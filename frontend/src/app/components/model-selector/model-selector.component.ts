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
  template: `
    <mat-card class="model-selector-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>tune</mat-icon>
          Select AI Model Quality
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <p class="description">Choose the AI model that best fits your needs</p>
        
        <mat-radio-group 
          [(ngModel)]="selectedModelId"
          (change)="onModelChange()"
          [disabled]="disabled"
          class="model-options">
          
          <mat-radio-button 
            *ngFor="let model of models" 
            [value]="model.id"
            class="model-option">
            <div class="model-info">
              <div class="model-header">
                <mat-icon [color]="model.quality === 'premium' ? 'accent' : 'primary'">
                  {{ model.icon }}
                </mat-icon>
                <span class="model-name">{{ model.name }}</span>
                <mat-chip *ngIf="model.quality === 'premium'" color="accent">Premium</mat-chip>
              </div>
              <p class="model-description">{{ model.description }}</p>
            </div>
          </mat-radio-button>
        </mat-radio-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .model-selector-card {
      margin-bottom: 24px;
    }

    .description {
      color: #666;
      margin-bottom: 16px;
    }

    .model-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .model-option {
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
      width: 100%;
    }

    .model-option:hover {
      border-color: #3f51b5;
      background-color: #f5f5f5;
    }

    ::ng-deep .mat-radio-button.mat-accent.mat-radio-checked .model-option {
      border-color: #3f51b5;
      background-color: #e8eaf6;
    }

    .model-info {
      margin-left: 8px;
    }

    .model-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .model-name {
      font-size: 1.1rem;
      font-weight: 500;
      color: #212121;
    }

    .model-description {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    mat-chip {
      height: 24px;
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .model-header {
        flex-wrap: wrap;
      }
    }
  `]
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
