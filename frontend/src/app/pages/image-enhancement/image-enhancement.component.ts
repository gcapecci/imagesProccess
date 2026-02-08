import { Component, ViewChild, ElementRef } from '@angular/core';
import { EnhancementOptions } from '../../services/image.service';
import { EnhancementProcessorComponent } from '../../components/enhancement-processor/enhancement-processor.component';

@Component({
  selector: 'app-image-enhancement',
  templateUrl: './image-enhancement.component.html',
  styleUrls: ['./image-enhancement.component.scss']
})
export class ImageEnhancementComponent {
  @ViewChild(EnhancementProcessorComponent) enhancementProcessor!: EnhancementProcessorComponent;
  @ViewChild('enhancementSection') enhancementSection!: ElementRef<HTMLDivElement>;
  
  uploadedImage: File | null = null;
  isProcessing = false;
  enhancementOptions: EnhancementOptions = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sharpness: 1.0,
    autoEnhance: false,
    denoise: false
  };

  onImageUploaded(image: File) {
    this.uploadedImage = image;
    // Reset previous results when new image is uploaded
    if (this.enhancementProcessor) {
      this.enhancementProcessor.processedImage = null;
      this.enhancementProcessor.processedImageUrl = null;
    }

    // Auto-scroll para a seção de enhancement após o upload
    setTimeout(() => {
      if (this.enhancementSection) {
        this.enhancementSection.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 150);
  }

  onImageRemoved() {
    this.uploadedImage = null;
    this.isProcessing = false;
    if (this.enhancementProcessor) {
      this.enhancementProcessor.processedImage = null;
      this.enhancementProcessor.processedImageUrl = null;
    }
  }

  onOptionsChanged(options: EnhancementOptions) {
    this.enhancementOptions = options;
  }

  onProcessingStart() {
    this.isProcessing = true;
  }

  onProcessingComplete(result: any) {
    this.isProcessing = false;
    console.log('Enhancement complete:', result);
    // No need to scroll - results replace the preview in same location
  }

  onEnhanceImage() {
    if (this.enhancementProcessor) {
      this.enhancementProcessor.enhanceImage();
    }
  }

  onProcessingError(error: any) {
    this.isProcessing = false;
    console.error('Enhancement error:', error);
  }
}
