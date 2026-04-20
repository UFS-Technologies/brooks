import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { student_Service } from '../../services/student.Service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-enquiry-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enquiry-summary.component.html',
  styleUrl: './enquiry-summary.component.scss'
})
export class EnquirySummaryComponent implements OnInit {
  private studentService = inject(student_Service);

  sources: any[] = [];
  statuses: any[] = [];
  counts: any[] = [];
  tableData: any[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.studentService.Get_Enquiry_Summary()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          this.sources = res[0] || [];
          this.statuses = res[1] || [];
          this.counts = res[2] || [];
          this.processTableData();
        },
        error: (err) => console.error('Error fetching summary:', err)
      });
  }

  processTableData() {
    // Create a map for easy lookup of counts: sourceId_statusId -> count
    const countMap = new Map();
    this.counts.forEach(item => {
      countMap.set(`${item.Enquiry_Source_Id}_${item.Status_Id}`, item.LeadCount);
    });

    // Map each source to a row object containing counts for each status
    this.tableData = this.sources.map(source => {
      const row: any = {
        name: source.Enquiry_Source_Name || 'Unknown Source',
        id: source.Enquiry_Source_Id,
        counts: {}
      };

      this.statuses.forEach(status => {
        row.counts[status.Status_Id] = countMap.get(`${source.Enquiry_Source_Id}_${status.Status_Id}`) || 0;
      });

      return row;
    });

    // Add "Others/Unknown" source if there are counts for sources not in the list
    const knownSourceIds = new Set(this.sources.map(s => s.Enquiry_Source_Id));
    const unknownCounts = this.counts.filter(c => !knownSourceIds.has(c.Enquiry_Source_Id));
    
    if (unknownCounts.length > 0) {
      const unknownRow: any = {
        name: 'Other Sources',
        id: 0,
        counts: {}
      };
      
      this.statuses.forEach(status => {
        const sum = unknownCounts
          .filter(c => c.Status_Id === status.Status_Id)
          .reduce((acc, curr) => acc + curr.LeadCount, 0);
        unknownRow.counts[status.Status_Id] = sum;
      });
      
      this.tableData.push(unknownRow);
    }
  }

  getTotalForStatus(statusId: number): number {
    return this.tableData.reduce((acc, row) => acc + (row.counts[statusId] || 0), 0);
  }

  getTotalForSource(row: any): number {
    return Object.values(row.counts).reduce((acc: number, curr: any) => acc + (curr || 0), 0) as number;
  }

  getGrandTotal(): number {
    return this.tableData.reduce((acc, row) => acc + this.getTotalForSource(row), 0);
  }
}
