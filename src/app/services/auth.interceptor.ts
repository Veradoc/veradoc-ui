import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router, private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    this.authService.logout();
                    // Optional: stop the error from bubbling up if you've already handled it
                    // return EMPTY; 
                }
                // Modern RxJS (v7+) requires the factory function: () => error
                return throwError(() => error);
            })
        );
    }
}