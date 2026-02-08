import { Component } from '@angular/core';
import { EnhancementOptions } from '../../services/image.service';

@Component({
  selector: 'app-image-enhancement',
  templateUrl: './image-enhancement.component.html',
  styleUrls: ['./image-enhancement.component.scss']
})
export class ImageEnhancementComponent {
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
  }

  onImageRemoved() {
    this.uploadedImage = null;
    this.isProcessing = false;
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
  }

  onProcessingError(error: any) {
    this.isProcessing = false;
    console.error('Enhancement error:', error);
  }
}
