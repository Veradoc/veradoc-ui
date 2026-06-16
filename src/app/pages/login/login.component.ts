import { Component, OnInit, NgZone, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { SettingService } from '../../services/setting.service';

// Declare 'google' as a global variable so TS doesn't complain
declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    InputTextModule,
    ButtonModule,
    PasswordModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [
    MessageService,
  ]  
})
export class LoginComponent implements OnInit {  
  readonly GOOGLE_ACTIVE_OAUTH = "GOOGLE_ACTIVE_OAUTH"
  readonly GOOGLE_CLIENT_ID = "GOOGLE_CLIENT_ID"
  readonly GOOGLE_CLIENT_SECRET = "GOOGLE_CLIENT_SECRET"

  googleActiveOAuth: boolean = false;
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  messageService = inject(MessageService); 
  router = inject(Router); 
  ngZone = inject(NgZone); 
  route = inject(ActivatedRoute);
  authService = inject(AuthService); 
  private settingService = inject(SettingService);

  email: string = '';
  password: string = '';
  loading: boolean = false;

  private async handleGoogleCredentialResponse(response: any) {
      const googleIdToken = response.credential;

      // 1. Send the Google token to YOUR backend
      const authResponse: any = await this.authService.tokenExchange(googleIdToken);

      if (authResponse.ok) {
          const data = await authResponse.json();
          
          // 2. Save the BACKEND'S token, which will have the HS256 algorithm
          this.authService.setUserDataFromToken(response.credential, data.token);

          this.ngZone.run(() => {
              this.router.navigate(['/conversation']);
          });
      } else {
          console.error("Backend refused the Google token");
      }
  }

  private initGoogle(): void {
    if (!this.clientId) {
      console.error('clientId is not set');
      return;
    }

    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: any) => this.handleGoogleCredentialResponse(response),
      context: 'signin',
      itp_support: true,
      use_fedcm_for_prompt: false,
      ux_mode: 'redirect',
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn')!,
      { theme: 'outline', size: 'large' }
    );    
  }

  constructor() {
    effect(() => {
      this.googleActiveOAuth = this.settingService.getSettingValue(this.GOOGLE_ACTIVE_OAUTH) === "true";

      if (this.googleActiveOAuth) {
        this.clientId = this.settingService.getSettingValue(this.GOOGLE_CLIENT_ID);
        this.clientSecret = this.settingService.getSettingValue(this.GOOGLE_CLIENT_SECRET);
      
        if (typeof google !== 'undefined') {
          // Script already loaded (Chrome cache hit)
          this.initGoogle();
        } else {
          // Safari / incognito: wait for script to finish loading
          const scriptEl = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
          if (scriptEl) {
            scriptEl.addEventListener('load', () => this.initGoogle());
          }
        }
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'session-expired') {
        this.messageService.add({
          severity: 'info',
          summary: 'Session Ended',
          detail: 'Logged out due to inactivity for your security.'
        });
      }
    });
  }

  onKeyDown(event: any) {
    if (event.code === 'Enter') {
      this.onLogin();
    }
  }

  onLoginWithGoogle() {
    // This opens the Google Select Account popup
    google.accounts.id.prompt(); 
    
    // Alternatively, if you want the specific "Sign in with Google" popup:
    // google.accounts.id.requestCode();    
  }

  onLogin() {
    if (this.email && this.password) {
      this.loading = true;

      this.authService.login(this.email, this.password).pipe(
        finalize(() => {
          this.loading = false;
      }))
      .subscribe({
        next: () => {
          console.log('Login successful!');
        },
        error: (err) => {
          console.error('Login failed', err);
          this.password = '';
        }        
      });
    }
  }
}