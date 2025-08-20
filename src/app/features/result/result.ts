import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { LoadingOverlay } from './../../shared/components/loading-overlay/loading-overlay';
import { CampSearchCard } from './../../shared/components/camp-search-card/camp-search-card';
import { CampWeatherComponent } from './../../shared/components/camp-weather-component/camp-weather-component';
import { CampListComponent } from './../../shared/components/camp-list-component/camp-list-component';

// 介面
import { CampSite } from './../../core/interfaces/CampSite';
import { CampSearch } from './../../core/interfaces/CampSearch';
import { CampDistData } from './../../core/interfaces/CampDistData';
import { WeatherAPI } from './../../core/interfaces/WeatherAPI';

import { environment } from './../../../environments/environment';

import weatherAPI from './../../../../public/assets/weatherAPI.json';

import { CampDataService } from '../../core/services/camp-data.service';

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
  providers: [CampDataService],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class Result {
  formData: any;
  campSearch!: CampSearch;
  campSites: CampSite[] = [];
  campSiteSearchResults: CampSite[] = [];
  campDistData: CampDistData[] = [];
  weather: any;
  cityApiMap: WeatherAPI = weatherAPI as WeatherAPI;
  locationWeather: any[] = [];
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private http: HttpClient,
    private location: Location,
    private campDataService: CampDataService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras.state?.['formData'];
    this.campSearch = this.toCampSiteSearchResults(this.formData);
  }
  goBack(): void {
    this.location.back();
  }
  getMaxSlots(data: Record<string, any[]>): number {
    let max = 0;
    for (const key in data) {
      if (data[key].length > max) max = data[key].length;
    }
    return max;
  }
  normalizeWeatherSlots(raw: any): any {
    const normalized: any = {};

    Object.keys(raw).forEach((date) => {
      const slots = raw[date];

      // 預設兩個時間段 → 用 null 表示
      const newSlots: (any | null)[] = [null, null];

      slots.forEach((slot: any) => {
        const [startStr, endStr] = slot.timeRange
          .split('~')
          .map((s: string) => s.trim());
        let startHour = parseInt(startStr.split(':')[0], 10);
        let endHour = parseInt(endStr.split(':')[0], 10);

        // 處理跨日，例如 18:00 ~ 06:00
        if (endHour <= startHour) {
          endHour += 24; // 讓跨日變成連續時間，例如 18 → 30
        }

        const midHour = Math.floor((startHour + endHour) / 2) % 24; // 中點取 0-23

        // 上午 slot
        if (midHour < 12) {
          newSlots[0] = {
            ...slot,
            timeRange: '00:00 ~ 12:00',
            label: '凌晨~中午',
          };
        }
        // 下午 slot
        else {
          newSlots[1] = {
            ...slot,
            timeRange: '13:00 ~ 23:00',
            label: '下午~晚上',
          };
        }
      });

      normalized[date] = newSlots;
    });

    return normalized;
  }

  async ngOnInit(): Promise<void> {
    await this.loadWeather();
    this.campSites = await this.campDataService.getCampSites(
      'assets/campdata.csv',
    );

    const filtered = this.campDataService.filterByCity(
      this.campSites,
      this.campSearch.city,
    );

    this.campDistData = this.campDataService.groupByDistrict(filtered);

    this.isLoading = false;
  }

  /** 轉換 formData 成 CampSearch */
  toCampSiteSearchResults(data: any): CampSearch {
    return {
      campDate: data?.campDate ?? '',
      city: data?.city ?? '',
    };
  }

  getApiByCity(city: string): string | undefined {
    return this.cityApiMap[city]?.api;
  }
  async loadWeather(): Promise<void> {
    try {
      const apiUrl = `https://opendata.cwa.gov.tw/api/${this.getApiByCity(this.campSearch.city)}?Authorization=${environment.CWA_API_KEY}`;
      // firstValueFrom 將 Observable 轉成 Promise
      this.weather = await firstValueFrom(this.http.get(apiUrl));
      this.locationWeather = this.weather.records.Locations[0].Location;
      console.log('取得天氣資料:', this.locationWeather);
    } catch (err) {
      console.error('取得天氣資料失敗', err);
    }
  }

  // helper function 回傳第一個日期的時間段，用於表頭
  getFirstDaySlots(districtName: string): any[] {
    const grouped: any = this.getWeatherByDistrictGrouped(districtName);
    const firstKey = Object.keys(grouped)[0];
    return firstKey ? grouped[firstKey] : [];
  }
  encodeURL(value: string): string {
    return encodeURIComponent(value);
  }
  getWeatherByDistrictGrouped(districtName: string): { [date: string]: any[] } {
    const districtData = this.locationWeather?.find(
      (item: any) => item.LocationName === districtName,
    );
    if (!districtData) return {};

    const grouped: { [date: string]: any[] } = {};
    const elements: any = {};
    districtData.WeatherElement.forEach(
      (el: any) => (elements[el.ElementName] = el.Time),
    );

    const maxTemps = elements['最高溫度'];
    const minTemps = elements['最低溫度'];
    const weatherStates = elements['天氣現象'];

    maxTemps.forEach((slot: any, idx: number) => {
      const start = new Date(slot.StartTime);
      const end = new Date(slot.EndTime);
      const dateStr = start.toISOString().slice(5, 10).replace('-', '/');

      if (!grouped[dateStr]) grouped[dateStr] = [];

      grouped[dateStr].push({
        label: start.getDate() !== end.getDate() ? '夜間' : '',
        timeRange: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} ~ ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
        maxTemp: slot.ElementValue[0].MaxTemperature,
        minTemp: minTemps[idx].ElementValue[0].MinTemperature,
        weather: weatherStates[idx].ElementValue[0].Weather,
      });
    });
    console.log('分組後的天氣資料:', districtName, grouped);
    return this.normalizeWeatherSlots(grouped);
  }

  getWeatherByLocationAny(location: string) {
    const locationData = this.locationWeather?.find(
      (item) => item.LocationName === location,
    );
    if (!locationData) return null;

    const result: any = {};

    locationData.WeatherElement.forEach((element: any) => {
      // 直接把整個 Time 陣列存進結果
      result[element.ElementName] = element.Time;
    });

    return result;
  }
}
