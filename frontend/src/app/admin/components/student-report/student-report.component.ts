import { Component, inject, OnInit, ViewChild, ElementRef, viewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { user_Service } from '../../services/user.Service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { course_Service } from '../../services/course.Service';
import { student_Service } from '../../services/student.Service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { StudentlistComponent } from "../studentlist/studentlist.component";
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    MatAutocompleteModule, MatDatepickerModule, MatButtonModule, MatIconModule, StudentlistComponent,
  MatCheckboxModule, MatNativeDateModule,],
  providers: [provideNativeDateAdapter(), { provide: LOCALE_ID, useValue: 'en-GB' }, // for dd-MM-yyyy support
      { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
      { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }],
  templateUrl: './student-report.component.html',
  styleUrls: ['./student-report.component.scss'],
})
export class StudentReportComponent implements OnInit {
  readonly Course = viewChild.required<ElementRef<HTMLInputElement>>('Course');
  readonly Student = viewChild.required<ElementRef<HTMLInputElement>>('Student');
  readonly Batch = viewChild.required<ElementRef<HTMLInputElement>>('Batch');
  // Form Controls
  selectedCourse = new FormControl();
  selectedStudent = new FormControl();
  selectedBatch = new FormControl();
  fromDate = new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  // fromDate = new FormControl(new Date());
  toDate = new FormControl(new Date());
  private user = inject(user_Service);
  private course = inject(course_Service);
  private student_Service_ = inject(student_Service);

  // Table Data
 displayedColumns = [
  'Student_ID',
  'Name', // merged First_Name + Last_Name
  'Email',
  'Branch_Name',
  'Entry_Date'
];
needDate: boolean = false;

  totalEntries = '';
  tableData: any[] = [];
  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalRecords = 0;
  Math = Math;

  // Filter Options
  courseDatas: any[] = [];
  studentDatas: any[] = [];
  BatchDatas: any[] = [];
  coursefilteredOptions: any[] = [];
  studentfilteredOptions: any[] = [];
  bacthfilteredOptions: any[] = [];
  IsLoaded = false;
  tempBatchData: any[];
  student_edit: boolean = false;
 student_Details: any;
 branchName:string=""
  constructor() { }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    forkJoin({
      courseNames: this.course.get_course_names(),
      courseItems: this.course.Get_All_Course_Items(),
      students: this.student_Service_.Get_All_Students('')
    }).subscribe(({ courseNames, courseItems, students }) => {
      this.courseDatas = this.coursefilteredOptions = courseNames[0];
      this.studentDatas = this.studentfilteredOptions = students;
      this.BatchDatas = this.bacthfilteredOptions = courseItems[3];
      this.fetchReportData();
    });
  }

//   fetchReportData() {
//     this.currentPage = this.currentPage || 1; // fallback to page 1

//     this.IsLoaded = false;
//     const params = {
//       Student_ID: this.selectedStudent.value?.Student_ID || 0,
//       Batch_ID: this.selectedBatch.value?.Batch_ID || 0,
//       Course_ID: this.selectedCourse.value?.Course_ID || 0,
//       fromDate: this.fromDate.value?.toLocaleDateString('en-CA') || '',
//       toDate: this.toDate.value?.toLocaleDateString('en-CA') || ''
//     };

//     this.user.Get_Report_Student(
//       params.Student_ID,
//       params.Batch_ID,
//       params.Course_ID,
//       params.fromDate,
//       params.toDate,
//       this.currentPage,
//       this.pageSize
//     ).subscribe({
//       next: (res: any[]) => {
//         console.log("res",res);
        
//         const [countResult, data] = res;
//         this.totalRecords = countResult?.[0]?.totalRecords || 0;
//         this.tableData = data || [];
//         this.tableData = data.map(item => ({
//   ...item,
//   Name: `${item.First_Name} ${item.Last_Name}`
// }));

