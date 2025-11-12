import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Guard to protect child routes that require authentication
 */
export const authGuardChild: CanActivateChildFn = (route, state) => {
  return authGuard(route, state);
};
