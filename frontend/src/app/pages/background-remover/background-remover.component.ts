import { Component, ViewChild, ElementRef } from '@angular/core';
import { ImageProcessorComponent } from '../../components/image-processor/image-processor.component';

@Component({
  selector: 'app-background-remover',
  templateUrl: './background-remover.component.html',
  styleUrls: ['./background-remover.component.scss']
})
export class BackgroundRemoverComponent {
  @ViewChild(ImageProcessorComponent) imageProcessor!: ImageProcessorComponent;
  @ViewChild('backgroundSection') backgroundSection!: ElementRef<HTMLDivElement>;
  uploadedImage: File | null = null;
  selectedModel = 'u2net';
  isProcessing = false;

  onModelSelected(modelId: string) {
    this.selectedModel = modelId;
  }

  onImageUploaded(image: File) {
    this.uploadedImage = image;

    // Reset previous results when a new image is uploaded
    if (this.imageProcessor) {
      this.imageProcessor.processedImage = null;
      this.imageProcessor.processedImageUrl = null;
    }

    // Auto-scroll para a seção de processamento após o upload
    setTimeout(() => {
      if (this.backgroundSection) {
        this.backgroundSection.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 150);
  }

  onImageRemoved() {
    this.uploadedImage = null;
    this.isProcessing = false;
    if (this.imageProcessor) {
      this.imageProcessor.processedImage = null;
      this.imageProcessor.processedImageUrl = null;
    }
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

  onRemoveBackground() {
    if (this.imageProcessor) {
      this.imageProcessor.processImage();
    }
  }
}
