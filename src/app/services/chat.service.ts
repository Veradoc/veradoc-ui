import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
    private config = inject(RuntimeConfigService);

    private readonly STORAGE_KEY = 'veradoc_session';
    private readonly baseUrl = `${this.config.apiUrl}/api/v1/chats`;

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

    getRecentConversations(limit: number = 10): Observable<any[]> {
        const headers: any = this.getAuthHeaders()
        const params = new HttpParams()
            .set('limit', limit.toString());
        
        return this.http.get<any[]>(`${this.baseUrl}/history/conversations/recents`, {
            headers: headers,
            params: params
        });
    } 
    
    getRecentChatsByUserPaginated(offset: number, limit: number, content?: string): Observable<any[]> {
        const headers: any = this.getAuthHeaders()
        const params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());
        
        if (content) {
            params.set('search', content);
        }

        return this.http.get<any[]>(`${this.baseUrl}/history/chats/recents`, {
            headers: headers,
            params: params
        });
    } 
    
    getRecentConversationsCount(): Observable<number> {
        const headers: any = this.getAuthHeaders()

        return this.http.get<number>(`${this.baseUrl}/history/conversations/count`, { headers });
    }
    
    getRecentChatsByConversationId(conversationId: string): Observable<any[]> {
        const headers: any = this.getAuthHeaders()

        return this.http.get<any[]>(`${this.baseUrl}/history/conversations/${conversationId}`, { headers });
    } 

    getLatestConversationMessages(): Observable<any[]> {
        const headers: any = this.getAuthHeaders()

        return this.http.get<any[]>(`${this.baseUrl}/history/conversations/latest/messages`, { headers });
    } 
    
    async streamChat(conversationId: string, question: string, tags: string, history: any[], activeRAG: boolean, onChunk: (data: any) => void, signal?: AbortSignal) {
        const headers: any = this.getAuthHeaders();
        const response = await fetch(`${this.baseUrl}/promt`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ conversationId, question, history, activeRAG, tags }),
            signal: signal, // Pass the signal here!
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const json = JSON.parse(line.replace('data: ', ''));
                    onChunk(json); // This sends the piece of text or the context table to the component
                }
            }
        }
    }   
}