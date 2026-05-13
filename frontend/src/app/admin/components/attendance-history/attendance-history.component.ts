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
  fromDate = new FormControl(new Date().toISOString().split('T')[0]);
  toDate = new FormControl(new Date().toISOString().split('T')[0]);

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
          this.fetchHistory();
        },
        error: (err) => console.error('Error loading batches', err)
      });
    } else {
      this.batchList = [];
      this.selectedBatch.setValue('');
      this.fetchHistory();
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
    this.isLoadingHistory = true;
    // record.Attendance_Date is now a YYYY-MM-DD string from the DB
    const dateStr = record.Attendance_Date;
    
    // Use the new dedicated session details API
    this.attendanceService.getAttendanceDetailsBySession(
      record.Course_ID || 0,
      record.Batch_ID || 0,
      dateStr
    ).subscribe({
      next: (res: any) => {
        this.isLoadingHistory = false;
        if (res.success && res.data && res.data.length > 0) {
          const studentRows = res.data.map((s: any, idx: number) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${idx + 1}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;">${s.Student_Name || s.Name || 'N/A'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">
                <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; 
                  ${s.Status === 1 ? 'background: #dcfce7; color: #166534;' : 
                    s.Status === 0 ? 'background: #fee2e2; color: #991b1b;' : 
                    s.Status === 2 ? 'background: #fef3c7; color: #92400e;' : 
                    'background: #eef2ff; color: #3730a3;'}">
                  ${this.getStatusLabel(s.Status)}
                </span>
              </td>
            </tr>
          `).join('');

          Swal.fire({
            title: `Attendance Details`,
            html: `
              <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
                <p><strong>Course:</strong> ${record.Course_Name || 'N/A'}</p>
                <p><strong>Batch:</strong> ${record.Batch_Name || 'N/A'}</p>
                <p><strong>Date:</strong> ${dateStr}</p>
              </div>
              <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <thead>
                    <tr style="background: #f9fafb; text-align: left;">
                      <th style="padding: 8px; border-bottom: 2px solid #eee;">#</th>
                      <th style="padding: 8px; border-bottom: 2px solid #eee;">Student Name</th>
                      <th style="padding: 8px; border-bottom: 2px solid #eee;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${studentRows}
                  </tbody>
                </table>
              </div>
            `,
            width: '600px',
            confirmButtonText: 'Close',
            confirmButtonColor: '#4338ca'
          });
        } else {
          Swal.fire('No Data', 'No student details found for this record.', 'info');
        }
      },
      error: (err) => {
        this.isLoadingHistory = false;
        console.error('Error fetching attendance details', err);
        Swal.fire('Error', 'Failed to load attendance details.', 'error');
      }
    });
  }

  deleteAttendanceRecord(record: any) {
    const dateStr = new Date(record.Attendance_Date).toISOString().split('T')[0];
    
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the attendance record for ${record.Batch_Name} on ${dateStr}. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoadingHistory = true;
        this.attendanceService.deleteAttendance(
          record.Course_ID || 0,
          record.Batch_ID || 0,
          dateStr
        ).subscribe({
          next: (res: any) => {
            this.isLoadingHistory = false;
            Swal.fire(
              'Deleted!',
              'Attendance record has been deleted.',
              'success'
            );
            this.fetchHistory(); // Refresh the list
          },
          error: (err) => {
            this.isLoadingHistory = false;
            console.error('Error deleting attendance', err);
            Swal.fire('Error', 'Failed to delete attendance record.', 'error');
          }
        });
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

  goBack() {
    this.router.navigate(['/admin/My_Students']);
  }
}
