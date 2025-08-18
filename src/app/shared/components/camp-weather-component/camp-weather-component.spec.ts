import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampWeatherComponent } from './camp-weather-component';

describe('CampWeatherComponent', () => {
  let component: CampWeatherComponent;
  let fixture: ComponentFixture<CampWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampWeatherComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CampWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
