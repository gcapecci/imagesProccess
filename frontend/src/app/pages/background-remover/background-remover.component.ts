import { Component } from '@angular/core';

@Component({
  selector: 'app-background-remover',
  templateUrl: './background-remover.component.html',
  styleUrls: ['./background-remover.component.scss']
})
export class BackgroundRemoverComponent {
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
  }

  onProcessingError(error: any) {
    this.isProcessing = false;
    console.error('Processing error:', error);
  }
}
