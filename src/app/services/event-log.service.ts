import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface LogEntry {
    level: 'info' | 'success' | 'error' | 'warn';
    source: string;
    message: string;
    payload?: unknown;
    timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class EventLogService {
    private readonly MAX_ENTRIES = 200;
    private _logs$ = new Subject<LogEntry>();
    readonly logs$ = this._logs$.asObservable();

    info(source: string, message: string) { this.push({ level: 'info', source, message }); }
    success(source: string, message: string) { this.push({ level: 'success', source, message }); }
    error(source: string, message: string) { this.push({ level: 'error', source, message }); }
    warn(source: string, message: string) { this.push({ level: 'warn', source, message }); }
    
    push(entry: Omit<LogEntry, 'timestamp'>): void {
        this._logs$.next({ ...entry, timestamp: new Date() });
    }
}