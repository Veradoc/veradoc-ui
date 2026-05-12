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

  statusStyles = {
    running: { label: 'Running', class: 'status-running' },
    exited: { label: 'Stopped', class:  'status-exited' },
    restarting: { label: 'Restarting', class: 'status-warning' },
    paused: { label: 'Paused', class: 'status-paused' },
    dead: { label: 'Dead', class: 'status-danger' },
    created: { label: 'Created', class: 'status-info' }
  };

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
    this.containerService.startContainer(container.id)
      .subscribe({
        next: (result) => {
          this.loading = false;          

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Container started correctly', BrokerMessageCriticity.SUCCESS);          
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
          
          this.loading = false;
        },
      });    
  }

  openStop(container: any) {
    this.containerService.stopContainer(container.id)
      .subscribe({
        next: (result) => {
          this.loading = false;

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Container stopped correctly', BrokerMessageCriticity.SUCCESS);
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);

          this.loading = false;
        },
      });    
  }
}