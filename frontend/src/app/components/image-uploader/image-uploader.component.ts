import { Component, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-image-uploader',
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
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

  openFileDialog(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.fileInput.nativeElement.click();
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
