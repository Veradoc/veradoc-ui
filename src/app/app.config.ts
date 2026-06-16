import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { SettingService } from './services/setting.service';

import { provideMarkdown } from 'ngx-markdown';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { firstValueFrom } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ 
      eventCoalescing: true 
    }),
    provideRouter(
      routes, 
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // 'zinc' or 'slate' provides that neutral, high-end AI look
          primary: {
            primitive: 'zinc' 
          },
          // This ensures the background stays light and doesn't flip to dark mode unexpectedly
          darkModeSelector: 'none' 
        }      
      }
    }),
    provideHttpClient(
      withInterceptorsFromDi() // Tells Angular to look for traditional DI interceptors
    ),    
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Essential: allows multiple interceptors to work in a chain
    }, 
    provideAppInitializer(() => {
      const settingsService = inject(SettingService);

      return firstValueFrom(settingsService.loadSettings());
    }),    
    provideMarkdown(),
  ]
};
