import { Component, inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { user_Service } from '../../services/user.Service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { StudentlistComponent } from "../studentlist/studentlist.component";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { course_Service } from '../../services/course.Service';
import jsPDF from 'jspdf';
// import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { LOCALE_ID } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeGb from '@angular/common/locales/en-GB';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { MatDialog } from '@angular/material/dialog';
import { EmailTemplateService } from '../../services/email-template.service';
import Swal from 'sweetalert2';

// Register 'en-GB' locale for dd-MM-yyyy support
registerLocaleData(localeGb);

// Custom format object
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'dd-MM-yyyy',
  },
  display: {
    dateInput: 'dd-MM-yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd-MM-yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};


@Component({
  selector: 'app-student-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, StudentlistComponent,
  MatCheckboxModule, MatNativeDateModule, MatSelectModule],
  providers: [provideNativeDateAdapter(), { provide: LOCALE_ID, useValue: 'en-GB' }, // for dd-MM-yyyy support
      { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
      { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
  templateUrl: './student-report.component.html',
  styleUrls: ['./student-report.component.scss'],
})
export class StudentReportComponent implements OnInit {
  selectedCourse = new FormControl('');
  selectedStudent = new FormControl('');
  selectedBatch = new FormControl('');
  fromDate = new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  toDate = new FormControl(new Date());
  private user = inject(user_Service);
  private courseService = inject(course_Service);
  private emailTemplateService = inject(EmailTemplateService);
  dialogBox = inject(MatDialog);

  courseList: any[] = [];
  batchList: any[] = [];

 displayedColumns = [
  'Action',
  'Student_ID',
  'Name', // merged First_Name + Last_Name
  'Email',
  'Contact',
  'Branch_Name',
  'Entry_Date'
];
showMoreOptions: boolean = false;

  totalEntries = '';
  tableData: any[] = [];
  // Pagination
  pageSize = 12;
  currentPage = 1;
  totalRecords = 0;
  Math = Math;
  IsLoaded = false;
  student_edit: boolean = false;
  student_Details: any;
  isFollowupOnly: boolean = false;
  branchName:string=""
  
  // Bulk Email Properties
  selectedStudents: Set<any> = new Set();
  showEmailModal: boolean = false;
  emailTemplates: any[] = [];
  selectedTemplateId: number | null = null;
  emailSubject: string = '';
  emailBody: string = '';
  isSendingEmail: boolean = false;

  constructor() { }

  ngOnInit() {
    this.loadInitialData();
    this.loadEmailTemplates();
  }

  loadEmailTemplates() {
    this.emailTemplateService.searchTemplates('').subscribe((res) => {
      this.emailTemplates = res || [];
    });
  }

  loadInitialData() {
    this.loadCourses();
    this.fetchReportData();
  }

  loadCourses() {
    this.courseService.get_course_names().subscribe({
      next: (res: any) => {
        this.courseList = res?.[0] || [];
      },
      error: (err) => console.error('Error loading courses', err)
    });
  }

  onCourseSelectionChange() {
    const selectedCourseName = this.selectedCourse.value;
    const selectedCourseObj = this.courseList.find(c => 
      c.Course_Name?.trim().toLowerCase() === selectedCourseName?.trim().toLowerCase()
    );
    
    console.log('Course Selection Changed:', selectedCourseName, 'Found:', selectedCourseObj);

    if (selectedCourseObj) {
      this.courseService.get_course_Batches(selectedCourseObj.Course_ID).subscribe({
        next: (res: any) => {
          this.batchList = res || [];
          this.selectedBatch.setValue(''); // Reset batch selection
          this.fetchReportData();
        },
        error: (err) => console.error('Error loading batches', err)
      });
    } else {
      this.batchList = [];
      this.selectedBatch.setValue('');
      this.fetchReportData();
    }
  }

  fetchReportData() {
  this.currentPage = this.currentPage || 1;
  this.IsLoaded = false;

  // If both dates are selected and more options is shown, use them; else pass null/empty
  const hasValidDates = this.showMoreOptions &&
                       this.fromDate.value &&
                       this.toDate.value;

const params = {
  studentSearch: this.selectedStudent.value?.trim() || '',
  batchSearch: this.selectedBatch.value?.trim() || '',
  courseSearch: this.selectedCourse.value?.trim() || '',
  fromDate: hasValidDates ? this.fromDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  toDate: hasValidDates ? this.toDate.value?.toLocaleDateString('en-CA') ?? '' : '',
};

console.log("params", params,this.currentPage,
      this.pageSize);

  this.user
    .Get_Report_Student(
      params.studentSearch,
      params.batchSearch,
      params.courseSearch,
      params.fromDate,
      params.toDate,
      this.currentPage,
      this.pageSize
    )
    .subscribe({
      next: (res: any[]) => {
        console.log('res', res);
        const [countResult, data] = res;
        this.totalRecords = countResult?.[0]?.totalRecords || 0;
        this.tableData = data?.map((item) => ({
          ...item,
          Name: `${item.First_Name} ${item.Last_Name}`,
          Contact: item.Phone_Number,
        })) || [];
      },
      complete: () => (this.IsLoaded = true),
    });
}

  // Bulk Selection Logic
  get isAllSelected() {
    return this.tableData.length > 0 && this.selectedStudents.size === this.tableData.length;
  }

  toggleSelectAll(event: any) {
    if (event.checked) {
      this.tableData.forEach(row => this.selectedStudents.add(row));
    } else {
      this.selectedStudents.clear();
    }
  }

  toggleSelectStudent(row: any, event: any) {
    if (event.checked) {
      this.selectedStudents.add(row);
    } else {
      this.selectedStudents.delete(row);
    }
  }

  openBulkEmailModal() {
    if (this.selectedStudents.size === 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Please select at least one student to send email.', Type: '3' },
      });
      return;
    }
    
    // Check if any selected student doesn't have an email
    const noEmailStudents = Array.from(this.selectedStudents).filter(s => !s.Email);
    if (noEmailStudents.length > 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: `Warning: ${noEmailStudents.length} selected student(s) do not have an email address. They will be skipped.`, Type: '3' },
      });
    }

    this.showEmailModal = true;
    this.emailSubject = '';
    this.emailBody = '';
    this.selectedTemplateId = null;
  }

  closeEmailModal() {
    this.showEmailModal = false;
  }

  onTemplateChange() {
    if (this.selectedTemplateId) {
      const template = this.emailTemplates.find(t => t.Template_ID === this.selectedTemplateId);
      if (template) {
        this.emailSubject = template.Subject;
        this.emailBody = template.Body;
      }
    } else {
      this.emailSubject = '';
      this.emailBody = '';
    }
  }

  sendBulkEmail() {
    if (!this.emailSubject.trim() || !this.emailBody.trim()) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Please enter Subject and Body for the email.', Type: '3' },
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Sending',
      text: `Are you sure you want to send this email to ${this.selectedStudents.size} student(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, send it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBulkEmailSend();
      }
    });
  }

  private executeBulkEmailSend() {
    this.isSendingEmail = true;
    const payload = {
      students: Array.from(this.selectedStudents),
      subject: this.emailSubject,
      body: this.emailBody
    };

    this.user.Send_Bulk_Email(payload).subscribe({
      next: (res) => {
        this.isSendingEmail = false;
        this.closeEmailModal();
        this.selectedStudents.clear();
        Swal.fire({
          title: 'Sent!',
          text: 'Bulk emails sent successfully!',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
      },
      error: (err) => {
        this.isSendingEmail = false;
        console.error('Bulk email error:', err);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to send bulk emails.',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  onSaveStudent(event: any): void {
  this.student_edit = false; 
}

  student_List_Update(row: any) {
    this.student_edit = true;
    this.student_Details = row;
    this.isFollowupOnly = false;
  }

  openFollowUp(student: any) {
    this.student_edit = true;
    this.student_Details = student;
    this.isFollowupOnly = true;
  }

  onCancelEdit() {
    this.student_edit = false;
    this.student_Details = null;
    this.isFollowupOnly = false;
    this.fetchReportData();
  }

  clearFilters() {
    [this.selectedCourse, this.selectedStudent, this.selectedBatch].forEach(control => control.reset());
    this.batchList = [];
    this.fromDate.setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    this.toDate.setValue(new Date());
    this.showMoreOptions = false;
    this.currentPage = 1;
    this.selectedStudents.clear();
    this.fetchReportData();
  }

  onPageChange(event: { pageIndex: number, pageSize: number }) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.selectedStudents.clear();
    this.fetchReportData();
  }
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

downloadPDF(): void {

   const hasValidDates = this.showMoreOptions &&
                      this.fromDate.value &&
                      this.toDate.value;

  const allDataParams = {
    studentSearch: this.selectedStudent.value?.trim() || '',
    batchSearch: this.selectedBatch.value?.trim() || '',
    courseSearch: this.selectedCourse.value?.trim() || '',
    fromDate: hasValidDates ? this.fromDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  toDate: hasValidDates ? this.toDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  };

  this.user.Get_Report_Student(
    allDataParams.studentSearch,
    allDataParams.batchSearch,
    allDataParams.courseSearch,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData?.length) {
        Swal.fire({
          title: 'No Data',
          text: 'No data to export.',
          icon: 'info',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Try to load the logo; generate PDF either way
      this.loadImageAsBase64('/assets/images/logo2.svg')
        .then((base64Image: string) => {
          this.generateStudentPDF(fullData, base64Image);
        })
        .catch(err => {
          console.warn('Logo load failed. Proceeding without logo.', err);
          this.generateStudentPDF(fullData); // call without logo
        });
    },
    error: () => Swal.fire({
      title: 'Error',
      text: 'Failed to download PDF',
      icon: 'error',
      confirmButtonColor: '#3085d6'
    })
  });
}
private generateStudentPDF(fullData: any[], base64Image?: string): void {
  console.log('fulldata',fullData );
  
 this.branchName = [...new Set(fullData.map(item => item.Branch_Name).filter(name => !!name))].join(', ');
   console.log('this.branchName>',fullData[0].Branch_Name
);
    // Set branchName from the first item, if available
 console.log('this.branchName<', this.branchName);
  const formattedData = fullData.map((item: any, index: number) => [
    index + 1,
    item.Student_ID,
    `${item.First_Name} ${item.Last_Name}`,
    item.Email,
    item.Phone_Number,
    item.Batch_Name,
    new Date(item.Entry_Date).toLocaleDateString('en-GB'),
  ]);

  const doc = new jsPDF();

  const courseName = this.selectedCourse?.value?.trim() || 'All Courses';
  const batchName = this.selectedBatch?.value?.trim() || 'All Batches';
  const branchName = this.branchName || 'All Branches'; // assuming `selectedBranch`
  const fromDateStr = this.showMoreOptions && this.fromDate.value ? new Date(this.fromDate.value).toLocaleDateString('en-GB') : 'N/A';
  const toDateStr = this.showMoreOptions && this.toDate.value ? new Date(this.toDate.value).toLocaleDateString('en-GB') : 'N/A';
  const totalEntries = this.totalRecords || 0;

  let currentY = 10;
    doc.setFontSize(14);
  doc.text('Student Report', 105, currentY , { align: 'center' });
  currentY += 1;
  // Optional logo
  if (base64Image) {
    doc.addImage(base64Image, 'PNG', 10, currentY, 20,20);
// Branch Name to right of logo
    doc.text(`${branchName || 'N/A'}`, 35, currentY + 10 );
  
  } {
  currentY += 20;
}
  // --- Filter Info Section ---
const pageCenter = 105; // A4 center in mm

doc.setFontSize(10);

// Line 1: Course | Batch
doc.text(`Course: ${courseName}`, pageCenter - 70, currentY);
doc.text(`Batch: ${batchName}`, pageCenter + 20, currentY);
currentY += 6;

// Line 2: From | To
doc.text(`From: ${fromDateStr}`, pageCenter - 70, currentY);
doc.text(`To: ${toDateStr}`, pageCenter + 20, currentY);
currentY += 6;

// Line 3: Total Duration (you can center it or align with left side)
doc.text(`Total Entries: ${totalEntries}`, pageCenter - 70, currentY);
currentY += 5;
  // currentY += 10;
  // doc.setFontSize(14);
  // doc.text('Student Report', 105, currentY, { align: 'center' });
  autoTable(doc, {
    head: [['#', 'Student ID', 'Name', 'Email', 'Contact', 'Batch', 'Entry Date']],
    body: formattedData,
    startY: currentY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }, // Optional: styling
  });

  doc.save('Student_Report.pdf');
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


exportToExcel(): void {
  const hasValidDates = this.showMoreOptions &&
    this.fromDate.value &&
    this.toDate.value;

  const allDataParams = {
    studentSearch: this.selectedStudent.value?.trim() || '',
    batchSearch: this.selectedBatch.value?.trim() || '',
    courseSearch: this.selectedCourse.value?.trim() || '',
    fromDate: hasValidDates ? this.fromDate.value?.toLocaleDateString('en-CA') ?? '' : '',
    toDate: hasValidDates ? this.toDate.value?.toLocaleDateString('en-CA') ?? '' : ''
  };

  this.user.Get_Report_Student(
    allDataParams.studentSearch,
    allDataParams.batchSearch,
    allDataParams.courseSearch,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData || fullData.length === 0) {
        Swal.fire({
          title: 'No Data',
          text: 'No data available to export.',
          icon: 'info',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Format export data
      const exportData = fullData.map((item: any) => ({
        'Student ID': item.Student_ID,
        Name: `${item.First_Name} ${item.Last_Name}`,
        Email: item.Email,
        Contact: item.Phone_Number,
        Batch: item.Batch_Name,
        'Entry Date': new Date(item.Entry_Date).toLocaleDateString('en-GB')
      }));

      // Create worksheet & workbook
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Report': worksheet },
        SheetNames: ['Report']
      };

      // Write to Excel buffer
      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      // Save the Excel file
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'Student_Report.xlsx');
    },
    error: () => Swal.fire({
      title: 'Error',
      text: 'Failed to export Excel.',
      icon: 'error',
      confirmButtonColor: '#3085d6'
    })
  });
}


}
