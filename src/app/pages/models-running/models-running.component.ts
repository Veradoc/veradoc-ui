import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { OllamaService } from '../../services/ollama.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';
import { EventLogService } from '../../services/event-log.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    InputIconModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService
  ],  
  templateUrl: './models-running.component.html',
  styleUrl: './models-running.component.scss',    
})
export class ModelsRunningComponent implements OnInit {
  private confirmationService = inject(ConfirmationService);
  private ollamaService = inject(OllamaService);
  private brokerService = inject(BrokerService);
  private eventLog = inject(EventLogService);
    
  ref = inject(DynamicDialogRef);
  allItems: any[] = [];
  filteredModels: any[] = [];
  searchQuery: string = '';
  logs: any[] = [];  

  private loadModels() {  
    this.ollamaService.getOllamaPulled(this.searchQuery)
      .subscribe({
        next: (response: any[]) => {
          this.allItems = response

          this.filteredModels = [...this.allItems];
        },
        error: (err) => {
          console.error('Error fetching messages', err);
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });      
  }

  private async executeActionModel(model: any, action: any) {
    this.logs = [];

    // Visual feedback: show it's working
    this.logs.push(`\nRequesting ${action} for ${model.name}...`);
    this.eventLog.info('Manage Model', `> Initiating ${action} for ${model.name}...`);

    await new Promise<void>((resolve, reject) => {
      this.ollamaService.processOllamaModelStream(model.name, action).subscribe({
        next: (chunk) => {
          this.logs.push(chunk);
          this.eventLog.info('Manage Model', chunk);
        },
        error: (err) => {
          this.logs.push(`\nError: ${err}`);

          this.eventLog.error('Manage Model', `[ERROR]: ${err}`);          
          this.eventLog.error('Manage Model', `[ERROR]: Failed to delete model. ${err.error?.detail || err.message}`);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);

          reject(err);
        },
        complete: () => { 
          resolve();
        }
      }); 
    });

    // This code runs ONLY after the stream is finished (Complete)
    await new Promise(f => setTimeout(f, 500)); // Clean async delay
    
    this.logs.push("\n--- Action Finished ---");
    this.eventLog.info('Manage Model', `--- ${model.name} ${action}ed successfully ---`);
    this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, `Model ${action}ed`, BrokerMessageCriticity.SUCCESS);

    await this.loadModels(); // Assuming loadModels is also async*/    
  }

  ngOnInit() {
    this.loadModels();    
  }

  onFilterModels() {
    const query = this.searchQuery.toLowerCase().trim();
    
    if (!query) {
      this.filteredModels = [...this.allItems];
    } else {
      this.filteredModels = this.filteredModels
        .filter(item => 
          item.name.toLowerCase().includes(query)
        );
    }    
  }

  onToggleModel(model: any) {
    const action: string = model.running ? 'stop' : 'start';

    this.confirmationService.confirm({
      message: `Are you sure you want to ${action} <b>${model.name}</b>?. This action will stop the previous model.`,
      header: 'Confirm Action',
      icon: 'pi pi-trash',
      acceptLabel: action[0]?.toUpperCase() + action.slice(1),
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-text',
      rejectButtonStyleClass: 'p-button-danger p-button-text',
      accept: async () => {
        await this.executeActionModel(model, action);
        
        console.log('END');
      }
    });    
  }  

  onConfirmDelete(model: any) {
    this.confirmationService.confirm({
        message: `Are you sure you want to delete <b>${model.name}</b>? This action cannot be undone.`,
        header: 'Confirm Deletion',
        icon: 'pi pi-trash',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        acceptButtonStyleClass: 'p-button-text',
        rejectButtonStyleClass: 'p-button-danger p-button-text',
        accept: () => {
          // 1. Show terminal to give feedback
          this.eventLog.info('Manage Model', `> Attempting to delete ${model.name}...`);

          // 2. Call the service
          this.ollamaService.deleteModel(model.name).subscribe({
            next: (res) => {
              this.eventLog.info('Manage Model', `[SUCCESS]: ${res.message}`);
              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Model deleted' , BrokerMessageCriticity.SUCCESS);

              this.loadModels();
            },
            error: (err) => {
              this.eventLog.error('Manage Model', `[ERROR]: Failed to delete model. ${err.error?.detail || err.message}`);
              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message , BrokerMessageCriticity.ERROR);
            }
          });
        }
      });    
  }

  onClose() {
     this.ref.close();
  }
}