import { Component, OnInit, Input, Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnimationKeyframesSequenceMetadata } from '@angular/animations';
import { v4 as uuidv4 } from 'uuid';
import { S3 } from 'aws-sdk';

@Injectable({
  providedIn: 'root',
})
export class student_Service {
  private http = inject(HttpClient);

  constructor() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  Save_student(student_) {
    console.log(student_, 'student_');
    ;
    return this.http.post(
      environment.BasePath + 'student/Save_student/',
      student_
    );
  }

  Check_Uniqueness(data: { Email?: string, Phone_Number?: string, Student_ID?: number }) {
    return this.http.post(
      environment.BasePath + 'student/Check_Uniqueness/',
      data
    );
  }
  Save_Call_Log(call_log_data: any) {
    return this.http.post(
      environment.BasePath + 'student/Save_Call_Log/',
      call_log_data
    );
  }
  Save_student_followup(followup_data: any) {
    console.log('Follow-up data payload:', followup_data);
    return this.http.post(
      environment.BasePath + 'student/Save_student_followup/',
      followup_data
    );
  }
  Get_student_followup_history(studentId): Observable<any> {
    return this.http.get(
      environment.BasePath + 'student/Get_student_followup_history/' + studentId
    );
  }
Get_All_Enquiry(): Observable<any> {
    return this.http.get(
      environment.BasePath + 'student/Get_All_Enquiry/'
    );
  }
  Save_Enquiry_Source(data: any): Observable<any> {
    return this.http.post(
      environment.BasePath + 'student/Save_Enquiry_Source/',
      data
    );
  }
  Delete_Enquiry_Source(Enquiry_Source_Id: number): Observable<any> {
    return this.http.post(
      environment.BasePath + 'student/Delete_Enquiry_Source/',
      { Enquiry_Source_Id: Enquiry_Source_Id }
    );
  }
  enroleCourse(course) {
    return this.http.post(
      environment.BasePath + 'student/enroleCourseFromAdmin/',
      course
    );
  }
  Insert_Student_Exam_Result(course) {
    return this.http.post(
      environment.BasePath + 'student/Insert_Student_Exam_Result/',
      course
    );
  }
  private extractData(res: Response) {
    let body = res;
    return body || {};
  }
  Search_student(
    student_Name: string,
    page: number,
    pageSize: number,
    courseId: number | null,
    batchId: number | null,
    enrollmentStatus: string | 'all',
    activeStatus: any
  ): Observable<any> {
    let params = new HttpParams()
      .set('student_Name', student_Name)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('enrollment_status', enrollmentStatus.toString())
      .set('activeStatus', activeStatus);
    if (courseId != null) {
      params = params.set('courseId', courseId.toString());
    }
    if (batchId != null) {
      params = params.set('batchId', batchId.toString());
    }

    return this.http.get(environment.BasePath + 'student/Search_student/', {
      params,
    });
  }
  Search_student_lead(
    student_Name: string,
    page: number,
    pageSize: number,
    courseId: number | null,
    batchId: number | null,
    enrollmentStatus: string | 'all',
    activeStatus: string,
    branchId: number | null,
    assignedStaffId: number | null = null
  ): Observable<any> {
    let params = new HttpParams()
      .set('student_Name', student_Name)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('enrollment_status', enrollmentStatus.toString())
      .set('activeStatus', activeStatus);
    if (courseId != null) {
      params = params.set('courseId', courseId.toString());
    }
    if (batchId != null) {
      params = params.set('batchId', batchId.toString());
    }
    if (branchId != null) {
      params = params.set('branchId', branchId.toString());
    }
    if (assignedStaffId != null) {
      params = params.set('assignedStaffId', assignedStaffId.toString());
    }
    console.log('Search Params:', params.toString());
    

    return this.http.get(environment.BasePath + 'student/Search_student_lead/', {
      params,
    });
  }
  Get_All_Students(student_Name): Observable<any> {
    var Search_Data = { student_Name: student_Name };
    return this.http.get(environment.BasePath + 'student/Get_All_Students/', {
      params: Search_Data,
    });
  }
  Get_Student_Exam_Results(studentId, courseId): Observable<any> {
    var Search_Data = { studentId: studentId, courseId: courseId };
    return this.http.get(
      environment.BasePath + 'student/Get_Student_Exam_Results/',
      { params: Search_Data }
    );
  }

  Delete_student(student_Id) {
    return this.http.post(
      environment.BasePath + 'student/Delete_Student_Account/' + student_Id,
      {}
    );
  }

