import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';

import { environment } from '../../environments/environment';
import { RuntimeConfigService } from './runtime-config.service';

export interface WsEvent {
    event: string;
    doc_id?: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
    private config = inject(RuntimeConfigService);
    
    //private readonly wsUrl = `${environment.apiUrl}/api/v1/ws`;
    private readonly wsUrl = `${this.config.wsUrl}/api/v1/ws`;
    
    private ws!: WebSocket;
    private messages$ = new Subject<WsEvent>();
    private wsConnected = false;
    private currentUserId: string | null = null;
    private reconnectDelay = 2000;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    
    private startPing(): void {
        this.stopPing(); // garantiza que no haya uno previo activo

        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, 30_000);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);

            this.pingInterval = null;
        }
    }
    
    isConnected(): boolean {
        return this.wsConnected;
    }

    connect(userId: string): void {
        const url = `${this.wsUrl}/${userId}`;
        
        this.ws = new WebSocket(url);
        this.wsConnected = true;
        this.currentUserId = userId;

        this.ws.onopen = () => {
            console.log('WS conectado');

            this.startPing(); // ← solo arranca cuando la conexión está abierta
        };

        this.ws.onmessage = (e) => {
            if (e.data === 'pong') return;
            try {
                this.messages$.next(JSON.parse(e.data));
            } catch {
                console.warn('WS message no es JSON válido:', e.data);
            }
        };

        this.ws.onclose = () => {
            console.warn('WS desconectado');
            this.stopPing(); // ← limpia el interval antes de reconectar

            if (this.wsConnected) {
                setTimeout(() => this.connect(this.currentUserId!), this.reconnectDelay);
            }
        };

        this.ws.onerror = (e) => console.error('WS error', e);
    }

    on(eventType: string): Observable<WsEvent> {
        return this.messages$.pipe(
            filter(msg => msg.event === eventType)
        );
    }
    
    disconnect(): void {
        this.wsConnected = false;
        this.currentUserId = null;
        this.stopPing();

        if (this.ws) {
            this.ws.close();
            this.ws = null!;
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}