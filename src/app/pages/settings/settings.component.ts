import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
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
    ButtonModule,
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
  readonly TOP_RERANKER_VECTORS_KEY = "TOP_RERANKER_VECTORS"
  readonly GOOGLE_ACTIVE_OAUTH = "GOOGLE_ACTIVE_OAUTH"
  readonly GOOGLE_CLIENT_ID = "GOOGLE_CLIENT_ID"
  readonly GOOGLE_CLIENT_SECRET = "GOOGLE_CLIENT_SECRET"

  private brokerService = inject(BrokerService);
  private confirmationService = inject(ConfirmationService); 
  private userService = inject(UserService);  
  private settingService = inject(SettingService);
  authService = inject(AuthService);  

  selectedSection = 'general';
  selectedJob = ''
  notificationsEnabled = true;
  name = '';
  topVectors: number | undefined;
  topRerankerVectors = 20
  googleActiveOAuth: boolean = false;
  googleClientId: string | undefined;
  googleClientSecret: string | undefined;

  menuItems = [
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' }    
  ];

  adminMenuItems = [
    { id: 'general', label: 'General' },
    { id: 'google', label: 'Google' },
    { id: 'model', label: 'Model' },
    { id: 'account', label: 'Account' }  
  ]
  
  jobs = [
    { label: 'Engineering', value: 'engineering' },
    { label: 'Design', value: 'design' },
    { label: 'Marketing', value: 'marketing' }
  ];  

  allSettings = this.settingService.settings; 
  @ViewChild('settingsForm') settingsForm!: NgForm;
  
  ngOnInit() {
    this.name = this.authService.currentUser()?.name ?? '';

    const top_k_vectors = this.settingService.getSettingValue(this.TOP_VECTORS_KEY);

    this.topVectors = top_k_vectors == null ? undefined : Number(this.settingService.getSettingValue(this.TOP_VECTORS_KEY))
    this.topRerankerVectors = Number(this.settingService.getSettingValue(this.TOP_RERANKER_VECTORS_KEY))       
    this.googleActiveOAuth = this.settingService.getSettingValue(this.GOOGLE_ACTIVE_OAUTH) === "true";
    this.googleClientId = this.settingService.getSettingValue(this.GOOGLE_CLIENT_ID);
    this.googleClientSecret = this.settingService.getSettingValue(this.GOOGLE_CLIENT_SECRET);  
    
    if (this.authService.currentUser()?.is_superuser) {
      this.menuItems = this.adminMenuItems;
    }
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

  onTopRerankerVectorsChange(event: any) {
    if (!this.topRerankerVectors) return;    

    this.settingService.saveKey(this.TOP_RERANKER_VECTORS_KEY, this.topRerankerVectors.toString())
      .subscribe({
        next: () => {
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Top Reranker Vectors model setted successfully', BrokerMessageCriticity.SUCCESS);
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
  }

  onSaveSettings(form: any) {
    // save actibe google oauth tag
    if (!this.topVectors) return;

    this.settingService.saveKey(this.GOOGLE_ACTIVE_OAUTH, this.googleActiveOAuth.toString())
      .subscribe({
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    
    // save actibe google client id tag
    if (!this.GOOGLE_CLIENT_ID) return;

    this.settingService.saveKey(this.GOOGLE_CLIENT_ID, this.googleClientId!.toString())
      .subscribe({
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    
    // save actibe google oauth tag
    if (!this.GOOGLE_CLIENT_SECRET) return;

    this.settingService.saveKey(this.GOOGLE_CLIENT_SECRET, this.googleClientSecret!.toString())
      .subscribe({
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    
    // save top vectors tag
    if (!this.topVectors) return;

    this.settingService.saveKey(this.TOP_VECTORS_KEY, this.topVectors.toString())
      .subscribe({
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    
    // save top reranker tag
    if (!this.topRerankerVectors) return;

    this.settingService.saveKey(this.TOP_RERANKER_VECTORS_KEY, this.topRerankerVectors.toString())
      .subscribe({
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });    
    
    this.settingsForm.control.markAsPristine();
    this.settingsForm.control.markAsUntouched();
    
    this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Settings save successfully', BrokerMessageCriticity.SUCCESS);
  }

  onLogout() {
    this.authService.logout();
  }  
}
