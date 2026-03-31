import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { user_Service } from '../../services/user.Service';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [SharedModule, CommonModule]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private userService = inject(user_Service);

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: {
            size: 10,
            weight: 'bold'
          }
        }
      }
    }
  };

  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  public pieChartData2: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };

  public barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
    },
    barPercentage: 0.3, // Adjust bar width
    categoryPercentage: 0.8 // Adjust space betwe
  };

  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public Accounts: any;

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  public barChartData2: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

    public barChartData3: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  public barChartData4: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
    public barChartData5: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };
  ngOnInit(): void {
    this.getDashboardData();
  }

  getDashboardData(): void {
    this.userService.Get_Dashboard().subscribe(
      (data) => {
        this.Accounts = data[0] 
        console.log('Accounts:', this.Accounts);
        
        // this.barChartData = {
        //   labels: data[0].map((ele: any) => ele.Course_Name),
        //   datasets: [{
        //     data: data[0].map((ele: any) => ele.Enrollment_Count),
        //     label: 'Total Count',
        //     backgroundColor: ['#42A5F5', '#66BB6A'],
        //     hoverBackgroundColor: ['#64B5F6', '#81C784']
        //   }]
        // };

        // this.barChartData2 = {
        //   labels: data[1].map((ele: any) => ele.Month),
        //   datasets: [{
        //     data: data[1].map((ele: any) => ele.Student_Count),
        //     label: 'Student Count',
        //     backgroundColor: ['#FFA726', '#EF5350','#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
        //     hoverBackgroundColor: ['#FFA726', '#EF5350','#64B5F6', '#81C784', '#FFB74D', '#EF9A9A']
        //   }]
        // };

        // this.barChartData3 = {
        //   labels: data[2].map((ele: any) => ele.To_User_Name),
        //   datasets: [{
        //     data: data[2].map((ele: any) => ele.Student_Count),
        //     label: 'Student Count',
        //     backgroundColor: ['#FFA726', '#EF5350','#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
        //     hoverBackgroundColor: ['#FFA726', '#EF5350','#64B5F6', '#81C784', '#FFB74D', '#EF9A9A']
        //   }]
        // };


        // this.barChartData4 = {
        //   labels: data[3].map((ele: any) => ele.Status_Name),
        //   datasets: [{
        //     data: data[3].map((ele: any) => ele.Student_Count),
        //     label: 'Student Count',
        //     backgroundColor: ['#FFA726', '#EF5350','#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
        //     hoverBackgroundColor: ['#FFA726', '#EF5350','#64B5F6', '#81C784', '#FFB74D', '#EF9A9A']
        //   }]
        // };

        //    this.barChartData5 = {
        //   labels: data[4].map((ele: any) => ele.Status_Name),
        //   datasets: [{
        //     data: data[4].map((ele: any) => ele.Student_Count),
        //     label: 'Amount',
        //     backgroundColor: ['#FFA726', '#EF5350','#42A5F5', '#66BB6A', '#FFA726', '#EF5350'],
        //     hoverBackgroundColor: ['#FFA726', '#EF5350','#64B5F6', '#81C784', '#FFB74D', '#EF9A9A']
        //   }]
        // };

      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }
}