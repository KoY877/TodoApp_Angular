import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Board as BoardModel } from '../../../models/board.model';
import { Router } from '@angular/router';
import { EntityService } from '../../../services/entity-service';
import { Reload } from '../../../services/reload';

@Component({
  selector: 'app-invite-member',
  imports: [],
  templateUrl: './invite-member.html',
  styleUrl: './invite-member.css',
})
export class InviteMember {
  @Input() getBoardId?: any
  @Output() closeInviteModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() clickOutside = new EventEmitter<any>();
  @Output() clickOutside2 = new EventEmitter<any>();
  private destroy$ = new Subject<void>();

  currentStep:number = 1;
  color?: string | null = '#'
  selectedIndex: number | null = null;
  selectedRole: string = 'Standard';
  data?: Array<any>[]
  alertMessage: string = '';
  receiveMemberColumnsData?: Array<any>[]
  notDuplicateMemberData?:  Array<{ memberEmail: string; role: string }> = [];
  boardData?: any
  isCompleteEmail: boolean = false
  isShowEmail: boolean = false
  isValueChange: boolean = false
  dropdownValue: boolean = false
  emailValue: string = ""
  form: FormGroup;

  constructor (
    private formBuilder: FormBuilder,
    private router : Router,
    private entityService : EntityService,
    private detectChange : ChangeDetectorRef,
    private elementRef: ElementRef,
    private reloadPage: Reload
  ) {
    this.form = this.formBuilder.group({
      step1: this.formBuilder.group({
        name: ['', Validators.required]
      }),
      step2: this.formBuilder.group({
        columns: this.formBuilder.array([]), // Row management in table form
      }),
      step3: this.formBuilder.group({
        columns2: this.formBuilder.array([]),
        selectedTask: [''],
        globalOption: ['']
      }),
      step4: this.formBuilder.group({
        email:  ['', Validators.email],
        memberColumns: this.formBuilder.array([]),
        chooseRole: ['Standard']
      }),
    })
  }


