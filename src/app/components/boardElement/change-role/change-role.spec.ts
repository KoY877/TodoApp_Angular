import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeRole } from './change-role';

describe('ChangeRole', () => {
  let component: ChangeRole;
  let fixture: ComponentFixture<ChangeRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeRole);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
