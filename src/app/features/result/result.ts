import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { LoadingOverlay } from './../../shared/components/loading-overlay/loading-overlay';
import { CampSearchCard } from './../../shared/components/camp-search-card/camp-search-card';
import { CampWeatherComponent } from './../../shared/components/camp-weather-component/camp-weather-component';
import { CampListComponent } from './../../shared/components/camp-list-component/camp-list-component';

// 介面
import { CampSite } from './../../core/interfaces/CampSite';
import { CampSearch } from './../../core/interfaces/CampSearch';
import { CampDistData } from './../../core/interfaces/CampDistData';

import { CampDataService } from '../../core/services/camp-data.service';
import { WeatherService } from '../../core/services/weather.service';

@Component({
  standalone: true,
  selector: 'app-result',
  imports: [
    CommonModule,
    HttpClientModule,
    CampSearchCard,
    LoadingOverlay,
    CampWeatherComponent,
    CampListComponent,
  ],
  providers: [CampDataService, WeatherService],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result {
  formData: any;
  campSearch!: CampSearch;
  campSites: CampSite[] = [];
  campDistData: CampDistData[] = [];
  locationWeather: any[] = [];
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private location: Location,
    private campDataService: CampDataService,
    private weatherService: WeatherService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras.state?.['formData'];
    this.campSearch = this.toCampSiteSearchResults(this.formData);
  }

  async ngOnInit(): Promise<void> {
    this.locationWeather = await this.weatherService.getWeather(this.campSearch.city);

    this.campSites = await this.campDataService.getCampSites('assets/campdata.csv');
    const filtered = this.campDataService.filterByCity(this.campSites, this.campSearch.city);
    this.campDistData = this.campDataService.groupByDistrict(filtered);

    this.isLoading = false;
  }

  goBack(): void {
    this.location.back();
  }

  /** 轉換 formData 成 CampSearch */
  private toCampSiteSearchResults(data: any): CampSearch {
    return {
      campDate: data?.campDate ?? '',
      city: data?.city ?? '',
    };
  }
  
  getWeatherByDistrictGrouped(districtName: string) {
    return this.weatherService.getWeatherByDistrictGrouped(this.locationWeather, districtName);
  }

  getWeatherByLocationAny(location: string) {
    return this.weatherService.getWeatherByLocationAny(this.locationWeather, location);
  }
}
