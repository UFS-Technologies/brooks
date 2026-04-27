import { Component, OnInit, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmailTemplateService } from '../../services/email-template.service';
import { EmailTemplate } from '../../../core/models/email_template';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';

import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './email-template.component.html',
  styleUrl: './email-template.component.scss'
})
export class EmailTemplateComponent implements OnInit {
  private emailTemplateService = inject(EmailTemplateService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  Entry_View = false;
  emailTemplateForm: FormGroup;
  emailTemplates: EmailTemplate[] = [];
  isLoading = false;
  submitted = false;

  constructor() {
    this.emailTemplateForm = this.fb.group({
      Template_ID: [0],
      Template_Name: ['', Validators.required],
      Subject: ['', Validators.required],
      Body: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates() {
    this.isLoading = true;
    this.emailTemplateService.searchTemplates('').subscribe({
      next: (data) => {
        this.emailTemplates = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showDialog('Error loading templates', '2');
      }
    });
  }

  createNew() {
    this.Entry_View = true;
    this.submitted = false;
    this.emailTemplateForm.reset({
      Template_ID: 0,
      Template_Name: '',
      Subject: '',
      Body: ''
    });
  }

  editTemplate(template: EmailTemplate) {
    this.Entry_View = true;
    this.submitted = false;
    this.emailTemplateForm.patchValue(template);
  }

  saveTemplate() {
    this.submitted = true;
    if (this.emailTemplateForm.invalid) {
      this.showDialog('Please fill all required fields', '2');
      return;
    }

    this.isLoading = true;
    this.emailTemplateService.saveTemplate(this.emailTemplateForm.value).subscribe({
      next: (res) => {
        if (res && res[0] && res[0].InsertId > 0) {
          this.showDialog('Template saved successfully', 'false');
          this.Entry_View = false;
          this.loadTemplates();
        } else {
          this.showDialog('Error saving template', '2');
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showDialog('Error saving template', '2');
      }
    });
  }

  deleteTemplate(id: number) {
    const dialogRef = this.dialog.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: { Message: 'Do you want to delete this template?', Type: true, Heading: 'Confirm' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Yes') {
        this.isLoading = true;
        this.emailTemplateService.deleteTemplate(id).subscribe({
          next: () => {
            this.showDialog('Template deleted', 'false');
            this.loadTemplates();
          },
          error: (err) => {
            this.isLoading = false;
            this.showDialog('Error deleting template', '2');
          }
        });
      }
    });
  }

  closeClick() {
    this.Entry_View = false;
  }

  private showDialog(message: string, type: string) {
    this.dialog.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: { Message: message, Type: type }
    });
  }
}
