import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import { ApiResponse } from '../models/api-response.model';
import { CollectionStats } from '../models/collection-stats.model';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
    providedIn: 'root'
})
export class SettingService {
    private config = inject(RuntimeConfigService);
    
    private readonly STORAGE_KEY = 'veradoc_session';
    private readonly baseUrl = `${this.config.apiUrl}/api/v1/settings`;

    constructor(private http: HttpClient) { }

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

    getValueByKey(key: string): Observable<string> {
        const headers: any = this.getAuthHeaders();

        return this.http.get<string>(`${this.baseUrl}/${key}`, {
            headers: headers,
        });
    }

    saveKey(key: string, value: string): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return this.http.post<any>(`${this.baseUrl}/${key}`, { value: value }, {
            headers: headers
        });
    }    
}