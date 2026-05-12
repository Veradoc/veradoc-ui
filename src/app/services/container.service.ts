import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

// Define an interface to get nice autocompletion
@Injectable({
    providedIn: 'root'
})
export class ContainerService {
    private readonly STORAGE_KEY = 'veradoc_session';
    private readonly baseUrl = `${environment.apiUrl}/api/v1/containers`;

    constructor(private http: HttpClient) {}

    private getAuthHeaders() {
        const sessionData = localStorage.getItem(this.STORAGE_KEY);
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
            }
        }

        return headers;
    }
    
    /**
     * Get list of containers, optionally filtered by stack
     */
    getContainers(stackName?: string): Observable<{ containers: any[] }> {
        const headers: any = this.getAuthHeaders();
        let params = new HttpParams();
        
        if (stackName) {
            params = params.set('stack_name', stackName);
        }

        return this.http.get<{ containers: any[] }>(`${this.baseUrl}`, {
            headers: headers,
            params: params
        });
    }

    /**
     * Start a container
     */
    startContainer(containerId: string): Observable<any> {
        const headers: any = this.getAuthHeaders();
        
        return this.http.post(`${this.baseUrl}/${containerId}/start`, null, {
            headers: headers,
        });
    }

    /**
     * Stop a container
     */
    stopContainer(containerId: string): Observable<any> {
        const headers: any = this.getAuthHeaders();
        
        return this.http.post(`${this.baseUrl}/${containerId}/stop`, null, {
            headers: headers,
        });
    }
}