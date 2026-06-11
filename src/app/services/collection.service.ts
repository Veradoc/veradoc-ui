import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import { CollectionStats } from '../models/collection-stats.model';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private config = inject(RuntimeConfigService);
  
  private readonly STORAGE_KEY = 'veradoc_session';
  private readonly baseUrl = `${this.config.apiUrl}/api/v1/collections`;

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

  getCollections(bucketName: string): Observable<CollectionStats[]> {
    const headers: any = this.getAuthHeaders();
    const params = new HttpParams()
      .set('bucket_name', bucketName);   

    return this.http.get<CollectionStats[]>(`${this.baseUrl}`, {
      headers: headers,
      params: params
    });
  }

  createCollection(bucketName: string, pathToCreate: string): Observable<ApiResponse> {
    const headers: any = this.getAuthHeaders();
    const params = new HttpParams()
      .set('bucket_name', bucketName)
      .set('path', pathToCreate);

    return this.http.post<ApiResponse>(`${this.baseUrl}`, null, {
      headers: headers,
      params: params
    });
  }

  deleteCollection(bucketName: string, pathToDelete: string): Observable<ApiResponse> {
    const headers: any = this.getAuthHeaders()
    const params = new HttpParams()
      .set('bucket_name', bucketName)
      .set('path', pathToDelete);

    return this.http.delete<ApiResponse>(`${this.baseUrl}`, {
      headers: headers,
      params: params
    });
  }
}