import { TestBed } from '@angular/core/testing';

import { PreferenceManagerService } from './preference-manager.service';

describe('PreferenceManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PreferenceManagerService = TestBed.get(PreferenceManagerService);
    expect(service).toBeTruthy();
  });
});
