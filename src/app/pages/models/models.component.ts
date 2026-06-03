import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { SliderModule } from 'primeng/slider';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { SelectModule } from 'primeng/select';
import { ConfirmationService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';

import { HuggingfaceService } from '../../services/huggingface.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AbbreviateNumberPipe } from '../../pipes/abbreviate-number.pipe';
import { OllamaService } from '../../services/ollama.service';
import { BrokerMessageCriticity, BrokerMessageType, BrokerService } from '../../services/broker.service';
import { TerminalLogComponent } from '../../components/terminal-log/terminal-log-component';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SliderModule,
    ChipModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DrawerModule,
    SelectModule,
    TimeAgoPipe,
    AbbreviateNumberPipe,
    TerminalLogComponent,
  ],
  providers: [
    ConfirmationService
  ],  
  templateUrl: './models.component.html',
  styleUrl: './models.component.scss',    
})
export class ModelsComponent implements OnInit {
  private confirmationService = inject(ConfirmationService);
  private huggingfaceService = inject(HuggingfaceService);
  private ollamaService = inject(OllamaService);
  private brokerService = inject(BrokerService);

  @ViewChild('terminalModel') termLog!: TerminalLogComponent;
  
  loading: boolean = true;
  models: any[] = [];
  model: any = {};
  page: number = 1;
  PAGE_SIZE = 10;
  totalModels: number = 0;
  searchQuery: string = '';
  sortModel: string = 'likes'; // default filter model
  filterModels: any[] = [
    {"key": "text-generation", text: "Text Generation"},
    //{"key": "image-text-to-text", text: "Image/Text to Text Generation"},
    { "key": "sentence-similarity", text: "Sentence Similarity" },
    //{"key": "feature-extraction", text: "Features Extraction" }
  ];
  filterModel: any = this.filterModels[0].key;
  showTerminal: boolean = false;

  hasMorePages: boolean = true;
  avatarFailed = false;

  private loadModels(page: number, pageSize:number, sort?: string, filter?: string, query: string = '') {
    this.loading = true;

    this.huggingfaceService.getModels(page, pageSize, sort, filter, query)
      .subscribe({
        next: (res: any) => {
          // 1. Update the list
          const data = res.models || [];
          this.hasMorePages = res.has_more;

          this.models = data.map((model: any) => {
            return {
              id: model.id,
              author: model.author,
              author_type: model.author_type,
              private: model.private,              
              downloads: model.downloads,
              likes: model.likes,
              pipelineTag: model.pipeline_tag,
              updated: new Date(model.created_at),
            };
          });
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }        
      });
  }

  ngOnInit() {
    this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.searchQuery);
  }

  getIcon(tag: string) {
    const map: any = {
      'text-generation': 'pi pi-align-left',
      'image-text-to-text': 'pi pi-box',
      'image-to-text': 'pi pi-image',
      'text-classification': 'pi pi-list',
      'summarization': 'pi pi-align-justify',
      'translation': 'pi pi-language',
      'automatic-speech-recognition': 'pi pi-microphone'      
    };

    return map[tag] || 'pi pi-question-circle';
  }

  extractParams(id: string) {
    const match = id.match(/(\d+B|\d+M)/i);

    return match ? match[0] : 'n/a';
  }

  onOrderModels(sortModel: string) {
    this.sortModel = sortModel;
    this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.filterModel, this.searchQuery);
  }

  onFilterModels (filterModel: string) {
    this.filterModel = filterModel;
    this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.filterModel, this.searchQuery);
  }

  onKeyDown(event: any) {
    if (event.code === 'Enter') {
      this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.filterModel, this.searchQuery);
    }
  }

  onPaginatedPrev() {
    this.page--;
    this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.filterModel, this.searchQuery);
  }

  onPaginatedNext() {
    this.page++;
    this.loadModels(this.page, this.PAGE_SIZE, this.sortModel, this.filterModel, this.searchQuery);
  }

  onAvatarError(event: any): void {
    event.target.style.display = 'none'

    // or replace with the icon fallback
    event.target.insertAdjacentHTML('afterend', '<i class="pi pi-microchip-ai text-blue-400" style="font-size: 30px"></i>')
  }
  
  onPullModel(model: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to pull <b>${model.id}</b>?.`,
      header: 'Confirm Action',
      icon: 'pi pi-trash',
      acceptLabel: 'Pull',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-text',
      rejectButtonStyleClass: 'p-button-danger p-button-text',
      accept: async () => {
        this.showTerminal = true;

        this.termLog.info(`> Initiating pullingfor ${model.id}...`);

        this.ollamaService.pullModelStream(model)
          .subscribe({
            next: (chunk) => {
              console.log(chunk);
              this.termLog.info(chunk);
            },
            error: (err) => {
              this.termLog.error(`[ERROR]: ${err}`);
              this.termLog.info(`[ERROR]: Failed to delete model. ${err.error?.detail || err.message}`);

              this.brokerService.sendMessage(BrokerMessageType.SYSTEM_ALERT, err.message, BrokerMessageCriticity.ERROR);
            },
            complete: () => {
              console.log("\n--- Model pull finished! ---");              
            }
          });
      }
    });   
  }
}