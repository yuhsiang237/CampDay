export interface WeatherAPI {
  [key: string]: { api: string };
}

export interface WeatherPeriod {
  StartTime: string;
  EndTime: string;
  ElementValue: {
    MaxTemperature?: number;
    MinTemperature?: number;
    Weather?: string;
  }[];
}

export interface WeatherElement {
  ElementName: '最高溫度' | '最低溫度' | '天氣現象';
  Time: WeatherPeriod[];
}

export interface DistrictWeather {
  LocationName: string;
  WeatherElement: WeatherElement[];
}

export interface GroupedWeatherSlot {
  label: string;
  timeRange: string;
  maxTemp?: number;
  minTemp?: number;
  weather?: string;
}

export interface GroupedWeather {
  [date: string]: GroupedWeatherSlot[];
}
