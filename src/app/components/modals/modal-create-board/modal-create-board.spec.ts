import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCreateBoard } from './modal-create-board';

describe('ModalCreateBoard', () => {
  let component: ModalCreateBoard;
  let fixture: ComponentFixture<ModalCreateBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCreateBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCreateBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
