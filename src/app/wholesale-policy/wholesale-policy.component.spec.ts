import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WholesalePolicyComponent } from './wholesale-policy.component';

describe('WholesalePolicyComponent', () => {
  let component: WholesalePolicyComponent;
  let fixture: ComponentFixture<WholesalePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WholesalePolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WholesalePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
