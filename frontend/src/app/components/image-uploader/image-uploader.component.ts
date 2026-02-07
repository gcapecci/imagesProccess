import { Component, Output, EventEmitter, Input } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-image-uploader',
  template: `
    <mat-card class="uploader-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>cloud_upload</mat-icon>
          Upload Your Image
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <ngx-file-drop 
          dropZoneLabel="Drop your image here or click to browse"
          (onFileDrop)="onFileDropped($event)"
          (onFileOver)="onFileHover($event)"
          (onFileLeave)="onFileLeave($event)"
          [accept]="'image/*'"
          [multiple]="false"
          class="file-drop-zone"
          [class.drag-over]="isHovering">
          
          <ng-template ngx-file-drop-content-tmp>
            <div class="drop-content">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <h3>Drop your image here</h3>
              <p>or</p>
              <button mat-raised-button color="primary" type="button">
                Choose File
              </button>
              <p class="file-info">
                Supports: JPG, PNG, WEBP, BMP, TIFF (Max: 50MB)
              </p>
            </div>
          </ng-template>
        </ngx-file-drop>

        <input #fileInput 
               type="file" 
               accept="image/*" 
               (change)="onFileSelected($event)" 
               style="display: none;">
               
        <div *ngIf="selectedFile" class="selected-file">
          <div class="selected-file-info">
            <mat-icon>image</mat-icon>
            <span class="file-name">{{ selectedFile.name }}</span>
            <button mat-icon-button (click)="removeFile()" color="warn">
              <mat-icon>cancel</mat-icon>
            </button>
          </div>
          
          <div class="file-details">
            <p>Size: {{ formatFileSize(selectedFile.size) }}</p>
            <p>Type: {{ selectedFile.type }}</p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .uploader-card {
      margin-bottom: 24px;
    }

    .file-drop-zone {
      min-height: 200px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .file-drop-zone:hover,
    .file-drop-zone.drag-over {
      border-color: #3f51b5;
      background-color: #f5f5f5;
    }

    .drop-content {
      text-align: center;
      padding: 32px;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
      margin-bottom: 16px;
    }

    .selected-file {
      margin-top: 16px;
      
      .selected-file-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        
        .file-name {
          flex: 1;
          font-weight: 500;
        }
      }
      
      .file-details {
        margin-top: 8px;
        font-size: 0.9em;
        color: #666;
      }
    }

    .file-info {
      font-size: 0.8rem;
      color: #666;
      margin-top: 16px;
    }
  `]
})
export class ImageUploaderComponent {
  @Output() imageUploaded = new EventEmitter<File>();
  @Output() imageRemoved = new EventEmitter<void>();
  @Input() isProcessing = false;

  selectedFile: File | null = null;
  isHovering = false;

  constructor(
    private imageService: ImageService,
    private notification: NotificationService
  ) {}

  onFileDropped(files: NgxFileDropEntry[]) {
    this.isHovering = false;
    
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.validateAndSetFile(file);
        });
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onFileHover(event: any) {
    this.isHovering = true;
  }

  onFileLeave(event: any) {
    this.isHovering = false;
  }

  validateAndSetFile(file: File) {
    if (!this.imageService.isValidImage(file)) {
      this.notification.showError('Please select a valid image file');
      return;
    }

    if (!this.imageService.isValidSize(file)) {
      this.notification.showError('File size must be less than 50MB');
      return;
    }

    this.selectedFile = file;
    this.imageUploaded.emit(file);
    this.notification.showSuccess(`Image ${file.name} uploaded successfully!`);
  }

  removeFile() {
    this.selectedFile = null;
    this.imageRemoved.emit();
    this.notification.showInfo('Image removed');
  }

  formatFileSize(bytes: number): string {
    return this.imageService.formatFileSize(bytes);
  }
}