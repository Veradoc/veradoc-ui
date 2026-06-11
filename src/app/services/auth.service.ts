import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { finalize, tap } from 'rxjs';

import { environment } from '../../environments/environment';

import { UserService } from './user.service';
import { User } from '../models/User';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private router = inject(Router);
  private config = inject(RuntimeConfigService);
  
  //private readonly baseUrl = `${environment.apiUrl}/api/v1/auth`;
  private readonly baseUrl = `${this.config.apiUrl}/api/v1/auth`;
  private readonly STORAGE_KEY = 'veradoc_session';
  
  // 1. The Private Signal (holds the actual data)
  private currentUserSignal = signal<User | null>(this.getSessionFromStorage());

  // 2. The Public Read-Only Signal (components use this to listen)
  readonly currentUser = this.currentUserSignal.asReadonly();

  // 3. Helper to check if logged in
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  private getSessionFromStorage(): User | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }
  
  /**
   * Retrieves the JWT string from the current session
   */
  getToken(): string | null {
    // 1. Try to get it from the Signal first (fastest)
    const user = this.currentUserSignal();
    if (user && user.token) {
      return user.token;
    }

    // 2. Fallback: Check localStorage in case the app was refreshed
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      try {
        const parsedUser = JSON.parse(storedData) as User;
        return parsedUser.token || null;
      } catch (e) {
        console.error('Error parsing stored user token', e);
        return null;
      }
    }

    return null;
  }
  
  /**
   * Helper to clean up Signals and LocalStorage
   */
  private clearLocalSession() {
    // 2. Remove the user data
    localStorage.removeItem('veradoc_session');

    // 3. (Optional) If you use an internal Signal or Subject for the user state,
    // set it to null here so the UI updates immediately.
    this.currentUserSignal.set(null);

    // 4. Redirect to login
    this.router.navigate(['/login']);
  }
  
  isSessionOk(): boolean {
    const sessionData = localStorage.getItem(this.STORAGE_KEY);

    // 1. Basic check: Does the session exist?
    if (!sessionData) return false;    

    try {
      const session = JSON.parse(sessionData);
      const token = session.token;

      // 2. Basic check: Does the token exist?
      if (!token) return false;

      // 3. Advanced check: Is the JWT expired?
      // We decode the payload (middle part of the JWT) to check 'exp'
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = Math.floor(new Date().getTime() / 1000);

      return now < expiry; // Returns true if current time is before expiry
    } catch (e) {
      return false; // If JSON parsing or decoding fails, they aren't logged in
    }
  }
  
  setUserDataFromToken(idToken: string, token: string) {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      const user: User = {
        id: '',
        email: payload.email,
        password: '',
        name: payload.name,
        token: token,
        picture: payload.picture,
        is_active: true,
        is_verified: true,
        is_superuser: false,         
        sub: payload.sub
      };

      // Update the signal and storage
      this.currentUserSignal.set(user);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to decode Google Token", e);
    }
  }

  /**
  * FastAPI Users Login uses OAuth2 Form Data (not JSON)
  */
  login(email: string, password: string) {
    const body = new HttpParams()
      .set('username', email) // FastAPI expects 'username' even if it's an email
      .set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<{ access_token: string; token_type: string }>(
      `${this.baseUrl}/jwt/login`,
      body,
      { headers }
    ).pipe(
      tap((session: any) => {        
        this.userService.getUserProfile(session.access_token).subscribe((user: any) => {
          const userSession: User = {
            id: user.id,
            email: user.email,
            password: '',
            token: session.access_token,
            name: user.name,
            picture: 'assets/default-avatar.png',
            is_active: user.is_active,
            is_verified: user.is_verified,
            is_superuser: user.is_superuser,            
            sub: 'manual'
          };

          if (user.is_active == false) {
            console.log('The user is not active');

            return;
          }

          /*if (user.is_verified == false) {
            console.log('The user is not verfied');

            return;
          }*/
          
          this.currentUserSignal.set(userSession);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userSession));
          
          this.router.navigate(['/conversation']);
        });
      })
    );
  }
  
  logout() {
    const token = this.getToken();

    if (!token) {
      this.clearLocalSession();
      return;
    }

    // Define headers with the token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Pass headers in the options object
    this.http.post(`${this.baseUrl}/jwt/logout`, {}, { headers }).pipe(
      finalize(() => {
        this.clearLocalSession();
      })
    ).subscribe({
      next: () => console.log('Backend session closed.'),
      error: (err) => {
        // If 401 occurs here, it means the token was already expired
        // but finalize() will still clear your local session, which is good.
        console.warn('Backend logout failed or token already invalid', err);
      }
    });
  }

  async tokenExchange(googleIdToken: any) {
    return await fetch(`${this.baseUrl}/google/token-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: googleIdToken })
      });
  }
}