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

  // ✅ Inject Services
  private router = inject(Router);
  private dataService = inject(ObservablesService);
  private activatedRoute = inject(ActivatedRoute);
  private http = inject(BaseApi);
  user_Service = inject(user_Service);
  private dialog = inject(MatDialog);

  // ✅ UI State
  menuOpen: boolean = false;
  menuItems: any[] = [];
  private routerSubscription?: Subscription;

  user = localStorage.getItem('User_Type');
  title: string = 'Dashboard';
  userEmail: string = '';
  First_Name: string = '';

  isSidebarVisible: boolean = true;
  isSidebarPinned: boolean = true;
  isSmallScreen: boolean = false;

  constructor() {
    if (localStorage.getItem('Access_Token')) {
      this.getMenu();
    }
  }

  // ✅ Screen Resize
  @HostListener('window:resize')
  onResize() {
    this.isSmallScreen = window.innerWidth <= 768;
  }

  // ✅ Sidebar Controls
  toggleSidebar() {
    if (!this.isSidebarPinned) {
      this.isSidebarVisible = !this.isSidebarVisible;
    }
  }

  togglePinSidebar() {
    this.isSidebarPinned = !this.isSidebarPinned;
    this.isSidebarVisible = this.isSidebarPinned;
  }

  // ✅ MAIN MENU FUNCTION (Mail Report INCLUDED HERE)
  async getMenu() {
    const User_Id = localStorage.getItem('User_Id');

    if (!User_Id) {
      console.error('User_Id not found');
      this.menuItems = [];
      return;
    }

    const menuOrder = [
      'Dashboard',
      'Lead',
      'Import',
      'Student',
      'My Students',
      'Expenses',
      'Income',
      'Staff',
      'Email',
      'Mail Report',
      'Campaign',
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
      'Account Reports',
      'Work Report',
      'Enquiry Conversion',
      'Status Report',
    ];

    this.user_Service.Get_user_Menus(User_Id).subscribe({
      next: (res: any) => {
        let items = Array.isArray(res?.[0]) ? res[0] : [];

        // ✅ Remove unwanted menu
        items = items.filter((item: any) => item?.Menu_Name !== 'Leave');

        // ✅ Normalize menu names
        items = items.map((item: any) => ({
          ...item,
          Menu_Name: item.Menu_Name?.trim() === 'Reports'
            ? 'Account Reports'
            : item.Menu_Name?.trim(),
        }));

        // ✅ 👉 Ensure Mail Report is always present
        const mailReportExists = items.some(
          (item: any) => item.Menu_Name === 'Mail Report'
        );

        if (!mailReportExists) {
          items.push({
            Menu_ID: 'fallback-mail-report',
            Menu_Name: 'Mail Report',
            Route: '/admin/Mail_Report',
          });
        }

        // ✅ 👉 Ensure Status Report is always present
        const statusReportExists = items.some(
          (item: any) => item.Menu_Name === 'Status Report'
        );

        if (!statusReportExists) {
          items.push({
            Menu_ID: 'fallback-status-report',
            Menu_Name: 'Status Report',
            Route: '/admin/Status_Report',
          });
        }

        // ✅ Fix routes
        items = items.map((item: any) => ({
          ...item,
          Route: this.getMenuRoute(item),
        }));

        // ✅ Sort menu
        items.sort((a: any, b: any) => {
          const indexA = menuOrder.indexOf(a.Menu_Name);
          const indexB = menuOrder.indexOf(b.Menu_Name);

          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });

        this.menuItems = items;

        console.log('Final Menu:', this.menuItems);
      },

      error: (err) => {
        console.error('Menu API error:', err);

        // ✅ Fallback if API fails
        this.menuItems = [
          {
            Menu_ID: 'fallback-mail-report',
            Menu_Name: 'Mail Report',
            Route: '/admin/Mail_Report',
          },
          {
            Menu_ID: 'fallback-status-report',
            Menu_Name: 'Status Report',
            Route: '/admin/Status_Report',
          },
        ];
      },
    });
  }

  // ✅ INIT
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

        this.title = breadcrumbData.breadcrumb;
      });

    const navTitle = this.dataService.getData('NavTitle');
    if (navTitle) {
      this.title = this.normalizeTitle(navTitle);
    }

    this.userEmail = this.dataService.getData('Email') || '';
    this.First_Name = this.dataService.getData('Name') || '';
  }

  // ✅ Breadcrumb
  getBreadcrumb(routeData: any): { breadcrumb: string } {
    let breadcrumb = this.normalizeTitle(routeData?.breadcrumb || '');

    if (breadcrumb === 'Faculty') {
      breadcrumb = 'Staff';
    }

    return { breadcrumb };
  }

  private normalizeTitle(title: string): string {
    return title === 'Reports' ? 'Account Reports' : title;
  }

  // ✅ Icon Handling
  getImageSource(label: string, isActive: boolean): string {
    switch (label) {
      case 'Dashboard':
        return isActive
          ? 'assets/images/navbar/dashboard-active.png'
          : 'assets/images/navbar/dashboard.png';

      case 'Student':
      case 'My Students':
        return isActive
          ? 'assets/images/navbar/student-active.png'
          : 'assets/images/navbar/student.svg';

      case 'Income':
        return isActive
          ? 'assets/images/navbar/income-active.png'
          : 'assets/images/navbar/income.png';

      case 'Email':
        return isActive
          ? 'assets/images/navbar/ppt-active.png'
          : 'assets/images/navbar/ppt.svg';

      default:
        return 'assets/images/navbar/default.png';
    }
  }

  // ✅ Route Fix
  getMenuRoute(item: any): string {
    const route = item?.Route || '';

    if (!route) return '/admin/dash';

    return route.startsWith('/') ? route : `/admin/${route}`;
  }

  // ✅ Active Check
  isActive(link: string): boolean {
    const options: IsActiveMatchOptions = {
      paths: 'exact',
      queryParams: 'exact',
      fragment: 'ignored',
      matrixParams: 'ignored',
    };

    return this.router.isActive(link, options);
  }

  // ✅ Mobile Menu
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // ✅ Logout
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
        this.routerSubscription?.unsubscribe();

        localStorage.clear();
        this.dataService.clearData();

        const userType = Number(this.user);

        if ([1, 2, 3].includes(userType)) {
          this.router.navigateByUrl('auth');
        } else if (userType === 4) {
          this.router.navigateByUrl('auth/user');
        } else {
          this.router.navigateByUrl('auth');
        }
      }
    });
  }

  // ✅ Menu Actions
  performAction(nav: string) {
    if (nav === 'Sign Out') {
      this.logout();
    }
  }
}
