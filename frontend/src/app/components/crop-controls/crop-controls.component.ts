import { Component, Output, EventEmitter, Input } from '@angular/core';

export interface CropOptions {
  width: number;
  height: number;
  aspectRatio: string;
  autoDetect: boolean;
  x?: number;
  y?: number;
}

@Component({
  selector: 'app-crop-controls',
  templateUrl: './crop-controls.component.html',
  styleUrls: ['./crop-controls.component.scss']
})
export class CropControlsComponent {
  @Input() disabled = false;
  @Input() isProcessing = false;
  @Input() hasImage = false;
  @Output() optionsChanged = new EventEmitter<CropOptions>();
  @Output() cropImage = new EventEmitter<void>();

  // Crop dimensions
  width = 800;
  height = 600;
  
  // Aspect ratio presets
  aspectRatio = 'custom';
  aspectRatios = [
    { value: 'custom', label: 'Custom', ratio: null },
    { value: '16:9', label: '16:9 (Landscape)', ratio: 16/9 },
    { value: '4:3', label: '4:3 (Standard)', ratio: 4/3 },
    { value: '1:1', label: '1:1 (Square)', ratio: 1 },
    { value: '9:16', label: '9:16 (Portrait)', ratio: 9/16 },
    { value: '3:4', label: '3:4 (Portrait)', ratio: 3/4 }
  ];

  // Auto-detect toggle
  autoDetect = false;

  onAspectRatioChange(): void {
    const selected = this.aspectRatios.find(ar => ar.value === this.aspectRatio);
    if (selected && selected.ratio) {
      // Adjust height based on width and ratio
      this.height = Math.round(this.width / selected.ratio);
    }
    this.emitChanges();
  }

  onWidthChange(): void {
    const selected = this.aspectRatios.find(ar => ar.value === this.aspectRatio);
    if (selected && selected.ratio) {
      this.height = Math.round(this.width / selected.ratio);
    }
    this.emitChanges();
  }

  onHeightChange(): void {
    const selected = this.aspectRatios.find(ar => ar.value === this.aspectRatio);
    if (selected && selected.ratio) {
      this.width = Math.round(this.height * selected.ratio);
    }
    this.emitChanges();
  }

  onAutoDetectToggle(): void {
    this.emitChanges();
  }

  resetAll(): void {
    this.width = 800;
    this.height = 600;
    this.aspectRatio = 'custom';
    this.autoDetect = false;
    this.emitChanges();
  }

  private emitChanges(): void {
    this.optionsChanged.emit({
      width: this.width,
      height: this.height,
      aspectRatio: this.aspectRatio,
      autoDetect: this.autoDetect
    });
  }
}
