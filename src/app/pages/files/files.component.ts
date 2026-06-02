import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmationService, MessageService } from 'primeng/api';

import { FileService } from '../../services/file.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        FormsModule,
        ConfirmDialogModule,
        TableModule,
        MenuModule,
        AutoCompleteModule,
        ButtonModule,
    ],
    providers: [MessageService, ConfirmationService], 
    templateUrl: './files.component.html',
    styleUrl: './files.component.scss',    
})
export class FilesComponent implements OnInit {
    router = inject(Router); 
    route = inject(ActivatedRoute);
    confirmationService = inject(ConfirmationService);
    fileService = inject(FileService); 

    // Mock data matching your MinIO / DockSphere structure
    readonly ROOT_BUCKET = 'custom-corpus'
    files: any[] = [];
    selectedFiles: any[] = [];
    selectedFilesCount: number = 0; // Default display match for your screenshot
    checkedFiles: any[] = [];
    selectedFile: any = null;
    showDetails: boolean = false;
    collectionName: string = '';

    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('folderInput') folderInput!: ElementRef<HTMLInputElement>;

    visibleFileDialog: boolean = false; // Set to true to display immediately
    visibleFolderDialog: boolean = false; // Set to true to display immediately
    newTagText: string = '';
    tags: string[] = [];
    suggestions: string[] = [];

    uploadType: any;
    uploadTypes: any[] = [
        {
            label: 'Upload File',
            icon: 'pi pi-upload',
            command: (event: any) => {
                this.visibleFileDialog = true;
            }
        },
        {
            label: 'Upload Folder',
            icon: 'pi pi-folder-open',
            command: () => {
                this.visibleFolderDialog = true;
            }
        }
    ];

    private closePanel() {
        this.selectedFile = null;
        this.showDetails = false;
    }

    ngOnInit() {
        // We use paramMap.get() to extract the string 'collectionId' defined in the route
        this.route.paramMap.subscribe(params => {
            this.collectionName = params.get('collectionName') || '';
            
            if (this.collectionName) {
                this.loadFiles();
            }
        });        
    } 
    
    convertToDate(dateString: string): Date {
        return new Date(dateString);
    }

    getFileIcon(filename: string) {
        if (filename.endsWith('.pdf')) return 'pi pi-file-pdf';

        if (filename.endsWith('.doc') || 
            filename.endsWith('.docx')) return 'pi pi-file-word';

        if (filename.endsWith('.xlsx')) return 'pi pi-file-excel';

        if (filename.endsWith('.png') || 
            filename.endsWith('.jpg') || 
            filename.endsWith('.gif')) return 'pi pi-image';

        return 'pi pi-file';
    }

    formatSize(bytes: number) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }   
    
    loadFiles() {
        this.fileService.getFiles('custom-corpus', this.collectionName)
            .subscribe({
                next: (data: any) => {
                    this.files = data.files;
                },
                error: (err) => console.error('Error fetching files', err)
            });
    }

    onRowClick(file: any) {
        this.selectedFile = file;
        this.showDetails = true; // Show both Actions and Info
    }

    onCheckboxClick(file: any) {
        // If the user just unchecked everything, close the panel
        if (this.checkedFiles.length === 0) {
            this.closePanel();

            return;
        }

        // Otherwise, show the panel in "Actions Only" mode
        // We use the last selected file to populate the panel title
        this.selectedFile = this.checkedFiles[this.checkedFiles.length - 1];
        this.showDetails = false;
    }
    
    onFileSelected(event: any): void {
        const element = event.currentTarget as HTMLInputElement;
        let files: FileList | null = element.files;

        if (files && files.length > 0) {
            this.fileService.uploadFiles(this.ROOT_BUCKET, this.collectionName, files)
                .subscribe({
                    next: (res) => {
                        this.loadFiles();
                    },
                    error: (err) => {
                        console.error('Upload Error:', err);
                    }
            });

            // Reset the input so the same file can be selected again if needed
            element.value = '';
        }
    }

    onFolderSelected(event: any): void {
        const element = event.currentTarget as HTMLInputElement;
        let files: FileList | null = element.files;

        if (files && files.length > 0) {
            this.fileService.uploadFiles(this.ROOT_BUCKET, this.collectionName, files)
                .subscribe({
                    next: (res) => {
                        this.loadFiles();
                    },
                    error: (err) => {
                        console.error('Upload Error:', err);
                    }
            });
        }    
    }

    onDownloadFile(selectedFile: any) {
        // item.path sería algo como "folder/documento.pdf"
        this.fileService.downloadFile('custom-corpus', selectedFile.full_path)
            .subscribe({
                next: async (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = selectedFile.full_path.split('/').pop() || 'file';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                },
                error: (err) => console.error("Error en la descarga", err)
            });
    }

    onDeleteFile(selectedFile: any) { 
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${selectedFile.full_path}?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Delete',
            rejectLabel: 'Cancel',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-secondary',
            accept: () => {
                this.fileService.deleteFile(this.ROOT_BUCKET, selectedFile.full_path)
                    .subscribe({
                        next: (result) => {
                            this.loadFiles();
                        },
                        error: (err) => console.error('Error fetching files', err)
                    });     
                }
            });      
    }

    onFilesSelected(event: Event): void {
        // initialize files collection selected
        this.selectedFiles = [];
        
        const input = event.target as HTMLInputElement;

        if (input.files && input.files.length > 0) {
            const newFiles = Array.from(input.files);
            
            // Merge avoiding duplicates by name+size
            const merged = [...this.selectedFiles];

            for (const file of newFiles) {
                const exists = merged.some(f => f.name === file.name && f.size === file.size);
                if (!exists) merged.push(file);
            }
            
            this.selectedFiles = merged;
            this.selectedFilesCount = this.selectedFiles.length;
        }
    }

    onComplete(event: AutoCompleteCompleteEvent) {
        // Immediately assign a new array reference — this is what clears the spinner
        this.suggestions = [];
    }

    onAddTag(event: any) {
        if (event.key === 'Enter') {
            const input = event.target as HTMLInputElement;
            const value = input.value?.trim();

            if (value && !this.tags.includes(value)) {
                this.tags = [...this.tags, value];
                input.value = '';

                // Force clear the internal autocomplete input value
                input.dispatchEvent(new Event('input'));
            }

            event.preventDefault();
            event.stopPropagation();
        }
    }
   
    onSaveFiles(): void {
        this.visibleFileDialog = false;
        this.visibleFolderDialog = false;

        console.log('Saving documents with tags:', this.tags, 'Count:', this.selectedFiles);
        console.log(this.selectedFiles);

        if (this.selectedFiles && this.selectedFiles.length > 0) {
            this.fileService.uploadFiles(this.ROOT_BUCKET, this.collectionName, this.selectedFiles, this.tags)
                .pipe(
                    finalize(() => {
                        this.selectedFiles = [];
                        this.selectedFilesCount = 0
                        this.tags = [];
                    })
                    ).subscribe({
                        next: (response) => {
                            this.loadFiles();
                        },
                        error: (err) => {
                            console.error('Upload Error:', err);
                        }
                    });
        }        
    } 
    
    onCancelFiles(): void {
        this.visibleFileDialog = false;
        this.visibleFolderDialog = false;

        this.selectedFiles = [];
        this.selectedFilesCount = 0
        this.tags = [];
    }    
}