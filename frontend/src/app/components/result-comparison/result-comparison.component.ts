import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-result-comparison',
  templateUrl: './result-comparison.component.html',
  styleUrls: ['./result-comparison.component.scss']
})
export class ResultComparisonComponent {
  @Input() title = 'Result';
  @Input() originalImage: string | null = '';
  @Input() resultImage: string | null = '';
  @Input() originalLabel = 'Before';
  @Input() resultLabel = 'After';
  @Input() resultTitle = 'Processed';
  @Input() downloadLabel = 'Download Image';

  @Output() download = new EventEmitter<void>();

  onDownload(): void {
    this.download.emit();
  }
}
