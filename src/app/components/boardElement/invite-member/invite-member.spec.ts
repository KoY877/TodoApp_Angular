import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteMember } from './invite-member';

describe('InviteMember', () => {
  let component: InviteMember;
  let fixture: ComponentFixture<InviteMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviteMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InviteMember);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
