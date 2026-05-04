import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * 1. Define an Enum for all possible message types.
 * This makes it easy to find and manage event names in one place.
 */
export enum BrokerMessageType {
  CHAT_FINALIZE = 'CHAT_FINALIZE',
  USER_LOGOUT = 'USER_LOGOUT',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum BrokerMessageCriticity {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warn',
  ERROR = 'danger',
  SECONDARY = 'secondary',
  CONTRAST = 'contrast',
}

/**
 * 2. Define an Interface for the message structure.
 */
export interface BrokerMessage {
  type: BrokerMessageType;
  value: any;
  criticity?: BrokerMessageCriticity;
}

@Injectable({
  providedIn: 'root'
})
export class BrokerService {
  // 1. Create a private Subject to hold the data
  private messageSource = new Subject<BrokerMessage>();
  
  // 2. Expose it as an Observable for components to listen to
  currentMessage = this.messageSource.asObservable();

  constructor() { }

  // 3. Method to update the data
  sendMessage(type: BrokerMessageType, value: any = true, criticity?: BrokerMessageCriticity) {
    this.messageSource.next({ type, value, criticity });
  }
}