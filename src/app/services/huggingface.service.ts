import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HuggingfaceService {
    private readonly STORAGE_KEY = 'veradoc_session';
    private readonly baseUrl = `${environment.apiUrl}/api/v1/huggingface`;

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
  
    getModels(page: number, page_size?: number, sort?: string, filter?: string, search?: string):  Observable<any[]> {
        const headers: any = this.getAuthHeaders();
        let params = new HttpParams()
            .set('page', page);

        if (page_size) {
            params = params.set('page_size', page_size);
        }

        if (sort) {
            params = params.set('sort', sort);
        }
         
        if (filter) {
            params = params.set('filter', filter);
        }

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<any[]>(`${this.baseUrl}`, {
            headers: headers,
            params: params
        });
    }   
}