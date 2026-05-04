import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

//import { VirtualScrollerModule } from 'primeng/virtualscroller';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ChatService } from '../../services/chat.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-search-dialog',
    templateUrl: './find-dialog.component.html',
    styleUrls: ['./find-dialog.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        TooltipModule,
        //VirtualScrollerModule,
    ]  
})
export class FindDialogComponent implements OnInit {  
  chatService = inject(ChatService);  

  ref = inject(DynamicDialogRef);
  allItems: any[] = [];
  filteredChats: any[] = [];
  searchQuery: string = '';

  private loadChats() { 
    this.chatService.getRecentChatsByUserPaginated(0, 10)
      .subscribe({
        next: (response: any[]) => {
          this.allItems = response.map(msg => {
            return {
              id: msg.id,
              sender: msg.role,
              icon:  msg.role === 'user' ? 'pi-comment' : 'pi-microchip-ai',              
              text: msg.content,
              date: new Date(msg.created_at), // Converting string to JS Date
            };
          });

          this.filteredChats = [...this.allItems];
        },
        error: (err) => {
          console.error('Error fetching messages', err);
        }
      });        
  }

  ngOnInit() {
     this.loadChats();
  }
  
  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredChats = [...this.allItems];
    } else {
      this.filteredChats = this.filteredChats
        .filter(item => 
          item.text.toLowerCase().includes(query)
        );
    }
  }
  
  onSelectItem(item: any) {
    this.ref.close(item);
  }

  onClose() {
    this.ref.close();
  }
}