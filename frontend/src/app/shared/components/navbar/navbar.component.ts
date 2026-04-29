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
  private readonly fallbackMenuItems = [
    {
      Menu_ID: 'fallback-mail-report',
      Menu_Name: 'Mail Report',
      Route: '/admin/Mail_Report',
    },
  ];

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

  isSidebarVisible: boolean = true;
  isSidebarPinned: boolean = true;
  isSmallScreen: boolean = false;

  constructor() {
    if (localStorage.getItem('Access_Token')) {
      this.getMenu();
    }
  }

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
      'My Students',
      'Expenses',
      'Income',
      'Staff',
      'Email',
      'Mail Report',
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
    ];

    this.user_Service.Get_user_Menus(User_Id).subscribe((res) => {
      let items = res[0] || [];

      // Remove unwanted menu
      items = items.filter((item: any) => item.Menu_Name !== 'Leave');

      // Add missing fallback items
      items = this.addMissingMenuItems(items);

      // Sort menu
      items.sort((a: any, b: any) => {
        const indexA = menuOrder.indexOf(a.Menu_Name);
        const indexB = menuOrder.indexOf(b.Menu_Name);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      });

      this.menuItems = items;
      console.log('Menu Items:', this.menuItems);
    });
  }

  private addMissingMenuItems(items: any[]): any[] {
    const existingNames = new Set(items.map((item: any) => item?.Menu_Name));

    const missingItems = this.fallbackMenuItems.filter(
      (item) => !existingNames.has(item.Menu_Name)
    );

    return [...items, ...missingItems];
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
    let breadcrumb = '';

    if (routeData.breadcrumb) {
      breadcrumb = routeData.breadcrumb;

      if (breadcrumb === 'Faculty') {
        breadcrumb = 'Staff';
      }
      if (breadcrumb === 'Student') {
        breadcrumb = 'Student';
      }
    }

    return { breadcrumb };
  }

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

      case 'Enquiry Summary':
      case 'Enquiry Conversion':
        return isActive
          ? 'assets/images/navbar/dashboard-active.png'
          : 'assets/images/navbar/dashboard.png';

      default:
        return '';
    }
  }

  getMenuRoute(item: any): string {
    const route = item?.Route || '';

    if (!route) return '/admin/dash';

    return route.startsWith('/') ? route : `/admin/${route}`;
  }

  isActive(link: string): boolean {
    const options: IsActiveMatchOptions = {
      paths: 'exact',
      queryParams: 'exact',
      fragment: 'ignored',
      matrixParams: 'ignored',
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
        if (this.routerSubscription) {
          this.routerSubscription.unsubscribe();
        }

        localStorage.clear();
        this.dataService.clearData();

        const userType = Number(this.user);

        if (userType === 1 || userType === 2 || userType === 3) {
          this.router.navigateByUrl('auth');
        } else if (userType === 4) {
          this.router.navigateByUrl('auth/user');
        } else {
          this.router.navigateByUrl('auth');
        }
      }
    });
  }

  performAction(nav: string) {
    if (nav === 'Sign Out') {
      this.logout();
    }
  }
}