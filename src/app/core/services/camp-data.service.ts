import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Papa from 'papaparse';

// 介面
import { CampSite } from '@core/interfaces/CampSite';
import { CampDistData } from '@core/interfaces/CampDistData';

@Injectable({
  providedIn: 'root', // ✅ standalone component 可以直接注入
})
export class CampDataService {
  private readonly csvUrl: string = 'assets/campdata.csv';

  constructor(private http: HttpClient) {}

  /** 讀 CSV 並轉成 CampSite[] */
  getCampSites(): Observable<CampSite[]> {
    return this.http.get(this.csvUrl, { responseType: 'text' }).pipe(
      map((csvData) => this.mapCsvToCampSites(csvData)),
      catchError((err) => {
        console.error('CSV 讀取失敗', err);
        return of([] as CampSite[]); // 錯誤時回傳空陣列，不讓 stream 爆掉
      }),
    );
  }

  /** CSV 文字轉 CampSite[] */
  private mapCsvToCampSites(csvData: string): CampSite[] {
    const parsed = Papa.parse<Record<string, string>>(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    return (parsed.data as Record<string, string>[]).map((row) => ({
      name: row['露營場名稱'],
      city: row['縣市別'],
      cityCode: row['縣市代碼'],
      district: row['鄉/鎮/市/區'],
      status: row['營業狀態'],
      longitude: parseFloat(row['經度']),
      latitude: parseFloat(row['緯度']),
      address: row['地址'],
      phone: row['電話'] || undefined,
      mobile: row['手機'] || undefined,
      website: row['網站'] || undefined,
      complianceOrViolation: row['符合相關法規露營場／違反相關法規露營場'],
      violationType: row['違反相關法規'],
      indigenousArea: row['是否有在原民區'],
      establishedTime: row['露營場設置時間'] || undefined,
    }));
  }

  /** 過濾符合縣市的露營場 */
  filterByCity(sites: CampSite[], city: string): CampSite[] {
    return sites.filter((site) => site.city.trim() === city.trim());
  }

  /** 依 district 分組 CampSite，回傳 CampDistData[] */
  groupByDistrict(sites: CampSite[]): CampDistData[] {
    const map: Record<string, CampSite[]> = {};

    sites.forEach((site) => {
      const key = site.district || '未分類';
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(site);
    });

    return Object.keys(map)
      .map((key) => ({ district: key, data: map[key] }))
      .sort((a, b) => a.district.localeCompare(b.district));
  }
}
