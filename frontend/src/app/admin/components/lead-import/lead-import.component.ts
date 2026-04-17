import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { student_Service } from '../../services/student.Service';
import { course_Service } from '../../services/course.Service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

interface ImportData {
  SNo: number;
  Name: string;
  Phone_Number: string;
  Email: string;
}

@Component({
  selector: 'app-lead-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './lead-import.component.html',
  styleUrl: './lead-import.component.scss'
})
export class LeadImportComponent implements OnInit {
  private studentService = inject(student_Service);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  importForm: FormGroup;
  departmentData: any[] = [];
  staffData: any[] = [];
  followUpStatusData: any[] = [];
  importedLeads: ImportData[] = [];
  file: File | null = null;
  isLoading: boolean = false;
  isImporting: boolean = false;

  constructor() {
    this.importForm = this.fb.group({
      Department: [null, Validators.required],
      AssignToStaff: [null, Validators.required],
      NextFollowUpDate: [this.getCurrentDate(), Validators.required],
      FollowUpStatus: [null, Validators.required],
      Remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadMetadata();
  }

  loadMetadata() {
    this.studentService.Department_Dropdown().subscribe((res: any) => {
      this.departmentData = Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : []);
      const admissionDept = this.departmentData.find(d => d.Department_Name === "Admission");
      if (admissionDept) this.importForm.patchValue({ Department: admissionDept });
    });

    this.studentService.User_Dropdown().subscribe((res: any) => {
      this.staffData = Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : []);
      const loggedInUserId = Number(localStorage.getItem('User_ID'));
      const currentUser = this.staffData.find(s => s.User_ID === loggedInUserId);
      if (currentUser) this.importForm.patchValue({ AssignToStaff: currentUser });
    });

    this.studentService.Get_Followup_Status().subscribe((res: any) => {
      let rows: any[] = Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : []);
      this.followUpStatusData = rows;
      const initialStatus = this.followUpStatusData.find(s => s.Status_Name?.toLowerCase() === 'pending');
      if (initialStatus) this.importForm.patchValue({ FollowUpStatus: initialStatus });
    });
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFileSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.file = selectedFile;
      this.parseExcel();
    }
  }

  parseExcel() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      this.importedLeads = rawData.map((row, index) => ({
        SNo: index + 1,
        Name: row['Name'] || '',
        Phone_Number: row['Phone Number'] || row['Phone_Number'] || '',
        Email: row['Email'] || ''
      })).filter(lead => lead.Name || lead.Phone_Number);
    };
    reader.readAsArrayBuffer(this.file);
  }

  downloadTemplate() {
    const template = [
      { 'Name': 'John Doe', 'Phone Number': '9876543210', 'Email': 'john@example.com' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = { Sheets: { 'Template': worksheet }, SheetNames: ['Template'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'Lead_Import_Template.xlsx');
  }

  importLeads() {
    if (this.importForm.invalid) {
      this.importForm.markAllAsTouched();
      return;
    }

    if (this.importedLeads.length === 0) {
      this.dialog.open(DialogBox_Component, {
        data: { Message: 'Please choose a file with data first!', Type: '3' }
      });
      return;
    }

    this.isImporting = true;
    const formValues = this.importForm.value;
    const currentUserId = Number(localStorage.getItem('User_ID'));

    const savePromises = this.importedLeads.map(lead => {
      const nameParts = lead.Name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        Student_ID: 0,
        First_Name: firstName,
        Last_Name: lastName,
        Email: lead.Email,
        Phone_Number: lead.Phone_Number,
        Country_Code: '+91',
        Country_Code_Name: 'in',
        Delete_Status: 0,
        Active_Status: 'Active',
        Department_Id: formValues.Department?.Department_Id || formValues.Department?.Department_ID,
        Department_Name: formValues.Department?.Department_Name,
        Assigned_Staff_ID: formValues.AssignToStaff?.User_ID,
        Assigned_Staff_Name: formValues.AssignToStaff?.First_Name,
        Follow_Up_Status_ID: formValues.FollowUpStatus?.Status_Id || formValues.FollowUpStatus?.Status_ID,
        Follow_Up_Status_Name: formValues.FollowUpStatus?.Status_Name,
        Next_Follow_Up_Date: formValues.NextFollowUpDate,
        Remark: formValues.Remarks,
        Created_By: currentUserId,
        Followup_Status: true
      };

      return this.studentService.Save_student(payload).toPromise();
    });

    Promise.all(savePromises).then(() => {
      this.isImporting = false;
      this.dialog.open(DialogBox_Component, {
        data: { Message: 'Leads imported successfully!', Type: 'false' }
      });
      // Do not clear importedLeads so they are displayed at the bottom as requested
    }).catch(err => {
      this.isImporting = false;
      console.error('Import error:', err);
      this.dialog.open(DialogBox_Component, {
        data: { Message: 'Some errors occurred during import.', Type: '2' }
      });
    });
  }

  compareObjects(o1: any, o2: any): boolean {
    if (o1 && o2) {
      return (o1.Department_ID === o2.Department_ID) || 
             (o1.Department_Id === o2.Department_Id) ||
             (o1.User_ID === o2.User_ID) ||
             (o1.Status_ID === o2.Status_ID) ||
             (o1.Status_Id === o2.Status_Id);
    }
    return o1 === o2;
  }
}
