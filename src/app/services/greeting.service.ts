// greeting.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GreetingService {
  getGreeting(name?: string): string {
    const hour = new Date().getHours();
    let greeting: string;

    if (hour >= 6 && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
    else if (hour >= 18 && hour < 22) greeting = 'Good evening';
    else greeting = 'Good night';

    return name ? `${greeting}, ${name}` : `${greeting}`;
  }
}