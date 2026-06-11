import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class OllamaService {
    private config = inject(RuntimeConfigService);
    
    private readonly STORAGE_KEY = 'veradoc_session';
    //private readonly baseUrl = `${environment.apiUrl}/api/v1/models`;
    private readonly baseUrl = `${this.config.apiUrl}/api/v1/models`;    

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

    getOllamaPulled(search?: string): Observable<any[]> {
        const headers: any = this.getAuthHeaders();
        const params = new HttpParams();

        if(search) {
            params.set('search', search);
        }

        return this.http.get<any[]>(`${this.baseUrl}/ollama`, {
            headers: headers,
            params: params
        });
    }
    
    pullModelStream(model: any): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return new Observable(observer => {
            // Use fetch because HttpClient doesn't support streaming POST bodies easily
            fetch(`${this.baseUrl}/ollama/pull/${model.id}/${model.pipelineTag}`, {
                method: 'POST',
                headers: headers
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    observer.error('Readable stream not supported or body is null');
                    return;
                }

                // Recursive function to read chunks
                const readChunks = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                observer.complete();
                                break;
                            }

                            // Convert Uint8Array to string and emit
                            const chunk = decoder.decode(value, { stream: true });
                            observer.next(chunk);
                        }
                    } catch (err) {
                        observer.error(err);
                    }
                };

                readChunks();
            }).catch(err => {
                observer.error(err);
            });
        });
    }

    /**
     * Deletes a model from the Ollama local storage
     * @param modelName The full name of the model (e.g., 'llama3:latest')
     */
    deleteModel(modelName: string): Observable<any> {
        const headers: any = this.getAuthHeaders();

        return this.http.delete<any>(`${this.baseUrl}/ollama/delete/${modelName}`, {
            headers: headers,
        });
    }

    /**
     * Universal stream handler for Starting or Stopping models
     * @param modelName Name of the model
     * @param action 'start' or 'stop'
     */
    processOllamaModelStream(modelName: string, action: 'start' | 'stop'): Observable<string> {
        const headers: any = this.getAuthHeaders();

        return new Observable(observer => {
            // We use fetch because HttpClient doesn't support readable streams easily
            fetch(`${this.baseUrl}/ollama/${action}/${modelName}`, {
                method: 'POST',
                headers: headers
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    observer.error('Readable stream not supported or body is null');
                    return;
                }

                const readChunks = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                observer.complete();
                                break;
                            }

                            // Convert Uint8Array to string and emit
                            const chunk = decoder.decode(value, { stream: true });
                            observer.next(chunk);
                        }
                    } catch (err) {
                        observer.error(err);
                    }
                };

                readChunks();
            })
            .catch(err => {
                observer.error(err);
            });
        });
    }    
}