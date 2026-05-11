import { Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { course_Service } from '../../services/course.Service';
import { AttendanceService } from '../../services/attendance.service';
import Swal from 'sweetalert2';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeGb from '@angular/common/locales/en-GB';

registerLocaleData(localeGb);

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'dd-MM-yyyy' },
  display: {
    dateInput: 'dd-MM-yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd-MM-yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatNativeDateModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'en-GB' },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './attendance-history.component.html',
  styleUrls: ['./attendance-history.component.scss'],
})
export class AttendanceHistoryComponent implements OnInit {
  private courseService = inject(course_Service);
  private attendanceService = inject(AttendanceService);
  private router = inject(Router);

  selectedCourse = new FormControl('');
  selectedBatch = new FormControl('');
  fromDate = new FormControl(new Date(new Date().setDate(new Date().getDate() - 7)));
  toDate = new FormControl(new Date());

  courseList: any[] = [];
  batchList: any[] = [];
  historyList: any[] = [];
  isLoadingHistory: boolean = false;

  ngOnInit() {
    this.loadCourses();
    this.fetchHistory();
  }

  loadCourses() {
    this.courseService.get_course_names().subscribe({
      next: (res: any) => {
        this.courseList = res?.[0] || [];
      },
      error: (err) => console.error('Error loading courses', err)
    });
  }

  onCourseChange() {
    const selectedCourseName = this.selectedCourse.value;
    const selectedCourseObj = this.courseList.find(c =>
      c.Course_Name?.trim().toLowerCase() === selectedCourseName?.trim().toLowerCase()
    );

    if (selectedCourseObj) {
      this.courseService.get_course_Batches(selectedCourseObj.Course_ID).subscribe({
        next: (res: any) => {
          this.batchList = res || [];
          this.selectedBatch.setValue('');
        },
        error: (err) => console.error('Error loading batches', err)
      });
    } else {
      this.batchList = [];
      this.selectedBatch.setValue('');
    }
  }

  fetchHistory() {
    this.isLoadingHistory = true;
    
    let courseId = 0;
    let batchId = 0;
    
    if (this.selectedCourse.value) {
      const selectedCourseObj = this.courseList.find(c => c.Course_Name?.trim().toLowerCase() === this.selectedCourse.value?.trim().toLowerCase());
      if (selectedCourseObj) courseId = selectedCourseObj.Course_ID;
    }
    
    if (this.selectedBatch.value) {
      const selectedBatchObj = this.batchList.find(b => b.Batch_Name?.trim().toLowerCase() === this.selectedBatch.value?.trim().toLowerCase());
      if (selectedBatchObj) batchId = selectedBatchObj.Batch_ID;
    }

    const fromDateStr = this.fromDate.value ? new Date(this.fromDate.value).toISOString().split('T')[0] : '';
    const toDateStr = this.toDate.value ? new Date(this.toDate.value).toISOString().split('T')[0] : '';

    this.attendanceService.getAttendanceHistory(courseId, batchId, fromDateStr, toDateStr).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.historyList = res.data;
        } else {
          this.historyList = [];
        }
        this.isLoadingHistory = false;
      },
      error: (err) => {
        console.error('Error loading history', err);
        this.historyList = [];
        this.isLoadingHistory = false;
      }
    });
  }

  viewAttendanceDetails(record: any) {
    // Navigating to a details page (Not requested explicitly but good to have a placeholder or a simple modal/alert)
    Swal.fire({
      title: 'Attendance Details',
      text: `View details for attendance on ${new Date(record.Attendance_Date).toLocaleDateString()} for batch ${record.Batch_Name || 'N/A'}. This functionality is not fully implemented yet.`,
      icon: 'info'
    });
  }

  goBack() {
    this.router.navigate(['/admin/My_Students']);
  }
}
