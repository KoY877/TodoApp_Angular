import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { lastValueFrom, Subject} from 'rxjs';
import { Board as BoardModel } from '../../../models/board.model';
import { EntityService } from '../../../services/entity-service';
import { Reload } from '../../../services/reload';
import { CommonModule } from '@angular/common';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { faArrowLeft, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Members } from '../../../models/members.model';
import { MemberService } from '../../../services/member-service';

@Component({
  selector: 'app-invite-member',
  imports: [CommonModule, ReactiveFormsModule, CharacterPipe, FontAwesomeModule],
  templateUrl: './invite-member.html',
  styleUrl: './invite-member.css',
})
export class InviteMember {
  // Fontawesome icon
  readonly faQuestion = faQuestion;
  readonly faArrowLeft = faArrowLeft;

  // Input and Output for send data and event on the board component
  @Input() getBoardId?: any
  @Output() closeInviteModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() clickOutside = new EventEmitter<any>();
  @Output() clickOutside2 = new EventEmitter<any>();
  @Output() isCompleteEmailChange = new EventEmitter<any>();
  private destroy$ = new Subject<void>();

  boardId = '';
  ownerName = '';
  ownerInitials = '';
  currentStep:number = 1;
  color?: string | null = '#'
  selectedIndex: number | null = null;
  selectedRole: string = 'Standard';
  data?: Array<any>[]
  alertMessage: string = '';
  receiveMembersData?: Array<any>[]
  notDuplicateMemberData?:  Array<{ memberEmail: string; role: string }> = [];
  boardData?: any
  isCompleteEmail: boolean = false
  isShowEmail: boolean = false
  isValueChange: boolean = false
  dropdownValue: boolean = false
  emailValue: string = ""
  form: FormGroup;
  memberColors: string[] = [];
  newMembers: Members[] = [];

  constructor (
    private formBuilder: FormBuilder,
    private entityService : EntityService,
    private memberService: MemberService,
    private detectChange : ChangeDetectorRef,
    private elementRef: ElementRef,
    private reloadPage: Reload
  ) {
    this.form = this.formBuilder.group({
      email: ['', Validators.email],
      members: formBuilder.array([]),
      chooseRole: ['Standard']
    })
  }