//       },
//       complete: () => this.IsLoaded = true
//     });
//   }

  fetchReportData() {
  this.currentPage = this.currentPage || 1;
  this.IsLoaded = false;

  // If both dates are selected and checkbox is true, use them; else pass null/empty
 const hasValidDates = this.needDate &&
                      this.fromDate.value &&
                      this.toDate.value;

const params = {
  Student_ID: this.selectedStudent.value?.Student_ID || 0,
  Batch_ID: this.selectedBatch.value?.Batch_ID || 0,
  Course_ID: this.selectedCourse.value?.Course_ID || 0,
  fromDate: hasValidDates ? this.fromDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  toDate: hasValidDates ? this.toDate.value?.toLocaleDateString('en-CA') ?? '' : '',
};

console.log("params", params,this.currentPage,
      this.pageSize);

  this.user
    .Get_Report_Student(
      params.Student_ID,
      params.Batch_ID,
      params.Course_ID,
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
        })) || [];
      },
      complete: () => (this.IsLoaded = true),
    });
}

  displayFn(item: any): string {
    return item ? item.Course_Name || item.First_Name || item.Batch_Name || '' : '';
  }

  onCancelEdit(): void {
  this.student_edit = false; // Set view back to list
}
 onSaveStudent(event: any): void {
  this.student_edit = false; 
}

  student_List_Update(item: any) {
    this.student_edit = true;
    this.student_Details = item;
    console.log('item', item);
  }
  
  filter(type: 'course' | 'student' | 'batch'): void {
    let filterValue: string;
    let dataSource: any[];
    let filteredArray: any[];
    let propertyName: string;

    switch (type) {
      case 'course':
        this.bacthfilteredOptions = []
        this.selectedBatch.setValue('')
        filterValue = this.Course().nativeElement.value.toLowerCase();
        dataSource = this.courseDatas;
        filteredArray = this.coursefilteredOptions;
        console.log(' this.coursefilteredOptions: ', this.coursefilteredOptions);
        propertyName = 'Course_Name';

        // When course changes, filter the batch data based on selected course ID
        this.filterBatchData();
        break;
      case 'student':
        filterValue = this.Student().nativeElement.value.toLowerCase();
        dataSource = this.studentDatas;
        filteredArray = this.studentfilteredOptions;
        propertyName = 'First_Name';
        break;
      case 'batch':
        filterValue = this.Batch().nativeElement.value.toLowerCase();
        dataSource = this.tempBatchData; // Use temporary array
        filteredArray = this.bacthfilteredOptions;
        propertyName = 'Batch_Name';
        break;
    }
    console.log('filterValue: ', filterValue);

    filteredArray = dataSource.filter(o =>
      o[propertyName].toLowerCase().includes(filterValue)
    );

    // Update the appropriate filtered options array
    switch (type) {
      case 'course':
        this.coursefilteredOptions = filteredArray;
        break;
      case 'student':
        this.studentfilteredOptions = filteredArray;
        break;
      case 'batch':
        this.bacthfilteredOptions = filteredArray;
        break;
    }
  }
  filterBatchData(): void {
    console.log('his.selectedCourse: ', this.selectedCourse);
    const selectedCourseId = this.selectedCourse.value; // Adjust based on your form control value structure

    if (selectedCourseId) {
      this.tempBatchData = this.BatchDatas.filter(batch => batch.Course_ID == selectedCourseId['Course_ID']);
    } else {
      this.tempBatchData = [...this.BatchDatas];
    }
    console.log('Filtered batch data: ', this.tempBatchData);
  }

  clearFilters() {
    [this.selectedCourse, this.selectedStudent, this.selectedBatch].forEach(control => control.reset());
    this.fromDate.setValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    this.toDate.setValue(new Date());
    // this.fromDate.setValue(new Date());
    this.currentPage = 1;
    this.fetchReportData();
  }

  onPageChange(event: { pageIndex: number, pageSize: number }) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.fetchReportData();
  }
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

downloadPDF(): void {

   const hasValidDates = this.needDate &&
                      this.fromDate.value &&
                      this.toDate.value;

  const allDataParams = {
    Student_ID: this.selectedStudent.value?.Student_ID || 0,
    Batch_ID: this.selectedBatch.value?.Batch_ID || 0,
    Course_ID: this.selectedCourse.value?.Course_ID || 0,
    fromDate: hasValidDates ? this.fromDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  toDate: hasValidDates ? this.toDate.value?.toLocaleDateString('en-CA') ?? '' : '',
  };

  this.user.Get_Report_Student(
    allDataParams.Student_ID,
    allDataParams.Batch_ID,
    allDataParams.Course_ID,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData?.length) {
        alert('No data to export.');
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
    error: () => alert('Failed to download PDF')
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
    item.Batch_Name,
    new Date(item.Entry_Date).toLocaleDateString('en-GB'),
    item.Batch_Name,
  ]);

  const doc = new jsPDF();

  const courseName = this.selectedCourse?.value?.Course_Name || 'All Courses';
  const batchName = this.selectedBatch?.value?.Batch_Name || 'All Batches';
  const branchName = this.branchName || 'All Branches'; // assuming `selectedBranch`
  const fromDateStr = this.fromDate.value ? new Date(this.fromDate.value).toLocaleDateString('en-GB') : 'N/A';
  const toDateStr = this.toDate.value ? new Date(this.toDate.value).toLocaleDateString('en-GB') : 'N/A';
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
    head: [['#', 'Student ID', 'Name', 'Email', 'Batch', 'Entry Date']],
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
  const allDataParams = {
    Student_ID: this.selectedStudent.value?.Student_ID || 0,
    Batch_ID: this.selectedBatch.value?.Batch_ID || 0,
    Course_ID: this.selectedCourse.value?.Course_ID || 0,
    fromDate: this.fromDate.value?.toLocaleDateString('en-CA') || '',
    toDate: this.toDate.value?.toLocaleDateString('en-CA') || ''
  };

  this.user.Get_Report_Student(
    allDataParams.Student_ID,
    allDataParams.Batch_ID,
    allDataParams.Course_ID,
    allDataParams.fromDate,
    allDataParams.toDate,
    1,
    this.totalRecords || 99999
  ).subscribe({
    next: (res: any[]) => {
      const [countResult, fullData] = res;
      if (!fullData || fullData.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Format export data
      const exportData = fullData.map((item: any) => ({
        'Student ID': item.Student_ID,
        Name: `${item.First_Name} ${item.Last_Name}`,
        Email: item.Email,
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
    error: () => alert('Failed to export Excel.')
  });
}


}

