import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMember } from './search-member';

describe('SearchMember', () => {
  let component: SearchMember;
  let fixture: ComponentFixture<SearchMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchMember);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
