import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  private baseUrl = environment.BasePath + 'Attendance/';

  saveAttendance(payload: any): Observable<any> {
    return this.http.post(this.baseUrl + 'Save_Attendance', payload);
  }

  getAttendanceHistory(courseId: number, batchId: number, fromDate: string, toDate: string): Observable<any> {
    return this.http.get(this.baseUrl + 'Get_Attendance_History', {
      params: {
        courseId: courseId.toString(),
        batchId: batchId.toString(),
        fromDate: fromDate || '',
        toDate: toDate || ''
      }
    });
  }
}
