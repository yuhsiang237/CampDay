export interface CampSite {
  name: string;                     // 露營場名稱
  city: string;                     // 縣市別
  cityCode?: string;                 // 縣市代碼
  district?: string;                 // 鄉/鎮/市/區
  status?: string;                   // 營業狀態
  longitude?: number;                // 經度
  latitude?: number;                 // 緯度
  address?: string;                  // 地址
  phone?: string;                   // 電話 (optional)
  mobile?: string;                  // 手機 (optional)
  website?: string;                 // 網站 (optional)
  complianceOrViolation?: string;    // 符合相關法規露營場／違反相關法規露營場
  violationType?: string;            // 違反相關法規
  indigenousArea?: string;           // 是否有在原民區 (yes/no)
  establishedTime?: string;         // 露營場設置時間 (optional)
}