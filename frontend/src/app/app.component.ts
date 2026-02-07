import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <main class="main-content">
        <div class="container">
          <div class="intro-section">
            <h1>AI Background Remover</h1>
            <p>Remove backgrounds from your images using advanced AI technology</p>
          </div>
          
          <app-image-uploader 
            (imageUploaded)="onImageUploaded($event)"
            [isProcessing]="isProcessing">
          </app-image-uploader>
          
          <app-image-processor
            *ngIf="uploadedImage"
            [image]="uploadedImage"
            (processingStart)="onProcessingStart()"
            (processingComplete)="onProcessingComplete($event)"
            (processingError)="onProcessingError($event)">
          </app-image-processor>
        </div>
      </main>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-content {
      flex: 1;
      padding: 24px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .intro-section {
      text-align: center;
      margin-bottom: 48px;
      
      h1 {
        font-size: 2.5rem;
        font-weight: 300;
        color: #3f51b5;
        margin-bottom: 16px;
      }
      
      p {
        font-size: 1.2rem;
        color: #757575;
        max-width: 600px;
        margin: 0 auto;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 16px;
      }
      
      .intro-section h1 {
        font-size: 2rem;
      }
      
      .intro-section p {
        font-size: 1rem;
      }
    }
  `]
})
export class AppComponent {
  uploadedImage: File | null = null;
  isProcessing = false;

  onImageUploaded(image: File) {
    this.uploadedImage = image;
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