  ngOnInit(): void {

    // If email value change
    this.email.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {

        if (value) {
          this.isCompleteEmail = true
          // Regex to valid email addresse
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (emailRegex.test(value)){
            this.isShowEmail = !this.isShowEmail
            this.emailValue = value

          } else {
            this.isShowEmail = false
          }

          this.isValueChange = true
        } else {
          this.isCompleteEmail = false
          this.isValueChange = false
        }
        this.detectChange.detectChanges()
      }
    });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {

      // If  email value in Invite members change

      if (this.isValueChange === true){
        this.clickOutside.emit(this.isValueChange);
        this.email.reset()
        this.dropdownValue = false
      } else {

        // If invite dropdown menu is open
        if (this.dropdownValue === false ) {
          this.clickOutside2.emit(this.dropdownValue = true);
        } else {
          this.clickOutside2.emit(this.dropdownValue = false);
        }
      }

    }
  }

  // close dropdown field
  handleCloseDropdown() {
    this.closeInviteModal.emit()
  }


  get email(): FormArray{
    return this.form.get('step4.email') as FormArray;
  }

  get memberColumns(): FormArray{
    return this.form.get('step4.memberColumns') as FormArray;
  }

  get role2(): FormArray{
    return this.form.get('step4.role2') as FormArray;
  }

  // Add an email to the list
  async addEmail(event: any, id: string) {
    event.preventDefault()

      // Receive email value
      const emailValue = this.form.value.step4.email;

      // Regex to valid email addresse
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if(emailValue && emailRegex.test(emailValue))
      {
        // Get current board data
        const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

        if(currentBoard[0].members.length === 0)
        {
          // Add email in memberColumns array
          this.memberColumns.push(this.formBuilder.group({
            memberEmail: [emailValue],
            role: ['Standard']
          }));

        } else {

          // Search email
          const searchEmail = (currentBoard as BoardModel[])[0].members.filter((item:any) => item.memberEmail === emailValue)

          // Alert, if email is already exist
          if (searchEmail.length !== 0)
          {
            this.alertMessage = `${emailValue} is already a member of the board`;
            alert( this.alertMessage)
          } else {
            // Add email in memberColumns array
            this.memberColumns.push(this.formBuilder.group({
              memberEmail: [emailValue],
              role: ['Standard']
            }))

          }

        }

        // Update board data
        this.email.reset()

        this.isCompleteEmail = false

        this.detectChange.detectChanges()
      } else {
        alert('Please enter a correct email address')
      }
  }

  // Remove an email from the list
  removeEmail(event: any, index: number) {
    event.stopPropagation();
    this.memberColumns.removeAt(index);
  }

  // Next Formular
  moveToNextStep (){
    this.currentStep = 2
    this.detectChange.detectChanges()
  }

  // Navigate to next step
  async nextStep(event: any, id: string) {
    event.preventDefault();

    const emailValue: string | null = this.form.value.step4.email;
    let memberValue = this.form.value.step4.memberColumns;
    // Get current board data
    const currentBoard = await lastValueFrom(this.entityService.getDataById('board', id));

    // Regex to valid email addresse
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (currentBoard[0] === undefined){
      alert("Please create a board!")
    }

    if (memberValue.length !== 0 && emailValue === null ) {

      // remove duplicate member data
      this.removeDuplicateData()

      // Move to next formular
      this.moveToNextStep()
    }

    if (memberValue.length == 0 && emailValue !== null ) {
      if (emailRegex.test(emailValue)) {
        const typedBoard = currentBoard as BoardModel[];
        if(typedBoard[0].members.length === 0)
        {
          // Add email in memberColumns array
          this.memberColumns.push(this.formBuilder.group({
            memberEmail: [emailValue],
            role: ['Standard']
          }));

          // Move to next formular
          this.moveToNextStep()
        } else {

          // Search email
          const searchEmail = (currentBoard as BoardModel[])[0].members.filter((item:any) => item.memberEmail === emailValue)

          // Alert, if email is already exist
          if (searchEmail.length !== 0)
          {
            this.alertMessage = `${emailValue} is already a member of the board`;
            alert( this.alertMessage)

            if(this.currentStep == 1){
              this.currentStep = 1;
            }

          } else {
            // Add email in memberColumns array
            this.memberColumns.push(this.formBuilder.group({
              memberEmail: [emailValue],
              role: ['Standard']
            }))

            // Move to next formular
            this.moveToNextStep()
          }
        }

      } else {
        alert('Please enter a correct email address')
      }

    }

    if (memberValue.length !== 0 && emailValue !== null){

      if (emailValue && emailRegex.test(emailValue)) {

        // Get current board data
        const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

        if(currentBoard[0].members.length === 0)
        {
          // Add email in memberColumns array
          this.memberColumns.push(this.formBuilder.group({
            memberEmail: [emailValue],
            role: ['Standard']
          }));

          // remove duplicate member data
          this.removeDuplicateData()

          // Move to next formular
          this.moveToNextStep()

        } else {

          // Search email
          const searchEmail = (currentBoard as BoardModel[])[0].members.filter((item:any) => item.memberEmail === emailValue)

          // Alert, if email is already exist
          if (searchEmail.length !== 0)
          {
            this.alertMessage = `${emailValue} is already a member of the board`;
            alert( this.alertMessage)

            // Don´t move to the next formular
            if(this.currentStep === 1){
              this.currentStep = this.currentStep;
            }
          } else {
            // Add email in memberColumns array
            this.memberColumns.push(this.formBuilder.group({
              memberEmail: [emailValue],
              role: ['Standard']
            }))

            // remove duplicate member data
            this.removeDuplicateData()

            // Move to next formular
            this.moveToNextStep()
          }
        }

      } else {
        alert('Please enter a correct email address')
      }

    }

    this.email.reset();
  }


 // remove duplicate member data
  removeDuplicateData() {
    this.receiveMemberColumnsData = this.memberColumns.value

    this.receiveMemberColumnsData?.forEach((item:any) => {

      const isDuplicate = this.notDuplicateMemberData?.some( // search duplicate member data
        (memberItem) =>
          memberItem.memberEmail === item.memberEmail && memberItem.role === item.role
      );

      if (!isDuplicate) { // if not duplicate
        this.notDuplicateMemberData?.push(item);
      }
    })

    this.memberColumns.clear()

    // Push not duplicate member data into formArray memberColumns
    this.notDuplicateMemberData?.forEach((item:any) => {
      this.memberColumns.push(this.formBuilder.group({
        memberEmail: [item.memberEmail],
        role: [item.role]
      }))
    })
  }

  // Return to previous step
  prevStep() {
    this.currentStep = 1;
    this.detectChange.detectChanges()
  }

  // Return Hexdecimal color
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    this.color = '#';
    for (let i = 0; i < 6; i++) {
      this.color += letters[Math.floor(Math.random() * 16)];
    }
    return this.color;
  }

  // Select Radio methode
  isRadioDisabled(type: 'task' | 'global'): boolean {
    // Disables all other radios except the selected one
    if (type === 'task') {
      return this.selectedIndex !== null ;
    }

    return this.selectedIndex !== null;
  }

  selectRadio(index: number): void {
    this.selectedIndex = index;
  }


  async handleInviteMember(event: any, id: string){
    event.preventDefault();

    // Get selected Role
    let choosedRole = this.form.value.step4.chooseRole;

    // Update of form memberColums data
    this.memberColumns?.controls.forEach((control) =>{
      const currentRole = control.get('role')?.value;

      if (currentRole) {
        control.get('role')?.setValue(choosedRole);
      }

    })

    this.data = this.memberColumns?.value

    // Get current board data
    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

    this.data?.forEach((item: any) => {
      currentBoard[0].members.push({
        memberEmail: item.memberEmail,
        role: item.role
      });
    })

    const updateBoard = await lastValueFrom(this.entityService.updateData('board', currentBoard));

    // Close dropdown
    this.closeInviteModal.emit()

    // Refresh component
    this.reloadPage.reloadPage()
  }
}
