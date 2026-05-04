import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodScannerComponent } from './food-scanner.component';

describe('FoodScannerComponent', () => {
  let component: FoodScannerComponent;
  let fixture: ComponentFixture<FoodScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodScannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
