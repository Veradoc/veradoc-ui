// user.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

import { User } from '../models/User';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class UserService {
    private config = inject(RuntimeConfigService);
    
    //private readonly userBaseUrl = `${environment.apiUrl}/api/v1/users`;
    //private readonly authBaseUrl = `${environment.apiUrl}/api/v1/auth`;
    private readonly userBaseUrl = `${this.config.apiUrl}/api/v1/users`;
    private readonly authBaseUrl = `${this.config.apiUrl}/api/v1/auth`;

    private readonly STORAGE_KEY = 'veradoc_session';

    private http = inject(HttpClient);
    
    private getAuthHeaders() {
        const sessionData = localStorage.getItem(this.STORAGE_KEY);

        if (!sessionData) {
            return new HttpHeaders();
        }

        // Parse the JSON string into an object
        const session = JSON.parse(sessionData);
        const token = session.token; // Now we have the actual JWT string

        if (!token) {
            console.error('No token found in localStorage!');
        }

        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    
    getUserProfile(token: string): Observable<User> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        // This returns the user object of the person currently logged in        
        return this.http.get<User>(`${this.authBaseUrl}/me`, { headers });
    }
    
    getUsers(): Observable<User[]> {    
        const headers: any = this.getAuthHeaders();

        return this.http.get<User[]>(`${this.userBaseUrl}`, { headers });
    }

    registerUser(user: any): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return this.http.post(`${this.authBaseUrl}/register-admin`, user, { headers });
    }
    
    updateUser(user: any): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return this.http.patch(`${this.authBaseUrl}/${user.id}`, user, { headers });
    }

    deleteUser(id: string): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return this.http.delete(`${this.authBaseUrl}/${id}`, { headers });
    }    
}