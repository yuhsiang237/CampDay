import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';

import { CampDataService } from '@core/services/camp-data.service';
import { WeatherService } from '@core/services/weather.service';

import { CampSearch } from '@core/interfaces/CampSearch';
import { CampDistData } from '@core/interfaces/CampDistData';
import { DistrictWeather, GroupedWeather } from '@core/interfaces/WeatherAPI';

import { LoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';
import { CampSearchCard } from '@shared/components/camp-search-card/camp-search-card';
import { CampWeatherComponent } from '@shared/components/camp-weather-component/camp-weather-component';
import { CampListComponent } from '@shared/components/camp-list-component/camp-list-component';

import { catchError, forkJoin, map, of, Observable } from 'rxjs';

interface FormData {
  campDate: string;
  city: string;
}

@Component({
  standalone: true,
  selector: 'app-result',
  imports: [
    CommonModule,
    CampSearchCard,
    LoadingOverlay,
    CampWeatherComponent,
    CampListComponent,
  ],
  templateUrl: './result.html',
  styleUrls: ['./result.scss'],
})
export class Result implements OnInit {
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

    // 防呆判斷
    if (
      !navData ||
      typeof navData.campDate !== 'string' ||
      typeof navData.city !== 'string'
    ) {
      console.warn('未收到有效的 formData，返回上一頁');
      this.location.back();
      return;
    }
    this.formData = {
      campDate: navData.campDate,
      city: navData.city,
    };
    this.campSearch = { ...this.formData };
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  private loadAllData(): void {
    this.isLoading = true;

    forkJoin({
      weather: this.loadWeather$(),
      camps: this.loadCampSites$(),
    }).subscribe({
      next: ({ weather, camps }) => {
        this.locationWeather = weather;
        this.campDistData = camps;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('載入資料失敗', err);
        this.isLoading = false;
      },
    });
  }

  /** 載入天氣資料 Observable */
  private loadWeather$(): Observable<DistrictWeather[]> {
    return this.weatherService.getWeather(this.campSearch.city).pipe(
      catchError((err) => {
        console.error('載入天氣資料失敗', err);
        return of([] as DistrictWeather[]);
      }),
    );
  }

  /** 載入營地資料 Observable */
  private loadCampSites$(): Observable<CampDistData[]> {
    return this.campDataService.getCampSites().pipe(
      map((campSites) =>
        this.campDataService.groupByDistrict(
          this.campDataService.filterByCity(campSites, this.campSearch.city),
        ),
      ),
      catchError((err) => {
        console.error('載入營地資料失敗', err);
        return of([] as CampDistData[]);
      }),
    );
  }

  goBack(): void {
    this.location.back();
  }

  getWeatherByDistrictGrouped(districtName: string): GroupedWeather {
    if (!this.locationWeather.length) return {};
    return this.weatherService.getWeatherByDistrictGrouped(
      this.locationWeather,
      districtName,
    );
  }
}
