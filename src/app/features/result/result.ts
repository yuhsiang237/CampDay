// Angular 核心模組
import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// 服務
import { CampDataService } from '@core/services/camp-data.service';
import { WeatherService } from '@core/services/weather.service';

// 介面
import { CampSearch } from '@core/interfaces/CampSearch';
import { CampDistData } from '@core/interfaces/CampDistData';
import { DistrictWeather, GroupedWeather } from '@core/interfaces/WeatherAPI';

// 共用 / component
import { LoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';
import { CampSearchCard } from '@shared/components/camp-search-card/camp-search-card';
import { CampWeatherComponent } from '@shared/components/camp-weather-component/camp-weather-component';
import { CampListComponent } from '@shared/components/camp-list-component/camp-list-component';

// 型別化 formData，給 default 空字串
interface FormData {
  campDate: string;
  city: string;
}

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
  styleUrls: ['./result.scss'],
})
export class Result {
  formData!: FormData;
  campSearch!: CampSearch;
  campDistData: CampDistData[] = [];
  locationWeather: DistrictWeather[] = [];
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private location: Location,
    private campDataService: CampDataService,
    private weatherService: WeatherService,
  ) {
    const navData =
      this.router.getCurrentNavigation()?.extras.state?.['formData'];
    this.formData = {
      campDate: navData?.campDate ?? '',
      city: navData?.city ?? '',
    };
    this.campSearch = this.toCampSearch(this.formData);
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await Promise.all([this.loadWeather(), this.loadCampSites()]);
    this.isLoading = false;
  }

  private async loadWeather(): Promise<void> {
    try {
      this.locationWeather = await this.weatherService.getWeather(
        this.campSearch.city,
      );
    } catch (err) {
      console.error('載入天氣資料失敗', err);
      this.locationWeather = [];
    }
  }

  private async loadCampSites(): Promise<void> {
    try {
      const campSites = await this.campDataService.getCampSites();
      const filtered = this.campDataService.filterByCity(
        campSites,
        this.campSearch.city,
      );
      this.campDistData = this.campDataService.groupByDistrict(filtered);
    } catch (err) {
      console.error('載入營地資料失敗', err);
      this.campDistData = [];
    }
  }

  goBack(): void {
    this.location.back();
  }

  private toCampSearch(data: FormData): CampSearch {
    return {
      campDate: data.campDate,
      city: data.city,
    };
  }

  getWeatherByDistrictGrouped(districtName: string): GroupedWeather {
    if (!this.locationWeather || this.locationWeather.length === 0) {
      // 尚未載入資料時回傳空物件
      return {};
    }
    return this.weatherService.getWeatherByDistrictGrouped(
      this.locationWeather,
      districtName,
    );
  }
}
