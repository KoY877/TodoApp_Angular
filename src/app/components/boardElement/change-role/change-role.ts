import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { Reload } from '../../../services/reload';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../../services/member-service';
import { Members } from '../../../models/members.model';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-change-role',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './change-role.html',
  styleUrl: './change-role.css',
})
export class ChangeRole {
  // Font Awesome icon
  readonly faQuestion = faQuestion;

  // Font Awesome icon
  @Input()  selectedMember?: any
  @Input()  getBoardId?: string | undefined
  @Output() closeChangeRole: EventEmitter<any> = new EventEmitter<any>();

  member?: string | undefined = '';
  role?: string | undefined = '';
  selectedIndex: number | null = null;
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private memberService: MemberService,
    private cdr: ChangeDetectorRef,
    private reload : Reload
  ){
     this.form = this.formBuilder.group({
        chooseRole: [this.role]
      })
  }

  ngOnInit() {
    this.member = this.selectedMember[0].memberEmail
    this.role = this.selectedMember[0].role;
    
    console.log(this.selectedMember[0].role);

    this.form = this.formBuilder.group({
      chooseRole: [this.role || 'Standard']
    });
    
    // Once the value has been obtained, the form is initialized.
    setTimeout(() => {
      this.form = this.formBuilder.group({
        chooseRole: [this.role],
      });
    }, 100);
  }

  // Method to handle closing the dropdown
  handleCloseDropdown(){
    this.closeChangeRole.emit()
  }

  // Method to select a radio button and update the form control value
  selectRadio(index: number): void {

    this.selectedIndex = index;
    // Determine the role value based on the selected index
    const value = index === 0 ? 'Standard' : 'Administrator';

    // Update the form control value
    this.form.get('chooseRole')?.setValue(value);

    // Update the role property with the selected value
    this.role = value; 

    // Trigger change detection to update the view
    this.cdr.detectChanges();    
  }

  // Submit data
  async handleChangeRole(event: any, id: string | undefined){

    event?.preventDefault()
    
    // Get role value from form
    const role = this.form?.value?.chooseRole

    // Update the selected member's role
    this.selectedMember[0].role = role;

    // Update the member data with the new role
    await lastValueFrom(this.memberService.updateMemberData('board/member', this.selectedMember[0]));

    this.closeChangeRole.emit(this.selectedMember[0])

    // Reload the page to reflect changes
    this.cdr.detectChanges();
  }
}
