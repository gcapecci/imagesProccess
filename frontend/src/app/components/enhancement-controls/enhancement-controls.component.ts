import { Component, Output, EventEmitter, Input } from '@angular/core';
import { EnhancementOptions } from '../../services/image.service';

@Component({
  selector: 'app-enhancement-controls',
  templateUrl: './enhancement-controls.component.html',
  styleUrls: ['./enhancement-controls.component.scss']
})
export class EnhancementControlsComponent {
  @Output() optionsChanged = new EventEmitter<EnhancementOptions>();
  @Input() disabled = false;

  brightness = 1.0;
  contrast = 1.0;
  saturation = 1.0;
  sharpness = 1.0;
  autoEnhance = false;
  denoise = false;

  get currentOptions(): EnhancementOptions {
    return {
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      sharpness: this.sharpness,
      autoEnhance: this.autoEnhance,
      denoise: this.denoise
    };
  }

  onSliderChange() {
    if (!this.autoEnhance) {
      this.optionsChanged.emit(this.currentOptions);
    }
  }

  onAutoEnhanceToggle() {
    if (this.autoEnhance) {
      // Reset sliders when auto-enhance is enabled
      this.brightness = 1.0;
      this.contrast = 1.0;
      this.saturation = 1.0;
      this.sharpness = 1.0;
    }
    this.optionsChanged.emit(this.currentOptions);
  }

  onDenoiseToggle() {
    this.optionsChanged.emit(this.currentOptions);
  }

  resetAll() {
    this.brightness = 1.0;
    this.contrast = 1.0;
    this.saturation = 1.0;
    this.sharpness = 1.0;
    this.autoEnhance = false;
    this.denoise = false;
    this.optionsChanged.emit(this.currentOptions);
  }

  formatLabel(value: number): string {
    return value.toFixed(1);
  }
}
