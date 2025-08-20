import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { CampDataService } from '@core/services/camp-data.service';
import { max7DaysValidator } from '@core/utils/form-validators';
import { CampSite } from '@core/interfaces/CampSite';

import { catchError, finalize, map, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  // FormGroup 型態化
  campForm!: FormGroup<{
    campDate: FormControl<string>;
    city: FormControl<string>;
  }>;

  // 未來 7 天與城市選項
  dates: ReadonlyArray<string> = [];
  cities: ReadonlyArray<string> = [];

  // 營地資料
  campSites: ReadonlyArray<CampSite> = [];

  // UX 狀態
  loading = false;
  errorMessage: string | null = null;

  private readonly DAYS_TO_GENERATE = 7;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private campDataService: CampDataService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.generateNextDays();
    this.loadCampData();
  }

  /** 建立表單 */
  private initForm(): void {
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
  private generateNextDays(): void {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < this.DAYS_TO_GENERATE; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    this.dates = dates;
  }

  /** 讀取 CSV 並轉成 CampSite[] */
  private loadCampData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.campDataService
      .getCampSites()
      .pipe(
        map((sites) => {
          this.campSites = sites;
          this.cities = Array.from(new Set(sites.map((s) => s.city)));
        }),
        catchError((error) => {
          console.error('CSV 讀取失敗', error);
          this.errorMessage = '資料讀取失敗，請稍後再試。';
          return of(null);
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
