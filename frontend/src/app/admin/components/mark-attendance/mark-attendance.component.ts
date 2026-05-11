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
  selector: 'app-mark-attendance',
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
  templateUrl: './mark-attendance.component.html',
  styleUrls: ['./mark-attendance.component.scss'],
})
export class MarkAttendanceComponent implements OnInit {
  private courseService = inject(course_Service);
  private attendanceService = inject(AttendanceService);
  private router = inject(Router);

  selectedCourse = new FormControl('');
  selectedBatch = new FormControl('');
  attendanceDate = new FormControl(new Date());
  selectedSession = new FormControl('');

  courseList: any[] = [];
  batchList: any[] = [];
  studentList: any[] = [];
  sessionList: string[] = [];

  // Status: 1 = Present, 0 = Absent, 2 = Leave, 3 = Late
  attendanceStatuses: Map<number, number> = new Map();
  isSavingAttendance: boolean = false;
  isLoadingStudents: boolean = false;

  staffId = parseInt(localStorage.getItem('User_Id') || '0');

  ngOnInit() {
    this.loadCourses();
    this.generateSessionSlots();
  }

  loadCourses() {
    this.courseService.get_course_names().subscribe({
      next: (res: any) => {
        this.courseList = res?.[0] || [];
      },
      error: (err) => console.error('Error loading courses', err)
    });
  }

  generateSessionSlots() {
    // Generate hourly session slots from 8 AM to 6 PM
    this.sessionList = [];
    for (let h = 8; h < 18; h++) {
      const startHour = h > 12 ? h - 12 : h;
      const endHour = (h + 1) > 12 ? (h + 1) - 12 : (h + 1);
      const startPeriod = h >= 12 ? 'PM' : 'AM';
      const endPeriod = (h + 1) >= 12 ? 'PM' : 'AM';
      const startStr = `${startHour === 0 ? 12 : startHour}`;
      const endStr = `${endHour === 0 ? 12 : endHour}`;
      this.sessionList.push(`${startStr}:00 ${startPeriod} – ${endStr}:00 ${endPeriod}`);
    }
    // Auto-select current session
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 8 && currentHour < 18) {
      this.selectedSession.setValue(this.sessionList[currentHour - 8]);
    }
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
          this.studentList = [];
          this.attendanceStatuses.clear();
        },
        error: (err) => console.error('Error loading batches', err)
      });
    } else {
      this.batchList = [];
      this.selectedBatch.setValue('');
      this.studentList = [];
      this.attendanceStatuses.clear();
    }
  }

  onBatchChange() {
    const selectedBatchName = this.selectedBatch.value;
    const selectedBatchObj = this.batchList.find(b =>
      b.Batch_Name?.trim().toLowerCase() === selectedBatchName?.trim().toLowerCase()
    );

    if (selectedBatchObj) {
      this.loadStudentsByBatch(selectedBatchObj.Batch_ID);
    } else {
      this.studentList = [];
      this.attendanceStatuses.clear();
    }
  }

  loadStudentsByBatch(batchId: number) {
    this.isLoadingStudents = true;
    this.courseService.Get_Student_List_By_Batch(batchId).subscribe({
      next: (res: any) => {
        this.studentList = res || [];
        this.initializeAttendanceStatuses();
        this.isLoadingStudents = false;
      },
      error: (err) => {
        console.error('Error loading students', err);
        this.isLoadingStudents = false;
      }
    });
  }

  initializeAttendanceStatuses() {
    this.attendanceStatuses.clear();
    this.studentList.forEach(student => {
      this.attendanceStatuses.set(student.Student_ID, 1); // Default: Present
    });
  }

  setAttendanceStatus(studentId: number, status: number) {
    this.attendanceStatuses.set(studentId, status);
  }

  markAllPresent() {
    this.studentList.forEach(student => {
      this.attendanceStatuses.set(student.Student_ID, 1);
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

  saveAttendance() {
    if (!this.selectedCourse.value) {
      Swal.fire('Error', 'Please select a course.', 'error');
      return;
    }
    if (!this.selectedBatch.value) {
      Swal.fire('Error', 'Please select a batch.', 'error');
      return;
    }
    if (this.studentList.length === 0) {
      Swal.fire('Error', 'No students found for this batch.', 'error');
      return;
    }

    const selectedBatchObj = this.batchList.find(b =>
      b.Batch_Name?.trim().toLowerCase() === this.selectedBatch.value?.trim().toLowerCase()
    );
    const selectedCourseObj = this.courseList.find(c =>
      c.Course_Name?.trim().toLowerCase() === this.selectedCourse.value?.trim().toLowerCase()
    );

    const dateValue = this.attendanceDate.value;
    const dateStr = dateValue ? new Date(dateValue).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const absentCount = this.studentList.filter(s => this.attendanceStatuses.get(s.Student_ID) === 0).length;
    const presentCount = this.studentList.filter(s => this.attendanceStatuses.get(s.Student_ID) === 1).length;
    const leaveCount = this.studentList.filter(s => this.attendanceStatuses.get(s.Student_ID) === 2).length;
    const lateCount = this.studentList.filter(s => this.attendanceStatuses.get(s.Student_ID) === 3).length;

    const attendanceData = this.studentList.map(student => ({
      Student_ID: student.Student_ID,
      Course_ID: selectedCourseObj?.Course_ID,
      Batch_ID: selectedBatchObj?.Batch_ID,
      Attendance_Date: dateStr,
      Status: this.attendanceStatuses.get(student.Student_ID),
      Course_Name: this.selectedCourse.value,
      Batch_Name: this.selectedBatch.value
    }));

    Swal.fire({
      title: 'Confirm Attendance',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Session:</strong> ${this.selectedSession.value || 'N/A'}</p>
          <p style="color: green;"><strong>Present:</strong> ${presentCount}</p>
          <p style="color: red;"><strong>Absent:</strong> ${absentCount}</p>
          <p style="color: orange;"><strong>Leave:</strong> ${leaveCount}</p>
          <p style="color: #6366f1;"><strong>Late:</strong> ${lateCount}</p>
        </div>
        <p class="mt-2 text-sm text-gray-500">Absent students will receive WhatsApp notifications.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      confirmButtonColor: '#4338ca'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSavingAttendance = true;
        this.attendanceService.saveAttendance({
          attendanceData,
          markedBy: this.staffId
        }).subscribe({
          next: () => {
            this.isSavingAttendance = false;
            Swal.fire({
              title: 'Success!',
              text: 'Attendance saved successfully.',
              icon: 'success',
              confirmButtonColor: '#4338ca'
            }).then(() => {
              this.router.navigate(['/admin/My_Students']);
            });
          },
          error: (err) => {
            this.isSavingAttendance = false;
            console.error('Save Attendance Error:', err);
            Swal.fire('Error', 'Failed to save attendance.', 'error');
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/My_Students']);
  }
}
