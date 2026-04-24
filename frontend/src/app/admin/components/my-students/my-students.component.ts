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
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import autoTable from 'jspdf-autotable';

import { LOCALE_ID } from '@angular/core';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeGb from '@angular/common/locales/en-GB';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

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
  selector: 'app-my-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatButtonModule, MatIconModule, StudentlistComponent,
  MatCheckboxModule, MatNativeDateModule, MatSelectModule],
  providers: [provideNativeDateAdapter(), { provide: LOCALE_ID, useValue: 'en-GB' }, 
      { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
      { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
  templateUrl: './my-students.component.html',
  styleUrls: ['./my-students.component.scss'],
})
export class MyStudentsComponent implements OnInit {
  selectedCourse = new FormControl('');
  selectedStudent = new FormControl('');
  selectedBatch = new FormControl('');
  fromDate = new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  toDate = new FormControl(new Date());
  private user = inject(user_Service);
  private courseService = inject(course_Service);

  courseList: any[] = [];
  batchList: any[] = [];

 displayedColumns = [
  'Action',
  'Student_ID',
  'Name', 
  'Email',
  'Contact',
  'Branch_Name',
  'Entry_Date'
];
showMoreOptions: boolean = false;

  totalEntries = '';
  tableData: any[] = [];
  pageSize = 12;
  currentPage = 1;
  totalRecords = 0;
  Math = Math;
  IsLoaded = false;
  student_edit: boolean = false;
  student_Details: any;
  isFollowupOnly: boolean = false;
  branchName:string=""

  staffId = parseInt(localStorage.getItem('User_Id') || '0');

  constructor() { }

  ngOnInit() {
    this.loadInitialData();
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
    
    if (selectedCourseObj) {
      this.courseService.get_course_Batches(selectedCourseObj.Course_ID).subscribe({
        next: (res: any) => {
          this.batchList = res || [];
          this.selectedBatch.setValue('');
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

  this.user
    .Get_My_Students_Report(
      params.studentSearch,
      params.batchSearch,
      params.courseSearch,
      params.fromDate,
      params.toDate,
      this.currentPage,
      this.pageSize,
      this.staffId
    )
    .subscribe({
      next: (res: any[]) => {
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
    this.fetchReportData();
  }

  onPageChange(event: { pageIndex: number, pageSize: number }) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchReportData();
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

  this.user.Get_My_Students_Report(
    allDataParams.studentSearch,
    allDataParams.batchSearch,
    allDataParams.courseSearch,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999,
    this.staffId
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData?.length) {
        alert('No data to export.');
        return;
      }

      this.loadImageAsBase64('/assets/images/logo2.svg')
        .then((base64Image: string) => {
          this.generateStudentPDF(fullData, base64Image);
        })
        .catch(err => {
          console.warn('Logo load failed. Proceeding without logo.', err);
          this.generateStudentPDF(fullData);
        });
    },
    error: () => alert('Failed to download PDF')
  });
}

private generateStudentPDF(fullData: any[], base64Image?: string): void {
  this.branchName = [...new Set(fullData.map(item => item.Branch_Name).filter(name => !!name))].join(', ');
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
  const branchName = this.branchName || 'All Branches';
  const fromDateStr = this.showMoreOptions && this.fromDate.value ? new Date(this.fromDate.value).toLocaleDateString('en-GB') : 'N/A';
  const toDateStr = this.showMoreOptions && this.toDate.value ? new Date(this.toDate.value).toLocaleDateString('en-GB') : 'N/A';
  const totalEntries = this.totalRecords || 0;

  let currentY = 10;
  doc.setFontSize(14);
  doc.text('My Students Report', 105, currentY , { align: 'center' });
  currentY += 1;
  if (base64Image) {
    doc.addImage(base64Image, 'PNG', 10, currentY, 20,20);
    doc.text(`${branchName || 'N/A'}`, 35, currentY + 10 );
  } {
    currentY += 20;
  }
  const pageCenter = 105;
  doc.setFontSize(10);
  doc.text(`Course: ${courseName}`, pageCenter - 70, currentY);
  doc.text(`Batch: ${batchName}`, pageCenter + 20, currentY);
  currentY += 6;
  doc.text(`From: ${fromDateStr}`, pageCenter - 70, currentY);
  doc.text(`To: ${toDateStr}`, pageCenter + 20, currentY);
  currentY += 6;
  doc.text(`Total Entries: ${totalEntries}`, pageCenter - 70, currentY);
  currentY += 5;
  autoTable(doc, {
    head: [['#', 'Student ID', 'Name', 'Email', 'Contact', 'Batch', 'Entry Date']],
    body: formattedData,
    startY: currentY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save('My_Students_Report.pdf');
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

  this.user.Get_My_Students_Report(
    allDataParams.studentSearch,
    allDataParams.batchSearch,
    allDataParams.courseSearch,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999,
    this.staffId
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData || fullData.length === 0) {
        alert("No data available to export.");
        return;
      }

      const exportData = fullData.map((item: any) => ({
        'Student ID': item.Student_ID,
        Name: `${item.First_Name} ${item.Last_Name}`,
        Email: item.Email,
        Contact: item.Phone_Number,
        Batch: item.Batch_Name,
        'Entry Date': new Date(item.Entry_Date).toLocaleDateString('en-GB')
      }));

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = {
        Sheets: { 'Report': worksheet },
        SheetNames: ['Report']
      };

      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });

      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'My_Students_Report.xlsx');
    },
    error: () => alert('Failed to export Excel.')
  });
}

}
