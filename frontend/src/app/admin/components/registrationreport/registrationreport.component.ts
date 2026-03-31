import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';


@Component({
  selector: 'app-registrationreport',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatAutocompleteModule, MatDatepickerModule, MatButtonModule, MatIconModule],
     providers: [provideNativeDateAdapter()],
  templateUrl: './registrationreport.component.html',
  styleUrl: './registrationreport.component.scss'
})
export class RegistrationreportComponent {

}
