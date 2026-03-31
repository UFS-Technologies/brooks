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
    this.getMenu();
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
      
    const User_Id =localStorage.getItem('User_Id')
    // const result = await this.http.get(`Get_All_Menu?User_Id=${User_Id}`);

 this.user_Service.Get_user_Menus(User_Id).subscribe((res) => {
      this.menuItems = res[0] ;
      console.log(this.menuItems);
      

     


      // console.log('res[0]', res[0]);
      // console.log('this.menuItems', this.menuItems);
    });



    // if (result) {
  
      //  const filteredMenu = result.filter((item: any) => item.IsView === 1);
      // this.menuItems = result;

      // 1 for admin   2 for student
      // this.user=='1'?this.menuItems= [
      //   { label: 'Student', link: '/admin/student', action: '' },
      //    { label: 'Banner', link: '/admin/Banner', action: '' },
      //    { label: 'Department', link: '/admin/department', action: '' },
      //    { label: 'PPT', link: '/admin/presentations', action: '' },
      //    { label: 'Eligibility Criteria', link: '/admin/eligibility_criteria', action: '' },
      //    { label: 'Exam Type', link: '/admin/exam_types', action: '' },
      //    { label: 'Question', link: '/admin/question', action: '' },

      //  ]:this.menuItems=[{ label: 'Dashboard', link: '/user/dash', action: '' },
      //  { label: 'PPT', link: '/user/ppt', action: '' },
      //  // { label: 'E-commerce', subItems: [
      //  //   { label: 'Products', link: '#',action: '' },
      //  //   { label: 'Billing', link: '#',action: '' },
      //  //   { label: 'Invoice', link: '#',action: '' }
      //  // ] },
      //  { label: 'Question Bank', link: '/user/question_bank', action: '' },
      //  { label: 'Online Test', link: '/user/student-exam', action: '' },

      // ]
    // }
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
    } else {
      breadcrumb = '';
    }
    return { breadcrumb };
  }
  n
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
