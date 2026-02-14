import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { EntityService } from '../../../services/entity-service';
import { Reload } from '../../../services/reload';
import { Board as BoardModel } from '../../../models/board.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-role',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-role.html',
  styleUrl: './change-role.css',
})
export class ChangeRole {
  @Input()  selectedMember?: any
  @Input()  getBoardId?: string | undefined
  @Output() closeChangeRole: EventEmitter<any> = new EventEmitter<any>();

  email?: string
  role?: string
  selectedIndex: number | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private entityService: EntityService,
    private reload : Reload
  ){
     this.form = fb.group({
          chooseRole: [this.role]
        })
  }


  ngOnInit() {
    this.email = this.selectedMember[0].memberEmail
    this.role = this.selectedMember[0].role;

    // Once the value has been obtained, the form is initialized.
    setTimeout(() => {
      this.form = this.fb.group({
        chooseRole: [this.role]
      });
    }, 100);
  }

  handleCloseDropdown(){
    this.closeChangeRole.emit()
  }

  selectRadio(index: number): void {
    this.selectedIndex = index;
  }


  // Submit data
  async handleChangeRole(event: any, id: string | undefined){

    event?.preventDefault()

    const role = this.form?.value?.chooseRole

    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

    let members = currentBoard[0]?.members;

    this.selectedMember= members?.filter((item:any) => item.memberEmail === this.email)

    this.selectedMember[0].role = role

    const updateBoard = await lastValueFrom(this.entityService.updateData('board', currentBoard));

    this.closeChangeRole.emit(this.selectedMember)


  }
}
