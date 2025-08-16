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

  constructor(private router: Router, private http: HttpClient) {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras.state?.['formData'];
    this.campSearch = this.toCampSiteSearchResults(this.formData);
  }

  async ngOnInit(): Promise<void> {
    await this.loadCampData();
    console.log('xxxxxx-->', this.campSites);

    // 載入完資料後再過濾
    this.campSiteSearchResults = this.filterCampSites();
    this.campDistData = this.groupByDistrict(this.campSiteSearchResults)
    console.log('過濾後結果:', this.campDistData);
  }

  private filterCampSites(): CampSite[] {
    console.log('rrr', this.campSites);
    return this.campSites.filter(
      (x) => x.city.trim() === this.campSearch.city.trim()
    );
  }

  private async loadCampData(): Promise<void> {
    const csvData = await firstValueFrom(
      this.http.get('assets/campdata.csv', { responseType: 'text' })
    );
    this.campSites = this.mapCsvToCampSites(csvData);
    console.log('Mapped CampSites:', this.campSites);
  }

  /**
   * 將 CSV 文字轉成 CampSite[]
   * @param csvData CSV 原始文字
   * @returns CampSite[]
   */
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
      complianceOrViolation:
        row['符合相關法規露營場／違反相關法規露營場'],
      violationType: row['違反相關法規'],
      indigenousArea: row['是否有在原民區'],
      establishedTime: row['露營場設置時間'] || undefined,
    }));
  }

  toCampSiteSearchResults(data: any): CampSearch {
    return {
      campDate: data?.campDate ?? '',
      city: data?.city ?? '',
    };
  }

  private groupByDistrict(sites: CampSite[]): CampDistData[] {
    const map: Record<string, CampSite[]> = {};

    sites.forEach(site => {
      const key = site.district || '未分類';
      if (!map[key]) map[key] = [];
      map[key].push(site);
    });

    // 轉成陣列，方便 *ngFor
    const grouped: CampDistData[] = Object.keys(map).map(key => ({
      district: key,
      data: map[key],
    }));

    // 可選：依 district 排序
    grouped.sort((a, b) => a.district.localeCompare(b.district));

    return grouped;
  }
}