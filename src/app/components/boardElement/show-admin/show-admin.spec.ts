import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAdmin } from './show-admin';

describe('ShowAdmin', () => {
  let component: ShowAdmin;
  let fixture: ComponentFixture<ShowAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
