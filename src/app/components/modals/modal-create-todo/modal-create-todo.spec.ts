import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCreateTodo } from './modal-create-todo';

describe('ModalCreateTodo', () => {
  let component: ModalCreateTodo;
  let fixture: ComponentFixture<ModalCreateTodo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCreateTodo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCreateTodo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
