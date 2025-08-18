import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-camp-weather',
  imports: [CommonModule],
  templateUrl: './camp-weather-component.html',
  styleUrl: './camp-weather-component.scss',
})
export class CampWeatherComponent {
  @Input() districtName!: string;
  @Input() weatherGrouped: { [date: string]: any[] } = {};

  getMaxSlots(): number {
    let max = 0;
    for (const key in this.weatherGrouped) {
      if (this.weatherGrouped[key].length > max)
        max = this.weatherGrouped[key].length;
    }
    return max;
  }
}
