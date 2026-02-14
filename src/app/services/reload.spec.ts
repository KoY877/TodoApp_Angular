import { TestBed } from '@angular/core/testing';

import { Reload } from './reload';

describe('Reload', () => {
  let service: Reload;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reload);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
