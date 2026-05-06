import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { filter, Subscription } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';

import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat-message.model';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';
import { AuthService } from '../../services/auth.service';
import { OllamaService } from '../../services/ollama.service';

@Component({
  selector: 'app-chats',
  imports: [
    CommonModule,
    FormsModule,
    ClipboardModule,
    ButtonModule,
    ToggleSwitchModule,
    MarkdownComponent
  ],
  providers: [
    MessageService,
  ],
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.scss'
})
export class ChatsComponent implements OnInit, OnDestroy {
  router = inject(Router); 
  chatService = inject(ChatService); 
  messageService = inject(MessageService);
  brokerService = inject(BrokerService);
  authService = inject(AuthService);
  ollamaService = inject(OllamaService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeRAG: boolean = true;
  messages: ChatMessage[] = [];
  contextData: any[] = []; // This replaces your gr.DataFrame
  currentQuestion: string = '';
  isThinking = false;
  messageThinking: string = "Let's see what you've got.";
  isNewConversartion: boolean = false;
  private isUserAtBottom = true;
  private conversationId: string = '';

  private abortController: AbortController | null = null;
  private navSubscription: Subscription;

  constructor() {
    this.navSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {      
      // 1. Get the navigation object inside the subscription
      const navigation = this.router.getCurrentNavigation();
      const messageReceived = navigation?.extras?.state?.['data'];
      this.activeRAG = navigation?.extras?.state?.['activeRAG'];

      if (messageReceived) {
        // get the firt chat and get the global conversation id if continue
        this.conversationId = messageReceived[0].conversation_id;

        // if the first chat not has any conversation id, it's a new one and send promt to LLM
        if(!messageReceived[0].id) {
          this.isNewConversartion = true;
          this.currentQuestion = messageReceived[0].content;

          //return;

          this.sendChat();
        } else {
          // if is a select conversation load all chats and not send promt to LLM
          this.messages = messageReceived;
        }
      }
    });
  }

  private loadModels() {  
    this.ollamaService.getOllamaPulled()
      .subscribe({
        next: (response: any[]) => {
          const allItems = response;
        },
        error: (err) => {
          console.error('Error fetching messages', err);
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });      
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  private getLastConversation() { 
    this.chatService.getLatestConversationMessages()
      .subscribe((data: any) => {
        this.messages = data.messages;
        this.activeRAG = true; // by default activate knowledge base
      });        
  }

  private lastChat() {
    // is exist any conversatio load the last one
    if (!this.isNewConversartion) {
      this.getLastConversation();
    }

    this.loadModels();
  }

  ngOnInit() {
    this.lastChat();
  }
  
  ngAfterViewChecked() {
    if (this.isUserAtBottom && this.isThinking) {
      this.scrollToBottom();
    }
  }

  // 1. Detect if the user is at the bottom BEFORE the view updates
  onScroll(): void {
    const element = this.scrollContainer.nativeElement;
    const threshold = 100; // pixels of tolerance

    // Logic: Is the user near the bottom?
    const position = element.scrollHeight - element.scrollTop - element.clientHeight;
    this.isUserAtBottom = position <= threshold;
  }

  autoGrow(element: HTMLElement) {
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
        this.sendChat();

        setTimeout(() => {
          this.autoGrow(element);
        }, 0);        
      }
    }
  }

  onCopySuccess() {
    this.messageService.add({ severity: 'success', summary: 'Clipboard', detail: 'Chat copied to clipboard' });    
  }

  onDownloadChat(chatText: string) {
    // 1. Create a Blob with the text content
    const blob = new Blob([chatText], { type: 'text/plain' });

    // 2. Create a hidden <a> element
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    // 3. Set the filename and URL
    anchor.download = 'chat-history.txt';
    anchor.href = url;

    // 4. Trigger the click and clean up
    anchor.click();
    window.URL.revokeObjectURL(url);
    anchor.remove();

    // Optional: Show your PrimeNG success toast
    this.messageService.add({
      severity: 'info',
      summary: 'Download',
      detail: 'Chat downlod succesfully'
    });
  }

  async sendChat() {    
    if (!this.currentQuestion.trim() && !this.isThinking) return;

    // If already thinking, the button acts as "STOP"
    if (this.isThinking) {
      this.stopGeneration();
      return;
    }

    // 1. Force the logic to know we want to follow the new message
    this.isUserAtBottom = true;

    const userQuestion = this.currentQuestion;
    
    this.messages.push({ 
      role: 'user',
      conversation_id: this.conversationId,
      content: userQuestion 
    });

    this.currentQuestion = '';

    // Preparar respuesta de la IA
    const aiMessage: ChatMessage = { role: 'assistant', content: '', actions: false };
    this.messages.push(aiMessage);
    this.isThinking = true;
    this.abortController = new AbortController(); // Initialize new controller

    // Force a scroll to bottom as soon as the user sends the message
    setTimeout(() => this.scrollToBottom(), 0);

    try {
      await this.chatService.streamChat(
        this.conversationId,
        userQuestion,
        this.messages,
        this.activeRAG,
        (chunk) => {
          if (chunk.type === 'text') {
            aiMessage.content += chunk.content;

            this.messageThinking = '';
            this.conversationId = chunk.conversation_id;          
          }

          if (chunk.type === 'context') {
            // Aquí podrías guardar el context_df si lo necesitas mostrar en otro lado
            console.log('Fin conversation?')
          }        
        },
        this.abortController.signal // Pass the signal
      );
      
      aiMessage.actions = true; // Mostrar botones de feedback al finalizar
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        aiMessage.content = "Error al conectar con el servidor.";
      }
    } finally {
      this.isThinking = false;

      this.brokerService.sendMessage(BrokerMessageType.CHAT_FINALIZE, true);
    }
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.isThinking = false;
    }
  }

  onAttacheFile(event: Event) {
    console.log('File attached to RAG:');
  }

  ngOnDestroy() {
    // This triggers when the user leaves the view
    if (this.navSubscription) {
      this.navSubscription.unsubscribe();
    }
  }  
}
