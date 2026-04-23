import {
  Component,
  EventEmitter,
  inject,
  Inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentFeesService } from '../../services/student-fees.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { course_Service } from '../../services/course.Service';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { log } from 'node:console';
import { SharedModule } from '../../../shared/shared.module';
interface InstallmentEntry {
  Student_Fees_ID: any;
  Student_ID: any;
  Course_ID: any;
  Course_Name: any;
  Installment_information_ID: any;
  Total_Amount: number;
  Paid_Amount: number;
  Fee_Status: string;
  Payment_Date: Date | null;
  Due_Date: Date | null;
  Payment_Mode: any;
  Transaction_ID: string;
  Installment_Index: number;
  Account_Id: number;
  Receipt_Id: number;
  Tax_Type_Id: number;
  Netvalue: number;
  Gstpers: number;
  Cgstpers: number;
  Sgstpers: number;
  Gst: number;
  Cgst: number;
  Sgst: number;
  Fine_Amount: number;
}

@Component({
  selector: 'app-student-fees',
  templateUrl: './student-fees.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatDialogModule,
    MatTableModule,
    MatTabsModule,
    SharedModule,
  ],
  styleUrls: ['./student-fees.component.scss'],
})
export class StudentFeesComponent {
  @Input() feesDetails: FormGroup;
  @Input() isEditMode: boolean = false;
  @Output() cancel = new EventEmitter<number | undefined>();

  constructor(
    private fb: FormBuilder,
    private feesService: StudentFeesService
  ) {
    this.initForm();
  }

  feeTypes = ['OneTime', 'TwoTime', 'ThreeTime', 'FourTime'];
  feesForm!: FormGroup;
  feesList: any[] = [];
  allAccounts: any = [];
  alltaxtypes: any = [];
  allPaymentMode: any = [];
  installments: any[] = [];
  course_Service_ = inject(course_Service);
  dialogBox = inject(MatDialog);
  isLoading: boolean = false;
  courseCategoryData = signal([]);
  teacherDatas = signal([]);
  ModuleDatas = signal([]);
  daysDatas = signal([]);
  allDaysDatas = signal([]);
  SectionsDatas = signal([]);
  VisibilityDatas = signal([]);
  searchTerm: string = '';
  course_Data: any;
  selectedTabIndex = 0;
  payFeeStatus: boolean = false;
  selectedAccount: any = {};
  selectedtaxtypes: any = {};
  finePerDay: number = 0;
  defaultFine: number = 0; // Will be set from DB


  Tax_type_Id: number = 1; // default value
  Tax_type_name: string = 'With Tax'; // default value
  areAllAccountsSelected(): boolean {
    return this.feesList.every((fee) => !!fee.Account_Id);
  }

  ngOnInit(): void {
    this.initForm();
    // this.getAccounts();
    this.gstalltaxtypes();
    this.Get_All_PaymentMode();
    console.log('isEditMode:', this.isEditMode);
    console.log('Loading fees for this.feesDetails:', this.feesDetails.value);
    if (!this.isEditMode) {
      this.loadFeesList();
    } else {
      this.loadReceiptFeesList();
    }
    this.fetchFineAmount();
  }

