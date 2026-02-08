import { Component, ViewChild, ElementRef } from '@angular/core';
import { ImageProcessorComponent } from '../../components/image-processor/image-processor.component';

@Component({
  selector: 'app-background-remover',
  templateUrl: './background-remover.component.html',
  styleUrls: ['./background-remover.component.scss']
})
export class BackgroundRemoverComponent {
  @ViewChild(ImageProcessorComponent) imageProcessor!: ImageProcessorComponent;
  uploadedImage: File | null = null;
  selectedModel = 'u2net';
  isProcessing = false;

  onModelSelected(modelId: string) {
    this.selectedModel = modelId;
  }

  onImageUploaded(image: File) {
    this.uploadedImage = image;
  }

  onImageRemoved() {
    this.uploadedImage = null;
    this.isProcessing = false;
  }

  onProcessingStart() {
    this.isProcessing = true;
  }

  onProcessingComplete(result: any) {
    this.isProcessing = false;
    console.log('Processing complete:', result);

    if (this.imageProcessor) {
      this.imageProcessor.scrollToResults();
    }
  }

  onProcessingError(error: any) {
    this.isProcessing = false;
    console.error('Processing error:', error);
  }
}
