import { Component, ViewChild, ElementRef } from '@angular/core';
import { CropProcessorComponent } from '../../components/crop-processor/crop-processor.component';
import { CropOptions } from '../../components/crop-controls/crop-controls.component';

@Component({
  selector: 'app-smart-crop',
  templateUrl: './smart-crop.component.html',
  styleUrls: ['./smart-crop.component.scss']
})
export class SmartCropComponent {
  @ViewChild(CropProcessorComponent) cropProcessor!: CropProcessorComponent;

  uploadedImage: File | null = null;
  cropOptions: CropOptions = {
    width: 800,
    height: 600,
    aspectRatio: 'custom',
    autoDetect: false
  };
  isProcessing = false;

  onImageSelected(file: File) {
    this.uploadedImage = file;
    // Reset previous results when a new image is uploaded
    if (this.cropProcessor) {
      this.cropProcessor.processedImage = null;
      this.cropProcessor.processedImageUrl = null;
    }
  }

  onImageRemoved() {
    this.uploadedImage = null;
    if (this.cropProcessor) {
      this.cropProcessor.processedImage = null;
      this.cropProcessor.processedImageUrl = null;
    }
  }

  onCropOptionsChanged(options: CropOptions) {
    this.cropOptions = options;
  }

  onProcessingStart() {
    this.isProcessing = true;
  }

  onProcessingComplete(result: any) {
    this.isProcessing = false;
    // No need to scroll - results replace the preview in same location
  }

  onCropImage() {
    if (this.cropProcessor) {
      this.cropProcessor.cropImage();
    }
  }

  onProcessingError(error: string) {
    this.isProcessing = false;
    console.error('Crop error:', error);
  }
}
