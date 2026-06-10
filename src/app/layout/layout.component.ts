import { Component, signal, inject, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';

import { filter, Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { DrawerModule } from 'primeng/drawer';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { AuthService } from '../services/auth.service';
import { FindDialogComponent } from '../pages/find-dialog/find-dialog.component';
import { ModelsRunningComponent } from '../pages/models-running/models-running.component';
import { ChatService } from '../services/chat.service';
import { OllamaService } from '../services/ollama.service';
import { BrokerMessage, BrokerMessageType, BrokerService } from '../services/broker.service';

import { TerminalLogComponent } from '../components/terminal-log/terminal-log-component';
import { EventLogService, LogEntry } from '../services/event-log.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    FormsModule,
    ButtonModule,
    TextareaModule,
    TooltipModule,
    TagModule,
    ToastModule,
    TieredMenuModule,
    DrawerModule,
    TerminalLogComponent
  ],
  providers: [
    MessageService,
    DialogService
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  @ViewChild('terminalModel') termLog!: TerminalLogComponent;
  
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);  
  private chatService = inject(ChatService);
  private ollamaService = inject(OllamaService);
  private brokerService = inject(BrokerService);
  private eventLog = inject(EventLogService);
  authService = inject(AuthService);

  refSearchChats: DynamicDialogRef | null | undefined;
  refRunningDialog: DynamicDialogRef | null | undefined;

  isExpanded = signal(true);  
  isRecientesOpen = true;
  activeRoute = '';
  message = '';
  name = '';
  showTerminal: boolean = false;

  private sub!: Subscription;
  
  readonly headerTitles = [
    { path: '/conversation', title: 'New conversation', subtitle: 'Fresh Start, New Ideas.' },
    { path: '/chats', title: 'Chats', subtitle: 'Quick Connections, Instant Results.' },
    { path: '/collections', title: ' Collections', subtitle: 'Manage your private document knowledge bases.' },
    { path: '/files', rootPath: '/collections', title: 'Files', subtitle: 'Manage, Store, and Sync.' },    
    { path: '/users', title: 'Users', subtitle: 'Manage team members and their system permissions.' },
    { path: '/models', title: 'Models', subtitle: 'Manage your reasoning models.' },
    { path: '/containers', title: 'Containers', subtitle: 'Manage your system.' },
  ];
  selecteHeaderTitle: any;

  // Optional: Listen for Ctrl+K or Cmd+K to open search globally
  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  handleKeyboardEvent(event: Event) {
    event.preventDefault();
    this.openSearch();
  }

  recentConversations: any[] = [];
  recentChats: any[] = [];
  logs: any[] = [];
  runningModel: string = '';
  brokerSubscription: Subscription = new Subscription();

  // Define profile menu items
  profileMenuItems: MenuItem[] = [
    { 
      label: 'Settings',
      icon: 'pi pi-cog',
      shortcut: '⌘,',
      command: () => { this.openSettings() },
    },
    /*{ 
      label: 'Language',
      icon: 'pi pi-globe',
          items: [
            { 
              label: 'English (United States)',
              command: () => this.changeLanguage('en-US') 
            },
            { 
              label: 'Spanis (Spain)', 
              command: () => this.changeLanguage('es-ES') 
            },
          ]     
    },*/
    { 
      label: 'Get help',
      icon: 'pi pi-question-circle',
      command: () => {
        window.open('https://veradoc.ai/help.html', '_blank');
    }       

    },
    { separator: true },
    /*{
      label: 'Mejorar plan',
      icon: 'pi pi-arrow-circle-up'
    },*/
    { 
      label: 'Log out', 
      icon: 'pi pi-sign-out',
      command: () => { this.logout(); } // This triggers when clicked
    }
  ];
  
  private openSettings() {
    this.router.navigate(['/settings']); 
  }

  private changeLanguage(lang: string) {
    console.log('Language changed to:', lang);
  }

  private logout() {
    this.authService.logout();
  }  

  private getRecentConversations() {
    this.chatService.getRecentConversations()
      .subscribe((data) => {
        this.recentConversations = data;
      });
  }

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = event.urlAfterRedirects;

      this.selecteHeaderTitle = this.headerTitles.find(headerTitle => this.activeRoute.includes(headerTitle.path));
    });

    this.getRecentConversations();
  }

  ngOnInit() {
    this.name = this.authService.currentUser()?.name ?? '';

    this.brokerSubscription = this.brokerService
      .currentMessage.subscribe((msg: BrokerMessage) => {
        if (msg.type == BrokerMessageType.CHAT_FINALIZE) {
          this.getRecentConversations();
        } else if(msg.type == BrokerMessageType.SYSTEM_ALERT) {
          this.messageService.add({ 
            severity: msg.criticity, 
            summary: msg.criticity?.charAt(0).toUpperCase() + msg.criticity!.slice(1), 
            detail: msg.value
          });
        }
      });
    
    // subscribe to any vent log to be showed
    this.sub = this.eventLog.logs$
      .subscribe((log: LogEntry) => {
        if (!log) {
          return;
        }

        // show the log terminal. The user must close manually
        this.showTerminal = true;

        // add event message to log terminal.
        const msg = `[${log.source}] ${log.message}`;

        switch (log.level) {
          case 'info': this.termLog.info(msg); break;
          case 'success': this.termLog.success(msg); break;
          case 'error': this.termLog.error(msg); break;
          case 'warn': this.termLog.warn(msg); break;
        }
      });   
  }
    
  onToggleSidebar() {
    this.isExpanded.update(value => !value);
  }

  onReturnTo() {
    this.router.navigate([this.selecteHeaderTitle.rootPath]);
  }

  onNavigateTo(path: string) {
    this.router.navigate([path]);
  }

  openSearch() {
    // Prevent opening multiple dialogs
    if (this.refSearchChats) return;

    this.refSearchChats = this.dialogService.open(FindDialogComponent, {
      width: '600px',
      showHeader: false,
      contentStyle: { "padding": "0", "border-radius": "12px" },
      styleClass: 'spotlight-dialog',
      closable: true,
      dismissableMask: true
    });

    this.refSearchChats?.onClose.subscribe((selectedChat) => {
      this.refSearchChats = undefined; // Reset ref
      if (selectedChat) {
        this.router.navigate(['/chats'], {
          state: {
            id: selectedChat.id
          }
        });
      }
    });
  }    
  
  onSelectChat(chatId: any) {
    this.chatService.getRecentChatsByConversationId(chatId)
      .subscribe((data) => {
        this.recentChats = data;

        this.router.navigate(['/chats'], { 
          state: { 
            data: this.recentChats,
            activeRAG: true // by default activate knowledge base
          },
          onSameUrlNavigation: 'reload' 
        });        
      });
  }

  onOpenRunningModels() {
    // Prevent opening multiple dialogs
    if (this.refRunningDialog) return;

    this.refRunningDialog = this.dialogService.open(ModelsRunningComponent, {
      position: 'top',
      width: '1000px',
      showHeader: false,
      contentStyle: { "overflow": "auto", "padding": "0", "border-radius": "12px" },
      style: { 'margin-top': '60px' },
    });

    this.refRunningDialog?.onClose.subscribe((selectedModel) => {
      this.refRunningDialog = undefined;

      if (selectedModel) {
        console.log(selectedModel);
      }
    });    
  }

  onEjectRunningModels() {    
    console.log("Eject Running model");
  
    // mock model
    this.runningModel = "phi3:3.8b-mini-128k-instruct-q8_0";

    this.logs = [];
    this.ollamaService.processOllamaModelStream(this.runningModel, 'stop')
      .subscribe({
        next: (chunk) => {
          // Append the new log chunk
          this.logs.push(chunk);

          console.log(chunk);
        },
        error: (err) => {
          this.logs.push(`\n[ERROR]: ${err}`);
        },
        complete: () => {
          this.logs.push("\n--- Deployment Finished ---");            
        }
      });
  }

  onCloseTerminal() {
    this.showTerminal = false;
  }

  onHelp() {
    window.open('https://veradoc.ai/help.html', '_blank');
  } 
  
  onGoHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }  
}