  fetchFineAmount() {
    this.feesService.Get_Late_Fee_Amount().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.defaultFine = res.amount;
        }
      },
      error: (err) => {
        console.error('Error fetching fine amount:', err);
        this.defaultFine = 200; // Fallback to ₹200 if DB call fails
      }
    });
  }


  initForm(): void {
    this.feesForm = this.fb.group({
      Installment_information_ID: ['', Validators.required],
      Total_Amount: ['', Validators.required],
      Paid_Amount: ['', Validators.required],
      Fee_Status: ['Pending', Validators.required],
      Payment_Date: [new Date(), Validators.required],
      Due_Date: [''],
      Payment_Mode: ['ADMIN'],
      Transaction_ID: [''],
      Course_Name: [''],
      Course_ID: [''], // ✅ missing - now added
      Student_ID: [''], // ✅ missing - now added
      Student_Fees_ID: [null],
      update_status: [false], // ✅ missing - now added
      Receipt_Id: [''], // ✅ missing - now added
    });
  }

  loadReceiptFeesList(): void {
    const Receipt_id = this.feesDetails?.get('Receipt_Id')?.value;
    if (!Receipt_id) {
      console.warn('Receipt_Id not available in feesDetails');
      return;
    }

    // Fetch payment modes first to ensure we can map them
    this.feesService.Get_All_PaymentMode().subscribe((paymentModes) => {
      this.allPaymentMode = paymentModes;
      
      this.feesService.Get_FeesByReceipt_ID(Receipt_id).subscribe(
        (res) => {
          console.log('Fees list response:', res);
          
          if (res.length > 0) {
            const selectedPaymentmode = res[0].Payment_mode;
            const paymentMode = this.allPaymentMode.find(
              (pm: any) =>
                pm.Payment_Name.toUpperCase() === (selectedPaymentmode || '').toUpperCase()
            );

            if (paymentMode && paymentMode.Payment_Id) {
              this.getAccounts(paymentMode.Payment_Id);
            }

            this.feesList = res.map((fee: any) => {
              const date = new Date(fee.Payment_Date);
              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
              
              return {
                ...fee,
                tempPaidAmount: parseFloat(fee.Amount),
                Payment_Date: localDate.toISOString().split('T')[0],
                Payment_Mode: fee.Payment_mode || '',
                Transaction_ID: fee.Transaction_ID || '',
                Account_Id: Number(fee.Account_Id) || null,
                Tax_Type_Id: Number(fee.Tax_Type_Id) || null,
                Payment_Id: paymentMode?.Payment_Id || null,
              };
            });
          }
        },
        (err) => {
          console.error('Error loading fee list:', err);
        }
      );
    });
  }
  updateFee() {
    if (this.feesList.length > 0 && this.feesList[0].Receipt_Id > 0) {
      var netValue = 0,
        gstpers = 18,
        cgstpers = 9,
        sgstpers = 9,
        gst = 0,
        cgst = 0,
        sgst = 0,
        paid = 0;
      paid = this.feesList[0].tempPaidAmount;
      if (this.feesList[0].Tax_Type_Id == 1) {
        netValue = (paid * 100) / (100 + gstpers);
        gst = paid - netValue;
        cgst = gst / 2;
        sgst = gst / 2;
      } else {
        netValue = paid;
        gst = paid - netValue;
        cgst = gst / 2;
        sgst = gst / 2;
      }

      const feeData = this.feesList[0];
      const selectedPaymentId = feeData.Payment_Id;
      const paymentMode = this.allPaymentMode.find(
        (pm: any) => +pm.Payment_Id === +selectedPaymentId
      );

      const updatedFee = {
        Receipt_Id: feeData.Receipt_Id,
        Student_Id: feeData.Student_Id,
        Amount: feeData.tempPaidAmount,
        Entry_Date: feeData.Entry_Date || feeData.entry_date || feeData.entry_Date,
        User_Id: feeData.User_Id || feeData.user_id || feeData.User_id,
        Branch: feeData.Branch || feeData.branch || 0,
        Account_Id: feeData.Account_Id,
        Payment_mode: paymentMode ? paymentMode.Payment_Name : (feeData.Payment_Mode || feeData.Payment_mode || ''),
        Transaction_ID: feeData.Transaction_ID,
        Tax_Type_Id: feeData.Tax_Type_Id,
        Netvalue: netValue,
        Gstpers: gstpers,
        Cgstpers: cgstpers,
        Sgstpers: sgstpers,
        Gst: gst,
        Cgst: cgst,
        Sgst: sgst,
        Payment_Date: feeData.Payment_Date,
        Fine_Amount: this.calculateFine(feeData)
      };
      this.feesService.Update_FeesByReceipt_ID(updatedFee).subscribe(
        (res) => {
          this.loadFeesList();
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: {
              Message: 'Receipt saved.',
              Type: 'false',
              Heading: 'UPDATED',
            },
          });
          this.onUpdateCancel();
          this.selectedTabIndex = 1;
        },
        (err) => {
          console.error('Error updating fee:', err);
        }
      );
    }
  }

  // Helper method to convert ISO date to yyyy-MM-dd
  convertDateToYyyyMmDd(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0]; // "2025-07-04"
  }
  // allPaymentMode
  Get_All_PaymentMode() {
    this.feesService.Get_All_PaymentMode().subscribe((res) => {
      this.allPaymentMode = res;
    });
  }
  change_payment(Payment_Id) {
    this.getAccounts(Payment_Id);
  }
  getAccounts(Payment_Id: number): void {
    console.log('Payment_Id', Payment_Id);

    this.feesService.Get_Accounts().subscribe((res) => {
      console.log('All accounts from API:', res);

      // Convert to number and filter
      this.allAccounts = res.filter(
        (account: any) => +account.Payment_Id === +Payment_Id
      );

      console.log('Filtered Accounts:', this.allAccounts);
    });
  }

  gstalltaxtypes(): void {
    this.feesService.gstalltaxtypes().subscribe((res) => {
      this.alltaxtypes = res;
    });
  }

  onInstallmentChange(installmentId: number): void {
    const selected = this.installments.find(
      (i) => i.Installment_information_ID === installmentId
    );
    if (selected) {
      this.feesForm.patchValue({ Total_Amount: parseFloat(selected.Amount) });
    }
  }

  setupAutoAmount(): void {
    this.feesForm
      .get('Installment_information_ID')
      ?.valueChanges.subscribe((id) => {
        const selected = this.installments.find(
          (i) => i.Installment_information_ID === id
        );
        if (selected) {
          this.feesForm.patchValue({ Total_Amount: selected.Amount });
        }
      });
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

  getTodayDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  loadFeesList(): void {
    const Student_Fees_ID = this.feesDetails?.get('Student_Fees_ID')?.value;
    console.log('Loading fees for Student_Fees_ID:', Student_Fees_ID);

    if (Student_Fees_ID) {
      this.feesService.Get_FeesByStudent_Fees_ID(Student_Fees_ID).subscribe(
        (res) => {
          console.log('Fees list response:', res);

          const today = this.getTodayDate();

          this.feesList = res.map((fee) => ({
            ...fee,
          // Initialize paid amount with remaining amount passed in form
          tempPaidAmount: this.feesDetails?.get('Paid_Amount')?.value || fee.Remaining_Amount || 0,
          // Format Payment_Date properly or set to today if null
            Payment_Date: today,
            Receipt_Id: 0, // Initialize Receipt_id
            selectedAccount: {}, // Initialize selectedAccount
            selectedtaxtypes: {},
            Tax_Type_Id: 1,
            Fine_Amount: this.calculateFine(fee)
          }));
        },
        (err) => {
          console.error('Error loading fee list:', err);
        }
      );
    } else {
      console.warn('Student_Fees_ID not available in feesDetails');
    }
  }

  Edit_FeesByReceipt_ID(Receipt_id): void {
    this.feesService.Edit_FeesByReceipt_ID(Receipt_id).subscribe(
      (res) => {
        const today = this.getTodayDate();

        this.feesList = res.map((fee) => ({
          ...fee,
          // Initialize paid amount with remaining amount passed in form
          tempPaidAmount: this.feesDetails?.get('Paid_Amount')?.value || fee.Remaining_Amount || 0,
          // Format Payment_Date properly or set to today if null
          Payment_Date: today,

          // Initialize selectedAccount
          selectedAccount: {}, // Initialize selectedAccount
          selectedtaxtypes: {},
          // Format Due_Date too if needed
          // Due_Date: fee.Due_Date
          //   ? new Date(fee.Due_Date).toISOString().substring(0, 10)
          //   : ''
        }));
      },
      (err) => {
        console.error('Error loading fee list:', err);
      }
    );
  }

  Delete_Receipt(fee) {
    this.feesService.Delete_FeesByReceipt_ID(fee.Receipt_Id).subscribe(
      () => {
        console.log('✅ Fee deleted successfully.');
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: {
            Message: 'Fee deleted successfully.',
            Type: 'false',
            Heading: 'DELETED',
          },
        });
        this.onUpdateCancel(); // Refresh the list after deletion
      },
      (err) => {
        console.error('Error deleting fee:', err);
      }
    );
  }
  saveFees(): void {
    ;
    this.isLoading = true;
    console.log(this.selectedAccount, 'selectedAccount');
    if (Object.keys(this.feesForm.value).length > 0) {
      // NEW Receipt
      if (this.feesList.length > 0 && this.feesList[0].Student_Fees_ID > 0) {    
        const remaining =
          this.feesList[0].Total_Amount - this.feesList[0].Paid_Amount;
        var netValue = 0,
          gstpers = 18,
          cgstpers = 9,
          sgstpers = 9,
          gst = 0,
          cgst = 0,
          sgst = 0,
          paid = 0;
        var totalPaid = this.feesList[0].tempPaidAmount;
        var fine = this.calculateFine(this.feesList[0]);
        paid = totalPaid - fine; // Core fee amount

        if (this.feesList[0].Tax_Type_Id == 1) {
          netValue = (paid * 100) / (100 + gstpers);
          gst = paid - netValue;
          cgst = gst / 2;
          sgst = gst / 2;
        } else {
          netValue = paid;
          gst = 0;
          (gstpers = 0), (cgstpers = 0), (sgstpers = 0), (cgst = 0);
          sgst = 0;
        }

        const selectedPaymentId = this.feesList[0].Payment_Id;

        const paymentMode = this.allPaymentMode.find(
          (pm: any) => +pm.Payment_Id === +selectedPaymentId
        );

        const updatedEntry: InstallmentEntry = {
          Student_Fees_ID: this.feesList[0].Student_Fees_ID,
          Student_ID: this.feesList[0].Student_ID,
          Course_ID: this.feesList[0].Course_ID,
          Course_Name: this.feesList[0].Course_Name,
          Installment_information_ID:
            this.feesList[0].Installment_information_ID,
          Total_Amount: this.feesList[0].Total_Amount,
          Paid_Amount: paid,
          Fee_Status: remaining > 0 ? 'Pending' : 'Paid',
          Payment_Date: this.feesList[0].Payment_Date,
          Due_Date: this.feesList[0].Due_Date,
          Payment_Mode: paymentMode.Payment_Name,
          Transaction_ID: this.feesList[0].Transaction_ID,
          Account_Id: this.feesList[0].Account_Id, //this.selectedAccount?.Account_id,
          Receipt_Id: this.feesList[0].Receipt_Id, // Use existing Receipt_Id or null
          Installment_Index: 1,
          Tax_Type_Id: this.feesList[0].Tax_Type_Id, //Tax_Type_Id:this.selectedtaxtypes?.Tax_Type_Id,
          Netvalue: netValue,
          Gstpers: gstpers,
          Cgstpers: cgstpers,
          Sgstpers: sgstpers,
          Gst: gst,
          Cgst: cgst,
          Sgst: sgst,
          Fine_Amount: this.calculateFine(this.feesList[0])
        };
        // ✅ This is an update
        this.feesService
          .Save_Student_Fees_Details([updatedEntry])
          .subscribe(() => {
            this.isLoading = false;
            console.log('✅ Student fees saved successfully.');
            this.dialogBox.open(DialogBox_Component, {
              panelClass: 'Dialogbox-Class',
              data: {
                Message: 'Receipt saved.',
                Type: 'false',
                Heading: 'UPDATED',
              },
            });
            this.onCancel();
            this.selectedTabIndex = 0;
          });
      } 
      // Update Receipt
      else {
        const selectedInstallment = this.installments.find(
          (i) =>
            i.Installment_information_ID ===
            this.feesList[0].Installment_information_ID
        );

        const feeType = selectedInstallment?.Fee_Type;
        const splitCount = this.getInstallmentSplitCount(feeType);

        const amounts = this.getRoundedInstallments(
          this.feesList[0].Total_Amount,
          splitCount,
          5000
        );

        var netValue = 0,
          gstpers = 18,
          cgstpers = 9,
          sgstpers = 9,
          gst = 0,
          cgst = 0,
          sgst = 0,
          paid = 0;
        
        var totalPaid = this.feesList[0].tempPaidAmount;
        var fine = this.calculateFine(this.feesList[0]);
        paid = totalPaid - fine; // Core fee amount

        if (this.feesList[0].Tax_Type_Id == 1) {
          netValue = (paid * 100) / (100 + gstpers);
          gst = paid - netValue;
          cgst = gst / 2;
          sgst = gst / 2;
        } else {
          netValue = paid;
          gst = 0;
          (gstpers = 0), (cgstpers = 0), (sgstpers = 0), (cgst = 0);
          sgst = 0;
        }

        const installmentEntries: InstallmentEntry[] = amounts.map(
          (amount, index) => ({
            Receipt_Id: this.feesList[0].Receipt_Id,
            Student_Fees_ID: this.feesList[0].Student_Fees_ID || 0,
            Student_ID: this.feesList[0].Student_Id,
            Course_ID: this.feesList[0].Course_ID || 0,
            Course_Name: this.feesList[0].Course_Name || '',
            Installment_information_ID:
              this.feesList[0].Installment_information_ID,
            Total_Amount: this.feesList[0].tempPaidAmount,
            Paid_Amount: paid,
            Fee_Status: 'Pending',
            Payment_Date: this.feesList[0].Payment_Date,
            Due_Date: null,
            Payment_Mode: this.feesList[0].Payment_Mode,
            Transaction_ID: this.feesList[0].Transaction_ID,
            Account_Id: this.feesList[0].Account_Id, //this.selectedAccount?.Account_id,
            Installment_Index: index + 1,
            Tax_Type_Id: this.feesList[0].Tax_Type_Id,
            Netvalue: netValue,
            Gstpers: gstpers,
            Cgstpers: cgstpers,
            Sgstpers: sgstpers,
            Gst: gst,
            Cgst: cgst,
            Sgst: sgst,
            Fine_Amount: this.calculateFine(this.feesList[0])
          })
        );

        this.feesService
          .Save_Student_Fees_Details(installmentEntries)
          .subscribe(() => {
            this.isLoading = false;
            console.log('✅ Saved all rounded installments successfully.');
             
            const successDialog = this.dialogBox.open(DialogBox_Component, {
              panelClass: 'Dialogbox-Class',
              data: {
                Message: 'Student fees saved successfully.',
                Type: 'false',
                Heading: 'SAVED',
              },
            });

           this.onCancel();
          });
        console.log(installmentEntries);
      }
    } else {
      console.warn('❌ Form is invalid');
      this.feesForm.markAllAsTouched();
    }
    this.payFeeStatus = false;
  }

  onCancel(): void {
    const studentId = this.feesList[0]?.Student_ID || this.feesList[0]?.Student_Id;
    if (studentId) {
      this.cancel.emit(studentId);
    } else {
      this.cancel.emit(0);
    }
  }

  onUpdateCancel(): void {
    const studentId = this.feesList[0]?.Student_ID || this.feesList[0]?.Student_Id;
    if (studentId) {
      this.cancel.emit(studentId);
    } else {
      this.cancel.emit(0);
    }
  }

  calculateFine(fee: any): number {
    if (!fee.Due_Date) return 0;
    
    const dueDate = new Date(fee.Due_Date);
    const today = new Date();
    
    // Reset time components for accurate date comparison
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // If today is after the due date, apply fine
    if (today > dueDate) {
      return this.defaultFine;
    }
    return 0;
  }
}
