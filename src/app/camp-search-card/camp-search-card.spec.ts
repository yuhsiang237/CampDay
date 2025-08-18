import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampSearchCard } from './camp-search-card';

describe('CampSearchCard', () => {
  let component: CampSearchCard;
  let fixture: ComponentFixture<CampSearchCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampSearchCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CampSearchCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
