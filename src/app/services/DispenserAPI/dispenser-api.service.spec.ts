import { TestBed } from '@angular/core/testing';

import { DispenserAPIService } from './dispenser-api.service';

describe('DispenserAPIService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DispenserAPIService = TestBed.get(DispenserAPIService);
    expect(service).toBeTruthy();
  });
});
