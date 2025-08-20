import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

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
    this.formData = {
      campDate: navData?.campDate ?? '',
      city: navData?.city ?? '',
    };
    this.campSearch = this.toCampSearch(this.formData);
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

  private toCampSearch(data: FormData): CampSearch {
    return {
      campDate: data.campDate,
      city: data.city,
    };
  }

  getWeatherByDistrictGrouped(districtName: string): GroupedWeather {
    if (!this.locationWeather || this.locationWeather.length === 0) {
      return {};
    }
    return this.weatherService.getWeatherByDistrictGrouped(
      this.locationWeather,
      districtName,
    );
  }
}