  ngOnInit(): void {
    this.email.valueChanges.subscribe((value: string) => {
      if (value && value.trim() !== '') {
        this.isCompleteEmail = true;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        this.isShowEmail = emailRegex.test(value);
        this.emailValue = value;
      } else {
        this.isCompleteEmail = false;
        this.isShowEmail = false;
        this.emailValue = '';
      }
    });

    this.memberColors = this.members.controls.map(() => this.getRandomColor());
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
      if (this.isValueChange === false && this.isCompleteEmail === false) {
        this.clickOutside.emit(this.isValueChange);
        this.email.reset()
        this.dropdownValue = false
      } else  {

        this.isCompleteEmailChange.emit(true);
      }
    }
  }

  // close dropdown field
  handleCloseDropdown() {
    this.closeInviteModal.emit()
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get members(): FormArray {
    return this.form.get('members') as FormArray;
  }

  get chooseRole(): FormControl {
    return this.form.get('chooseRole') as FormControl;
  }


  // Add an email to the list
  async addEmail(event: any, id: string) {
    event.preventDefault();

    const emailValue: string = this.email.value?.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailValue && emailRegex.test(emailValue)) {
      // Get current board data
      const currentBoard = await lastValueFrom(
        this.entityService.getDataById<BoardModel>('boards', id)
      );

      if (!currentBoard || !currentBoard[0]) {
        alert('Board not found');
        return;
      }

      // Check if email already exists in board
      const emailExists = currentBoard[0].members?.some(
        (m: Members) => m.memberEmail?.toLowerCase() === emailValue.toLowerCase()
      );

      if (emailExists) {
        alert('This member is already part of the board');
        this.email.reset();
        return;
      }

      // Check if email already in the form
      const alreadyAdded = this.members.controls.some(
        (control) => control.get('memberEmail')?.value.toLowerCase() === emailValue.toLowerCase()
      );

      if (alreadyAdded) {
        alert('This email is already in the list');
        this.email.reset();
        return;
      }

      // Add email to members array
      this.members.push(this.formBuilder.group({
        memberEmail: [emailValue],
        role: ['Standard'],
        boardId: [this.boardId]
      })),
      this.email.reset()

      // Reset email input
      this.email.reset();
      this.isCompleteEmail = false;
      this.isShowEmail = false;
    } else {
      alert('Please enter a valid email address');
    }
  }

  // Remove an email from the list
  removeEmail(event: any, index: number) {
    event.stopPropagation();
    event.preventDefault();
    this.members.removeAt(index);
  }

  // Next Formular
  moveToNextStep (){
    this.currentStep = 2
    this.detectChange.detectChanges()
  }

  // Navigate to next step
  async nextStep(event: any, id: string) {
    event.preventDefault();

    try {
      const emailValue: string | null = this.email.value?.trim();

      // Regex to valid email address
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      // If there's an email in the input, add it first
      if (emailValue && emailRegex.test(emailValue)) {
        await this.addEmail(event, id);

        // Wait a bit for the form to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check if there are members to invite AFTER adding the email
      if (this.members.length === 0) {
        alert('Please add at least one email address');
        return;
      }

      // Remove duplicates
      this.removeDuplicateData();

      // Move to next step
      this.currentStep = 2;
      this.detectChange.detectChanges();

    } catch (error) {

      alert('An error occurred. Please try again.');
    }
  }

  // remove duplicate member data
  removeDuplicateData() {
    this.receiveMembersData = this.members.value

    this.receiveMembersData?.forEach((item:any) => {

      const isDuplicate = this.notDuplicateMemberData?.some( // search duplicate member data
        (memberItem) =>
          memberItem.memberEmail === item.memberEmail && memberItem.role === item.role
      );

      if (!isDuplicate) { // if not duplicate
        this.notDuplicateMemberData?.push(item);
      }
    })

    this.members.clear()

    // Push not duplicate member data into formArray members
    this.notDuplicateMemberData?.forEach((item:any) => {
      this.members.push(this.formBuilder.group({
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

  async handleInviteMember(event: any, id: string) {
    event.preventDefault();

    try {
      if (!this.members?.length) {
        alert('Please add at least one member to invite');
        return;
      }

      if (!id) {
        alert('Board ID is missing');
        return;
      }

      const choosedRole = this.chooseRole.value;
      this.members.controls.forEach((control) => {
        control.get('role')?.setValue(choosedRole);
      });

      // Receive existing members for this board to check if email already exist for this user on this board
      const existingMembers = await lastValueFrom(
        this.memberService.getMembersByBoard<Members>(
          'board/member',
          id
        )
      );

      const existingEmailsForUser = new Set(
        existingMembers
          .map(m => m.memberEmail?.toLowerCase())
          .filter((e): e is string => !!e)
      );

      const memberData: Members[] = this.members.value;
      this.newMembers = [];
      let addedCount = 0;

      // Add only new members that are not already part of the board for this user
      memberData.forEach((item: Members) => {
        const email = item.memberEmail?.toLowerCase();
        if (email && !existingEmailsForUser.has(email)) {
          this.newMembers.push({
            memberEmail: item.memberEmail,
            role: item.role || 'Standard',
            boardId: id
          });
          addedCount++;
        }
      });

      if (addedCount === 0 || this.newMembers.length === 0) {
        alert('All members are already part of this board for this user');
        return;
      }

      // Add new members to the Member table
      for (const member of this.newMembers) {
        await lastValueFrom(
          this.memberService.addMemberData('board/member', member)
        );
      }

      // Reset form
      setTimeout(() => {
        this.members.clear();
        this.notDuplicateMemberData = [];
        this.currentStep = 1;
        this.form.reset({ chooseRole: 'Standard' });
        this.closeInviteModal.emit();
        this.reloadPage.reloadPage();
      }, 0);

    } catch (error: any) {

      if (error?.status === 0) {
        alert('Cannot connect to the server. Please check if the Server is running.');
      } else {
        alert(`An error occurred while inviting members: ${error?.message || 'Unknown error'}. Please check the console for details.`);
      }
    }
  }

}
