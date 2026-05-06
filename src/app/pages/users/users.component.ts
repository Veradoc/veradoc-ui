import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms'

import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { UserService } from '../../services/user.service';
import { User } from '../../models/User';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    TableModule,
    TagModule,  
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService
  ],  
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',    
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private brokerService = inject(BrokerService);

  loading: boolean = true;
  userDialog: boolean = false;
  users: any[] = [];
  user: any = {};
  userForm!: FormGroup;

  private loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.userService.getUsers().subscribe({
          next: (data) => {
            this.users = data;
            this.loading = false;
          },
          error: () => this.loading = false
        });
      }
    });
  }

  ngOnInit() {
    this.loadUsers();
  }  

  openDialog(user?: User): void {
    this.user = user ?? {};

    this.userForm = this.fb.group({
      id: [user?.id ?? ''],
      name: [user?.name ?? '', Validators.required],
      email: [user?.email ?? '', [Validators.required, Validators.email]],
      password: [user?.password ?? null, user?.id ? [] : Validators.required],
      is_active: [user?.is_active ?? true],
      is_superuser: [user?.is_superuser ?? false],
    });

    this.userDialog = true;
  }

  onSaveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const user = this.userForm.value;

    if (user.id) {
      this.userService.updateUser(user).subscribe({
        next: () => {
          this.loadUsers();
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'User details saved', BrokerMessageCriticity.SUCCESS);
          this.onHideDialog();
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    } else {
      this.userService.registerUser(user).subscribe({
        next: () => {
          this.loadUsers();
          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'User registered', BrokerMessageCriticity.SUCCESS);
          this.onHideDialog();
        },
        error: (err) => {
          console.log(err);

          this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
        }
      });
    }
  }

  onDeleteUser(user: User) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.name || user.email}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter((val) => val.id !== user.id);

            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'User removed successfully', BrokerMessageCriticity.SUCCESS);
          },
          error: (err) => {
            console.log(err);

            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
          }
        });
      }
    });
  }
  
  onHideDialog() {
    this.userForm.reset();
    this.userDialog = false;
  }
}