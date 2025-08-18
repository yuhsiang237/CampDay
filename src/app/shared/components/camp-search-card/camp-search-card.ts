// 匯入 Angular 核心功能
import { Component, Input, Output, EventEmitter } from '@angular/core';
// Component → 用來定義 Angular 元件
// Input → 定義屬性可以從父 component 傳入
// Output → 定義事件可以向父 component 發射
// EventEmitter → 用來發射事件給父 component

// 匯入 CommonModule，提供 *ngIf、*ngFor 等 Angular 指令
import { CommonModule } from '@angular/common';

// 匯入自訂介面 CampSearch，用來定義資料結構
import { CampSearch } from '../../../core/interfaces/CampSearch';

// 使用 @Component 裝飾器定義元件
@Component({
  selector: 'app-camp-search-card', // 元件的標籤名稱，父 component 使用 <app-camp-search-card>
  imports: [CommonModule], // 引入 CommonModule，讓 template 可使用 ngIf、ngFor 等指令
  templateUrl: './camp-search-card.html', // 指向 HTML 模板檔
  styleUrl: './camp-search-card.scss', // 指向 SCSS 樣式檔
})
export class CampSearchCard {
  // @Input() 定義從父 component 接收的屬性
  @Input() campSearch!: CampSearch;
  // campSearch 是必須的（用驚嘆號表示非 null / undefined）
  // 父 component 可以傳入一個 CampSearch 物件給這個元件

  // @Output() 定義一個事件，讓元件向父 component 發射訊號
  @Output() back = new EventEmitter<void>();
  // back 事件沒有傳遞資料，只用來通知父 component

  // 元件內部方法
  goBack() {
    this.back.emit();
    // 呼叫 back.emit()，會觸發父 component 綁定的 (back) 事件
    // 父 component 會執行它綁定的回調，例如 goBack() 方法
  }
}
