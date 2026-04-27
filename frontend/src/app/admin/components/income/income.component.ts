import { Component, inject, OnInit } from '@angular/core';
import { IncomeService } from '../../services/income.service';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogBox_Component } from '../../../shared/components/DialogBox/DialogBox.component';
import { CommonModule } from '@angular/common';
import { StudentFeesService } from '../../services/student-fees.service';
import { ExpenseTypeService } from '../../services/expense-type.service';
import { EmailTemplateService } from '../../services/email-template.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss',
})
export class IncomeComponent implements OnInit {
  showForm: boolean = false;
  isEditMode: boolean = false;
  IncomeList: any[] = [];
  selectedExpenseType: any = '';
  amount: number = 0;
  description: string = '';
  recipientEmail: string = '';
  dialogBox = inject(MatDialog);
  Expense_Type: any[] = [];
  incomeId: number = 0;
  allAccounts: any = [];
  selectedAccount: any;
  isEdit: boolean = false;
  isSave: boolean = false;
  isDelete: boolean = false;
  emailTemplates: any[] = [];
  selectedTemplateId: number | null = null;
  url = inject(ActivatedRoute);

  constructor(
    private incomeApi: IncomeService,
    private feesService: StudentFeesService,
    private expenseTypeService: ExpenseTypeService,
    private emailTemplateService: EmailTemplateService
  ) {}

  ngOnInit() {
    this.Get_IncomeList();
    this.Get_Expense_Type();
    this.getAccounts();

    this.url.queryParams.subscribe(params => {
      if (params['item']) {
        const receivedItem = JSON.parse(params['item']);
        this.isSave = receivedItem?.IsSave || false;
        this.isEdit = receivedItem?.IsEdit || false;
        this.isDelete = receivedItem?.IsDelete || false;
      }
    });

    this.loadEmailTemplates();
  }

  loadEmailTemplates() {
    this.emailTemplateService.searchTemplates('').subscribe((res) => {
      this.emailTemplates = res || [];
    });
  }

  sendSelectedEmail(email: string, studentName: string = '') {
    if (this.selectedTemplateId && email) {
      const placeholders = {
        'Student Name': studentName,
        'Lead Name': studentName
      };
      this.emailTemplateService.sendTemplateEmail(this.selectedTemplateId, email, placeholders).subscribe({
        next: (res) => {
          console.log('Email sent successfully', res);
          this.dialogBox.open(DialogBox_Component, {
            panelClass: 'Dialogbox-Class',
            data: { Message: 'Email sent successfully', Type: 'false' },
          });
        },
        error: (err) => console.error('Error sending email', err)
      });
    }
  }

  getAccounts(): void {
    this.feesService.Get_Accounts().subscribe((res) => {
      this.allAccounts = res;
    });
  }

  Get_Expense_Type() {
    this.expenseTypeService.Get_Expense_Type().subscribe((typelist) => {
      this.Expense_Type = typelist;
    });
  }

  Get_IncomeList() {
    this.incomeApi.Get_IncomeList().subscribe((incomelist: any[]) => {
      this.IncomeList = incomelist;
    });
  }

  saveSelectedIncome() {
    const incomePayload = {
      Income_Id: this.incomeId || 0,
      Expense_Type_Id: this.selectedExpenseType,
      User_Id: this.getLoggedInUserId(),
      Amount: this.amount,
      Description: this.description,
      Account_Id: this.selectedAccount.Account_id || 0,
      Account_Name: this.selectedAccount.Account_Name || '',
    };

    this.incomeApi.saveIncome(incomePayload).subscribe((Save_status) => {
      if (Save_status) {
        this.dialogBox.open(DialogBox_Component, {
          panelClass: 'Dialogbox-Class',
          data: { Message: 'Income saved successfully!', Type: 'false' },
        });

        this.sendSelectedEmail(this.recipientEmail);
        this.resetForm();
        this.Get_IncomeList();
      }
    });
  }

  resetForm() {
    this.incomeId = 0;
    this.selectedExpenseType = '';
    this.description = '';
    this.recipientEmail = '';
    this.amount = 0;
    this.showForm = false;
    this.isEditMode = false;
    this.selectedAccount = null;
  }

  getLoggedInUserId(): number {
    const User_Id = localStorage.getItem('User_Type');
    return User_Id ? Number(User_Id) : 1; 
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    } else {
      this.isEditMode = false;
    }
  }

  editIncome(income: any) {
    this.incomeId = income.Income_Id;
    this.selectedExpenseType = income.Expense_Type_Id;
    this.amount = income.Amount;
    this.description = income.Description;

    this.selectedAccount = this.allAccounts.find(
      (acc: any) => acc.Account_id === income.Account_Id
    );

    this.showForm = true;
    this.isEditMode = true;
  }

  deleteIncome(incomeId: number) {
    const dialogRef = this.dialogBox.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: 'Do you want to delete ?',
        Type: true,
        Heading: 'Confirm',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result == 'Yes') {
        this.incomeApi.Delete_Income(incomeId).subscribe((Res) => {
          this.Get_IncomeList();
        });
      }
    });
  }

  pageSizeOptions: number[] = [10, 15, 20, 25];
  pageSize: number = 10;
  currentPage: number = 1;

  get totalPages(): number {
    return Math.ceil(this.IncomeList.length / this.pageSize) || 1;
  }

  get paginatedIncomes() {
    if (!this.IncomeList) return [];
    const start = (this.currentPage - 1) * this.pageSize;
    return this.IncomeList.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }
}
