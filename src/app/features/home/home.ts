import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { AbstractControl } from '@angular/forms';

// 第三方套件
import Papa from 'papaparse';

// 介面
import { CampSite } from '../../core/interfaces/CampSite';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  // 表單
  campForm!: FormGroup; // 我保證這個變數在使用前會被賦值，請 TypeScript 不要再抱怨它可能是 undefined。

  // 下拉選單與資料
  dates: string[] = [];
  cities: string[] = [];
  campSites: CampSite[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.generateNext7Days();
    this.buildForm();
    this.loadCampData();
  }

  /** 建立表單 */
  private buildForm(): void {
    this.campForm = this.fb.group({
      campDate: [
        '',
        [
          Validators.required,
          (control: AbstractControl) => {
            if (!control.value) return null;
            const selected = new Date(control.value);
            const today = new Date();
            const maxDate = new Date();
            maxDate.setDate(today.getDate() + 6); // 今日 + 6 天
            return selected < today || selected > maxDate
              ? { max7Days: true }
              : null;
          },
        ],
      ],
      city: ['', Validators.required],
    });
  }

  /** 產生未來 7 天日期字串 */
  private generateNext7Days(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      this.dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
    }
  }

  /** 讀取 CSV 並轉成 CampSite[] */
  private loadCampData(): void {
    this.http
      .get('assets/campdata.csv', { responseType: 'text' })
      .subscribe((csvData) => {
        this.campSites = this.mapCsvToCampSites(csvData);

        // 取得唯一縣市
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

  /** 表單送出 */
  submitForm(): void {
    if (this.campForm.valid) {
      // 導向結果頁，並帶入表單資料
      this.router.navigate(['/result'], {
        state: { formData: this.campForm.value },
      });
    } else {
      this.campForm.markAllAsTouched();
    }
  }
}
