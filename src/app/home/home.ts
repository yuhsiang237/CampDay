import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common'; // <-- 匯入 CommonModule
import Papa from 'papaparse';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CampSite } from './../../interfaces/CampSite'; // 假設你把 interface 放這
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  campForm!: FormGroup;
  dates: string[] = []; // 下拉選單日期
  campSites: CampSite[] = []; // 存放 CSV 轉成的 JSON
  cities: any[] = []; // 存放 CSV 轉成的 JSON

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // 產生未來 7 天日期字串
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.dates.push(date.toISOString().split('T')[0]); // 格式 YYYY-MM-DD
    }

    // 建立表單
    this.campForm = this.fb.group({
      campDate: ['', Validators.required],
      city: ['', Validators.required], // 新增 city 欄位
    });

    // 使用 HttpClient 讀取 CSV
    this.http
      .get('assets/campdata.csv', { responseType: 'text' })
      .subscribe((csvData) => {
        // 使用 mapping function 將 CSV 轉成 CampSite[]
        this.campSites = this.mapCsvToCampSites(csvData);

        this.cities = Array.from(
          new Set(this.campSites.map((site) => site.city)),
        );
        console.log('縣市選單:', this.cities);
        console.log('Mapped CampSites:', this.campSites);
      });
  }

  /**
   * 將 CSV 文字轉成 CampSite[]
   * @param csvData CSV 原始文字
   * @returns CampSite[]
   */
  mapCsvToCampSites(csvData: string): CampSite[] {
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
  submitForm() {
    if (this.campForm.valid) {
      // 可將表單資料帶到結果頁
      this.router.navigate(['/result'], {
        state: { formData: this.campForm.value },
      });
    } else {
      this.campForm.markAllAsTouched();
    }
  }
}
