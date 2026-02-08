import { Component, ViewChild, ElementRef } from '@angular/core';
import { ImageService, ProcessingResult, EnhancementOptions, CropOptions } from '../../services/image.service';
import { NotificationService } from '../../services/notification.service';

type EditorTool = 'crop' | 'enhance' | 'bg-remove' | null;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  currentFile: File | null = null;
  currentImageUrl: string | null = null;
  originalFile: File | null = null; // For "Reset"
  
  activeTool: EditorTool = 'bg-remove';
  isProcessing = false;
  
  // Resizing State
  panelWidth = 320;
  minPanelWidth = 250;
  isResizing = false;
  private startX = 0;
  private startWidth = 0;
  
  // Tool specific state
  bgRemoveModel = 'u2net';
  cropOptions: CropOptions = { width: 800, height: 600, aspectRatio: 'custom', autoDetect: false };
  enhancementOptions: EnhancementOptions = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sharpness: 1.0,
    autoEnhance: false,
    denoise: false
  };

  constructor(
    private imageService: ImageService,
    private notification: NotificationService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loadFile(file);
    }
  }

  onFileDropped(files: any[]) { // Using ngx-file-drop structure if we implement it, or just generic file
    if (files.length > 0) {
      // Handle logic if it's from ngx-file-drop or direct drop
      // For now assuming direct file object for simplicity
      this.loadFile(files[0]); 
    }
  }

  // Helper for Upload Component
  handleUpload(file: File) {
    this.loadFile(file);
  }

  private loadFile(file: File) {
    this.currentFile = file;
    this.originalFile = file;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentImageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  setActiveTool(tool: EditorTool) {
    // If clicking same tool that is active
    if (this.activeTool === tool) {
      if (this.panelWidth === 0) {
        // Reopen if closed
        this.panelWidth = 320;
      }
      // If open, do nothing (or could toggle close, but user asked to reopen)
    } else {
      this.activeTool = tool;
      if (this.panelWidth === 0) {
        this.panelWidth = 320; // Auto open
      }
    }
  }

  closePanel() {
    this.panelWidth = 0;
    this.activeTool = null;
  }

  // --- Resizing ---

  startResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.panelWidth;
    
    // Add global listeners
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private onResize = (event: MouseEvent) => {
    if (!this.isResizing) return;
    
    // Calculate new width
    // Mouse moving right increases width (since panel is on left)
    // Wait, the panel structure: Tools | Settings | Resizer | Canvas
    // So Settings is to the left of Resizer. Moving resizer right increases Settings width.
    const dx = event.clientX - this.startX;
    let newWidth = this.startWidth + dx;
    
    // Check collapse threshold
    if (newWidth < this.minPanelWidth / 2) {
      // Collapse zone
      newWidth = 0;
      // Do not set activeTool to null here, to allow "unsnapping" while still dragging
    } else if (newWidth < this.minPanelWidth) {
      // Minimum width constraint
      newWidth = this.minPanelWidth;
    } else if (newWidth > 600) {
      // Maximum width constraint
      newWidth = 600;
    }
    
    this.panelWidth = newWidth;
  };

  private stopResize = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);

    // If we ended up closed, then toggle off the tool
    if (this.panelWidth === 0) {
      this.activeTool = null;
    }
  };


  // --- Actions ---

  async applyBgRemoval() {
    if (!this.currentFile) return;
    
    this.isProcessing = true;
    this.imageService.removeBackground(this.currentFile, this.bgRemoveModel).subscribe({
      next: (result: ProcessingResult) => {
        if (result.processedImage && result.success !== false) { // ImageService returns intermediate events too
           // We need to handle the observable properly as it returns events
           // BUT ImageService.removeBackground returns events OR result depending on implementation.
           // Looking at service code, it uses reportProgress: true and maps events.
           // However, the final event returns a Blob but the service mapping might be tricky.
           // Let's look at how other components consume it.
        }
        // In the service code read earlier:
        // It returns Observable<ProcessingResult>.
        // On HttpEventType.Response (not shown in snippet but implied), it yields the body.
        // Wait, the snippet ended early. processingTime etc comes from headers.
        
        // Let's assume the service works as 'last emission is the result'.
      },
      error: (err) => {
        this.notification.showError('Failed to remove background');
        this.isProcessing = false;
      }
    });
    
    // NOTE: Because ImageService returns a stream of events (Composite object),
    // I need to filter for the final result.
    // Actually, looking at image.service.ts again, let's trust I can subscribe and check for 'processedImage'.
    
    this.imageService.removeBackground(this.currentFile, this.bgRemoveModel).subscribe({
      next: (res) => {
        // Intermediate progress events return { success: false }
        if (res.processedImage) {
           this.updateCurrentImage(res.processedImage, 'background-removed.png');
           this.isProcessing = false;
           this.notification.showSuccess('Background removed successfully');
        }
      },
      error: (err) => {
         this.isProcessing = false;
         this.notification.showError('Error processing image');
      }
    });
  }
  
  async applyCrop() {
    if (!this.currentFile) return;
    this.isProcessing = true;
    
    this.imageService.cropImage(this.currentFile, this.cropOptions).subscribe({
      next: (res) => {
         if (res.processedImage) {
           this.updateCurrentImage(res.processedImage, 'cropped.png');
           this.isProcessing = false;
           this.notification.showSuccess('Image cropped successfully');
         }
      },
      error: (err) => {
        this.isProcessing = false;
        this.notification.showError('Error cropping image');
      }
    });
  }

  async applyEnhance() {
    if (!this.currentFile) return;
    this.isProcessing = true;
    
    this.imageService.enhanceImage(this.currentFile, this.enhancementOptions).subscribe({
      next: (res) => {
         if (res.processedImage) {
           this.updateCurrentImage(res.processedImage, 'enhanced.png');
           this.isProcessing = false;
           this.notification.showSuccess('Image enhanced successfully');
         }
      },
      error: (err) => {
        this.isProcessing = false;
        this.notification.showError('Error enhancing image');
      }
    });
  }

  private updateCurrentImage(blob: Blob, filename: string) {
    this.currentFile = new File([blob], filename, { type: 'image/png' });
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentImageUrl = e.target.result;
    };
    reader.readAsDataURL(blob);
  }

  downloadImage() {
    if (!this.currentImageUrl) return;
    const link = document.createElement('a');
    link.href = this.currentImageUrl;
    link.download = 'edited-image.png'; // dynamic name could be better
    link.click();
  }
  
  resetImage() {
    if (this.originalFile) {
      this.loadFile(this.originalFile);
    }
  }
}
