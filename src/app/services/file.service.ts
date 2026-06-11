import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import { CollectionStats } from '../models/collection-stats.model';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private config = inject(RuntimeConfigService);
  
  private readonly STORAGE_KEY = 'veradoc_session';
  private readonly baseUrl = `${this.config.apiUrl}/api/v1/files`;

  constructor(private http: HttpClient) {}

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

  getFiles(bucketName: string, path?: string): Observable<CollectionStats[]> {
    const headers: any = this.getAuthHeaders();
    let params = new HttpParams().set('bucket_name', bucketName);

    if (path) {
      params = params.set('path', path);
    }

    return this.http.get<CollectionStats[]>(`${this.baseUrl}`, {
      headers: headers,
      params: params
    });
  }

  downloadFile(bucketName: string, path: string) {
    const headers: any = this.getAuthHeaders();
    const params = new HttpParams()
      .set('bucket_name', bucketName)
      .set('object_key', path);
    
    return this.http.get(`${this.baseUrl}/download`, {
      headers: headers,
      params: params,
      responseType: 'blob'
    });
  }

  uploadFiles(bucketName: string, path: string, files: File[] | FileList, tags?: any): Observable<ApiResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('bucket_name', bucketName)
      .set('path', path)
      .set('tags', tags);    
    
    const formData = new FormData();

    // Convert FileList to Array and append each file
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      // Crucial: The key 'files' must match the argument name in your FastAPI backend
      formData.append('files', file, file.name);
    });

    return this.http.post<ApiResponse>(`${this.baseUrl}/upload`, formData, {
      headers: headers,
      params: params
    });
  }

  deleteFile(bucketName: string, objectKey: string): Observable<ApiResponse> {
    const headers: any = this.getAuthHeaders()    
    const params = new HttpParams()
      .set('bucket_name', bucketName)
      .set('object_key', objectKey);
    
    return this.http.delete<ApiResponse>(`${this.baseUrl}`, {
      headers: headers,
      params: params
    });
  }
}