import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from './../../../environments/environment';
import { WeatherAPI } from '../interfaces/WeatherAPI';
import weatherAPI from './../../../../public/assets/weatherAPI.json';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private cityApiMap: WeatherAPI = weatherAPI as WeatherAPI;

  constructor(private http: HttpClient) { }

  /** 根據縣市名稱取得 API URL */
  private getApiByCity(city: string): string | undefined {
    return this.cityApiMap[city]?.api;
  }

  /** 取得天氣資料 */
  async getWeather(city: string): Promise<any[]> {
    try {
      const apiUrl = `https://opendata.cwa.gov.tw/api/${this.getApiByCity(city)}?Authorization=${environment.CWA_API_KEY}`;
      const weather = await firstValueFrom(this.http.get<any>(apiUrl));
      return weather.records.Locations[0].Location;
    } catch (err) {
      console.error('取得天氣資料失敗', err);
      return [];
    }
  }

  /** 將天氣資料分組，並格式化成上午/下午 slot */
  normalizeWeatherSlots(raw: any): any {
    const normalized: any = {};

    Object.keys(raw).forEach((date) => {
      const slots = raw[date];
      const newSlots: (any | null)[] = [null, null];

      slots.forEach((slot: any) => {
        const [startStr, endStr] = slot.timeRange.split('~').map((s: string) => s.trim());
        let startHour = parseInt(startStr.split(':')[0], 10);
        let endHour = parseInt(endStr.split(':')[0], 10);

        if (endHour <= startHour) {
          endHour += 24;
        }

        const midHour = Math.floor((startHour + endHour) / 2) % 24;

        if (midHour < 12) {
          newSlots[0] = { ...slot, timeRange: '00:00 ~ 12:00', label: '凌晨~中午' };
        } else {
          newSlots[1] = { ...slot, timeRange: '13:00 ~ 23:00', label: '下午~晚上' };
        }
      });

      normalized[date] = newSlots;
    });

    return normalized;
  }

  /** 指定行政區分組天氣 */
  getWeatherByDistrictGrouped(locationWeather: any[], districtName: string): { [date: string]: any[] } {
    const districtData = locationWeather?.find((item: any) => item.LocationName === districtName);
    if (!districtData) return {};

    const grouped: { [date: string]: any[] } = {};
    const elements: any = {};
    districtData.WeatherElement.forEach((el: any) => (elements[el.ElementName] = el.Time));

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

    return this.normalizeWeatherSlots(grouped);
  }

  /** 取得某個地點的原始天氣 element */
  getWeatherByLocationAny(locationWeather: any[], location: string) {
    const locationData = locationWeather?.find((item) => item.LocationName === location);
    if (!locationData) return null;

    const result: any = {};
    locationData.WeatherElement.forEach((element: any) => {
      result[element.ElementName] = element.Time;
    });

    return result;
  }
}
