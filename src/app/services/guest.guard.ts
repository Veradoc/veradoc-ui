import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const session = JSON.parse(localStorage.getItem('veradoc_session') || '{}');

  if (authService.isAuthenticated()) {
    router.navigate(['/conversation']);

    return false;
  }

  // Otherwise, allow them to see the login page
  return true;
};