import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      // Check for required roles
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles && requiredRoles.length > 0) {
        if (!this.authService.hasRole(requiredRoles)) {
          // User doesn't have required role, redirect to home
          return this.router.createUrlTree(['/']);
        }
      }

      // Check for required permissions
      const requiredPermission = route.data['permission'] as { resource: string, action: string };
      if (requiredPermission) {
        if (!this.authService.hasPermission(requiredPermission.resource, requiredPermission.action)) {
          // User doesn't have required permission, redirect to home
          return this.router.createUrlTree(['/']);
        }
      }

      return true;
    }

    // Not logged in, redirect to login with return url
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
