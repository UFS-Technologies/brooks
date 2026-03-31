import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorMessageComponent } from './error-message/error-message.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatTabsModule} from '@angular/material/tabs';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
import { DialogBox_Component } from './components/DialogBox/DialogBox.component';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component';
import {MatSelectModule} from '@angular/material/select';
import {MatStepperModule} from '@angular/material/stepper';
import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NgChartsModule } from 'ng2-charts';
import { NgxCountriesDropdownModule } from 'ngx-countries-dropdown';

import { MatButtonModule } from '@angular/material/button';
import { LottieComponent } from 'ngx-lottie';

@NgModule({
  declarations: [
    ErrorMessageComponent,
    NavbarComponent,
    DialogBox_Component,
    LoadingComponent,

  ], exports: [
        NgxCountriesDropdownModule,
        ErrorMessageComponent,
        NgxMaterialTimepickerModule,
        MatNativeDateModule,
        MatTabsModule,
        NgChartsModule,
        MatInputModule,
        NavbarComponent,
        MatNativeDateModule,
        MatInputModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        ReactiveFormsModule,
       FormsModule,
        MatDialogModule,
        DialogBox_Component,
        LoadingComponent,
        MatDatepickerModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        MatStepperModule,
        MatExpansionModule,NgChartsModule,
        MatIconModule,
        MatCheckboxModule,
          
    ], imports: [
        CommonModule,
        
        ReactiveFormsModule, 
        NgChartsModule,
        MatDatepickerModule,
        NgChartsModule,
        MatNativeDateModule,
        MatInputModule,
        MatSlideToggleModule,
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule,
        MatNativeDateModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTabsModule,
        RouterModule,
        LottieComponent,
        FormsModule ,
         
        ],
        
        providers: [provideHttpClient(withInterceptorsFromDi())] })



 
export class SharedModule { }
 