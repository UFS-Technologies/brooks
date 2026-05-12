import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { user_Service } from '../../services/user.Service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { EmailTemplateService } from '../../services/email-template.service';
import { EmailTemplate } from '../../../core/models/email_template';

@Component({
  selector: 'app-mail-report',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: './mail-report.component.html',
  styleUrl: './mail-report.component.scss'
})
export class MailReportComponent implements OnInit {
  private userService = inject(user_Service);
  private templateService = inject(EmailTemplateService);
  
  tableData: any[] = [];
  templates: EmailTemplate[] = [];
  displayedColumns: string[] = ['date', 'leadName', 'template', 'email', 'subject', 'status', 'openedStatus'];
  isLoaded: boolean = false;

  // Filters
  sentOn: boolean = true;
  fromDate: any = new Date();
  toDate: any = new Date();
  selectedTemplateId: number | null = null;

  ngOnInit() {
    console.log('MailReportComponent initialized');
    this.fetchTemplates();
    this.fetchReportData();
  }

  fetchTemplates() {
    this.templateService.searchTemplates('').subscribe({
      next: (res: any) => {
        this.templates = res || [];
      },
      error: (err) => console.error('Error fetching templates:', err)
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    // Format to YYYY-MM-DD
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  fetchReportData() {
    this.isLoaded = false;
    const filters = {
      fromDate: this.sentOn ? this.formatDate(this.fromDate) : '',
      toDate: this.sentOn ? this.formatDate(this.toDate) : '',
      templateId: this.selectedTemplateId
    };

    this.userService.Get_Mail_Report(filters).subscribe({
      next: (res: any) => {
        this.tableData = res || [];
        this.isLoaded = true;
      },
      error: (err) => {
        console.error('Error fetching mail report:', err);
        this.isLoaded = true;
      }
    });
  }

  resetFilters() {
    this.sentOn = true;
    this.fromDate = new Date();
    this.toDate = new Date();
    this.selectedTemplateId = null;
    this.fetchReportData();
  }
}
