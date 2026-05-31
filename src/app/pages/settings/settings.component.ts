import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ConfirmationService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';
import { SettingService } from '../../services/setting.service';

@Component({
  selector: 'app-find',
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    RippleModule,    
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  readonly TOP_VECTORS_KEY = "TOP_VECTORS"
  private brokerService = inject(BrokerService);
  private confirmationService = inject(ConfirmationService); 
  private userService = inject(UserService);  
  private settingService = inject(SettingService);
  authService = inject(AuthService);  

  selectedSection = 'general';
  selectedJob = ''
  notificationsEnabled = true;
  name = '';
  topVectors = 5

  menuItems = [
    { id: 'general', label: 'General' },
    { id: 'model', label: 'Model' },
    { id: 'account', label: 'Account' }    
  ];

  jobs = [
    { label: 'Engineering', value: 'engineering' },
    { label: 'Design', value: 'design' },
    { label: 'Marketing', value: 'marketing' }
  ];  

  ngOnInit() {
    this.name = this.authService.currentUser()?.name ?? '';

    this.settingService.getValueByKey(this.TOP_VECTORS_KEY)
      .subscribe({
        next: (result: any) => {
          if (result) {
            this.topVectors = Number(result.value);
          }
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });    
  }

  onDeleteAccount() {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${this.authService.currentUser()?.name}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.userService.deleteUser(this.authService.currentUser()!.id)
          .subscribe({
            next: () => {    
              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'User removed successfully', BrokerMessageCriticity.SUCCESS);

              this.authService.logout();            
            },
            error: (err) => {
              console.log(err);
    
              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
            }
        });
      }
    });        
  } 

  onTopVectorsChange(event: any) {
    if (!this.topVectors) return;    

    this.settingService.saveKey(this.TOP_VECTORS_KEY, this.topVectors.toString())
      .subscribe({
        next: () => {
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Top Vectors model setted successfully', BrokerMessageCriticity.SUCCESS);
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
  }

  onLogout() {
    this.authService.logout();
  }  
}
