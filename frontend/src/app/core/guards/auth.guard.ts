import { Injectable, inject } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn, Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
class PermissionsService {
  private router = inject(Router);


  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('ocalSt ', localStorage['Access_Token'] &&  localStorage['User_Type']);
    if (localStorage['Access_Token'] &&  localStorage['User_Type']==1 ) {
      return true;
    }
    else {
      this.router.navigateByUrl('/auth')
      return false;
    }
  }   
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {

  return inject(PermissionsService).canActivate(next, state);
}




