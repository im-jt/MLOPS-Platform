import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard factory to protect routes based on permissions
 */
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    // User doesn't have required permission
    router.navigate(['/unauthorized']);
    return false;
  };
};
