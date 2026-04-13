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
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          padding: 10,
          font: {
            size: 13,
            family: "'Inter', sans-serif"
          },
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          padding: 10,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          color: '#64748b'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          color: '#1e293b'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        cornerRadius: 8,
        displayColors: false
      }
    }
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

  public pieChartData3: ChartData<'pie'> = {
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
        
        if (data[1]) {
          this.barChartData = {
            labels: data[1].map((ele: any) => ele.Course_Name),
            datasets: [{
              data: data[1].map((ele: any) => ele.Enrollment_Count),
              label: 'Total Count',
              backgroundColor: [
                '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'
              ],
              hoverBackgroundColor: [
                '#4338CA', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777', '#0891B2'
              ],
              borderRadius: 8,
              borderWidth: 0,
              barThickness: 40
            }]
          };
        }

        if (data[2]) {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const counts = new Array(12).fill(0);
          data[2].forEach((row: any) => {
            const idx = months.indexOf(row.Month);
            if (idx !== -1) counts[idx] = row.Student_Count;
          });

          this.barChartData2 = {
            labels: months,
            datasets: [{
              data: counts,
              label: 'Student Count',
              backgroundColor: [
                '#F59E0B'
              ],
              hoverBackgroundColor: [
                '#D97706'
              ],
              borderRadius: 8,
              borderWidth: 0,
              barThickness: 30
            }]
          };
        }

        if (data[3]) {
          const coursesMap = new Map();
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const colors = [
            '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
            '#1E293B', '#FACC15', '#FB923C'
          ];
          
          let colorIndex = 0;
          data[3].forEach((row: any) => {
            if (!coursesMap.has(row.Course_Name)) {
              coursesMap.set(row.Course_Name, {
                label: row.Course_Name,
                data: new Array(12).fill(0),
                fill: true,
                tension: 0.4,
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '20', // Add transparency for area chart
                pointBackgroundColor: colors[colorIndex % colors.length],
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors[colorIndex % colors.length]
              });
              colorIndex++;
            }
            const monthIdx = months.indexOf(row.Month);
            if (monthIdx !== -1) {
              coursesMap.get(row.Course_Name).data[monthIdx] = row.Student_Count;
            }
          });

          this.barChartData3 = {
            labels: months,
            datasets: Array.from(coursesMap.values())
          };
        }

        if (data[4]) {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const leadCounts = new Array(12).fill(0);
          data[4].forEach((row: any) => {
            const idx = months.indexOf(row.Month);
            if (idx !== -1) leadCounts[idx] = row.Lead_Count;
          });

          this.barChartData4 = {
            labels: months,
            datasets: [{
              data: leadCounts,
              label: 'Lead Count',
              backgroundColor: [
                '#6366F1' // Indigo color for lead report
              ],
              hoverBackgroundColor: [
                '#4F46E5'
              ],
              borderRadius: 8,
              borderWidth: 0,
              barThickness: 30
            }]
          };
        }

        if (data[5]) {
          const statuses = ['Active', 'Dropout', 'Completed'];
          const counts = [0, 0, 0];
          data[5].forEach((row: any) => {
            const idx = statuses.indexOf(row.Status);
            if (idx !== -1) counts[idx] = row.Count;
          });

          this.pieChartData3 = {
            labels: statuses,
            datasets: [{
              data: counts,
              label: 'Student Status',
              backgroundColor: [
                '#10B981', // Emerald for Active
                '#EF4444', // Red for Dropout
                '#3B82F6'  // Blue for Completed
              ],
              hoverBackgroundColor: [
                '#059669',
                '#DC2626',
                '#2563EB'
              ],
              borderWidth: 0
            }]
          };
        }

      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );
  }
}