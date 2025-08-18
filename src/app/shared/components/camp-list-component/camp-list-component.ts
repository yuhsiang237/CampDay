import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampSite } from './../../../core/interfaces/CampSite';

@Component({
  selector: 'app-camp-list-component',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './camp-list-component.html',
  styleUrl: './camp-list-component.scss',
})
export class CampListComponent {
  @Input() campSites: CampSite[] = [];

  encodeURL(value: string): string {
    return encodeURIComponent(value);
  }
}
