import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ImageService, ProcessingResult, UploadProgress, EnhancementOptions } from '../../services/image.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-enhancement-processor',
  templateUrl: './enhancement-processor.component.html',
  styleUrls: ['./enhancement-processor.component.scss']
})
export class EnhancementProcessorComponent implements OnDestroy {
  @Input() image: File | null = null;
  @Input() enhancementOptions: EnhancementOptions = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sharpness: 1.0,
    autoEnhance: false,
    denoise: false
  };
  @Output() processingStart = new EventEmitter<void>();
  @Output() processingComplete = new EventEmitter<ProcessingResult>();
  @Output() processingError = new EventEmitter<string>();

  imagePreview: string | null = null;
  processedImage: Blob | null = null;
  processedImageUrl: string | null = null;
  isProcessing = false;
  progress: UploadProgress = { progress: 0, status: 'uploading' };
  
  private progressSubscription: Subscription | null = null;

  constructor(
    private imageService: ImageService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    if (this.image) {
      this.createImagePreview();
    }
  }

  ngOnDestroy() {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }
    if (this.processedImageUrl) {
      URL.revokeObjectURL(this.processedImageUrl);
    }
  }

  createImagePreview() {
    if (this.image) {
      this.imagePreview = URL.createObjectURL(this.image);
    }
  }

  enhanceImage() {
    if (!this.image) {
      this.notification.showError('No image selected');
      return;
    }

    this.isProcessing = true;
    this.processingStart.emit();
    this.imageService.resetProgress();

    this.progressSubscription = this.imageService.uploadProgress$.subscribe(
      progress => this.progress = progress
    );

    this.imageService.enhanceImage(this.image, this.enhancementOptions).subscribe({
      next: (result: ProcessingResult) => {
        if (result.success && result.processedImage) {
          this.processedImage = result.processedImage;
          this.processedImageUrl = URL.createObjectURL(result.processedImage);
          this.processingComplete.emit(result);
          this.notification.showSuccess(
            `Image enhanced successfully! Processing time: ${result.processingTime}`
          );
        }
      },
      error: (error) => {
        this.processingError.emit(error.error || 'Enhancement failed');
        this.notification.showError(error.error || 'Failed to enhance image');
      },
      complete: () => {
        this.isProcessing = false;
        if (this.progressSubscription) {
          this.progressSubscription.unsubscribe();
        }
      }
    });
  }

  downloadImage() {
    if (this.processedImage && this.image) {
      const filename = `enhanced_${this.image.name.replace(/\.[^/.]+$/, '')}.png`;
      this.imageService.downloadImage(this.processedImage, filename);
      this.notification.showInfo('Download started!');
    }
  }

  getProgressIcon(): string {
    switch (this.progress.status) {
      case 'uploading':
        return 'cloud_upload';
      case 'processing':
        return 'auto_fix_high';
      case 'downloading':
        return 'cloud_download';
      case 'complete':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'hourglass_empty';
    }
  }
}
