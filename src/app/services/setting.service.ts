import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';

export interface SettingValueResponse {
    key: string;
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class SettingService {
    private config = inject(RuntimeConfigService);
    
    private readonly STORAGE_KEY = 'veradoc_session';
    private readonly baseUrl = `${this.config.apiUrl}/api/v1/settings`;

    private settingsSignal = signal<SettingValueResponse[]>([]);
    public readonly settings = this.settingsSignal.asReadonly();
    
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

    /**
    * Helper method to easily find a specific setting by its key anywhere in the app
    */
    getSettingValue(key: string): string | undefined {
        return this.settings().find(s => s.key === key)?.value;
    }

    /**
    * Fetches settings from backend and caches them in the singleton state
    */
    loadSettings(): Observable<SettingValueResponse[]> {        
        return this.http.get<SettingValueResponse[]>(`${this.baseUrl}`).pipe(
            tap(data => {
                this.settingsSignal.set(data);
            })
        );
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