import { Component, effect, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

import { fromEvent, merge, timer, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from './services/broker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private wsService = inject(WebSocketService);
  private brokerService = inject(BrokerService);
  private router = inject(Router);
  private idleSubscription?: Subscription;
  private wsSubscriptions: Subscription[] = [];

  private registerGlobalListeners(): void {
    this.clearListeners();
    
    // Notificaciones test event
    this.wsSubscriptions.push(
      this.wsService.on('ws.test')
        .subscribe(msg => {
          this.brokerService.sendMessage(
            BrokerMessageType.SYSTEM_ALERT,
            `Test message: ${msg['text']}`,
            BrokerMessageCriticity.SUCCESS);
        }),
      
      // Notificaciones globales de ingesta
      this.wsService.on('doc.ingested')
        .subscribe(msg => {
          this.brokerService.sendMessage(
            BrokerMessageType.SYSTEM_ALERT,
            `${msg['filename']} — ${msg['chunks']} chunks indexados`,
            BrokerMessageCriticity.SUCCESS);
          
            //this.documentStore.reload(); // actualiza la lista global
        }),

      this.wsService.on('doc.progress')
        .subscribe(msg => {
          //this.documentStore.updateProgress(msg['doc_id'] as string, msg['pct'] as number);
        }),

      this.wsService.on('doc.error')
        .subscribe(msg => {
          this.brokerService.sendMessage(
            BrokerMessageType.SYSTEM_ALERT,
            'Error de ingesta',
            BrokerMessageCriticity.ERROR);
        }),
    )
  }

  private clearListeners(): void {
    this.wsSubscriptions.forEach(s => s.unsubscribe());
    this.wsSubscriptions = [];
  }
  
  private connectWebsocket() {
    effect(() => {
      const user = this.authService.currentUser();

      if (user && !this.wsService.isConnected()) {
        this.wsService.connect(user.id);
        this.registerGlobalListeners();
      }

      if (!user) {
        this.wsService.disconnect();
        this.clearListeners();
      }
    });
  }
  
  private performAutoLogout() {
    // Only logout if the session has some issue: 
    // - Not exist session-
    // - Not exist token inside session
    // - The token inside is expired
    if (!this.authService.isSessionOk()) {
      this.authService.logout();
      this.router.navigate(['/login'], {
        queryParams: { reason: 'session-expired' }
      });
    }
  }
  
  constructor() {
    this.connectWebsocket();
  }

  ngOnInit() {
    this.setupIdleTimeout();    
  }
  
  setupIdleTimeout() {
    // 1. List the events that count as "activity"
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'scroll')
    );

    // 2. Set the limit (e.g., 30 minutes = 1,800,000 ms)
    const IDLE_TIME = 30 * 60 * 1000;

    this.idleSubscription = activity$.pipe(
      // Every time an event happens, restart the timer
      switchMap(() => timer(IDLE_TIME)),
      tap(() => {
        console.log('User idle for too long. Logging out...');
        this.performAutoLogout();
      })
    ).subscribe();
  }

  // Cleanup to prevent memory leaks
  ngOnDestroy() {
    this.idleSubscription?.unsubscribe();
    this.clearListeners();
  }
}
