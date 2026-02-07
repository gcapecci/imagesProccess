import { Component, Output, EventEmitter, Input } from '@angular/core';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: string;
  quality: 'standard' | 'premium';
}

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrls: ['./model-selector.component.scss']
})
export class ModelSelectorComponent {
  @Output() modelSelected = new EventEmitter<string>();
  @Input() disabled = false;

  selectedModelId = 'u2net';

  models: AIModel[] = [
    {
      id: 'u2net',
      name: 'U²-Net Standard',
      description: 'Fast and efficient model for general purpose background removal. Best for simple backgrounds and quick results.',
      icon: 'flash_on',
      quality: 'standard'
    },
    {
      id: 'isnet-general-use',
      name: 'ISNet Enhanced',
      description: 'Advanced model with alpha matting and post-processing. Superior quality for complex backgrounds, fine details, and smooth edges. Recommended for professional results.',
      icon: 'auto_awesome',
      quality: 'premium'
    }
  ];

  ngOnInit() {
    // Emit initial selection
    this.modelSelected.emit(this.selectedModelId);
  }

  onModelChange() {
    this.modelSelected.emit(this.selectedModelId);
  }
}
