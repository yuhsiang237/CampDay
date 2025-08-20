// Angular 核心模組
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular 表單相關
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

// HTTP 與服務
import { HttpClientModule } from '@angular/common/http';
import { CampDataService } from '@core/services/camp-data.service';

// RxJS
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';

// 自訂工具與介面
import { max7DaysValidator } from '@core/utils/form-validators';
import { CampSite } from '@core/interfaces/CampSite';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  providers: [CampDataService],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  // 明確型態化 FormGroup
  campForm!: FormGroup<{
    campDate: FormControl<string>;
    city: FormControl<string>;
  }>;

  // 日期與縣市陣列
  dates: ReadonlyArray<string> = [];
  cities: ReadonlyArray<string> = [];

  // CSV 轉出的資料
  campSites: ReadonlyArray<CampSite> = [];

  // UX 狀態
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private campDataService: CampDataService,
  ) {}

  ngOnInit(): void {
    this.generateNext7Days();
    this.buildForm();
    this.loadCampData(); // ✅ 改成 RxJS
  }

  /** 建立表單 */
  private buildForm(): void {
    this.campForm = this.fb.group({
      campDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, max7DaysValidator],
      }),
      city: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  /** 產生未來 7 天日期字串 */
  private generateNext7Days(): void {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    this.dates = dates;
  }

  /** 讀取 CSV 並轉成 CampSite[]，加上錯誤處理與 loading */
  private loadCampData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.campDataService
      .getCampSites() // ✅ 回傳 Observable<CampSite[]>
      .pipe(
        map((sites) => {
          this.campSites = sites;
          this.cities = Array.from(new Set(sites.map((site) => site.city)));
        }),
        catchError((error) => {
          console.error('CSV 讀取失敗', error);
          this.errorMessage = '資料讀取失敗，請稍後再試。';
          return of(null); // ✅ 回傳 fallback Observable，避免中斷
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe();
  }

  /** 表單送出 */
  submitForm(): void {
    if (this.campForm.valid) {
      this.router.navigate(['/result'], {
        state: { formData: this.campForm.value },
      });
    } else {
      this.campForm.markAllAsTouched();
    }
  }
}
