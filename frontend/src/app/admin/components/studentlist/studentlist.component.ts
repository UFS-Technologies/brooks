import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDocumentsComponent } from '../student-documents/student-documents.component';
import { AttendanceService } from '../../services/attendance.service';
import { AddExpenseDialogComponent } from '../add-expense-dialog/add-expense-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ExpenseTypeService } from '../../services/expense-type.service';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { StudentFeesService } from '../../services/student-fees.service';
import { MatTabGroup } from '@angular/material/tabs';
import { SharedModule } from '../../../shared/shared.module';
import { MatTableModule } from '@angular/material/table';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { student } from '../../../core/models/student';
import { StudentFeesComponent } from '../student-fees/student-fees.component';
import { student_Service } from '../../services/student.Service';
import { user_Service } from '../../services/user.Service';
import { EmailTemplateService } from '../../services/email-template.service';
import { IConfig, ICountry } from 'ngx-countries-dropdown';
import { environment } from '../../../../environments/environment';
import {
  catchError,
  EMPTY,
  finalize,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { course_Service } from '../../services/course.Service';
import { error, log } from 'node:console';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RegistrationResponse {
  Status: string;
  RollNumber: string;
}

@Component({
  selector: 'app-studentlist',
  imports: [
    CommonModule,
    StudentDocumentsComponent,
    AddExpenseDialogComponent,
    MatTabGroup,
    SharedModule,
    MatTableModule,
    StudentFeesComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './studentlist.component.html',
  styleUrl: './studentlist.component.scss',
})
export class StudentlistComponent {
  @Input() mode: 'add' | 'list' = 'list'; // default is 'list'

  @Input() followUps: any = [];
  @Input() totalFollowUps: number = 0;
  @Input() missedFollowUps: number = 0;
  @Input() isFollowupOnly: boolean = false;
  @Output() cancel = new EventEmitter<any>();
  @Output() save = new EventEmitter<any>();
  preferredCountryCodes: string[] = ['in', 'ae'];
  activeStatus: string = 'all'; // 'all' | 'active' | 'deactivated'
  followUpForm: FormGroup;
  selectedCountryCode: string = 'IN';
  dialogBox = inject(MatDialog);
  selectedStudentForDocuments: any = null;
  view = 'edit';
  studentExpense: any;
  feesList: any[] = [];
  receipList: any[] = [];
  selectedTabIndex: any;
  payFeeStatus: boolean = false;
  isEditingFees: boolean = false;
  feesForm: FormGroup;
  receiptForm: FormGroup;
  isEditingReceipt: boolean = false;
  selectedReceipt: any | null = null;
  isLoading: boolean = false;
  student_Form: FormGroup;
  student_Data: student[];
  showFollowUpSection: boolean = false;
  previewUrl: any = null;
  selectedTime: any;
  selectedSlot: any;
  optedCourseId: any;
  courseList: any;
  currentFollowUpData: any = null;
  slotDetails: any;
  batchDetails: any;
  installment_label: any = '';
  selectedCountry: ICountry;
  student_Course!: FormGroup;
  fees_updated_status: boolean = false;
  installments: any[] = [];
  Student_Fees_IDs: any[];
  fileToRemoveAws: any = [];
  allCourse: any = [];
  batch_Data: any;
  todayString: string;
  Search_Branch: any = {};
  Search_staff: any = {};
  Search_status: any = {};
  Search_Department: any = {};
  Search_Branch_Data: any[] = [];
  Search_Department_Data: any[] = [];
  Search_Branch_Temp: any = {};
  staffData: any[] = [];
  followUpStatusData: any[] = [];
  studentFollowUpHistory: any[] = [];
  nextFollowUpDate: string = '';
  remark: string = '';
  selectedStudentForFollowup: any = null;
  private course_Service_ = inject(course_Service);
  // Add these properties to your component class
  showFollowupHistory: boolean = false;
  followupHistoryList: any[] = [];
  loadingFollowupHistory: boolean = false;
  showHistoryBox: boolean = false;
  followUpHistory: any[] = [];
  Discount_: any = 0;
  isLoadingHistory: boolean = false;
  feeTypes = ['OneTime', 'TwoTime', 'ThreeTime', 'FourTime'];
  form: FormGroup;
  emailTemplates: any[] = [];
  selectedTemplateId: number | null = null;
  feeAmount: number | null = null;
  enquirySources: any[] = [];
  newBatchId: any = 0;
  selectedCountryConfig: IConfig = {
    hideCode: true,
    hideName: true,
  };
  countryListConfig: IConfig = {
    hideCode: true,
  };
  available_Time_Slots: any = [];
  isRegistering: boolean = false;
  registration_Status: boolean = false;
  tutorsList: any[] = [];
  mockTestPackages: any[] = [];

  isEdit: boolean = false;
  isSave: boolean = false;
  isDelete: boolean = false;
  
  // Email Logs
  emailLogs: any[] = [];
  emailLogsLoading: boolean = false;

  // Call Log
  callLogStatus: string = 'Answered';
  callLogDate: string = new Date().toISOString().split('T')[0];
  callLogRemark: string = '';
  isSavingCallLog: boolean = false;
  
  // Attendance Summary
  attendanceFromDate: string = new Date().toISOString().split('T')[0];
  attendanceToDate: string = new Date().toISOString().split('T')[0];
  attendanceTeacherId: number = 0;
  attendanceStatus: number = -1; // -1 for all
  attendanceSummary: any = null;
  attendanceHistory: any[] = [];
  attendanceLoading: boolean = false;

  private currentSubscription?: Subscription;
  private courseSubscription?: Subscription;
  StudentFees_Service_ = inject(StudentFeesService);
  student_Service_ = inject(student_Service);
  private user = inject(user_Service);
  private emailTemplateService = inject(EmailTemplateService);
  private attendanceService = inject(AttendanceService);
  private fb = inject(FormBuilder);
  private url = inject(ActivatedRoute);
  totals: any;
  originalInstallments: any[] = [];
  totalFeeAmount: any;
  calculatedTotalAmount: number = 0;
  branch_status: boolean = false;
  feeAmountInWords: string = '';
  trackByIndex(index: number): number {
    return index;
  }
  compareBranch(o1: any, o2: any): boolean {
    return o1 && o2 ? (o1.Branch_Id || o1.Branch_ID) === (o2.Branch_Id || o2.Branch_ID) : o1 === o2;
  }
  compareDepartment(o1: any, o2: any): boolean {
    return o1 && o2 ? (o1.Department_Id || o1.Department_ID) === (o2.Department_Id || o2.Department_ID) : o1 === o2;
  }
  compareStaff(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.User_ID === o2.User_ID : o1 === o2;
  }
  compareStatus(o1: any, o2: any): boolean {
    return o1 && o2 ? (o1.Status_Id || o1.Status_ID) === (o2.Status_Id || o2.Status_ID) : o1 === o2;
  }
  constructor(
    private expenseApi: ExpenseTypeService,
    private feesService: StudentFeesService,
    private cdRef: ChangeDetectorRef
  ) {
    const today = new Date().toISOString().split('T')[0];
    this.student_Form = this.fb.group({
      Student_ID: [0],
      First_Name: ['', Validators.required],
      Middle_Name: [''],
      Last_Name: [''],
      Academic_Year: [''],
      DOB: [''],
      Percentage: [''],
      Gender: [''],
      Nationality: [''],
      Mother_Tongue: [''],
      Religion: [''],
      Aadhaar_Card_Number: [''],
      Blood_Group: [''],
      Email: ['', Validators.required],
      Country_Code_Name: ['in', Validators.required], // 🇮🇳 Default to India
      Country_Code: ['+91', Validators.required], // New field for country code
      Profile_Photo_Path: [''],
      Profile_Photo_Name: [''],
      Phone_Number: ['', Validators.required],
      Delete_Status: [0],
      Social_Provider: [''],
      Social_ID: [''],
      Avatar: [''],
      Age: [0],
      Qualification: [''],
      // Qualification_Description: [''],
      Alt_Phone_Number: [''],
      Address: [''],
      District: [''],
      Guardian_Type: ['Father'], // Father | Mother | Other
      Guardian_Name: [''],
      Guardian_Phone: [''],
      Guardian_Alt_Phone: [''],
      // Guardian_Alternative_Number: [''],
      Active_Status: ['Active'],
      // WhatsApp_Reminder_To: ['Parent'], // Student | Parent
      // Parents_Name: [''],
      // Parents_Phone: [''],
      // Emergency_Contact: [''],
      // Height_cm: [0],
      // Weight_kg: [''],
      Admission_Date: [today],
      Roll_No: [Math.floor(10000000 + Math.random() * 90000000).toString(), [Validators.maxLength(10)]],
      Enquiry_Source_Id: [''],
      Branch_Id: [''],
      isRegistering: [false],
      Registered_By:[''],
      Registered_On:[today],
      Mock_Test_Subscribed: [false],
      Mock_Test_Package: ['']

    });
    this.student_Course = this.fb.group({
      Student_ID: [0, []],
      Course_ID: [0, []],
      //Course_ID: [0, [Validators.required, Validators.min(1)]],
      Enrollment_Date: [new Date().toISOString().substring(0, 10)], // today's date
      Expiry_Date: [''],
      Price: [''],
      Payment_Date: [new Date().toISOString().substring(0, 16)], // today's datetime
      Payment_Status: [''],
      LastAccessed_Content_ID: [0],
      Transaction_Id: [''],
      Delete_Status: [0], // default to 0
      StudentCourse_ID: [0], // default to 0
      Payment_Method: [''],
      Slot_Id: [0],
      Batch_ID: [0, [Validators.required, Validators.min(1)]],
    });
    this.receiptForm = this.fb.group({
      Entry_Date: ['', Validators.required],
      Amount: [0, [Validators.required, Validators.min(1)]],
      Payment_mode: ['', Validators.required],
      Account_Name: ['', Validators.required],
      Voucher_Number: ['', Validators.required],
    });
    this.feesForm = this.fb.group({
      Student_Fees_ID: [''],
      Installment_information_ID: [''],
      Total_Amount: [''],
      Fee_Status: [''],
      Payment_Date: [''],
      Due_Date: [''],
      Paid_Amount: [''],
      Payment_Mode: [''],
      Transaction_ID: [''],
      Student_ID: [''],
      Course_ID: [''],
      Receipt_Id: [''], // ✅ <--- Add this line
      update_status: [''],
      Discount: [0],
      Fee_Amount: [0],
      Total_FeeAmount: [0],
    });
  }
  ngOnInit() {
    this.initFeesForm();
    this.Branch_Dropdown();
    this.course_Service_.Search_course('').subscribe((res) => {
      this.allCourse = res;
    });
    this.Followup_status_Dropdown();
    this.student_Service_.Get_MockTestPackages().subscribe({
      next: (res: any) => {
        let data = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : res;
        this.mockTestPackages = data || [];
      },
      error: (err) => console.error('Error fetching mock test packages', err)
    });

    this.student_Form.get('Mock_Test_Subscribed')?.valueChanges.subscribe(checked => {
      const packageControl = this.student_Form.get('Mock_Test_Package');
      if (checked) {
        packageControl?.setValidators([Validators.required]);
      } else {
        packageControl?.clearValidators();
        packageControl?.setValue('');
      }
      packageControl?.updateValueAndValidity();
    });

    this.courseSubscription?.unsubscribe();

    this.courseSubscription = this.student_Course
      .get('Course_ID')
      ?.valueChanges.subscribe((courseId) => {
        if (this.view == 'courses' || this.view == 'edit')
          this.updateCourseDetails(courseId);
        // this.fetchInstallments(courseId);
      });

    this.student_Course.get('Course_ID')?.valueChanges.subscribe((courseId) => {
      this.feesForm.get('Course_ID')?.setValue(courseId);
    });

    // this.feesForm.get('Fee_Amount')?.valueChanges.subscribe((total) => {
    //   const selectedInstallmentId = this.feesForm.get(
    //     'Installment_information_ID'
    //   )?.value;

    //   console.log(
    //     'Selected Installment_information_ID:',
    //     selectedInstallmentId
    //   ); // 👈 LOG HERE
    //   console.log('New Fee_Amount:', total); // 👈 Optional: log the new fee amount

    //   const selectedInstallment = this.installments.find(
    //     (i) => i.Fee_Type === selectedInstallmentId
    //   );

    //   if (selectedInstallment) {
    //     const feeType = selectedInstallment.Fee_Type;
    //     const count = this.getInstallmentSplitCount(feeType);
    //     if (count && total > 0) {
    //       const newAmounts = this.getRoundedInstallments(total, count, 5000);
    //       // Update the Amount in each installment row
    //       // this.installments = this.installments.map((inst, idx) => ({
    //       //   ...inst,
    //       //   Amount: newAmounts[idx].toFixed(2), // optional: keep as string
    //       // }));
    //     }
    //   }
    // });

    this.Get_All_Enquiry();

    if (this.mode === 'add') {
      this.branch_status = true;
      console.log('StudentList loaded in ADD mode');
      this.nextFollowUpDate = this.getCurrentDate();
      this.loadFollowupData();
    } else {
      this.branch_status = false;
      this.loadFollowupData();
      console.log('followUps', this.followUps);
      this.Edit_student(this.followUps);
      const studentID = this.followUps.Student_ID;
      this.loadStudentCourse(studentID);

      if (this.isFollowupOnly) {
        this.view = 'followup';
        this.selectedStudentForFollowup = this.followUps;
      }
    }
    this.feesForm
      .get('Total_FeeAmount')
      ?.valueChanges.subscribe(() => this.updateFeeAmount());
    this.feesForm
      .get('Discount')
      ?.valueChanges.subscribe(() => this.updateFeeAmount());

    this.url.queryParams.subscribe((params) => {
      console.log('params', params);

      if (params['item']) {
        const receivedItem = JSON.parse(params['item']);
        console.log('Received Item:', receivedItem);

        this.isEdit = receivedItem?.IsEdit || false;
        this.isSave = receivedItem?.IsSave || false;
        this.isDelete = receivedItem?.IsDelete || false;

        console.log('Permissions:', this.isEdit, this.isSave, this.isDelete);
      }
    });

    this.loadEmailTemplates();
  }

  loadEmailTemplates() {
    this.emailTemplateService.searchTemplates('').subscribe((res) => {
      this.emailTemplates = res || [];
    });
  }

  sendSelectedEmail(email: string, studentName: string, courseName: string = '') {
    if (this.selectedTemplateId && email) {
      const placeholders = {
        'Student Name': studentName,
        'Lead Name': studentName,
        'Course Name': courseName
      };
      this.emailTemplateService.sendTemplateEmail(this.selectedTemplateId, email, placeholders).subscribe({
        next: (res) => {
          console.log('Email sent successfully', res);
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Email sent successfully', Type: 'false' },
          });
        },
        error: (err) => console.error('Error sending email', err)
      });
    }
  }

  getEmailLogs(student: any) {
    if (!student || !student.Student_ID) return;
    this.emailLogsLoading = true;
    this.user.Get_Email_Logs_By_Student(student.Student_ID).subscribe({
      next: (res: any) => {
        this.emailLogs = res || [];
        this.emailLogsLoading = false;
      },
      error: (err) => {
        console.error('Failed to get email logs:', err);
        this.emailLogsLoading = false;
      }
    });
  }

  saveCallLog() {
    // Resolve Student_ID from form (primary) or followUps input (fallback)
    const studentId = this.student_Form.get('Student_ID')?.value || this.followUps?.Student_ID;

    if (!studentId || studentId === 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Invalid student selected', Type: '3' },
      });
      return;
    }

    this.isSavingCallLog = true;
    // 'User_Id' is the actual logged-in user numeric ID; 'User_Type' is the role/type ID
    const User_Id = localStorage.getItem('User_Id') || '0';
    
    const callLogData = {
      Call_Log_ID: 0,
      Student_ID: studentId,
      User_ID: parseInt(User_Id),
      Call_Date: this.callLogDate || new Date().toISOString().split('T')[0],
      Call_Status: this.callLogStatus,
      Remark: this.callLogRemark
    };

    this.student_Service_.Save_Call_Log(callLogData).subscribe({
      next: (res: any) => {
        this.isSavingCallLog = false;
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Call log saved successfully', Type: 'false' },
        });
        this.callLogRemark = ''; // Clear remark after save
        this.view = 'list'; // Return to list view
      },
      error: (err) => {
        console.error('Error saving call log:', err);
        this.isSavingCallLog = false;
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Failed to save call log', Type: '3' },
        });
      }
    });
  }

  fetchAttendanceSummaryReport() {
    const studentId = this.student_Form.get('Student_ID')?.value || this.followUps?.Student_ID;
    if (!studentId) return;

    this.attendanceLoading = true;
    this.attendanceService.getAttendanceSummaryReport(
      studentId,
      0, // courseId
      0, // batchId
      this.attendanceFromDate,
      this.attendanceToDate,
      this.attendanceTeacherId,
      this.attendanceStatus
    ).subscribe({
      next: (res: any) => {
        this.attendanceHistory = res.data || [];
        this.attendanceSummary = res.summary || null;
        this.attendanceLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch attendance summary:', err);
        this.attendanceLoading = false;
      }
    });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Present';
      case 0: return 'Absent';
      case 2: return 'Leave';
      case 3: return 'Late';
      default: return 'Unknown';
    }
  }

  loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('Canvas context not available');
        }
      };
      img.onerror = reject;
    });
  }

  printPDF(logoBase64?: string, studentImageBase64?: string): void {
    const studentDetails = this.followUps;
    //Date to dd-mm-yyyy
    const originalDate = studentDetails.Admission_Date;
    let formattedDate = originalDate;
    if (originalDate) {
      const [year, month, day] = originalDate.split('-');
      formattedDate = `${day}-${month}-${year}`;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    (doc as any).lastAutoTable = undefined;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageMargin = 10;

    const logoX = pageMargin;
    const logoY = 10;
    const logoWidth = 45;
    const logoHeight = 15;
    const textStartX = logoX + logoWidth + 5;

    // 🖼️ Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    // 🧾 Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Trackbox', textStartX, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Near HDFC Bank, Angadippuram Valanchery Road, Perinthalmanna - 679321',
      textStartX,
      22
    );
    doc.text(
      '+91-8078250037, +91-8281570037 | Medcoeduservicellp@gmail.com',
      textStartX,
      27
    );
    doc.text('https://www.trackbox.in', textStartX, 32);

    // 🔻 Separator line
    doc.setLineWidth(0.8);
    doc.line(pageMargin, 38, pageWidth - pageMargin, 38);

    // 🧑 Student Info
    const studentInfoY = 44;
    doc.setFontSize(11);
    doc.text(
      //`Admission Date: ${studentDetails.Admission_Date}`,
      `Admission Date: ${formattedDate}`,
      pageMargin,
      studentInfoY
    );
    var Roll_No = studentDetails.Roll_No??'';

    doc.text(
      `Roll No: ${Roll_No}`,
      pageMargin,
      studentInfoY + 6
    );
    doc.text(
      `Student: ${studentDetails.First_Name} ${studentDetails.Last_Name}`,
      pageMargin,
      studentInfoY + 12
    );
    doc.text(
      `${studentDetails.Guardian_Type}: ${studentDetails.Guardian_Name}`,
      pageMargin,
      studentInfoY + 18
    );
    doc.text(
      `Mobile: ${studentDetails.Phone_Number}`,
      pageMargin,
      studentInfoY + 24
    );
    doc.text(
      `Address: ${studentDetails.Address}`,
      pageMargin,
      studentInfoY + 30
    );

    // 🖼️ Passport Photo or Placeholder Box
    const photoBoxSize = 30;
    const photoBoxX = pageWidth - pageMargin - photoBoxSize;
    const photoBoxY = studentInfoY;

    if (studentImageBase64) {
      try {
        doc.addImage(
          studentImageBase64,
          'JPEG',
          photoBoxX,
          photoBoxY,
          photoBoxSize,
          photoBoxSize
        );
      } catch (err) {
        console.warn('Failed to load student image, using placeholder.', err);
        this.drawPhotoPlaceholder(doc, photoBoxX, photoBoxY, photoBoxSize);
      }
    } else {
      this.drawPhotoPlaceholder(doc, photoBoxX, photoBoxY, photoBoxSize);
    }

    // 🎓 Course Info Table
    // Fetch dynamic course details
    const selectedCourse = this.allCourse.find(
      (c) => c.Course_ID === this.student_Course.get('Course_ID')?.value
    );
    const courseName = selectedCourse?.Course_Name || 'Course';

    this.View_courses(studentDetails.Student_ID, false);
    // Fetch discount and total from form
    const discount = this.feesForm.get('Discount')?.value || 0;
    const totalAmount = this.feesForm.get('Total_FeeAmount')?.value || 0;
    const finalAmount = this.feesForm.get('Fee_Amount')?.value || 0;
     doc.setFontSize(11);
    doc.text(
      `Admission Details:`,
      pageMargin,
      studentInfoY + 39
    );
    autoTable(doc, {
      startY: studentInfoY + 40,
      margin: { left: pageMargin, right: pageMargin },
      head: [['Course', 'Fees']],
      body: [
        [courseName, `Rs. ${totalAmount.toLocaleString()}`],
        // ['', ''],
        ['Total', `Rs. ${totalAmount.toLocaleString()}`],
        ['Discount', `Rs. ${discount.toLocaleString()}`],
        ['Grand Total', `Rs. ${finalAmount.toLocaleString()}`],
      ],
      styles: { fontSize: 10 },
      didParseCell(data) {
        if (data.row.index >= 2) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const afterCourseY =
      (doc as any).lastAutoTable?.finalY || studentInfoY + 85;
    debugger;

    console.log('this.installments', this.installments);
doc.text(
      `Payment Details:`,
      pageMargin,
      studentInfoY + 86
    );
    autoTable(doc, {
      startY: afterCourseY + 10,
      margin: { left: pageMargin, right: pageMargin },
      head: [
        [
          '#',
          'Installment Date',
          'Paid On',
          'Amount',
          'Status',
          'Mode',
          'Ref No.',
          'Receipt',
          'Tax',
        ],
      ],
      body: this.installments?.map((inst, i) => [
        (i + 1).toString(),
        this.formatDate(inst.Due_Date) || '-', // Date
        this.formatDate(inst.Payment_Date) || '-', // Paid On
        inst.Total_Amount?.toString() || '-', // Amount
        inst.Fee_Status || 'unpaid', // Status
        inst.Payment_Mode || '-', // Mode
        inst.Installment_information_ID || '-', // Ref No.
        inst.Receipt || '-', // Receipt
        inst.Tax || '-', // Tax
      ]) || [['-', '-', '-', '-', '-', '-', '-', '-', '-']], // fallback empty row
      styles: { fontSize: 8 },
    });

    const afterPaymentsY =
      (doc as any).lastAutoTable?.finalY || afterCourseY + 60;
    const signatureLineY = afterPaymentsY + 40;

    // 📜 Terms & Conditions
    doc.setFontSize(9);
    doc.text('Terms and Conditions:', pageMargin, afterPaymentsY + 10);

    doc.setFontSize(8);
    doc.text(
      '• This receipt is subject to realisation of cheque.',
      pageMargin,
      afterPaymentsY + 16
    );
    doc.text(
      '• This receipt should be carefully preserved and must be produced on demand.',
      pageMargin,
      afterPaymentsY + 22
    );
    doc.text(
      '• Fees once paid are not refundable/transferable in any circumstances.',
      pageMargin,
      afterPaymentsY + 28
    );

    // 🧾 Page bottom padding
    const bottomMargin = 15;
    const signatureSectionHeight = 20; // height for signature lines & labels
    const footerNoteHeight = 10; // height for footer text

    const pageHeight = doc.internal.pageSize.getHeight();
    const availableSpace =
      pageHeight - bottomMargin - signatureSectionHeight - footerNoteHeight;

    // If signature would go beyond current content, start from bottom
    const signatureY = Math.max(signatureLineY, availableSpace);

    // ✅ Signature Labels
    doc.setFontSize(10);
    doc.text('(Student/Parent Signature)', pageMargin, signatureY - 2);
    doc.text('(Authorised Signatory)', pageWidth - 70, signatureY - 2);

    // ✍️ Signature Line
    doc.setLineWidth(0.7);
    doc.line(pageMargin, signatureY, pageWidth - pageMargin, signatureY);

    // 📌 Footer Note - Centered
    const footerNote =
      'Note: This is a system generated report and does not require signature.';
    const noteWidth = doc.getTextWidth(footerNote);
    const noteX = (pageWidth - noteWidth) / 2;

    doc.setFontSize(8);
    doc.text(footerNote, noteX, signatureY + 10);

    // 💾 Save PDF
    //doc.save('student-fee-report.pdf');
    doc.save(studentDetails.First_Name + '-' + studentDetails.Last_Name+'.pdf');
    this.isLoading = false;
  }
  private drawPhotoPlaceholder(
    doc: jsPDF,
    x: number,
    y: number,
    size: number
  ): void {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(x, y, size, size);
    doc.setFontSize(8);
    doc.text('Passport Size', x + 3, y + 12);
    doc.text('Photo Here', x + 5, y + 18);
  }

  downloadPDF(): void {
    this.isLoading = true;
    const logoUrl = '/assets/images/logo.png';
    const studentImageUrl =
      environment.s3Path + this.followUps.Profile_Photo_Path || '';

    console.log('Logo URL:', logoUrl);
    console.log('studentImageUrl URL:', studentImageUrl);

    Promise.all([
      this.loadImageAsBase64(logoUrl).catch(() => undefined),
      studentImageUrl
        ? this.loadImageAsBase64(studentImageUrl).catch(() => undefined)
        : Promise.resolve(undefined),
    ])
      .then(([logoBase64, studentImageBase64]) => {
        this.printPDF(logoBase64, studentImageBase64);
      })
      .catch((err) => {
        console.error('Error loading images:', err);
        this.printPDF(); // fallback: no images
      });
  }

  Branch_Dropdown() {
    this.student_Service_.Branch_Dropdown().subscribe(
      (Rows) => {
        console.log('Rows', Rows);
        this.Search_Branch_Data = Rows;
        if (Rows && Rows.length > 0) {
          this.Search_Branch = Rows[0];
        }
      },
      (err) => {
        console.error('Failed to fetch branch data:', err);
      }
    );
  }

  loadStudentCourse(Student_ID: any) {
    this.student_Service_
      .getCoursesByStudentId(Student_ID)
      .subscribe((data: any) => {
        if (
          !data.Total_FeeAmount ||
          data.Total_FeeAmount === 0 ||
          data.Total_FeeAmount == null ||
          data.Total_FeeAmount == ''
        ) {
          this.feesForm.patchValue({
            Total_Amount: data[0]?.Course_Amount,
          });
        } else {
          this.feesForm.patchValue({
            Total_Amount: data.Total_FeeAmount,
          });
        }
      });
  }

  //Checking Total Amount and Total FeeAmount for the first time
  // loadStudentCourse(Student_ID: any){
  // this.student_Service_.getCoursesByStudentId(Student_ID).subscribe((data: any) => {
  // //     // Set initial installment data
  //     this.installments = data.installments || [];

  // //     // First-time case: Total_FeeAmount is not saved yet
  //     if (!data.Total_FeeAmount || data.Total_FeeAmount === 0) {
  //       const totalAmount = this.installments.reduce(
  //         (sum, inst) => sum + (+inst.Amount || 0),
  //         0
  //       );

  // //       // Set and save total fee amount
  //       this.feesForm.get('Total_Amount')?.setValue(totalAmount);
  //       this.feesForm.get('Fee_Amount')?.setValue(totalAmount); // initially same
  //       this.totalFeeAmount = totalAmount;

  // //       // Save back to backend (or it'll recalculate next time again)
  //       const payload = {
  //         Student_ID: data.Student_ID,
  //         Course_ID: data.Course_ID,
  //         Total_FeeAmount: totalAmount
  //       };
  //       this.student_Service_.enroleCourse(payload).subscribe({
  //         next: () => console.log('✅ Total_FeeAmount saved to backend.'),
  //         error: (err) => console.error('❌ Error saving Total_FeeAmount', err)
  //       });

  //     } else {
  //       // Edit mode: use saved Total_FeeAmount only
  //       this.totalFeeAmount = data.Total_FeeAmount;

  //       this.feesForm.get('Total_Amount')?.setValue(this.totalFeeAmount);
  //     }

  //     // console.log("data.Discount",data.Discount);

  // //     // Handle discount (if exists)
  // //     // const discount = data.Discount || 0;
  // //     // this.feesForm.get('Discount')?.setValue(discount);

  // //     // const feeAmount = this.totalFeeAmount - discount;
  // //     // this.feesForm.get('Fee_Amount')?.setValue(feeAmount >= 0 ? feeAmount : 0);

  // //     // Set IDs to feesForm
  //     this.feesForm.patchValue({
  //       Student_ID: data.Student_ID,
  //       Course_ID: data.Course_ID,
  //     });
  //   });
  // }

  //   loadStudentCourse(Student_ID: any){
  //   this.student_Service_.getCoursesByStudentId(Student_ID).subscribe((data: any) => {
  //     console.log("data",data);

  //     // Set initial installment data
  //     this.installments = data.installments || [];

  //     // First-time case: Total_FeeAmount is not saved yet
  //     if (!data.Total_FeeAmount || data.Total_FeeAmount === 0) {
  //       const totalAmount = this.installments.reduce(
  //         (sum, inst) => sum + (+inst.Amount || 0),
  //         0
  //       );

  //       // Set and save total fee amount
  //       this.feesForm.get('Total_Amount')?.setValue(totalAmount);
  //       this.feesForm.get('Fee_Amount')?.setValue(totalAmount); // initially same
  //       this.totalFeeAmount = totalAmount;

  //       // Save back to backend (or it'll recalculate next time again)
  //       const payload = {
  //         Student_ID: data.Student_ID,
  //         Course_ID: data.Course_ID,
  //         Total_FeeAmount: totalAmount
  //       };
  //       this.student_Service_.enroleCourse(payload).subscribe({
  //         next: () => console.log('✅ Total_FeeAmount saved to backend.'),
  //         error: (err) => console.error('❌ Error saving Total_FeeAmount', err)
  //       });

  //     } else {

  //          console.log("this.feesForm",this.feesForm);

  //       // Edit mode: use saved Total_FeeAmount only
  //       this.totalFeeAmount = data.Total_FeeAmount;

  //       this.feesForm.get('Total_Amount')?.setValue(this.totalFeeAmount);
  //          console.log("this.feesForm>>>>>>>>>>>>>>>>>>>>>>.",this.feesForm);

  //     }

  //     console.log("data.Discount",data.Discount);

  //     // Handle discount (if exists)
  //     // const discount = data.Discount || 0;
  //     // this.feesForm.get('Discount')?.setValue(discount);

  //     // const feeAmount = this.totalFeeAmount - discount;
  //     // this.feesForm.get('Fee_Amount')?.setValue(feeAmount >= 0 ? feeAmount : 0);

  //     // Set IDs to feesForm
  //     // this.feesForm.patchValue({
  //     //   Student_ID: data.Student_ID,
  //     //   Course_ID: data.Course_ID,
  //     // });
  //   });
  // }

  //  Fee amount (Total fee - Discount)
  updateFeeAmount(): void {
    const total = +this.feesForm.get('Total_FeeAmount')?.value || 0;
    // let discount = +this.feesForm.get('Discount')?.value || 0;
    let discountRaw = this.feesForm.get('Discount')?.value || 0;
    let discount = discountRaw === '' || discountRaw == null ? 0 : +discountRaw;

    // Clamp discount to not exceed total
    // if (discount > total) {
    //   discount = total;
    //   this.feesForm.get('Discount')?.setValue(total, { emitEvent: false });

    //   // Optional: alert the user
    //   console.warn('Discount cannot exceed Total Amount.');
    //   // Or show a user-facing error message here
    // }

    const result = total - discount;
    const feeAmount = result >= 0 ? result : 0;
    this.feesForm.get('Fee_Amount')?.patchValue(feeAmount);

    // this.feesForm
    //   .get('Fee_Amount')
    //   ?.setValue(result >= 0 ? result : 0, { emitEvent: false });

    // this.feesForm.get('Fee_Amount')?.patchValue(+feeAmount, { emitEvent: true });

    if (discount == 0) {
        // 👉 Restore original installment data
        if (this.originalInstallments && this.originalInstallments.length > 0) {
            // copy to avoid reference issues
            this.installments = JSON.parse(JSON.stringify(this.originalInstallments));
        }
    } else {
        // 👇 Rebalance the installments based on new fee amount
        this.rebalanceInstallmentsProportionally(feeAmount);
    }
  }

  rebalanceInstallmentsProportionally(newFeeAmount: number): void {
    const count = this.installments.length;
    if (count === 0) return;

    const rawAmount = newFeeAmount / count;

    // Helper to round to nearest multiple of 100
    const roundToNearest100 = (value: number): number => {
      return Math.round(value / 100) * 100;
    };

    // Round each installment
    const roundedInstallments = this.installments.map((inst, idx) => {
      const rounded = roundToNearest100(rawAmount);
      return { ...inst, Amount: rounded };
    });

    // Total after rounding
    const totalRounded = roundedInstallments.reduce((sum, inst) => sum + inst.Amount, 0);
    const diff = newFeeAmount - totalRounded;

    // Adjust the last installment to match the target total
    if (diff !== 0) {
      const last = roundedInstallments[count - 1];
      roundedInstallments[count - 1] = {
        ...last,
        Amount: last.Amount + diff
      };
    }

    this.installments = roundedInstallments;
  }

  Get_All_Enquiry() {
    this.student_Service_.Get_All_Enquiry().subscribe(
      (Rows) => {
        if (Rows && Array.isArray(Rows[0])) {
          this.enquirySources = Rows[0];
        } else if (Array.isArray(Rows)) {
          this.enquirySources = Rows;
        } else {
          this.enquirySources = [];
        }
      },
      (err) => {
        console.error('Failed to fetch enquiry sources:', err);
      }
    );
  }

  onRegistrationToggle(event: any) {
    this.isRegistering = event;
    this.registration_Status = event;
    if (!event) {
      this.student_Form.patchValue({
        Roll_No: null,
        Admission_Date: null,
        isRegistering: false,
      });
    } else {
      const currentRollNo = this.student_Form.get('Roll_No')?.value;
      const newRollNo = currentRollNo ? currentRollNo : Math.floor(10000000 + Math.random() * 90000000).toString();
      this.student_Form.patchValue({
        isRegistering: true,
        Roll_No: newRollNo,
      });
      const today = new Date().toISOString().split('T')[0];
      this.student_Form.get('Admission_Date')?.setValue(today);
    }
  }

  getRoundedInstallments(
    total: number,
    count: number,
    base: number = 5000
  ): number[] {
    const rawAmount = total / count;
    const roundedAmount = Math.round(rawAmount / base) * base;
    const installments = new Array(count).fill(roundedAmount);

    const totalRounded = installments.reduce((sum, val) => sum + val, 0);
    const difference = total - totalRounded;

    // Correct the last installment
    installments[count - 1] += difference;

    return installments;
  }
  getInstallmentSplitCount(feeType: string): number {
    switch (feeType) {
      case 'TwoTime':
        return 2;
      case 'ThreeTime':
        return 3;
      case 'OneTime':
        return 1;
      case 'FourTime':
        return 4;
      default:
        return 1;
    }
  }

  updateCourseDetails(courseId: number) {
    this.isLoading = true;
    const selectedCourse = this.allCourse.find(
      (course) => course.Course_ID == courseId
    );
    console.log('selectedCourse: ', selectedCourse);
    console.log('student_Course: ', this.student_Course);

    this.student_Course.get('Slot_Id')?.setValue(null);
    this.student_Course.get('Batch_ID')?.setValue(null);
    this.student_Course.get('Price')?.setValue(selectedCourse?.Price);

    if (selectedCourse) {
      const currentDate = new Date().toISOString().substring(0, 10);
      this.student_Course.patchValue({
        Enrollment_Date: currentDate,
        Payment_Date: currentDate,
        Delete_Status: 0,
        Batch_ID: null,
        Slot_Id: null,
      });

      // Store subscription to unsubscribe from previous call
      if (this.currentSubscription) {
        this.currentSubscription.unsubscribe();
      }

      this.currentSubscription = forkJoin({
        timeSlots: this.course_Service_.Get_Available_Time_Slot(courseId),
        batches: this.course_Service_.get_course_Batches(courseId),
      })
        .pipe(
          map(({ timeSlots, batches }) => ({
            timeSlots: timeSlots[0],
            batches: batches,
          })),
          tap(({ timeSlots, batches }) => {
            this.available_Time_Slots = timeSlots;
            console.log(
              'this.available_Time_Slots: ',
              this.available_Time_Slots
            );

            this.batch_Data = batches;
            const selectedBatchInfo = this.batch_Data.find(
              (batch) =>
                batch.Batch_ID.toString() ==
                this.student_Course.get('Batch_ID')?.value
            );

            if (selectedBatchInfo) {
              this.batchDetails = selectedBatchInfo;
            } else {
              this.batchDetails = '';
            }
            console.log('this.batch_Data: ', this.batch_Data);

            if (
              this.available_Time_Slots.length == 0 &&
              this.view == 'courses' &&
              this.courseList.length == 0
            ) {
              this.showNoTimeSlotsDialog();
            }
          }),
          catchError((error) => {
            console.error('Error fetching course details:', error);
            this.isLoading = false;
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    } else {
      this.isLoading = false;
    }
  }
  // Separate method for dialog to improve readability
  private showNoTimeSlotsDialog(): void {
    this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message:
          'No available time slots. All existing time slots have been assigned. Please create or edit time slots under Course -> Edit.',
        Type: '3',
      },
    });
  }
  closeClick() {
    this.cancel.emit();
  }
  initFeesForm() {
    this.feesForm = this.fb.group({
      Student_Fees_ID: [''],
      Installment_information_ID: [''],
      Total_Amount: [0],
      Paid_Amount: [''],
      Fee_Status: [''],
      Payment_Date: [''],
      Due_Date: [''],
      Payment_Mode: [''],
      Transaction_ID: [''],
      Course_ID: [''],
      Student_ID: [''],
      update_status: [false],
      Fee_Amount: [0],
      Discount: [0],
      Total_FeeAmount: [0],
    });
  }
  // Keep your existing formatFollowupDate method as is
  formatFollowupDate(dateString: string): string {
    if (!dateString) {
      return ' ';
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString;
      }

      // Robust date-only formatting
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }
  // Get current date in YYYY-MM-DD format
  getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  /**
   * Toggle follow-up history visibility and load data
   */
  toggleFollowupHistory(): void {
    this.showFollowupHistory = !this.showFollowupHistory;
    // Load history when showing for the first time
    if (this.showFollowupHistory) {
      this.loadFollowupHistoryList();
    }
  }
  getCurrentFollowUpDataForSave(): any {
    if (!this.currentFollowUpData) {
      return null;
    }

    return {
      Branch_Id:
        this.Search_Branch?.Branch_Id ||
        this.currentFollowUpData.Branch_ID ||
        this.currentFollowUpData.Branch_Id ||
        null,
      Branch_Name: this.Search_Branch?.Branch_Name || this.currentFollowUpData.Branch_Name || "",
      Department_Id:
        this.Search_Department?.Department_Id ||
        this.currentFollowUpData.Department_ID ||
        this.currentFollowUpData.Department_Id ||
        null,
      Department_Name: this.Search_Department?.Department_Name || this.currentFollowUpData.Department_Name || "",
      Assigned_Staff_ID: this.Search_staff?.User_ID || this.currentFollowUpData.Assigned_Staff_ID || null,
      Assigned_Staff_Name: this.Search_staff?.First_Name || this.currentFollowUpData.Assigned_Staff_Name || "",
      Follow_Up_Status_ID: this.Search_status?.Status_Id || this.currentFollowUpData.Follow_Up_Status_ID || this.currentFollowUpData.Status_ID || null,
      Follow_Up_Status_Name:
        this.Search_status?.Status_Name || this.currentFollowUpData.Follow_Up_Status_Name || this.currentFollowUpData.Status_Name || "",
      Status_ID: this.Search_status?.Status_Id || this.currentFollowUpData.Status_ID || this.currentFollowUpData.Follow_Up_Status_ID || null,
      Followup_Status: this.Search_status?.Status_Id || this.currentFollowUpData.Status_ID || this.currentFollowUpData.Follow_Up_Status_ID || null,
      Status_Name: this.Search_status?.Status_Name || this.currentFollowUpData.Status_Name || this.currentFollowUpData.Follow_Up_Status_Name || "",
      Next_Follow_Up_Date: this.nextFollowUpDate ? this.nextFollowUpDate.toString().split('T')[0] : (this.currentFollowUpData.Next_Follow_Up_Date || this.currentFollowUpData.Follow_Up_Date || null)?.toString().split('T')[0],
      Follow_Up_Date: this.nextFollowUpDate ? this.nextFollowUpDate.toString().split('T')[0] : (this.currentFollowUpData.Follow_Up_Date || this.currentFollowUpData.Next_Follow_Up_Date || null)?.toString().split('T')[0],
      Remark: this.remark || this.currentFollowUpData.Remark || "",
      Created_Date:
        this.currentFollowUpData.Created_Date ||
        new Date().toISOString().split('T')[0],
      Delete_Status: 0,
    };
  }
  getFollowUpData() {
    // If editing existing student and no new follow-up section is shown,
    // return the existing follow-up data
    if (
      this.view === 'edit' &&
      this.student_Form.get('Student_ID')?.value &&
      !this.showFollowUpSection
    ) {
      return this.getCurrentFollowUpDataForSave() || {};
    }
    const validation = this.validateFollowUpSection();
    if (!validation.isValid && this.showFollowUpSection) {
      return {};
    }
    // For new students or when follow-up section is shown, use form data
    return {
      Branch_Id: this.Search_Branch?.Branch_Id || null,
      Branch_ID: this.Search_Branch?.Branch_Id || null,
      Branch_Name: this.Search_Branch?.Branch_Name || '',
      Department_Id: this.Search_Department?.Department_Id || null,
      Department_ID: this.Search_Department?.Department_Id || null,
      Department_Name: this.Search_Department?.Department_Name || '',
      Assigned_Staff_ID: this.Search_staff?.User_ID || null,
      Assigned_Staff_Name: this.Search_staff?.First_Name || '',
      Follow_Up_Status_ID: this.Search_status?.Status_Id || null,
      Follow_Up_Status_Name: this.Search_status?.Status_Name || '',
      Next_Follow_Up_Date: this.nextFollowUpDate || null,
      Follow_Up_Date: this.nextFollowUpDate || null,
      Remark: this.remark?.trim() || '',
      Created_Date: new Date().toISOString().split('T')[0],
      Delete_Status: 0,
    };
  }

  // New method to validate follow-up section mandatory fields
  validateFollowUpSection(): { isValid: boolean; message: string } {
    const validationErrors: string[] = [];

    console.log('Validating follow-up section...');
    console.log('this.Search_Branch:', this.Search_Branch);
    console.log('this.Search_Department:', this.Search_Department);

    // Check Branch selection - handle multiple scenarios
    if (
      !this.Search_Branch ||
      this.Search_Branch === '' ||
      !(this.Search_Branch.Branch_Id || this.Search_Branch.Branch_ID) ||
      (this.Search_Branch.Branch_Id === 0 && this.Search_Branch.Branch_ID === 0) ||
      (this.Search_Branch.Branch_Id === '0' && this.Search_Branch.Branch_ID === '0') ||
      (this.Search_Branch.Branch_Id === undefined && this.Search_Branch.Branch_ID === undefined) ||
      (this.Search_Branch.Branch_Id === null && this.Search_Branch.Branch_ID === null)
    ) {
      validationErrors.push('Branch is required in follow-up section');
    }

    // Check Department selection - handle multiple scenarios
    if (
      !this.Search_Department ||
      this.Search_Department === '' ||
      !(this.Search_Department.Department_Id || this.Search_Department.Department_ID) ||
      (this.Search_Department.Department_Id === 0 && this.Search_Department.Department_ID === 0) ||
      (this.Search_Department.Department_Id === '0' && this.Search_Department.Department_ID === '0') ||
      (this.Search_Department.Department_Id === undefined && this.Search_Department.Department_ID === undefined) ||
      (this.Search_Department.Department_Id === null && this.Search_Department.Department_ID === null)
    ) {
      validationErrors.push('Department is required in follow-up section');
    }

    // Optional: Add other follow-up field validations if needed
    // Example: Staff assignment validation
    // if (!this.Search_staff ||
    //     this.Search_staff === '' ||
    //     !this.Search_staff.Staff_ID ||
    //     this.Search_staff.Staff_ID === 0 ||
    //     this.Search_staff.Staff_ID === '0') {
    //   validationErrors.push('Staff assignment is required');
    // }

    // Optional: Follow-up status validation
    // if (!this.Search_status ||
    //     this.Search_status === '' ||
    //     !this.Search_status.Status_ID ||
    //     this.Search_status.Status_ID === 0 ||
    //     this.Search_status.Status_ID === '0') {
    //   validationErrors.push('Follow-up status is required');
    // }

    if (validationErrors.length > 0) {
      console.log('Validation failed:', validationErrors);
      return {
        isValid: false,
        message: validationErrors.join(', '),
      };
    }

    console.log('Validation passed');
    return { isValid: true, message: '' };
  }

  // New method to handle follow-up save from list view
  saveFollowUpFromList() {
    console.log(
      'this.selectedStudentForFollowup: ',
      this.selectedStudentForFollowup
    );
    if (!this.selectedStudentForFollowup?.Student_ID) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Invalid student selected', Type: '3' },
      });
      return;
    }
    // Validate follow-up mandatory fields
    const followUpValidationResult = this.validateFollowUpSection();
    if (!followUpValidationResult.isValid) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: {
          Message: followUpValidationResult.message,
          Type: '3',
        },
      });
      return;
    }

    this.isLoading = true;
    this.isLoading = true;
    // Create a payload that mimics the student save structure but only for follow-up
    const followUpPayload = {
      Student_ID: this.selectedStudentForFollowup.Student_ID,
      // Include existing student data to maintain the same API structure
      First_Name: this.selectedStudentForFollowup.First_Name,
      Last_Name: this.selectedStudentForFollowup.Last_Name,
      Email: this.selectedStudentForFollowup.Email,
      Phone_Number: this.selectedStudentForFollowup.Phone_Number,
      Enquiry_Source_Id: this.selectedStudentForFollowup.Enquiry_Source_Id || this.selectedStudentForFollowup.Enquiry_Source_ID,
      // Add follow-up data
      ...this.getFollowUpData(),
      // Flag to indicate this is follow-up only save
      isFollowUpOnly: true,
    };

    console.log('Follow-up only payload:', followUpPayload);

    // Use the same save structure as regular student save
    this.student_Service_
      .Save_student(followUpPayload)
      .pipe(
        switchMap((saveStatus) => {
          // Create a mock save status for follow-up processing
          const mockSaveStatus = [
            {
              Student_ID: this.selectedStudentForFollowup.Student_ID,
              success: true,
            },
          ];
          return this.processStudentSaveWithFollowup(mockSaveStatus);
        }),
        catchError((error) => {
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: {
              Message: error.error || 'Error saving follow-up',
              Type: '2',
            },
          });
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Follow-up saved successfully:', result);
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Follow-up saved successfully!', Type: 'false' },
          });

          if (this.selectedStudentForFollowup) {
            this.sendSelectedEmail(
              this.selectedStudentForFollowup.Email,
              this.selectedStudentForFollowup.First_Name
            );
          }

          // Reset form and go back to list
          this.resetFollowUpForm();
          this.view = 'list';
          this.selectedStudentForFollowup = null;
        },
      });
  }
  resetFollowUpForm(): void {
    console.log('=== resetFollowUpForm called ===');
    this.Search_Branch = null;
    this.Search_Department = null;
    this.Search_staff = null;
    this.Search_status =
      this.followUpStatusData.find(
        (status: any) => status.Status_Name?.toLowerCase() === 'pending'
      ) || null;
    this.nextFollowUpDate = this.getCurrentDate();
    this.remark = '';

    // Also reset follow-up history display
    this.showFollowupHistory = false;
    this.followupHistoryList = [];
    this.loadingFollowupHistory = false;
  }

  checkUniqueness(type: 'Email' | 'Phone_Number') {
    const control = this.student_Form.get(type);
    if (!control || !control.value) return;

    const payload = {
      [type]: control.value,
      Student_ID: this.student_Form.get('Student_ID')?.value || 0
    };

    this.student_Service_.Check_Uniqueness(payload).subscribe((res: any) => {
      if (type === 'Email' && res.emailCount > 0) {
        control.setErrors({ serverError: 'Email already exists' });
      } else if (type === 'Phone_Number' && res.phoneCount > 0) {
        control.setErrors({ serverError: 'Phone number already exists' });
      } else {
        // If it was a server error, clear it but keep other errors
        if (control.hasError('serverError')) {
          const errors = { ...control.errors };
          delete errors['serverError'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    });
  }

  private processStudentSave(Save_status: any): Observable<any> {
    this.student_Course.get('Student_ID')?.setValue(Save_status[0].Student_ID);

    // Merge specific values from feesForm into student_Course payload
    const payload = {
      ...this.student_Course.value,
      Course_ID: this.feesForm.get('Course_ID')?.value,
      Batch_ID: this.student_Course.get('Batch_ID')?.value,
      Installment_information_ID: this.feesForm.get(
        'Installment_information_ID'
      )?.value,
      Total_FeeAmount: this.feesForm.get('Total_FeeAmount')?.value,
      Fee_Status: this.feesForm.get('Fee_Status')?.value,
      Discount: this.feesForm.get('Discount')?.value,
      Fee_Amount: this.feesForm.get('Fee_Amount')?.value,
    };
    console.log('Checking Payload', payload);

    return this.student_Service_.enroleCourse(payload).pipe(
      tap(() => {
        if (Save_status[0].existingUser === 1) {
          if (Save_status[0].duplicateEmail === 1) {
            this.student_Form.get('Email')?.setErrors({ serverError: 'Email already exists' });
          }
          if (Save_status[0].duplicatePhone === 1) {
            this.student_Form.get('Phone_Number')?.setErrors({ serverError: 'Phone number already exists' });
          }
          
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Student Already Exists. Please check the fields for details.', Type: '3' },
          });
        } else if (Number(Save_status[0].Student_ID) > 0) {
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Saved', Type: 'false' },
          });
          this.cancel.emit();
        } else {
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Error Occurred', Type: '2' },
          });
        }
      })
    );
  }

  // Updated processStudentSaveWithFollowup to handle both scenarios
  processStudentSaveWithFollowup(Save_status: any) {
    console.log('Processing student save with follow-up:', Save_status);

    // Process student save first (or skip if follow-up only)
    const studentProcessing =
      this.view === 'followup'
        ? of(Save_status) // Skip student processing for follow-up only
        : this.processStudentSave(Save_status);

    return studentProcessing.pipe(
      switchMap(() => {
        // Check if follow-up data needs to be saved
        if (this.shouldSaveFollowUp()) {
          const followUpData = this.prepareFollowUpData(Save_status);
          console.log('Saving follow-up data:', followUpData);
          return this.student_Service_.Save_student_followup(followUpData);
        }
        return of(null);
      })
    );
  }
  // Updated prepareFollowUpData to handle both scenarios
  prepareFollowUpData(Save_status: any) {
    const studentId =
      this.view === 'followup'
        ? this.selectedStudentForFollowup?.Student_ID
        : Save_status[0]?.Student_ID ||
          this.student_Form.get('Student_ID')?.value;

    return {
      Student_ID: studentId,
      Branch_Id: this.Search_Branch?.Branch_Id || null,
      Branch_ID: this.Search_Branch?.Branch_Id || null,
      Branch_Name: this.Search_Branch?.Branch_Name || '',
      Department_Id: this.Search_Department?.Department_Id || null,
      Department_ID: this.Search_Department?.Department_Id || null,
      Department_Name: this.Search_Department?.Department_Name || '',
      Assigned_Staff_ID: this.Search_staff?.User_ID || null,
      Assigned_Staff_Name: this.Search_staff?.First_Name || '',
      Follow_Up_Status_ID: this.Search_status?.Status_Id || null,
      Follow_Up_Status_Name: this.Search_status?.Status_Name || '',
      Next_Follow_Up_Date: this.nextFollowUpDate || null,
      Remark: this.remark?.trim() || '',
      Created_Date: new Date().toISOString().split('T')[0],
      Delete_Status: 0,
    };
  }
  // Updated shouldSaveFollowUp to check for both scenarios
  shouldSaveFollowUp(): boolean {
    // Check if any follow-up data is provided
    const hasFollowUpData = !!(
      this.Search_Branch ||
      this.Search_Department ||
      this.Search_staff ||
      this.Search_status ||
      this.nextFollowUpDate ||
      (this.remark && this.remark.trim())
    );

    // For follow-up view, always save if there's any data
    if (this.view === 'followup') {
      return hasFollowUpData;
    }

    // For unregistered students (leads), save the follow-up history if there is follow-up data
    if (!this.registration_Status) {
      return hasFollowUpData;
    }

    // For edit view, save if follow-up section is shown and has data
    return this.showFollowUpSection && hasFollowUpData;
  }
  isValidEmail(email: string): boolean {
    return Validators.email(new FormControl(email)) === null;
  }

  Save_student() {
    const isMismatch = this.checkInstallmentMismatch();

    if (isMismatch) {
      const dialogRef = this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: {
          Message: 'Fee amount and installment total do not match.',
          Type: '1', // '1' implies confirmation dialog
          ConfirmButtonText: 'Yes',
          CancelButtonText: 'No',
        },
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result === true) {
          this.proceedWithStudentSave(); // Continue with save if confirmed
        }
      });

      return; // Exit here to wait for confirmation
    }

    this.proceedWithStudentSave(); // Proceed directly if no mismatch
  }

  proceedWithStudentSave() {
    console.log('feesForm', this.feesForm);
    console.log('installments', this.installments);
    console.log('this.student_Form', this.student_Form.value);
    console.log('this.isRegistering', this.isRegistering);
    const User_Id = localStorage.getItem('User_Type');
    // Check if this is a follow-up only save from list view
    if (this.view === 'followup' && this.selectedStudentForFollowup) {
      return this.saveFollowUpFromList();
    }
    // Original student form validation for edit view|| !this.student_Course.valid
    if (!this.student_Form.valid) {
      this.student_Form.markAllAsTouched();
      this.student_Course.markAllAsTouched();
      return;
    }
    const email = this.student_Form.get('Email')?.value;
    const phone = this.student_Form.get('Phone_Number')?.value;

    this.student_Form.get('isRegistering')?.setValue(this.registration_Status);
    this.student_Form.get('Registered_By')?.setValue(User_Id);

    // if (this.student_Form.get('isRegistering')?.setValue(this.registration_Status)) {
      // Only set Registered_On if not already registered
      this.student_Form.get('Registered_On')?.setValue(new Date());
    // }

    if (!email && !phone) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: {
          Message: 'Please provide either an Email or a Phone Number',
          Type: '3',
        },
      });
      return;
    }

    if (email && !this.isValidEmail(email)) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Please provide a valid Email address', Type: '3' },
      });
      return;
    }

    // Prepare follow-up data
    const followUpData = this.getFollowUpData();

    // Merge follow-up fields into student form value before saving
    const studentPayload = {
      ...this.student_Form.value,
      isRegistering: this.registration_Status ? 1 : 0, // Ensure numeric for backend if needed
      isRegistered: this.registration_Status ? 1 : 0, // Explicitly add isRegistered for clarity
      Address: this.registration_Status ? this.student_Form.value.Address : (this.student_Form.value.District || this.student_Form.value.Address), 
      ...followUpData,
      ...this.student_Course.value, // Merge course details like Slot_Id, Course_ID, Batch_ID
      Installments: this.installments,
      Branch_Id: this.student_Form.value.Branch_Id,
      Student_Fees_IDs: this.Student_Fees_IDs,
    };

    console.log('this.studentPayload', studentPayload);

    if (
      this.showFollowUpSection &&
      !this.student_Form.get('Student_ID')?.value
    ) {
      const followUpValidationResult = this.validateFollowUpSection();
      if (!followUpValidationResult.isValid) {
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: {
            Message: followUpValidationResult.message,
            Type: '3',
          },
        });

        return;
      }
    }
    this.isLoading = true;
    // Helper to process save with follow-up
    const saveStudentAndFollowUp$ = (payload: any) =>
      this.student_Service_.Save_student(payload).pipe(
        switchMap((saveStatus) =>
          this.processStudentSaveWithFollowup(saveStatus)
        ),
        catchError((error) => {
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: error.error || 'Error occurred', Type: '2' },
          });
          return EMPTY;
        }),
        finalize(() => (this.isLoading = false))
      );

    if (studentPayload.Profile_Photo_Path instanceof File) {
      (this.fileToRemoveAws.length
        ? forkJoin(
            this.fileToRemoveAws.map((key) =>
              from(this.course_Service_.fileToRemoveAws(key))
            )
          )
        : of(null)
      )
        .pipe(
          switchMap(() =>
            from(
              this.student_Service_.uploadFile(
                studentPayload.Profile_Photo_Path,
                studentPayload.First_Name
              )
            )
          ),
          tap((res) => {
            studentPayload.Profile_Photo_Path = res.key;
          }),
          switchMap(() =>
            saveStudentAndFollowUp$(studentPayload).pipe(
              tap((res) => {
                this.save.emit(res);
                const courseName = this.allCourse.find(c => c.Course_ID === this.student_Course.get('Course_ID')?.value)?.Course_Name || '';
                this.sendSelectedEmail(studentPayload.Email, studentPayload.First_Name, courseName);
              }) // emit here
            )
          )
        )
        .subscribe();
    } else {
      saveStudentAndFollowUp$(studentPayload).subscribe((res) => {
        this.save.emit(res);
        const courseName = this.allCourse.find(c => c.Course_ID === this.student_Course.get('Course_ID')?.value)?.Course_Name || '';
        this.sendSelectedEmail(studentPayload.Email, studentPayload.First_Name, courseName);
      });
    }
  }
  isFormValid(): boolean {
    if (!this.student_Form.valid) return false;
    if (this.isRegistering) {
      if(this.feesForm.value.Installment_information_ID === -1 || this.feesForm.value.Installment_information_ID === 0 || this.feesForm.value.Installment_information_ID === null) {
      return false;
    }
      return this.student_Course.valid && this.feesForm.valid;      
    }



    
    return true;
  }

  onAmountChange(index: number, newValue: number): void {
    const totalAmount = +this.feesForm.value.Fee_Amount;

    // Force current value to numeric
    this.installments[index].Amount = +newValue;

    // Calculate the current total
    let currentTotal = this.installments.reduce(
      (sum, inst) => sum + +inst.Amount,
      0
    );

    const difference = currentTotal - totalAmount;

    // No correction needed
    if (difference === 0) return;

    // Try to adjust the last (or another) installment to balance
    // for (let i = this.installments.length - 1; i >= 0; i--) {
    //   if (i === index) continue; // skip the one currently being edited

    //   let currentVal = +this.installments[i].Amount;
    //   let newVal = currentVal - difference;

    //   if (newVal >= 0) {
    //     this.installments[i].Amount = newVal;
    //     break;
    //   }
    // }
  }
  // Toggle follow-up section visibility
  toggleFollowUpSection() {
    this.showFollowUpSection = !this.showFollowUpSection;
    if (this.showFollowUpSection) {
      if (!this.nextFollowUpDate) {
        this.nextFollowUpDate = this.getCurrentDate();
      }
      // Set student ID if available
      const studentId = this.student_Form.get('Student_ID')?.value;
      if (studentId) {
        this.followUpForm.get('Student_Id')?.setValue(studentId);
        // this.loadStudentFollowUpHistory(studentId);
      }
    }
  }

  loadFollowupData() {
    // Load branches, departments, staff, and status data if not already loaded
    // This method should call your existing data loading methods
    if (!this.Search_Branch_Data?.length) {
      this.Branch_Dropdown();
    }
    if (!this.Search_Department_Data?.length) {
      this.Department_Dropdown();
    }
    if (!this.staffData?.length) {
      this.User_Dropdown();
    }
    if (!this.followUpStatusData?.length) {
      this.Followup_status_Dropdown();
    }
  }

  Followup_status_Dropdown() {
    this.student_Service_.Get_Followup_Status().subscribe(
      (res: any) => {
        let rows: any[] = [];
        if (res && Array.isArray(res[0])) {
          rows = res[0];
        } else if (Array.isArray(res)) {
          rows = res;
        }

        const defaultOption = { Status_Id: 0, Status_Name: 'Select Status' };
        this.followUpStatusData = [defaultOption, ...rows];

        this.followUpStatusData.forEach((item: any) => {
          if (item.Status_Id !== undefined && item.Status_ID === undefined) {
            item.Status_ID = item.Status_Id;
          }
        });

        const initialStatus = this.followUpStatusData.find(
          (status: any) => status.Status_Name?.toLowerCase() === 'initial'
        );

        if (this.view !== 'list') {
          if (!this.Search_status || this.Search_status.Status_Id === 0) {
            this.Search_status = initialStatus || defaultOption;
          }
        }

        console.log('Follow-up statuses loaded from DB (StudentList Dynamic):', this.followUpStatusData);
      },
      (err) => {
        console.error('Failed to fetch follow-up statuses:', err);
      }
    );
  }



  User_Dropdown() {
    this.student_Service_.User_Dropdown().subscribe(
      (Rows) => {
        console.log('Raw user Response:', Rows);

        // If Rows is an object, try:
        if (Rows && Array.isArray(Rows[0])) {
          this.staffData = Rows[0];
        } else if (Array.isArray(Rows)) {
          this.staffData = Rows;
        } else {
          console.error('Unexpected User data format:', Rows);
          this.staffData = [];
          return;
        }

        const defaultOption = { User_ID: 0, First_Name: 'Select Staff' };
        this.staffData.unshift(defaultOption);

        // Auto-select the logged-in user when adding a new lead
        const loggedInName = localStorage.getItem('Name');
        const loggedInUser = loggedInName
          ? this.staffData.find((s: any) => s.First_Name === loggedInName)
          : null;
        this.Search_staff = loggedInUser || defaultOption;
      },
      (err) => {
        console.error('Failed to fetch branch data:', err);
      }
    );
  }

  Department_Dropdown() {
    this.student_Service_.Department_Dropdown().subscribe(
      (Rows) => {
        console.log('Raw Departtment Response:', Rows);

        // If Rows is an object, try:
        if (Rows && Array.isArray(Rows[0])) {
          this.Search_Department_Data = Rows[0];
        } else if (Array.isArray(Rows)) {
          this.Search_Department_Data = Rows;
        } else {
          console.error('Unexpected Branch data format:', Rows);
          this.Search_Department_Data = [];
          return;
        }

        const defaultOption = {
          Department_ID: 0,
          Department_Name: 'Select Department',
        };
        this.Search_Department_Data.unshift(defaultOption);

        // Default to 'Admission' department when adding a new lead
        const admissionDept = this.Search_Department_Data.find(
          (d: any) => d.Department_Name?.toLowerCase() === 'admission'
        );
        this.Search_Department = admissionDept || defaultOption;
      },
      (err) => {
        console.error('Failed to fetch branch data:', err);
      }
    );
  }

  onInstallmentChange(selectedInstallment: any) {
    if (this.installments.length > 0) {
      const Fee_Type = this.installments[0].Fee_Type;
      if (Fee_Type != selectedInstallment) {
        this.fees_updated_status = false;
        this.cdRef.detectChanges();
      }
    }
    if (!this.fees_updated_status) {
      this.installments = [];
      const feestype = selectedInstallment;
      const CourseID = this.student_Course.get('Course_ID')?.value;
      const Batch_ID = this.student_Course.get('Batch_ID')?.value;
      console.log('feestype, CourseID, Batch_ID', feestype, CourseID, Batch_ID);

      this.fetchInstallmentsWithType(feestype, CourseID, Batch_ID);
      this.cdRef.detectChanges();
      this.isLoading = true;
      setTimeout(() => {
        const StudentID = this.student_Course.get('Student_ID')?.value;
        const CourseID = this.student_Course.get('Course_ID')?.value;
        const BatchID = this.student_Course.get('Batch_ID')?.value;
        this.newBatchId = BatchID;
        const InstallmentinformationID = this.feesForm.get(
          'Installment_information_ID'
        )?.value;
        const TotalFeeAmount = this.feesForm.get('Total_FeeAmount')?.value || 0;
        const TotalAmount = this.feesForm.get('Total_Amount')?.value || 0;

        console.log('installmentAmount', TotalAmount);
        this.cdRef.detectChanges();
        console.log(
          'Getting for existing StudentID, CourseID, BatchID, InstallmentinformationID, TotalFeeAmount  >>',
          StudentID,
          CourseID,
          BatchID,
          InstallmentinformationID,
          TotalFeeAmount,
          TotalAmount
        );
        this.setTotalFeeAmount(
          StudentID,
          CourseID,
          BatchID,
          InstallmentinformationID,
          TotalFeeAmount,
          TotalAmount
        );
        this.isLoading = false;
      }, 1000);
      this.feesForm.patchValue({ Total_Amount: null });
      this.feesForm.patchValue({ Total_FeeAmount: null });
    }
  }
  loadFollowupHistoryList(): void {
    const studentId =
      this.view === 'followup'
        ? this.selectedStudentForFollowup?.Student_ID
        : this.student_Form.get('Student_ID')?.value;

    if (!studentId) {
      console.log('No student ID found');
      return;
    }

    console.log('Loading follow-up history for student ID:', studentId);
    this.loadingFollowupHistory = true;
    this.followupHistoryList = [];

    this.student_Service_.Get_student_followup_history(studentId).subscribe({
      next: (response: any) => {
        console.log('Follow-up history response:', response);

        let historyData: any[] = [];

        if (
          Array.isArray(response) &&
          response.length > 0 &&
          Array.isArray(response[0])
        ) {
          historyData = response[0];
        } else if (Array.isArray(response)) {
          historyData = response;
        } else {
          console.log('Unexpected response structure:', response);
          historyData = [];
        }

        console.log('Extracted history data:', historyData);
        this.followupHistoryList = historyData;

        // Sort by created date (newest first)
        if (this.followupHistoryList.length > 0) {
          this.followupHistoryList.sort((a: any, b: any) => {
            const dateA = new Date(a.Created_Date || a.created_date || '').getTime();
            const dateB = new Date(b.Created_Date || b.created_date || '').getTime();
            if (dateA !== dateB) {
              return dateB - dateA;
            }
            const idA = a.Follow_Up_ID || a.Followup_ID || a.Follow_up_ID || 0;
            const idB = b.Follow_Up_ID || b.Followup_ID || b.Follow_up_ID || 0;
            return idB - idA;
          });
        }

        this.loadingFollowupHistory = false;
        console.log(
          'Final processed follow-up history:',
          this.followupHistoryList
        );
      },
      error: (error: any) => {
        console.error('Error loading follow-up history:', error);
        this.loadingFollowupHistory = false;
        this.followupHistoryList = [];

        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: {
            Message: 'Unable to load follow-up history. Please try again.',
            Type: '2',
          },
        });
      },
    });
  }
  fetchInstallmentsWithType(
    Fee_Type: string,
    courseId: number,
    Batch_ID: number
  ): void {
    if (courseId && Fee_Type && Batch_ID) {
      console.log(Fee_Type, courseId, Batch_ID);

      this.feesService
        .Get_InstallmentsByFee_Type(Fee_Type, courseId, Batch_ID)
        .subscribe(
          (res) => {
            console.log('res check', res);

            // Append calculated DueDate
            const today = new Date();
            this.installments = res.map((inst) => {
              const dueDate = new Date(today);
              dueDate.setDate(today.getDate() + inst.Duration);

              // Convert duration to months
              const durationInDays = parseInt(inst.Duration, 10);
              const months = Math.floor(durationInDays / 30);

              return {
                ...inst,
                DueDate: dueDate.toISOString().split('T')[0], // format as yyyy-MM-dd for <input type="date">
                DurationInMonths: months > 0 ? months : 'Less than 1 Month',
              };
            });

            // Patch first total amount
            if (this.installments.length > 0) {
              console.log('this.installments', this.installments);

              this.feesForm.patchValue({
                Total_Amount: this.installments.reduce(
                  (sum, inst) => sum + parseFloat(inst.Amount),
                  0
                ),
              });
            }
          },
          (err) => console.error('Error fetching installments:', err)
        );
    }
  }

  onBatchChange(event: any) {
    const batchId = event.target.value;
    const courseId = this.student_Course.get('Course_ID')?.value;
    
    // Fetch Tutors for the selected course and batch
    if (courseId && batchId) {
      this.course_Service_.Get_Teachers_By_Course_And_Batch(courseId, batchId).subscribe(
        (res: any) => {
          this.tutorsList = res || [];
        },
        (err) => {
          console.error('Failed to load tutors', err);
          this.tutorsList = [];
        }
      );
    } else {
      this.tutorsList = [];
    }

    const selectedBatchInfo = this.batch_Data.find(
      (batch) => batch.Batch_ID.toString() == batchId
    );

    if (selectedBatchInfo) {
      this.batchDetails = selectedBatchInfo;
      this.cdRef.detectChanges();
      setTimeout(() => {
        const StudentID = this.student_Course.get('Student_ID')?.value;
        const CourseID = this.student_Course.get('Course_ID')?.value;
        const BatchID = this.student_Course.get('Batch_ID')?.value;
        const InstallmentinformationID = this.feesForm.get(
          'Installment_information_ID'
        )?.value;
        const TotalFeeAmount = this.feesForm.get('Total_FeeAmount')?.value;
        const TotalAmount = this.feesForm.get('Total_Amount')?.value;
        this.setTotalFeeAmount(
          StudentID,
          CourseID,
          BatchID,
          InstallmentinformationID,
          TotalFeeAmount,
          TotalAmount
        );
      }, 1000);
      this.cdRef.detectChanges();
    } else {
      this.batchDetails = '';
    }
       this.feesForm.patchValue({
        Installment_information_ID: -1
      });
    console.log('this.batchDetails: ', this.batchDetails);
  this.feesForm.patchValue({ Installment_information_ID: null });
  }
  onCountryChange(country: ICountry) {
    // Update the form with the selected country code
    this.student_Form.patchValue({
      Country_Code: country.dialling_code,
      Country_Code_Name: country.code,
    });

    console.log('Selected Country:', country);
    console.log('Country Code:', country.dialling_code);
  }
  shouldShowExistingImage(): boolean {
    const profilePhotoPath = this.student_Form.value.Profile_Photo_Path;
    return profilePhotoPath && !(profilePhotoPath instanceof File);
  }
  printReceipt(fee: any): void {
    const includeTax = fee.Tax_Type_Id === 1;
    console.log('Printing receipt for fee:', fee);
    console.log('student_Data:', this.student_Data);
    const name = localStorage.getItem('Name');

    // Assuming fee.Amount is a valid number
    const amount = Number(fee.Amount) || 0;
    const fineAmount = Number(fee.Fine_Amount) || 0;
    const totalAmount = amount + fineAmount;
    
    this.feeAmountInWords = this.convertNumberToWords(totalAmount);
    fee.CGST = +(amount * 0.09).toFixed(2);
    fee.SGST = +(amount * 0.09).toFixed(2);
    fee.Total_GST_18 = +(fee.CGST + fee.SGST).toFixed(2);
    // Assuming you already have fee.FeeDetails_JSON as an array
    const pendingInstallment = fee.FeeDetails_JSON.find(
      (item: any) => item.Fee_Status === 'Pending'
    );

    if (pendingInstallment) {
      fee.Next_Instalment = pendingInstallment.Total_Amount;
      fee.Due_Date = pendingInstallment.Due_Date;
      // fee.Balance = pendingInstallment.Total_Amount - fee.Amount;
      fee.Balance = this.totals.remainingAmount;
    } else {
      fee.Next_Instalment = '0.00';
      fee.Due_Date = null;
    }

    if (fee.Balance == 0) {
      fee.Next_Instalment = '0.00';
      fee.Due_Date = null;
    }
    const imageUrl =
       `${fee.logo_path}`;

     

    this.getImageBase64FromUrlAdditional(imageUrl).then((logoBase64) => {
      const printContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 8px; border: 1px solid #000; }
            .header { text-align: center; border: 1px solid #000; padding: 8px; font-size: 16px; font-weight: bold; margin-bottom: 8px; }
            .sub-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
            .sub-header-add1 { display: flex; align-items: left; gap: 16px; margin-bottom: 8px; }
            .sub-header img { height: 60px; }
            .borderline{style="border: 1px double #000;  outline: 1px solid #000; margin: 8px 0; padding: 0;"}
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            td, th { padding: 6px 8px; font-size: 14px; vertical-align: top; }
            .footer { font-size: 10px; margin-top: 8px; padding-top: 4px;font-weight: normal }
            .footer-mod { font-size: 12px; flex: 1;  }
            .signature-row {font-size: 12px;text-align: right;min-width: 200px;margin-left: 20px;}            
            .invoice-box { padding: 12px; width: 100%; box-sizing: border-box; }
            .mod1{display:flex; justify-item: space-between;align-items: flex-start;flex-wrap: wrap; }
            .leftalign{ text-align: left }
            .rightalign{ text-align: right }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="sub-header-add1" >
              <img style="width:175px" id="logoImg" src=${logoBase64} />
              <div style="text-align: left;font-size: 12px">
                <strong>${fee.Branch_Detail_Name || ''}</strong><br>
                ${[fee.Address1, fee.Address2, fee.Address3, fee.Address4, fee.Pincode ? '- ' + fee.Pincode : ''].filter(v => v && String(v).trim() !== 'null').join(' ')}<br>
                ${[
                  [fee.ContactNo, fee.MobileNo].filter(v => v && String(v).trim() !== 'null').join(', '),
                  fee.Branch_Email && String(fee.Branch_Email).trim() !== 'null' ? fee.Branch_Email : ''
                ].filter(Boolean).join(' | ') || '&nbsp;'}<br>
                <a href="${fee.Website && String(fee.Website).trim() !== 'null' ? fee.Website : 'https://www.trackbox.in'}" target="_blank">${fee.Website && String(fee.Website).trim() !== 'null' ? fee.Website : 'https://www.trackbox.in'}</a>
              </div>          
            </div>
             <div class="sub-header" ><strong>RECEIPT<strong></div>
             <div><tr><td colspan="2"><hr class='borderline' /></td></tr></div>

<table>
            <tr>
            <td class="leftalign">Receipt No. : <strong>${
              fee.Voucher_Number || 'N/A'
            }</strong></td>
            <td class="rightalign">
             Amount : <strong>Rs. ${fee.Amount}</strong></td>
             </tr>
             ${fineAmount > 0 ? `
             <tr>
               <td class="leftalign">Admission Date : <strong>${this.formatDate(fee.Admission_Date)}</strong></td>
               <td class="rightalign">Fine Amount : <strong>Rs. ${fineAmount.toFixed(2)}</strong></td>
             </tr>
             ` : ''}
              <tr>
                <td  class="leftalign">Roll No. : <strong>${
                  fee.Roll_No || 'N/A'
                }</strong></td>
                <td></td>
              </tr>
              
              ${
                includeTax
                  ? `
               <tr>
                <td  class="leftalign">Received from : <strong>${
                  fee.First_Name || 'N/A'
                }</strong></td>
                 <td  class="rightalign">CGST (9.0%) : <strong>Rs. ${fee.CGST.toFixed(
                   2
                 )}</strong</td>
              </tr>
              <tr>
                <td  class="leftalign">Payment Date : <strong>${this.formatDate(
                  fee.Payment_Date
                )}</strong></td>
                <td  class="rightalign">SGST (9.0%) : <strong>Rs. ${fee.SGST.toFixed(
                  2
                )}</strong></td>
              </tr>
              <tr>
                <td class="leftalign">Payment Mode : <strong>${
                  fee.Payment_mode || 'N/A'
                }</strong></td>
                 <td  class="rightalign">Total GST 18% : <strong>Rs. ${fee.Total_GST_18.toFixed(
                   2
                 )}</strong></td>
              </tr>`
                  : `
            
          <tr>
                <td  class="leftalign">Received from : <strong>${
                  fee.First_Name || 'N/A'
                }</strong></td>
                
              </tr>
              <tr>
                <td  class="leftalign">Admission Date : <strong>${this.formatDate(
                  fee.Admission_Date
                )}</strong></td>
              </tr>
              <tr>
                 <td  class="leftalign">Payment Date : <strong>${this.formatDate(
                   fee.Payment_Date
                 )}</strong></td>
              </tr>
              <tr>
               <td class="leftalign">Payment Mode : <strong>${
                 fee.Payment_mode || 'N/A'
               }</strong></td>
              </tr>`
              }
              <tr>
                <td  class="leftalign">Course : <strong>${
                  fee.FeeDetails_JSON[0]?.Course_Name || 'N/A'
                }</strong></td>
                <td></td>
              </tr>
              
             
              <tr style="height: 16px;"><td colspan="2"><hr class="borderline" /></td></tr>
            </table>
            <div><tr><td colspan="2"><hr class='borderline' /></td></tr></div>
            <div class="footer">
           <div class="mod1" >
            <div class="footer-mod">
             <strong>Terms & Conditions:</strong><br>
              1. This receipt is subject to realisation of cheque.<br>
              2. This receipt should be carefully preserved and must be produced on demand.<br>
              3. Fees once paid are not refundable/transferable in any circumstances.<br>
              4. SAC Code: 999293 Service: Commercial Training & Coaching Services
            </div>

            <div class="signature-row"><br>
            <div>(Authorised Signatory)</div><br><br>
              <div>(Student/Parent Signature)</div>
              
            </div>
            
          </div></div>
        </body>
      </html>
    `;

      const printWindow = window.open('', '_blank', 'width=800,height=1000');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for the image to load before printing
        printWindow.onload = () => {
          const logoImg = printWindow.document.getElementById(
            'logoImg'
          ) as HTMLImageElement;
          if (logoImg.complete) {
            printWindow.print();
          } else {
            logoImg.onload = () => printWindow.print();
            logoImg.onerror = () => {
              console.error('Logo image failed to load');
              printWindow.print(); // Fallback: still print without image
            };
          }
        };
      }
    });
  }
  goBack(): void {
    this.cancel.emit();
  }
  getImage(imagepath) {
    return environment['FilePath'] + imagepath;
  }
  onFileSelected(event) {
    const fileSizeLimit = 1 * 1024 * 1024; // 4MB in bytes

    const file = (event.target as HTMLInputElement).files;
    if (file && file[0] && file[0].size > fileSizeLimit) {
      Swal.fire({
        title: 'File Too Large',
        text: 'File size exceeds the 1MB limit. Please select a smaller file.',
        icon: 'warning',
        confirmButtonColor: '#3085d6'
      });
      return; // Exit if the file is too large
    }

    if (
      !(this.student_Form.get('Profile_Photo_Path')?.value instanceof File) &&
      this.student_Form.get('Profile_Photo_Path')?.value != null &&
      this.student_Form.get('Profile_Photo_Path')?.value != ''
    ) {
      this.fileToRemoveAws.push(
        this.student_Form.get('Profile_Photo_Path')?.value
      );
    }
    if (file && file[0]) {
      this.student_Form.get('Profile_Photo_Path')?.setValue(file[0]);
      this.student_Form.get('Profile_Photo_Name')?.setValue(file[0].name);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file[0]);
    } else {
      this.previewUrl = null;
    }
  }
  getImageBase64FromUrl(url: string): Promise<string> {
    return fetch(url)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string); // ✅ Base64 string with prefix
            reader.onerror = () => reject('Failed to convert image');
            reader.readAsDataURL(blob);
          })
      );
  }

  async getImageBase64FromUrlAdditional(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject('Failed to convert image');
      reader.readAsDataURL(blob);
    });
  }

  amountToWords(amount: number): string {
    if (!amount) return '';
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(amount).replace('₹', '').trim() + ' (in rupees)';
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  updateReceipt() {
    if (this.receiptForm.invalid || !this.selectedReceipt) return;

    const formValue = this.receiptForm.value;

    // Convert yyyy-MM-dd ➡ dd-MM-yyyy for storage/display
    const dateParts = formValue.Entry_Date.split('-');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    const updatedReceipt: any = {
      ...this.selectedReceipt,
      ...formValue,
      Entry_Date: formattedDate,
    };

    const index = this.receipList.findIndex((r) => r === this.selectedReceipt);
    if (index > -1) {
      this.receipList[index] = updatedReceipt;
    }

    this.receiptForm.reset();
    this.selectedReceipt = null;
    this.isEditingReceipt = false;
  }
  cancelEdit() {
    this.receiptForm.reset();
    this.selectedReceipt = null;
    this.isEditingReceipt = false;
  }

  Delete_Receipt(Receipt) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: 'Do you want to delete ?',
        Type: true,
        Heading: 'Confirm',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'Yes') {
        this.isLoading = true;
        console.log('Receipt to delete:', Receipt);

        this.feesService.Delete_FeesByReceipt_ID(Receipt.Receipt_Id).subscribe(
          (Delete_status) => {
            if (Delete_status[0].Receipt_Id > 0) {
              this.selectedTabIndex = 1;
              this.get_student_fees_details(Receipt.Student_Id);
              const dialogRef = this.dialogBox.open(DialogBox_Component, {
                panelClass: 'Dialogbox-Class',
                data: { Message: 'Deleted', Type: 'false' },
              });
            } else {
              this.isLoading = false;
              const dialogRef = this.dialogBox.open(DialogBox_Component, {
                panelClass: 'Dialogbox-Class',
                data: { Message: 'Error Occured', Type: '2' },
              });
            }
            this.isLoading = false;
          },
          (Rows) => {
            this.isLoading = false;
            const dialogRef = this.dialogBox.open(DialogBox_Component, {
              panelClass: 'Dialogbox-Class',
              data: { Message: 'Error Occured', Type: '2' },
            });
          }
        );
      }
    });
  }

  Edit_FeesByReceipt_ID(receipt: any) {
    this.selectedReceipt = receipt;
    console.log('receipt to check', this.selectedReceipt);

    // Convert dd-MM-yyyy ➡ yyyy-MM-dd for input[type="date"]
    const paymentDate =
      receipt.Payment_Date || receipt.Entry_Date || new Date().toISOString();

    const incoming = {
      Student_Fees_ID: 77,
      Installment_information_ID: receipt.Installment_information_ID || '',
      Total_Amount: parseFloat(receipt.Amount),
      Fee_Status: receipt.Fee_Status,
      Payment_Date: paymentDate,
      Due_Date: receipt.Due_Date ? new Date(receipt.Due_Date) : '',
      Paid_Amount: '',
      Payment_Mode: receipt.Payment_mode || 'ADMIN',
      Transaction_ID: receipt.Transaction_ID || '',
      Student_ID: receipt.Student_Id,
      Course_ID: receipt.Course_ID,
      Receipt_Id: receipt.Receipt_Id,
      update_status: true,
    };
    if (!this.feesForm.contains('Receipt_Id')) {
      this.feesForm.addControl('Receipt_Id', new FormControl(''));
    }
    const formKeys = Object.keys(this.feesForm.controls);
    const missingKeys = Object.keys(incoming).filter(
      (k) => !formKeys.includes(k)
    );
    console.warn('❗Missing form controls:', missingKeys); // dev helper
    this.isEditingFees = true;
    this.feesForm.patchValue(incoming);
    this.view = 'Add_Fees';
  }
  handleCancel(studentId: any): void {
    this.view = 'Student_Fees';
    this.selectedTabIndex = 1;

    if (studentId > 0) {
      this.get_student_fees_details(studentId);
      this.loadFeesList(studentId);
    } else {
      console.warn('Invalid Student_ID on cancel');
    }
  }
  payFee(fee: any): void {
    this.payFeeStatus = true;
    this.feesForm.patchValue({
      Student_Fees_ID: fee.Student_Fees_ID,
      Installment_information_ID: fee.Installment_information_ID || '',
      Total_Amount: parseFloat(fee.Total_Amount),
      Paid_Amount: fee.Remaining_Amount,
      Fee_Status: fee.Fee_Status,
      Payment_Date: new Date(),
      Due_Date: fee.Due_Date ? new Date(fee.Due_Date) : '',
      Payment_Mode: fee.Payment_Mode || 'ADMIN',
      Transaction_ID: fee.Transaction_ID || '',
      Course_ID: fee.Course_ID,
      Student_ID: fee.Student_ID,
      update_status: false,
    });
    this.selectedTabIndex = 1;
    // Optional: scroll to form or switch to "Fee Entry" tab
    const tabGroup = document.querySelector('mat-tab-group');
    if (tabGroup) {
      (tabGroup as any).selectedIndex = 1; // Switch to Fee Entry tab
    }
    this.isEditingFees = false;
    this.view = 'Add_Fees';
  }
  get isEditMode(): boolean {
    return this.feesForm.get('update_status')?.value === true;
  }

  openStudentDocuments(student: any): void {
    this.selectedStudentForDocuments = student;
    this.view = 'Student_Documents';
  }
  handleDocumentsCancel(studentId: any): void {
    this.view = 'Student_Fees';
    // this.selectedTabIndex = 0;

    // this.pageLoad();
  }
  handleExpenseCancel(studentIds: any): void {
    // this.view = 'Student_Fees';
    console.log('studentId', studentIds);
  }
  handleExpenseSave(result: any): void {
    console.log('test result', result);
    const expensePayload = {
      Expense_Id: result.Expense_Id || 0,
      Expense_Type_Id: result.Expense_Type_Id,
      User_Id: this.getLoggedInUserId(),
      Entry_Date: new Date(),
      Amount: result.Amount,
      Description: result.Description,
      Account_id: result.Account_Id || 0,
      Account_Name: result.Account_Name || '',
      Student_ID: result.Student_ID,
      StudentName: result.StudentName,
    };
    this.expenseApi.saveExpense(expensePayload).subscribe((Save_status) => {
      if (Save_status) {
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Expense saved successfully!', Type: 'false' },
        });
      }
    });
  }
  getLoggedInUserId(): number {
    const User_Id = localStorage.getItem('User_Type');
    // Replace with real logic from auth service
    return User_Id ? Number(User_Id) : 1; // Example
  }
  openAddExpense(student: any): void {
    this.view = 'Student_Expense';
    this.studentExpense = student;
  }
  studentRemoveRegistration(student: any, isRegistered: boolean) {
    console.log('studentRemoveRegistration', isRegistered);
    const action = !isRegistered ? 'register' : 'unregister';
    // this.isRegistering = !isRegistered; // Don't toggle state here, let the UI/Confirmation handle it
    const message = `Do you want to Remove Registration?`;
    const User_ID = localStorage.getItem('User_Type');

    const rollNo = this.student_Form.get('Roll_No')?.value;

     const dialogRef = this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: message,
        Type: true,
        Heading: 'Confirm',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'Yes') {
         console.log("this.student_Form['Roll_No']", this.student_Form.value.Branch_Id);
    console.log('mode', this.mode);
    console.log("this.student_Form['Roll_No']", this.student_Form.value.Roll_No);

    if (this.student_Form.value.Roll_No) {
      // this.registration_Status
      this.isLoading = true;
      console.log('Student ID:', student);
      console.log('Currently Registered:', isRegistered);

      console.log('User_ID', User_ID);
      // Registration_Using_Student_Branch
      this.feesService
        .Remove_Student_Registration(
          student.Student_ID,
          isRegistered,
          User_ID
        )
        .subscribe(
          (res: RegistrationResponse) => {
            console.log('Registration response:', res);
            this.followUps['Roll_No'] = res.RollNumber;
            this.student_Form.get('Roll_No')?.setValue(res.RollNumber);

            // this.ngOnInit();
            this.isLoading = false;
          },
          (err) => {
            console.error('Error loading fee list:', err);
            this.isLoading = false;
          }
        );
      this.isLoading = false;
    }
      }
    })
   
  }
  studentRegistration(student: any, isRegistered: boolean) {
    console.log('isRegistered', isRegistered);
    const action = !isRegistered ? 'register' : 'unregister';
    this.registration_Status = !isRegistered;
    const message = `Do you want to ${action}?`;
    const User_ID = localStorage.getItem('User_Type');
    // Is_Registered


         console.log("this.student_Form['Roll_No']", this.student_Form.value.Branch_Id);
    console.log('mode', this.mode);
    console.log("this.student_Form['Roll_No']", this.student_Form.value.Roll_No);

    if (!this.student_Form['Roll_No']) {
      // this.registration_Status
      this.isLoading = true;
      console.log('Student ID:', student);
      console.log('Currently Registered:', isRegistered);

      console.log('User_ID', User_ID);
      // Registration_Using_Student_Branch
      this.feesService
        .Registration_Using_Student_Branch(
          student.Student_ID,
          isRegistered,
          User_ID
        )
        .subscribe(
          (res: RegistrationResponse) => {
            console.log('Registration response:', res);
            if (this.followUps) {
              this.followUps['Roll_No'] = res.RollNumber;
            }
            this.student_Form.get('Roll_No')?.setValue(res.RollNumber);
            this.isLoading = false;
          },
          (err) => {
            console.error('Error in registration call:', err);
            this.isLoading = false;
          }
        );
      this.isLoading = false;
    }
  }

  loadFeesList(Student_ID): void {
    const studentId = Student_ID;
    // this.setTotalFeeAmount(Student_ID);
    if (studentId) {
      this.feesService.Get_FeesByStudentId(studentId).subscribe(
        (res) => {
          this.feesList = res;
          console.log('this.feesList', this.feesList);
          this.totals = this.feesList.reduce(
            (acc, fee) => {
              acc.totalAmount += parseFloat(fee.Total_Amount);
              acc.paidAmount += parseFloat(fee.Paid_Amount);
              acc.remainingAmount += parseFloat(fee.Remaining_Amount);
              return acc;
            },
            { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
          );

          console.log('Total Fees:', this.totals.totalAmount);
          console.log('Total Paid:', this.totals.paidAmount);
          console.log('Balance:', this.totals.remainingAmount);
        },
        (err) => {
          console.error('Error loading fee list:', err);
        }
      );
    }
  }
  get_student_fees_details(Student_ID): void {
    const studentId = Student_ID;
    console.log('Fetching fees for student ID:', studentId);

    if (studentId) {
      this.feesService.get_student_fees_details(studentId).subscribe(
        (res) => {
          this.receipList = res;
        },
        (err) => {
          console.error('Error loading fee list:', err);
        }
      );
    }
  }
  Student_Fees(student) {
    this.view = 'Student_Fees';
    const Student_ID = student.Student_ID;
    this.loadFeesList(Student_ID);
    this.get_student_fees_details(Student_ID);
  }
  setStudentDetails(student: any) {
    console.log('Showing course details for:', student);
  }

  Edit_student(student_e: any) {
    console.log('student_e: ', student_e);
    this.view = 'edit';
    this.nextFollowUpDate = this.getCurrentDate();
    // isActive
    // Preservation of Active_Status from database
    if (!student_e['Active_Status']) {
      const status = (student_e['Status_Name'] || '').toLowerCase();
      if (status === 'completed') {
        student_e['Active_Status'] = 'Completed';
      } else {
        student_e['Active_Status'] = student_e['isActive'] ? 'Active' : 'Dropout';
      }
    }
    if (student_e['Roll_No'] || (this.followUps && this.followUps['Roll_No'])) {
      this.registration_Status = true;
      this.isRegistering = true;
    }
    // Always hide follow-up section when editing existing student
    this.showFollowUpSection = false;

    this.Clr_student_Course();
    this.isLoading = true;
    const admissionDate = new Date(student_e.Admission_Date);
    const formatted = admissionDate.toLocaleDateString('en-CA'); // "2025-06-16"
    student_e.Admission_Date = formatted;

    // For leads, 'Place' is stored in the 'Address' field.
    // Ensure 'District' (bound to Place UI) is populated from Address.
    if (!this.isRegistering && student_e.Address) {
      student_e.District = student_e.Address;
    }

    student_e.Mock_Test_Subscribed = !!student_e.Mock_Test_Subscribed;

    this.student_Form.patchValue(student_e);
    this.View_courses(student_e.Student_ID, false);

    // Load existing follow-up data silently (no UI, just store the data)
    this.loadExistingFollowUpData(student_e.Student_ID);
  }
  UpdateRegistering() {}
  loadExistingFollowUpData(studentId: number): void {
    console.log(
      '=== Loading existing follow-up data silently for student:',
      studentId
    );

    if (!studentId) {
      console.log('No student ID provided, clearing follow-up data');
      this.currentFollowUpData = null;
      return;
    }

    // Get the latest follow-up record for this student
    this.student_Service_.Get_student_current_followup(studentId).subscribe({
      next: (response: any) => {
        let followUpData: any = null;

        // Handle different response structures
        if (Array.isArray(response) && response.length > 0) {
          if (Array.isArray(response[0]) && response[0].length > 0) {
            followUpData = response[0][0]; // Your typical structure: response[0][0]
          } else if (response[0] && typeof response[0] === 'object') {
            followUpData = response[0]; // response[0] is the object
          }
        }

        if (!followUpData) {
          console.log('No existing follow-up data found');
          this.nextFollowUpDate = this.getCurrentDate();
          this.remark = '';
          this.isLoading = false;
          return;
        }
        const admissionDate = new Date(followUpData.Admission_Date);
        const formatted = admissionDate.toLocaleDateString('en-CA');
        followUpData.Admission_Date = formatted;
        const today = new Date().toISOString().split('T')[0];
        this.student_Form.patchValue({
          Guardian_Type: followUpData.Guardian_Type
            ? followUpData.Guardian_Type
            : 'Father',
          Guardian_Name: followUpData.Guardian_Name || '',
          Guardian_Phone: followUpData.Guardian_Phone || '',
          Guardian_Alt_Phone: followUpData.Guardian_Alt_Phone,
          Active_Status:
            (followUpData.Status_Name || '').toLowerCase() === 'completed'
              ? 'Completed'
              : followUpData.isActive === 0
              ? 'Dropout'
              : 'Active',

          Height_cm: followUpData.Height_cm || '',
          Weight_kg: followUpData.Weight_kg || '',
          Admission_Date: followUpData.Admission_Date || today,
          Roll_No: followUpData.Roll_No || null,
          Age: followUpData.Age || [''],
          Qualification: followUpData.Qualification || [''],
          Qualification_Description: followUpData.Qualification_Description || [''],
          Alt_Phone_Number: followUpData.Alt_Phone_Number || [''],
          Address: followUpData.Address || [''],
        });
        // this.student_Form.patchValue(followUpData);
        // Just store the data, don't show any UI
        this.currentFollowUpData = followUpData;

        if (followUpData && Object.keys(followUpData).length > 0) {
          // Correct field mappings from backend:
          // Branch_Id, Department_Id, To_User_Id, Follow_Up_Date, Status_Name
          const branchId = followUpData.Branch_Id || followUpData.Branch_ID;
          const deptId = followUpData.Department_Id || followUpData.Department_ID;
          const staffId = followUpData.To_User_Id || followUpData.Assigned_Staff_ID;
          const statusName = followUpData.Status_Name || followUpData.Follow_Up_Status_Name;
          const statusId = followUpData.Status_Id || followUpData.Follow_Up_Status_ID || followUpData.Status_ID;

          console.log('Processed Follow-up data:', {
            branchId,
            deptId,
            staffId,
            statusName,
            followUpDate: followUpData.Follow_Up_Date
          });

          // Match IDs with dropdown objects to update UI
          if (branchId && this.Search_Branch_Data?.length > 0) {
            const matched = this.Search_Branch_Data.find(b => (b.Branch_Id || b.Branch_ID) == branchId);
            if (matched) this.Search_Branch = matched;
          }

          if (deptId && this.Search_Department_Data?.length > 0) {
            const matched = this.Search_Department_Data.find(d => (d.Department_Id || d.Department_ID) == deptId);
            if (matched) this.Search_Department = matched;
          }

          if (staffId && this.staffData?.length > 0) {
            const matched = this.staffData.find(s => s.User_ID == staffId);
            if (matched) this.Search_staff = matched;
          }

          if (this.followUpStatusData?.length > 0) {
            let matched = null;
            if (statusId) {
              matched = this.followUpStatusData.find(s => (s.Status_Id || s.Status_ID) == statusId);
            }
            if (!matched && statusName) {
              matched = this.followUpStatusData.find(s => s.Status_Name?.toLowerCase() === statusName.toLowerCase());
            }
            if (matched) this.Search_status = matched;
          }

          // Set Date and Remark
          const rawDate = followUpData.Follow_Up_Date || followUpData.Next_Follow_Up_Date;
          this.nextFollowUpDate = rawDate ? new Date(rawDate).toISOString().split('T')[0] : this.getCurrentDate();
          this.remark = followUpData.Remark || '';
        } else {
          console.log('No existing follow-up data found');
          this.nextFollowUpDate = this.getCurrentDate();
          this.remark = '';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading follow-up data:', error);
        this.currentFollowUpData = null;
        this.isLoading = false;
      },
    });
  }

  View_courses(Student_ID: any, viewChange: boolean = true) {
    this.selectedTime = '';
    this.selectedSlot = null;
    this.optedCourseId = null;
    this.isLoading = true;
    this.student_Service_
      .getCoursesByStudentId(Student_ID)
      .subscribe((result: any) => {
        this.courseList = result;
        console.log("Result!!!!!!", result);
        if (result && result.length > 0) {
        this.feesForm
          .get('Total_FeeAmount')
          ?.setValue(this.courseList[0].Total_FeeAmount);
        this.feesForm.get('Discount')?.setValue(this.courseList[0].Discount);
        this.feesForm
          .get('Student_ID')
          ?.setValue(this.courseList[0].Student_ID);
        this.feesForm.get('Batch_ID')?.setValue(this.courseList[0].Batch_ID);

        console.log('After setValue:', this.feesForm.value);

        setTimeout(() => {
          const StudentID = this.student_Course.get('Student_ID')?.value;
          const CourseID = this.student_Course.get('Course_ID')?.value;
          const BatchID = this.student_Course.get('Batch_ID')?.value;
          const InstallmentinformationID = this.feesForm.get(
            'Installment_information_ID'
          )?.value;
          const TotalFeeAmount = this.feesForm.get('Total_FeeAmount')?.value;
          const TotalAmount = this.feesForm.get('Total_Amount')?.value;
          console.log('installmentAmount', TotalAmount);

          console.log(
            'Getting for existing StudentID, CourseID, BatchID, InstallmentinformationID, TotalFeeAmount  >>',
            StudentID,
            CourseID,
            BatchID,
            InstallmentinformationID,
            TotalFeeAmount,
            TotalAmount
          );
          this.setTotalFeeAmount(
            StudentID,
            CourseID,
            BatchID,
            InstallmentinformationID,
            TotalFeeAmount,
            TotalAmount
          );
        }, 1000);

        if (viewChange) {
          this.view = 'courses';
        }

        if (result.length) {
          if (result[0]['start_time'] && result[0]['end_time']) {
            this.selectedTime =
              result[0]['start_time'] + ' - ' + result[0]['end_time'];
          }
          this.selectedSlot = result[0].Slot_Id;
          this.slotDetails = {
            Teacher_Name: result[0]['Teacher_Name_One_On_One'],
            start_time: result[0]['start_time'],
            end_time: result[0]['end_time'],
          };
          this.optedCourseId = result[0].Course_ID;
        }
        if (this.view != 'courses' && result.length) {
          this.student_Course.patchValue({
            Student_ID: Student_ID,
            Course_ID: result[0] ? result[0].Course_ID : 0,
            Batch_ID: result[0] ? result[0].Batch_ID : 0,
            Slot_Id: result[0] ? result[0].Slot_Id : 0,
            StudentCourse_ID: result[0] ? result[0].StudentCourse_ID : 0,
            Price: result[0] ? result[0].Price : 0,
            Payment_Method: 'admin',
          });

          // Fetch tutors for the loaded course and batch
          if (result[0] && result[0].Course_ID && result[0].Batch_ID) {
            this.course_Service_.Get_Teachers_By_Course_And_Batch(result[0].Course_ID, result[0].Batch_ID).subscribe(
              (res: any) => {
                this.tutorsList = res || [];
              },
              (err) => {
                console.error('Failed to load tutors', err);
                this.tutorsList = [];
              }
            );
          } else {
            this.tutorsList = [];
          }

           this.isLoading = false;
        } else {
          this.student_Course.patchValue({
            Student_ID: Student_ID,
          });
          this.isLoading = false;
        }

        if (result.length > 0) {
          this.StudentFees_Service_.Get_FeesByStudentCourse(
            Student_ID,
            this.courseList[0].Course_ID
          ).subscribe((result) => {
            console.log('Fees for selected course:', result);
            if (result.length > 0) {
              this.isRegistering = true;
              this.fees_updated_status = true;
              const Fee_Type = result[0]?.Fee_Type;

              const totalRemainingAmount = result.reduce((sum, fee) => {
                return sum + parseFloat(fee.Remaining_Amount);
              }, 0);

              this.installment_label = Fee_Type;

              if (totalRemainingAmount > 0) {
                this.feesForm.get('Fee_Status')?.setValue('Pending');
              } else {
                this.feesForm.get('Fee_Status')?.setValue('Paid');
              }
              // this.feesForm.get('Total_Amount')?.setValue(totalRemainingAmount);
              this.feesForm
                .get('Installment_information_ID')
                ?.setValue(Fee_Type);

              let totalAmountSum = result.reduce(
                (sum, fee) => sum + parseFloat(fee.Total_Amount),
                0
              );

              // this.feesForm.get('Total_Amount')?.setValue(totalAmountSum);
              this.calculatedTotalAmount = totalAmountSum;
              console.log('totalAmountSum', totalAmountSum);
              console.log('calculatedTotalAmount', this.calculatedTotalAmount);
              // this.setTotalFeeAmount(Student_ID);

              this.installments = result.map((fee) => ({
                ...fee,
                Amount: parseFloat(fee.Total_Amount), // <-- this is the key
                DueDate: fee.Due_Date ? fee.Due_Date.split('T')[0] : '', // trim time portion
                Duration: fee.Duration,
              }));
              debugger
              this.originalInstallments = this.installments;
              this.Student_Fees_IDs = result.map((fee) => fee.Student_Fees_ID);
              this.isLoading = false;
            }
          });
        }
         
      }this.isLoading = false;
      },error => {

        console.error('Error fetching fees:', error);
        this.isLoading = false;

      }
    );
  }
  // Set Total_FeeAmount based on various conditions
  setTotalFeeAmount(
    Student_ID: any,
    Course_ID: any,
    Batch_ID: any,
    Installment_information_ID: any,
    Total_FeeAmount: any,
    Total_Amount: any
  ) {
    // 1. Use Installment sum if available
    if (Student_ID == 0 && this.installments.length > 0) {
      console.log(
        'Inside  Installment sum if available',
        Student_ID,
        Total_Amount,
        this.installments.length
      );
      console.log('Inside  Installment sum if available');
      this.feesForm.patchValue({ Total_FeeAmount: Total_Amount });
      this.cdRef.detectChanges();
      return;
    }

    // 2. Use Editmode if no Total_FeeAmount stored

    if (Student_ID !== 0 && !Total_FeeAmount && Total_Amount) {
      console.log(
        'Student_ID && this.newBatchId !== Batch_ID   && this.installments.length > 0 && !Total_FeeAmount',
        Student_ID,
        this.newBatchId !== Batch_ID,
        this.installments.length > 0,
        !Total_FeeAmount
      );

      console.log('Inside  Editmode if no Total_FeeAmount stored');
      this.student_Service_;
      this.feesForm.patchValue({ Total_FeeAmount: Total_Amount });
      this.cdRef.detectChanges();
      return;
    }

    // 2. Use Editmode if no Total_FeeAmount stored

    if (Student_ID && this.installments.length > 0 && !Total_FeeAmount) {
      console.log(
        'Student_ID && this.newBatchId !== Batch_ID   && this.installments.length > 0 && !Total_FeeAmount',
        Student_ID,
        this.newBatchId !== Batch_ID,
        this.installments.length > 0,
        !Total_FeeAmount
      );

      console.log('Inside  Editmode if no Total_FeeAmount stored');
      this.student_Service_;
      this.feesForm.patchValue({ Total_FeeAmount: Total_Amount });
      this.cdRef.detectChanges();
      return;
    }

    //   // 3. Use backend Total_FeeAmount if all values present

    if (
      Student_ID &&
      this.newBatchId == Batch_ID &&
      Course_ID &&
      Total_FeeAmount &&
      this.installments.length > 0
    ) {
      console.log('Inside backend');
      console.log(
        'Student_ID && this.newBatchId !== Batch_ID   && this.installments.length > 0 && !Total_FeeAmount',
        Student_ID,
        this.newBatchId !== Batch_ID,
        this.installments.length > 0,
        !Total_FeeAmount
      );
      this.student_Service_
        .getCoursesByStudentId(Student_ID)
        .subscribe((data: any) => {
          const feeAmountFromBackend = data?.[0]?.Total_FeeAmount;
          console.log(
            'Setting Total_FeeAmount from backend:',
            feeAmountFromBackend
          );

          this.feesForm.patchValue({ Total_FeeAmount: feeAmountFromBackend });
          this.cdRef.detectChanges();
        });
      return;
    }

    // 4. Fallback to zero if no data

    console.log('Setting Total_FeeAmount to 0 (no data)');
    this.feesForm.patchValue({ Total_FeeAmount: 0 });

    this.cdRef.detectChanges();

    // //   // 3. Use backend Total_FeeAmount if all values present

    if (
      Student_ID &&
      Course_ID &&
      this.newBatchId !== Batch_ID &&
      Total_FeeAmount &&
      this.installments.length > 0
    ) {
      console.log('Inside backend');
      console.log(
        'Student_ID && this.newBatchId !== Batch_ID   && this.installments.length > 0 && !Total_FeeAmount',
        Student_ID,
        this.newBatchId !== Batch_ID,
        this.installments.length > 0,
        !Total_FeeAmount
      );
      this.student_Service_
        .getCoursesByStudentId(Student_ID)
        .subscribe((data: any) => {
          const feeAmountFromBackend = data?.[0]?.Total_FeeAmount;
          console.log(
            'Setting Total_FeeAmount from backend:',
            feeAmountFromBackend
          );

          this.feesForm.patchValue({ Total_FeeAmount: feeAmountFromBackend });
          this.cdRef.detectChanges();
        });
      return;
    }

    //   // 4. Fallback to zero if no data
    setTimeout(() => {
      console.log('Setting Total_FeeAmount to 0 (no data)');
      this.feesForm.patchValue({ Total_FeeAmount: 0 });
    }, 2000);

    this.cdRef.detectChanges();
  }

  Clr_student_Course() {
    this.previewUrl = null;
    this.student_Course.reset({
      Student_ID: 0,
      StudentCourse_ID: 0,
      Course_ID: 0,
      Enrollment_Date: new Date().toISOString().substring(0, 10), // today's date
      Expiry_Date: '',
      Price: '',
      Payment_Date: new Date().toISOString().substring(0, 16), // today's datetime
      Payment_Status: '',
      LastAccessed_Content_ID: 0,
      Transaction_Id: '',
      Delete_Status: 0, // default to 0
      Payment_Method: '',
      Slot_Id: null,
      Batch_ID: null,
    });
  }

  openFollowUp(student: any) {
    if (!student?.Student_ID) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Invalid student data', Type: '3' },
      });
      return;
    }

    this.Edit_student(student);
    this.loadFollowupData();
    this.remark = '';
    this.showFollowUpSection = true;
    this.loadFollowupHistoryList();
  }

  Delete_student(student_Id) {
    console.log('student_Id', student_Id.Student_ID);
    const Student_ID = student_Id.Student_ID;
    const dialogRef = this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: 'Do you want to delete ?',
        Type: true,
        Heading: 'Confirm',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'Yes') {
        this.isLoading = true;
        this.student_Service_.Delete_student(Student_ID).subscribe(
          (Delete_status) => {
            if (Delete_status[0].Student_ID > 0) {
              this.goBack();
              const dialogRef = this.dialogBox.open(DialogBox_Component, {
                panelClass: 'Dialogbox-Class',
                data: { Message: 'Deleted', Type: 'false' },
              });
            } else {
              this.isLoading = false;
              const dialogRef = this.dialogBox.open(DialogBox_Component, {
                panelClass: 'Dialogbox-Class',
                data: { Message: 'Error Occured', Type: '2' },
              });
            }
            this.isLoading = false;
          },
          (Rows) => {
            this.isLoading = false;
            const dialogRef = this.dialogBox.open(DialogBox_Component, {
              panelClass: 'Dialogbox-Class',
              data: { Message: 'Error Occured', Type: '2' },
            });
          }
        );
      }
    });
  }

  // To check Mismtch in Fee amount and installment Sum
  checkInstallmentMismatch(): boolean {
    const feeAmount = +this.feesForm.get('Fee_Amount')?.value || 0;
    const sumOfInstallments = this.installments.reduce(
      (sum, inst) => sum + (+inst.Amount || 0),
      0
    );

    return feeAmount !== sumOfInstallments;
  }

  //Converting Amount to words
  convertNumberToWords(amount: number): string {
    if (amount === 0) return 'Zero Rupees';

    const ones = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];

    function twoDigits(n: number): string {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }

    function segmentToWords(n: number, label: string): string {
      return n ? twoDigits(n) + ' ' + label : '';
    }

    let num = Math.floor(amount);
    let result = '';

    // Extract segments
    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundred = Math.floor(num / 100);
    const rest = num % 100;

    if (crore) result += segmentToWords(crore, 'Crore ') + ' ';
    if (lakh) result += segmentToWords(lakh, 'Lakh ') + ' ';
    if (thousand) result += segmentToWords(thousand, 'Thousand ') + ' ';
    if (hundred) result += ones[hundred] + ' Hundred ';
    if (rest) {
      if (result !== '') result += 'and ';
      result += twoDigits(rest) + ' ';
    }

    // result += 'Rupees';
    result += 'Only';

    return result.trim().replace(/\s+/g, ' ');
  }
}
