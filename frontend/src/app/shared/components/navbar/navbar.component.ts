import { Component, HostListener, OnInit, inject } from '@angular/core';
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
} from '@angular/router';
import { ObservablesService } from '../../services/observables.service';
import { Subscription, filter, map } from 'rxjs';
import { BaseApi } from '../../services/_BaseApi.Service';
import { user_Service } from '../../../admin/services/user.Service';
import { MatDialog } from '@angular/material/dialog';
import { DialogBox_Component } from '../../components/DialogBox/DialogBox.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  private dataService = inject(ObservablesService);
  private activatedRoute = inject(ActivatedRoute);
  private http = inject(BaseApi);
   user_Service = inject(user_Service);
  private dialog = inject(MatDialog);

  menuOpen: boolean = false;
  menuItems: any = [];
  private routerSubscription: Subscription | undefined;

  user = localStorage.getItem('User_Type');
  title: string = 'Dashboard';
  data: any;
  userEmail: any = '';
  First_Name: any = '';
  constructor() {
    if (localStorage.getItem('Access_Token')) {
      this.getMenu();
    }
  }

  isSidebarVisible: boolean = true;
  isSidebarPinned: boolean = true;
  isSmallScreen: boolean = false;

  @HostListener('window:resize')
  onResize() {
    this.isSmallScreen = window.innerWidth <= 768;
  }

  toggleSidebar() {
    if (!this.isSidebarPinned) {
      this.isSidebarVisible = !this.isSidebarVisible;
    }
  }
  togglePinSidebar() {
    this.isSidebarPinned = !this.isSidebarPinned;
    this.isSidebarVisible = this.isSidebarPinned;
  }

  async getMenu() {
    const User_Id = localStorage.getItem('User_Id');
    const menuOrder = [
      'Dashboard',
      'Lead',
      'Import',
      'Student',
      'Expenses',
      'Income',
      'Staff',
      'Enquiry Source',
      'Enquiry Summary',
      'Expense Category',
      'Expense Type',
      'Course',
      'Student Reports',
      'Exam Upload',
      'Studentfile upload',
      'Fees Total Outstanding',
      'Upcoming Installment',
      'Due Instalment',
      'Reports',
      'Work Report',
      'Enquiry Conversion',
      'Status',
      // 'Leave',
    ];

    this.user_Service.Get_user_Menus(User_Id).subscribe((res) => {
      let items = res[0] || [];

      items = items.filter((item: any) => item.Menu_Name !== 'Leave');

      items.sort((a: any, b: any) => {
        const indexA = menuOrder.indexOf(a.Menu_Name);
        const indexB = menuOrder.indexOf(b.Menu_Name);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      });

      this.menuItems = items;
      console.log(this.menuItems);
    });
  }

  ngOnInit(): void {
    this.onResize();
    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) route = route.firstChild;
          return route;
        })
      )
      .subscribe((route) => {
        const breadcrumbData = this.getBreadcrumb(route.snapshot.data);
        localStorage.setItem('NavTitle', breadcrumbData.breadcrumb);
        this.dataService.setData('NavTitle', breadcrumbData.breadcrumb);
        console.log('breadcrumbData.breadcrumb', breadcrumbData.breadcrumb);

        this.title = breadcrumbData.breadcrumb;
      });

    const navTitle = this.dataService.getData('NavTitle');
    if (navTitle) {
      this.title = navTitle;
    }

    this.userEmail = this.dataService.getData('Email');
    this.First_Name = this.dataService.getData('Name');
  }

 getBreadcrumb(routeData: any): { breadcrumb: string } {
    console.log('routeData', routeData);

    let breadcrumb = '';
    if (routeData.breadcrumb) {
      breadcrumb = `${routeData.breadcrumb}`;
      if (routeData.breadcrumb == 'Faculty') {
        breadcrumb = `Staff`;
      }
      if (routeData.breadcrumb == 'Student') {
        breadcrumb = `Student`;
      }
      /* if (routeData.breadcrumb == 'Leave') {
        breadcrumb = `Leave`;
      } */
    } else {
      breadcrumb = '';
    }
    return { breadcrumb };
  }
  
  getImageSource(label: string, isActive: boolean): string {
    switch (label) {
      case 'Dashboard':
        return isActive
          ? 'assets/images/navbar/dashboard-active.png'
          : 'assets/images/navbar/dashboard.png';
      case 'PPT':
        return isActive
          ? 'assets/images/navbar/ppt-active.png'
          : 'assets/images/navbar/ppt.svg';
      case 'Question Bank':
        return isActive
          ? 'assets/images/navbar/questionBank-active.png'
          : 'assets/images/navbar/questionBank.png';
      case 'Online Test':
        return isActive
          ? 'assets/images/navbar/onlineTest-active.png'
          : 'assets/images/navbar/onlineTest.png';
      case 'Student':
        return isActive
          ? 'assets/images/navbar/student-active.png'
          : 'assets/images/navbar/student.svg';
      case 'Banner':
        return isActive
          ? 'assets/images/navbar/banner-active.png'
          : 'assets/images/navbar/banner.svg';
      case 'Department':
        return isActive
          ? 'assets/images/navbar/department-active.png'
          : 'assets/images/navbar/department.svg';
      case 'Eligibility Criteria':
        return isActive
          ? 'assets/images/navbar/eligibility-active.png'
          : 'assets/images/navbar/eligibility.png';
      case 'Exam Type':
        return isActive
          ? 'assets/images/navbar/exam-type-active.png'
          : 'assets/images/navbar/exam-type.svg';
      case 'Question':
        return isActive
          ? 'assets/images/navbar/questions-active.png'
          : 'assets/images/navbar/questions.svg';
      case 'Income':
        return isActive
          ? 'assets/images/navbar/income-active.png'
          : 'assets/images/navbar/income.png';
      case 'Status':
        return '';
      /* case 'Leave':
        return isActive
          ? 'assets/images/navbar/ppt-active.png'
          : 'assets/images/navbar/ppt.svg'; */
      case 'Enquiry Summary':
        return isActive
          ? 'assets/images/navbar/dashboard-active.png'
          : 'assets/images/navbar/dashboard.png';
      case 'Enquiry Conversion':
        return isActive
          ? 'assets/images/navbar/dashboard-active.png'
          : 'assets/images/navbar/dashboard.png';
      default:
        return ''; 
    }
  }
  isActive(link: string): boolean {
    const options: IsActiveMatchOptions = {
      paths: 'exact', // Ensure the entire path matches exactly
      queryParams: 'exact', // Ensure the query parameters match exactly
      fragment: 'ignored', // Ignore the fragment (hash) part of the URL
      matrixParams: 'ignored', // Ignore matrix parameters
    };

    return this.router.isActive(link, options);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  logout() {
    const dialogRef = this.dialog.open(DialogBox_Component, {
      panelClass: 'Dialogbox-Class',
      data: {
        Message: 'Are you sure you want to log out?',
        Type: true,
        Heading: 'Confirm Logout',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'Yes') {
        // Proceed with logout
        if (this.routerSubscription) {
          this.routerSubscription.unsubscribe();
        }
        localStorage.clear();
        this.dataService.clearData();

        if (this.user === '2') {
          this.router.navigateByUrl('auth/user');
        } else if (this.user === '1') {
          this.router.navigateByUrl('auth');
        }
      }
      // If result is not 'Yes', do nothing (user cancelled logout)
    });
  }
  performAction(nav: string) {
    switch (nav) {
      case 'Sign Out':
        this.logout();
        break;
      default:
    }
  }
}
