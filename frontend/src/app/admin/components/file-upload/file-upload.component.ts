import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { student_Service } from '../../services/student.Service';
import { HttpClient } from '@angular/common/http';
import * as FileSaver from 'file-saver';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../../shared/shared.module';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { MatDialog } from '@angular/material/dialog';

interface Installment {
  Index: number;
  DueDate: string;
  IsPaid: string;
  Amount: number;
  TaxApplied: string;
  TaxAmount: number;
  PaymentMode: string;
  PaymentStatus: string;
  Details: string;
  installment_amount: number;
}

interface StudentData {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone_Number: string;
  Course_Name: string;
  Batch_Name: string;
  Status: string;
  Admission_Date: string;
  Branch_Name: string;
  Assigned_To: string;
  Source: string;
  Follow_Up_Date: string;
  Follow_Up_Status: string;
  Remarks: string;
  Branch_Id: number;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, MatIconModule, SharedModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent {
  dialogBox = inject(MatDialog);
  file: File | null = null;
  arrayBuffer: any;
  Student_Import_Details_Data: StudentData[] = [];
  isUploading: boolean = false;
  isSaving: boolean = false;
  // Field mapping properties
  firstNameField: string = 'First Name';
  lastNameField: string = 'Last Name';
  emailField: string = 'Email';
  countryNameField: string = 'Country Code_Name';
  countryCodeField: string = 'Country Code';
  phoneNumberField: string = 'Phone Number';
  rollNoField: string = 'Roll No';
  Search_Branch_Data: any[] = [];
  Search_Branch_Temp: any = {};
  displayedColumns: string[] = [
    'First_Name',
    'Last_Name',
    'Email',
    'Country_Code_Name',
    'Country_Code',
    'Phone_Number',
    'Roll_No',
  ];
  excelHeaders: string[] = [];

  Search_Branch: any = {};
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private student_Service_: student_Service
  ) {
    this.Branch_Dropdown();
  }
  exportExcel(): void {
    const worksheetData: any[][] = [];

    // Optional: Add headers only (no data)
    const headers = this.displayedColumns.map((col) => col.replace('_', ' '));
    worksheetData.push(headers);

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Student Import': worksheet },
      SheetNames: ['Student Import'],
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob: Blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

    FileSaver.saveAs(blob, 'Student_Import_Template.xlsx');
  }
  onFileSelected(event: any): void {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
    }
  }

  uploadFile(): void {
    if (!this.file) {
      alert('Please select a file first!');
      return;
    }

    if (!this.Search_Branch || this.Search_Branch.Branch_Id === 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: {
          Message: 'Please select a branch before uploading!',
          Type: '3',
        },
      });
      return;
    }

    this.isUploading = true;
    this.processExcel();
  }

  processExcel(): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.arrayBuffer = reader.result;
      const data = new Uint8Array(this.arrayBuffer);
      const arr = Array.from(data, (byte) => String.fromCharCode(byte));
      const bstr = arr.join('');

      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
      });

      if (rawData.length > 0) {
        this.excelHeaders = Object.keys(rawData[0]);
      }
      console.log('rawData', rawData);

      const cleanedData = rawData
        .map((row: any) => {
          const fullName = row['Student Name'] || '';
          let First_Name = '';
          let Last_Name = '';
          if (fullName) {
            const parts = fullName.trim().split(' ');
            First_Name = parts[0];
            Last_Name = parts.slice(1).join(' ');
          } else {
            First_Name = row['First Name'] || '';
            Last_Name = row['Last Name'] || '';
          }
          // 🔁 Shared phone number cleaning function
          const cleanPhone = (raw: string): string => {
            if (!raw) return '';
            const cleaned = raw.toString().replace(/[^\d,]/g, '');
            const numbers = cleaned
              .split(',')
              .map((num) => num.trim())
              .filter(Boolean);

            const normalizeNumber = (num: string): string => {
              let digitsOnly = '';
              if (/e\+?/i.test(num)) {
                digitsOnly = Number(num).toLocaleString('en-IN', {
                  maximumFractionDigits: 0,
                  useGrouping: false,
                });
              } else {
                digitsOnly = num;
              }
              return digitsOnly.length > 10 && digitsOnly.startsWith('91')
                ? digitsOnly.slice(digitsOnly.length - 10)
                : digitsOnly;
            };

            return normalizeNumber(numbers[0] || '');
          };

          return {
            First_Name: First_Name || '',
            Last_Name: Last_Name || '',
            Email: (row['Email ID'] || row['Email'] || '').trim(),
            Country_Code_Name: row['Country Code Name'] || row['Country_Code_Name'] || '',
            Country_Code: row['Country Code'] || row['Country_Code'] || '',
            Phone_Number: cleanPhone(row['Contact Number'] || row['Phone Number']),
            Course_Name: row['Course Name'] || row['Course'] || '',
            Batch_Name: row['Batches'] || row['Batch'] || '',
            Status: row['Student Status'] || row['Status'] || '',
            Admission_Date: row['Admission Date'] || '',
            Branch_Name: this.Search_Branch.Branch_Name,
            Branch_Id: this.Search_Branch.Branch_Id,
            Assigned_To: row['Created By'] || row['Assigned To'] || '',
            Source: row['Source'] || '',
            Follow_Up_Date: row['Follow up Date'] || row['Follow Up Date'] || '',
            Follow_Up_Status: row['Follow up Status'] || row['Follow Up Status'] || '',
            Remarks: row['Note'] || row['Remarks'] || '',
            Roll_No: row['Roll No.'] || row['Roll No'] || '',
            Address: row['Address'] || '',
            Father: row['Father'] || '',
            Mother: row['Mother'] || '',
            GuardianNO: cleanPhone(row['Guardian Contact Number'] || row['Guardian Contact']),
            QUALIFICATION: row['QUALIFICATION'] || row['Qualification'] || '',
            Total_Amount: row['Total Amount'] || '',
            Paid_Amount: row['Paid Amount'] || '',
            Due_Date: row['Instalment 1'] || '',
            Payment_Mode: row['Details'] || '',
            // ✅ Dynamic Installments
  Installments: (() => {
  const installments: Installment[] = [];

  let notPaidTotal = 0;
  let paidInstallments: any[] = [];

  for (let i = 0; i < 19; i++) {
    const idx = i === 0 ? '' : `_${i}`;

    const parseAmount = (val: string): number => {
      if (!val) return 0;
      const cleaned = val
        .toString()
        .replace(/Rs\.?/i, '')
        .replace(/,/g, '')
        .trim();
      return parseFloat(cleaned) || 0;
    };

    const dueDate = row[`Instalment ${i + 1}`];
    const rawAmount = row[`Amount${idx}`];
    const isPaid = (row[`Is Paid?${idx}`] || '').toUpperCase();
    const taxApplied = row[`Tax Applied${idx}`];
    const rawTaxAmount = row[`Tax Amount${idx}`];
    const paymentMode = row[`Payment Mode${idx}`];
    const paymentStatus = row[`Payment Status${idx}`];
    const details = row[`Details${idx}`];

    const amount = parseAmount(rawAmount);

    if (!dueDate && !rawAmount && !isPaid) continue;

    const installment = {
      Index: i + 1,
      DueDate: dueDate || '',
      IsPaid: isPaid,
      Amount: amount,
      TaxApplied: taxApplied || '',
      TaxAmount: parseAmount(rawTaxAmount),
      PaymentMode: paymentMode || '',
      PaymentStatus: paymentStatus || '',
      Details: details || '',
      installment_amount: 0 // placeholder
    };

    if (isPaid === 'NOT PAID') {
      installment.installment_amount = amount;
      notPaidTotal += amount;
    } else if (isPaid === 'PAID') {
      paidInstallments.push(installment);
    }

    installments.push(installment);
  }

  const paidAmount = parseFloat(row['Paid Amount']) || 0;
  const remainingPaidAmount = paidAmount - notPaidTotal;

  const perInstallmentAmount =
    paidInstallments.length > 0
      ? Math.ceil(remainingPaidAmount / paidInstallments.length)
      : 0;

  for (const inst of paidInstallments) {
    inst.installment_amount = Math.max(inst.Amount, perInstallmentAmount);
  }

  return installments;
})()



            // Installments: Array.from({ length: 19 }, (_, i) => {
            //   const idx = i === 0 ? '' : `_${i}`;

            //   const parseAmount = (val: string): number => {
            //     if (!val) return 0;
            //     // ✅ Remove Rs, whitespace, and commas explicitly
            //     const cleaned = val
            //       .toString()
            //       .replace(/Rs\.?/i, '') // Remove 'Rs' or 'Rs.'
            //       .replace(/,/g, '') // Remove commas
            //       .trim();
            //     return parseFloat(cleaned) || 0;
            //   };

            //   const dueDate = row[`Instalment ${i + 1}`];
            //   const rawAmount = row[`Amount${idx}`];
            //   const isPaid = row[`Is Paid?${idx}`];
            //   const taxApplied = row[`Tax Applied${idx}`];
            //   const rawTaxAmount = row[`Tax Amount${idx}`];
            //   const paymentMode = row[`Payment Mode${idx}`];
            //   const paymentStatus = row[`Payment Status${idx}`];
            //   const details = row[`Details${idx}`];

            //   if (!dueDate && !rawAmount && !isPaid) return null;

            //   return {
            //     Index: i + 1,
            //     DueDate: dueDate || '',
            //     IsPaid: isPaid || '',
            //     Amount: parseAmount(rawAmount), // 👈 Rs. removed and parsed to float
            //     TaxApplied: taxApplied || '',
            //     TaxAmount: parseAmount(rawTaxAmount),
            //     PaymentMode: paymentMode || '',
            //     PaymentStatus: paymentStatus || '',
            //     Details: details || '',
            //   };
            // }).filter(Boolean),
          };
        })
        // ❗ Filter rows where at least First_Name, Roll_No, Email OR Phone_Number exists
        .filter((student) => student.First_Name || student.Roll_No || student.Email || student.Phone_Number);

      this.Student_Import_Details_Data = cleanedData;

      this.isUploading = false;
      console.log(
        'Filtered & Imported Data:',
        this.Student_Import_Details_Data
      );
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.isUploading = false;
      alert('Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(this.file!);
  }

  Branch_Dropdown() {
    this.student_Service_.Branch_Dropdown().subscribe(
      (Rows) => {
        const defaultOption = { Branch_Id: 0, Branch_Name: 'Select Branch' };

        if (Rows && Array.isArray(Rows[0])) {
          this.Search_Branch_Data = [defaultOption, ...Rows[0]];
        } else if (Array.isArray(Rows)) {
          this.Search_Branch_Data = [defaultOption, ...Rows];
        } else {
          this.Search_Branch_Data = [defaultOption];
        }

        this.Search_Branch = defaultOption;
      },
      (err) => {
        console.error('Failed to fetch branch data:', err);
      }
    );
  }

  saveAllStudents(): void {
    if (this.Student_Import_Details_Data.length === 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'No data to save!', Type: '3' },
      });
      return;
    }

    if (!this.Search_Branch || this.Search_Branch.Branch_Id === 0) {
      this.dialogBox.open(DialogBox_Component, {
        panelClass: 'Dialogbox-Class',
        data: { Message: 'Please select a branch before saving!', Type: '3' },
      });
      return;
    }

    this.isLoading = true;
    this.isSaving = true;

    const payload = {
      students: this.Student_Import_Details_Data,
    };

    this.student_Service_.saveStudentsImport(payload).subscribe(
      (response) => {
        this.isSaving = false;
        this.isLoading = false;
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Students saved successfully!', Type: 'false' },
        });
        this.clearData();
      },
      (error) => {
        this.isSaving = false;
        this.isLoading = false;
        const errorMessage =
          error.error?.message || error.message || 'Unknown error';
        alert(`❌ Error: ${errorMessage}`);
      }
    );
  }

  clearData(): void {
    this.Student_Import_Details_Data = [];
    this.file = null;
    this.arrayBuffer = null;
    this.excelHeaders = [];

    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeStudent(index: number): void {
    this.Student_Import_Details_Data.splice(index, 1);
  }
}
