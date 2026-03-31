import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {

  constructor(private http: HttpClient) { }





  saveIncome(incomePayload: any): Observable<any> {
    return this.http.post(environment.BasePath + 'Income/Save_Income/', incomePayload);
  }

  Get_IncomeList(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.BasePath}Income/Get_IncomeList`);
  }

  Delete_Income(Income_Id: number): Observable<any> {
    return this.http.post(environment.BasePath + 'Income/Delete_Income', { Income_Id });
  }
}
