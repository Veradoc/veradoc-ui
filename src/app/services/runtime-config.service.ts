import { Injectable } from '@angular/core';

declare const __env: { apiUrl: string; wsUrl: string };

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
    readonly apiUrl = window.__env?.apiUrl ?? 'http://localhost:8808';
    readonly wsUrl = window.__env?.wsUrl ?? 'ws://localhost:8808';

    constructor() {
        console.log(this.apiUrl);
    }
}