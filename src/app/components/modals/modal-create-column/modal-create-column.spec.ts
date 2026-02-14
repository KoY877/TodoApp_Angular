import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCreateColumn } from './modal-create-column';

describe('ModalCreateColumn', () => {
  let component: ModalCreateColumn;
  let fixture: ComponentFixture<ModalCreateColumn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCreateColumn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCreateColumn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
