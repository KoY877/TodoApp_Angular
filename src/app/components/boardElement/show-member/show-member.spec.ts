import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMember } from './show-member';

describe('ShowMember', () => {
  let component: ShowMember;
  let fixture: ComponentFixture<ShowMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowMember);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
