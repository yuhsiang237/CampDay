import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.html',
  styleUrls: ['./loading-overlay.scss'],
})
export class LoadingOverlay {
  @Input() isLoading: boolean = false;
  @Input() message: string = '載入中…';
}
