import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ImageService, ProcessingResult, UploadProgress } from '../../services/image.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-processor',
  template: `
    <mat-card class="processor-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>auto_fix_high</mat-icon>
          AI Background Removal
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="image-preview" *ngIf="imagePreview">
          <img [src]="imagePreview" alt="Original image" class="preview-image">
        </div>

        <div class="actions">
          <button mat-raised-button 
                  color="primary" 
                  [disabled]="isProcessing"
                  (click)="processImage()">
            <mat-icon *ngIf="!isProcessing">smart_toy</mat-icon>
            <mat-spinner *ngIf="isProcessing" diameter="20"></mat-spinner>
            {{ isProcessing ? 'Processing...' : 'Remove Background' }}
          </button>
        </div>

        <!-- Progress Bar -->
        <div *ngIf="isProcessing" class="progress-section">
          <mat-progress-bar mode="determinate" [value]="progress.progress"></mat-progress-bar>
          <p class="progress-text">{{ progress.message }}</p>
        </div>

        <!-- Results -->
        <div *ngIf="processedImage" class="results-section">
          <h3>Processed Result</h3>
          <div class="comparison">
            <div class="image-container">
              <h4>Original</h4>
              <img [src]="imagePreview" alt="Original" class="result-image">
            </div>
            <div class="image-container">
              <h4>Processed</h4>
              <img [src]="processedImageUrl" alt="Processed" class="result-image">
            </div>
          </div>
          
          <div class="download-section">
            <button mat-raised-button color="accent" (click)="downloadImage()">
              <mat-icon>download</mat-icon>
              Download Processed Image
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .processor-card {
      margin-top: 24px;
    }

    .image-preview {
      text-align: center;
      margin-bottom: 24px;
    }

    .preview-image {
      max-width: 100%;
      max-height: 400px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .actions {
      text-align: center;
      margin: 24px 0;
    }

    .progress-section {
      margin: 24px 0;
    }

    .progress-text {
      text-align: center;
      margin-top: 8px;
      color: #666;
    }

    .comparison {
      display: flex;
      gap: 24px;
      margin: 24px 0;
    }

    .image-container {
      flex: 1;
      text-align: center;
    }

    .result-image {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .download-section {
      text-align: center;
      margin-top: 24px;
    }

    @media (max-width: 768px) {
      .comparison {
        flex-direction: column;
      }
    }
  `]
})
export class ImageProcessorComponent implements OnDestroy {
  @Input() image: File | null = null;
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

  processImage() {
    if (!this.image) {
      this.notification.showError('No image selected');
      return;
    }

    this.isProcessing = true;
    this.processingStart.emit();
    this.imageService.resetProgress();

    // Subscribe to progress updates
    this.progressSubscription = this.imageService.uploadProgress$.subscribe(
      progress => this.progress = progress
    );

    // Process the image
    this.imageService.removeBackground(this.image).subscribe({
      next: (result: ProcessingResult) => {
        if (result.success && result.processedImage) {
          this.processedImage = result.processedImage;
          this.processedImageUrl = URL.createObjectURL(result.processedImage);
          this.processingComplete.emit(result);
          this.notification.showSuccess(
            `Background removed successfully! Processing time: ${result.processingTime}`
          );
        }
      },
      error: (error) => {
        this.processingError.emit(error.error || 'Processing failed');
        this.notification.showError(error.error || 'Failed to process image');
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
      const filename = `processed_${this.image.name.replace(/\.[^/.]+$/, '')}.png`;
      this.imageService.downloadImage(this.processedImage, filename);
      this.notification.showInfo('Download started!');
    }
  }
}