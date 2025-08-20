import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from './../../../environments/environment';
import { WeatherAPI } from '../interfaces/WeatherAPI';
import weatherAPI from './../../../../public/assets/weatherAPI.json';
import { DistrictWeather, GroupedWeather, WeatherPeriod } from '../interfaces/WeatherAPI';

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
  async getWeather(city: string): Promise<DistrictWeather[]> {
    try {
      const apiUrl = `https://opendata.cwa.gov.tw/api/${this.getApiByCity(
        city
      )}?Authorization=${environment.CWA_API_KEY}`;
      const weatherResponse = await firstValueFrom(this.http.get<any>(apiUrl));
      return weatherResponse.records.Locations[0].Location as DistrictWeather[];
    } catch (err) {
      console.error('取得天氣資料失敗', err);
      return [];
    }
  }

  /** 將天氣資料分組，並格式化成上午/下午區段 */
  normalizeWeatherSlots(raw: GroupedWeather): GroupedWeather {
    const normalized: GroupedWeather = {};

    Object.keys(raw).forEach((date) => {
      const slots = raw[date];
      const newSlots: (GroupedWeather[typeof date][0] | null)[] = [null, null];

      slots.forEach((slot) => {
        if (!slot) return;

        const [startStr, endStr] = slot.timeRange.split('~').map((s) => s.trim());
        let startHour = parseInt(startStr.split(':')[0], 10);
        let endHour = parseInt(endStr.split(':')[0], 10);

        if (endHour <= startHour) endHour += 24;

        const midHour = Math.floor((startHour + endHour) / 2) % 24;

        if (midHour < 12) {
          newSlots[0] = { ...slot, timeRange: '00:00 ~ 12:00', label: '凌晨~中午' };
        } else {
          newSlots[1] = { ...slot, timeRange: '13:00 ~ 23:00', label: '下午~晚上' };
        }
      });

      normalized[date] = newSlots as GroupedWeather[typeof date];
    });

    return normalized;
  }

  /** 指定行政區分組天氣 */
  getWeatherByDistrictGrouped(
    locationWeather: DistrictWeather[],
    districtName: string
  ): GroupedWeather {
    const districtData = locationWeather.find((item) => item.LocationName === districtName);
    if (!districtData) return {};

    const grouped: GroupedWeather = {};
    const elements: Record<string, WeatherPeriod[]> = {};

    districtData.WeatherElement.forEach((el) => (elements[el.ElementName] = el.Time));

    const maxTemps = elements['最高溫度'] || [];
    const minTemps = elements['最低溫度'] || [];
    const weatherStates = elements['天氣現象'] || [];

    maxTemps.forEach((period, idx) => {
      const start = new Date(period.StartTime);
      const end = new Date(period.EndTime);
      const dateStr = start.toISOString().slice(5, 10).replace('-', '/');

      if (!grouped[dateStr]) grouped[dateStr] = [];

      grouped[dateStr].push({
        label: start.getDate() !== end.getDate() ? '夜間' : '',
        timeRange: `${start.getHours().toString().padStart(2, '0')}:${start
          .getMinutes()
          .toString()
          .padStart(2, '0')} ~ ${end.getHours().toString().padStart(2, '0')}:${end
            .getMinutes()
            .toString()
            .padStart(2, '0')}`,
        maxTemp: period.ElementValue[0].MaxTemperature,
        minTemp: minTemps[idx]?.ElementValue[0]?.MinTemperature,
        weather: weatherStates[idx]?.ElementValue[0]?.Weather,
      });
    });

    return this.normalizeWeatherSlots(grouped);
  }
}
