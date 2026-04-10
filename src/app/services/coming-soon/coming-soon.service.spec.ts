import { TestBed } from '@angular/core/testing';

import { ComingSoonService } from './coming-soon.service';

describe('ComingSoonService', () => {
  let service: ComingSoonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComingSoonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
