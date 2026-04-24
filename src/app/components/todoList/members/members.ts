import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map, Subject, takeUntil, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { Message } from '../../../services/message';

@Component({
  selector: 'app-members',
  imports: [CommonModule, ReactiveFormsModule, CharacterPipe],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members {
  @Input() members!: any[] | undefined;
  @Output() sendSelectedMember: EventEmitter<any> = new EventEmitter<any>();
  @Output() sendDeselectedMember: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeDropdownMembers: EventEmitter<void> = new EventEmitter<void>();
  searchControl: FormControl = new FormControl();

  private destroy$ = new Subject<void>();

  ownerName: string = '';
  ownerInitials: string = '';
  emails?: any | undefined[] = []
  emails2?: any | undefined[] = []
  results?: any[] = []
  isResult: boolean = false
  activ = ''
  activeIndex?: string | null = null
  form: FormGroup


  constructor(
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private message : Message,
  ) {
    this.form = formBuilder.group({
      selectedEmails: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        map((query) => query ?? ''),  // Converts null/undefined to an empty string
        tap(query => {
          if (query.trim() === '') {
            this.isResult = false;   // If search is empty, hide results
            this.cdr.detectChanges();
          }
        }),
        filter((query) => query.trim() !== ''),  // Continue only if the request is valid
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (query: string) => {
          if (Array.isArray(this.members)) {
            this.results = (this.members || [])
              .filter(item => item && item.memberEmail)
              .filter(item => item.memberEmail.toLowerCase().includes(query.toLowerCase()));
            this.isResult = true;
          }
        },
        error: (error: any) => {
          this.isResult = false;
          this.cdr.detectChanges();
        }
      });

    // Initialize owner information on component load
    this.initializeOwnerInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // get Selected email address
  get selectedEmails(): FormArray {
    return this.form.get('selectedEmails') as FormArray;
  }

  private initializeOwnerInfo(): void {
    const currentUserId = localStorage.getItem('User-Id');

    this.ownerName = localStorage.getItem('UserName') ||
      localStorage.getItem('UserEmail') ||
      'Owner';

    this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();

  }

  // display the members, give the possibility to select an email or deselect it
  handleSelectedMember(event: Event, item: any) {
    event.preventDefault()

    const target = event.target as HTMLInputElement;

    // If the box is checked
    if (target.checked) {

      const alreadyExists = this.selectedEmails.controls.some(
        (control: any) => control.value === target.value
      );

      if (!alreadyExists) {
        this.selectedEmails.push(this.formBuilder.control(target.value));
        this.emails = this.selectedEmails.value
      }

      // Update visual status (useful if dropdown is recreated)
      item.checked = target.checked;

      // Send to the parent Add-Task
      this.sendSelectedMember.emit(this.emails);
    } else {

      // If unchecked, it is removed
      const index = this.selectedEmails.controls.findIndex(
        (control: any) => control.value === target.value
      );

      if (index > -1) {
        this.selectedEmails.removeAt(index);

        this.emails = this.selectedEmails.value
      }

      // Update visual status (uncheck box)
      item.checked = false

      // Send to the parent Add-Task
      this.sendDeselectedMember.emit(item.memberEmail)

    }

  }

  handleCloseDropdown() {
    this.closeDropdownMembers.emit();
  }
}
