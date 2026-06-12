import { Component, effect, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

import { fromEvent, merge, timer, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { WebSocketService } from './services/websocket.service';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from './services/broker.service';
import { EventLogService } from './services/event-log.service';

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
  private eventLog = inject(EventLogService);
  
  private readonly MAX_TIMEOUT: number = 30; // max minutes
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
      
      // Global Documentation events
      this.wsService.on('doc.ingested')
        .subscribe((msg: any) => {
          this.brokerService.sendMessage(
            BrokerMessageType.SYSTEM_ALERT,
            `${msg['filename']} — ${msg['chunks']} chunks indexados`,
            BrokerMessageCriticity.SUCCESS);
        }),

      this.wsService.on('doc.progress')
        .subscribe((msg: any) => {
          this.eventLog.info('Doc embedding', `Token: ${msg.text}`);
        }),

      this.wsService.on('doc.error')
        .subscribe((msg: any) => {
          this.brokerService.sendMessage(
            BrokerMessageType.SYSTEM_ALERT,
            msg,
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

    // 2. Set the limit in ms
    const IDLE_TIME = this.MAX_TIMEOUT * 60 * 1000;

    this.idleSubscription = activity$.pipe(
      // Every time an event happens, restart the timer
      switchMap(() => timer(IDLE_TIME)),
      tap(() => {
        console.log('User idle for too long. Logging out...');
        this.performAutoLogout();
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.idleSubscription?.unsubscribe();
    this.clearListeners();
  }
}
