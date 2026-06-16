import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MenuModule } from 'primeng/menu';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../services/auth.service';
import { GreetingService } from '../../services/greeting.service';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-conversation',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ToggleSwitchModule,
    MenuModule,
    ChipModule,
    AutoCompleteModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent {
  authService = inject(AuthService);  
  router = inject(Router); 
  greeting = inject(GreetingService).getGreeting(this.authService.currentUser()?.name);
  fileService = inject(FileService);

  activeRAG: boolean = true;
  message = '';
  isMenuOpen = false;

  tags: string[] = [];
  suggestions: string[] = [];
  files: any[]= [];
  selectedFiles: any[] = [];
  showFilterTagsPanel: boolean= false;
  showTagsPanel: boolean= false;
  tagsSelected: string[] = [];

  menuFilterTagsItems = [
    {
      label: 'Filter by Tags',
      icon: 'pi pi-paperclip',
      command: () => {
        this.loadFiles();
      }
    },     
  ];

  private loadFiles() {
    this.fileService.getFiles('custom-corpus')
      .subscribe((response: any) => {
        this.files = response.files.map((f: any) => ({
          ...f,
          collection: f.full_path.split('/')[0],
          tags_str: f.tags.join(','),          
        }));

        // remove the owner_id tag to be selectable
        this.files.forEach((file) => {
          file.tags = file.tags.filter((tag: any) => tag !== 'owner_id');
        });
        
        this.showFilterTagsPanel = true;
    });
  }

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

  onSelectTags() {
    // close tags filter panel
    this.showFilterTagsPanel = false;

    if (this.selectedFiles.length > 0) {
      // get files tags selected
      this.tagsSelected = Array.from(
        new Set(this.selectedFiles.map(file => file.tags).flat())
      );

      // open tags selected panel
      this.showTagsPanel = true;      
    } else {
      this.onClearTags();
    }
  }

  onClearTags() {
    this.selectedFiles = [];
    this.tagsSelected = [];
    this.showTagsPanel = false;
  }

  onSendMessage(event: Event, element: HTMLElement) {
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
          tags: this.tagsSelected,
          activeRAG: this.activeRAG
        } 
      });     
    }
  }  

  sendChat(event: Event, element: HTMLElement) {  
    this.onSendMessage(event, element);
  }  
}
