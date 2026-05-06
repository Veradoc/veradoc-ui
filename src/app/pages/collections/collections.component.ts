import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { CollectionService } from '../../services/collection.service';
import { CollectionStats } from '../../models/collection-stats.model';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ReactiveFormsModule,
    DialogModule,
    ConfirmDialogModule,
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './collections.component.html',
  styleUrl: './collections.component.scss'
})
export class CollectionsComponent implements OnInit {
  readonly ROOT_BUCKET = "custom-corpus";

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);  
  collectionService = inject(CollectionService);
  brokerService = inject(BrokerService);

  collections: CollectionStats[] = [];
  collection: any = {};
  collectionDialog: boolean = false;

  collectionForm!: FormGroup;

  private loadCollections() {
    this.collectionService.getCollections('custom-corpus')
      .subscribe({
        next: (data) => {
          this.collections = data;
        },
        error: (err) => console.error('Error fetching collections', err)
      });
  }

  ngOnInit() {
    this.loadCollections();
  }
  
  openDialog(collection?: any): void {
    this.collectionForm = this.fb.group({
      id: [collection?.id ?? ''],
      name: [collection?.name ?? '', Validators.required],      
    });

    this.collectionDialog = true;
  }

  onOpenFiles(collection: any): void  {
    this.router.navigate(['/files', collection.path]);
  }

  onSaveCollection(): void {
    if (this.collectionForm.invalid) {
      this.collectionForm.markAllAsTouched();
      return;
    }

    const collection = this.collectionForm.value;

    if (collection.id) {
      /*this.collectionService.updateCollection(collection)
        .subscribe({
          next: () => {
            this.loadCollections();
            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Collection saved', BrokerMessageCriticity.SUCCESS);
            this.hideDialog();
          },
          error: (err) => {
            console.log(err);

            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
          }
      })*/
    } else {
      this.collectionService.createCollection(this.ROOT_BUCKET, collection.name)
        .subscribe({
          next: () => {
            this.loadCollections();
            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Collection created', BrokerMessageCriticity.SUCCESS);
            this.onHideDialog();
          },
          error: (err) => {
            console.log(err);

            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
          }
      });
    }
  }

  onRemoveCollection(collection: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${collection.path} collection?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.collectionService.deleteCollection(this.ROOT_BUCKET, collection.path).subscribe({
          next: () => {
            this.loadCollections();
            this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, 'Collection deleted', BrokerMessageCriticity.SUCCESS);
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
    this.collectionDialog = false;
  }  
}