import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';
import { ContainerService } from '../../services/container.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService
  ],  
  templateUrl: './containers.component.html',
  styleUrl: './containers.component.scss',    
})
export class ContainersComponent implements OnInit {
  private containerService = inject(ContainerService);
  private confirmationService = inject(ConfirmationService);
  private brokerService = inject(BrokerService);

  loading: boolean = true;
  containers: any[] = [];
  container: any = {};

  private loadContainers() {
    this.loading = true;
    this.containerService.getContainers()
      .subscribe({
        next: (data) => {
          this.containers = data.containers;
          this.loading = false;
        },
        error: (err) => {       
          console.log(err);
          
          this.loading = false;

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);          
        },      
      });
  }

  ngOnInit() {
    this.loadContainers();
  }  

  onRefresh() {
    this.loadContainers();
  }

  openStart(container: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to start ${container.name}?`,
      header: 'Confirm Start',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'start',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.containerService.startContainer(container.id)
          .subscribe({
            next: (result) => {
              this.loading = false;

              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Container started correctly', BrokerMessageCriticity.SUCCESS);

              this.loadContainers();
            },
            error: (err) => {
              console.log(err);

              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);

              this.loading = false;
            },
          });  
      }
    });  
  }

  openStop(container: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to stop ${container.name}?`,
      header: 'Confirm Stop',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Stop',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.containerService.stopContainer(container.id)
          .subscribe({
            next: (result) => {
              this.loading = false;

              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Container stopped correctly', BrokerMessageCriticity.SUCCESS);

              this.loadContainers();              
            },
            error: (err) => {
              console.log(err);

              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);

              this.loading = false;
            },
          }); 
      }
    });    
  }
}