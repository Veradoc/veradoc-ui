import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { AuthService } from '../../services/auth.service';
import { GreetingService } from '../../services/greeting.service';

@Component({
  selector: 'app-conversation',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToggleSwitchModule,
    ChipModule,
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent {
  authService = inject(AuthService);  
  router = inject(Router); 
  greeting = inject(GreetingService).getGreeting(this.authService.currentUser()?.name);

  activeRAG: boolean = true;
  message = '';
  isMenuOpen = false;

  onAutoGrow(element: HTMLElement) {
    // 1. Temporarily shrink it to '0' so scrollHeight reflects only the text content
    element.style.height = '0px';
    
    // 2. Set it to the full height of the content
    // We use scrollHeight to get the exact pixel height of the text
    const newHeight = element.scrollHeight;
    element.style.height = newHeight + 'px';

    // 3. Optional: Handle the max-height scrollbar
    if (newHeight >= 200) {
      element.style.overflowY = 'auto';
    } else {
      element.style.overflowY = 'hidden';
    }
  }

  onHandleKeyDown(event: KeyboardEvent, element: HTMLElement) {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift + Enter: Let the default behavior happen (new line)
        return; 
      } else {
        // Enter only: Trigger your event and prevent a new line from being added
        event.preventDefault();
        this.onSendMessage(event, element);

        setTimeout(() => {
          this.onAutoGrow(element);
        }, 0);        
      }
    }
  }

  onSendMessage(event: Event, element: HTMLElement) {
    /*{
      "id": "9f92c1155cd8483ab0b13d8206cf1ec4",      
      "conversation_id": "4df664b9d7ec44b2a390781a68808e78",    
      "content": "Resume of paper",
      "role": "user",    
      "created_at": "2026-04-20T12:45:30.039327"
    }*/

    if (this.message != '' && this.message.trim()) {
      console.log('Sending to RAG:', this.message);

      const conversation = [
        {
          content: this.message,
          role: "user",
          created_at: new Date().toString()
        }
      ];

      this.router.navigate(['/chats'], { 
        state: {
          data: conversation,
          activeRAG: this.activeRAG // selected by user to start a conversation
        } 
      });     
    }
  }  

  onToggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  sendChat(event: Event, element: HTMLElement) {  
    this.onSendMessage(event, element);
  }  
}