  Get_student_current_followup(Student_Id): Observable<any> {
    ;
    return this.http.get(
      environment.BasePath +
        'Student/Get_student_current_followup/' +
        Student_Id
    );
  }
  delete_Student_Exam_result(student_Id) {
    return this.http.get(
      environment.BasePath + 'student/delete_Student_Exam_result/' + student_Id
    );
  }
  Generate_certificate(StudentCourse_ID, value) {
    return this.http.get(
      environment.BasePath +
        'student/Generate_certificate/' +
        StudentCourse_ID +
        '/' +
        value
    );
  }
  Get_student(student_Id) {
    return this.http.get(
      environment.BasePath + 'student/Get_student/' + student_Id
    );
  }
  getCoursesByStudentId(studentId): Observable<any> {
    return this.http.get(
      environment.BasePath + 'student/Get_Courses_By_StudentId/' + studentId
    );
  }
  uploadFile(
    file: File,
    studentName: string,
    key?
  ): Promise<{ key: any; fileName: string }> {
    return new Promise((resolve, reject) => {
      console.log('key: ', key);
      const contentType = file.type;
      const randomString = uuidv4(); // Generate a random UUID
      if (!key) {
        key = `Trackbox/Students/${studentName}${randomString}`;
      }

      const bucket = new S3({
        accessKeyId: environment.awsAccessKeyId,
        secretAccessKey: environment.awsSecretAccessKey,
        region: environment.awsRegion,
      });

      const params = {
        Bucket: environment.awsS3Bucket,
        Key: key,
        Body: file,
        ACL: 'public-read',
        ContentType: contentType,
      };

      bucket.upload(params, function (err, data) {
        if (err) {
          console.log('There was an error uploading your file: ', err);
          reject(err);
        } else {
          console.log('Successfully uploaded file.', data);
          resolve({ key: key, fileName: file.name });
        }
      });
    });
  }
 // document_types
  Get_DocumentTypes() {
  return this.http.get(environment.BasePath + `student/Get_DocumentTypes`);
}

Get_StudentDocuments(studentId: number) {
    return this.http.get(environment.BasePath + `student/Get_StudentDocuments/`+studentId);
}

save_DocumentMetadata(payload: any) {
  return this.http.post(
      environment.BasePath + 'Student/save_DocumentMetadata/',
      payload
    );
}
Delete_StudentDocument(student_Id) {
    return this.http.post(
      environment.BasePath + 'student/Delete_StudentDocument/' + student_Id,
      {}
    );
  }

  saveStudentsImport(payload) {
    ;
    console.log('payload: ', payload);
    return this.http.post(
      environment.BasePath + 'Student/Bulk_Student_Import/',
      payload
    );
  }
  saveInstallmentsImport(payload) {
    ;
    console.log('payload: ', payload);
    return this.http.post(
      environment.BasePath + 'Student/BulkImportInstallmentsBatch/',
      payload
    );
  }
  saveAllEnrollments(payload) {
    ;
    console.log('payload: ', payload);
    return this.http.post(
      environment.BasePath + 'Student/saveAllEnrollments/',
      payload
    );
  }

  Branch_Dropdown(): Observable<any> {
    ;
    return this.http.get(environment.BasePath + 'Student/Branch_Dropdown/');
  }
  Department_Dropdown(): Observable<any> {
    ;
    return this.http.get(environment.BasePath + 'Student/Department_Dropdown/');
  }
  Followup_status_Dropdown() {
    ;
    return this.http.get(
      environment.BasePath + 'Student/Followup_status_Dropdown/'
    );
  }

  User_Dropdown(): Observable<any> {
    ;
    return this.http.get(environment.BasePath + 'Student/User_Dropdown/');
  }
  Course_Dropdown(): Observable<any> {
    ;
    return this.http.get(environment.BasePath + 'Student/Course_Dropdown/');
  }
  loadBatches(): Observable<any> {
    ;
    return this.http.get(environment.BasePath + 'Student/loadBatches/');
  }
  Save_Followup_Status(data: any) {
    return this.http.post(
      environment.BasePath + 'student/Save_Followup_Status/',
      data
    );
  }
  Get_Followup_Status(): Observable<any> {
    return this.http.get(environment.BasePath + 'student/Get_Followup_Status/');
  }
  Delete_Followup_Status(Status_Id: number) {
    return this.http.post(
      environment.BasePath + 'student/Delete_Followup_Status/',
      { Status_Id: Status_Id }
    );
  }

  Get_Enquiry_Summary(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get(environment.BasePath + 'student/Get_Enquiry_Summary/', { params });
  }

  Get_Status_Report(fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get(environment.BasePath + 'student/Get_Status_Report/', { params });
  }
}
