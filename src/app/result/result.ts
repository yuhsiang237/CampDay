import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Papa from 'papaparse';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

// 介面
import { CampSite } from './../../interfaces/CampSite';
import { CampSearch } from './../../interfaces/CampSearch';
import { CampDistData } from '../../interfaces/CampDistData';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-result',
  imports: [CommonModule, HttpClientModule],
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
  private apiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-007?Authorization=${environment.CWA_API_KEY}`;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras.state?.['formData'];
    this.campSearch = this.toCampSiteSearchResults(this.formData);
  }

  async ngOnInit(): Promise<void> {
    await this.loadWeather();

    await this.loadCampData();
    console.log('全部 CampSites:', this.campSites);

    this.campSiteSearchResults = this.filterCampSites();
    this.campDistData = this.groupByDistrict(this.campSiteSearchResults);
    console.log('過濾後結果:', this.campDistData);
  }

  /** 過濾符合縣市的露營場 */
  private filterCampSites(): CampSite[] {
    return this.campSites.filter(
      (site) => site.city.trim() === this.campSearch.city.trim(),
    );
  }

  /** 載入 CSV 並解析成 CampSite[] */
  private async loadCampData(): Promise<void> {
    const csvData = await firstValueFrom(
      this.http.get('assets/campdata.csv', { responseType: 'text' }),
    );
    this.campSites = this.mapCsvToCampSites(csvData);
    console.log('Mapped CampSites:', this.campSites);
  }

  /** 將 CSV 文字轉成 CampSite[] */
  private mapCsvToCampSites(csvData: string): CampSite[] {
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    return parsed.data.map((row: any) => ({
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

  /** 轉換 formData 成 CampSearch */
  toCampSiteSearchResults(data: any): CampSearch {
    return {
      campDate: data?.campDate ?? '',
      city: data?.city ?? '',
    };
  }

  /** 依 district 分組 CampSite，回傳 CampDistData[] */
  private groupByDistrict(sites: CampSite[]): CampDistData[] {
    const map: Record<string, CampSite[]> = {};

    sites.forEach((site) => {
      const key = site.district || '未分類';
      if (!map[key]) map[key] = [];
      map[key].push(site);
    });

    const grouped: CampDistData[] = Object.keys(map)
      .map((key) => ({ district: key, data: map[key] }))
      .sort((a, b) => a.district.localeCompare(b.district));

    return grouped;
  }

  async loadWeather() {
    try {
      // firstValueFrom 將 Observable 轉成 Promise
      this.weather = await firstValueFrom(this.http.get(this.apiUrl));
      console.log(this.weather);
    } catch (err) {
      console.error('取得天氣資料失敗', err);
    }
  }
}
