import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
import { ShowMember } from "../show-member/show-member";
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, lastValueFrom, map, Subject, takeUntil, tap } from 'rxjs';
import { Board as BoardModel } from '../../../models/board.model';
import { Members } from '../../../models/members.model';
import { EntityService } from '../../../services/entity-service';
import { Message } from '../../../services/message';
import { CommonModule } from '@angular/common';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { ColorPipe } from '../../../pipes/color-pipe';
import { faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-search-member',
  imports: [CommonModule, ReactiveFormsModule, ShowMember, CharacterPipe, FontAwesomeModule],
  templateUrl: './search-member.html',
  styleUrl: './search-member.css',
})
export class SearchMember {
   // Font Awesome icons
    readonly faArrowLeft = faArrowLeft;

  @Input() memberData!: any;
  @Input() getBoardId!: string;
  @Input() ownerName!: string;
  @Input() ownerInitials!: string;
  @Input() isChangeRole: boolean = false
  searchControl: FormControl = new FormControl();
  @Output() openSearchMemberDP: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeSearchMemberDP: EventEmitter<void> = new EventEmitter<void>();
  @Output() closeMemberDP: EventEmitter<any> = new EventEmitter<any>();
  @Output() clickOutside: EventEmitter<any> = new EventEmitter<any>();
  private destroy$ = new Subject<void>();

  @Input() currentStep?: number = 1;
  userId = '';
  boards?: BoardModel [];
  results?: any []
  members?: Members[];
  memberColors: string[] = [];
  memberDropdown: any[] = [];
  memberEdit: Members[] = [];
  isResult:boolean = false
  activeIndex?: string | null = null
  form: FormGroup | undefined
  dropdownSearchValue?: boolean = false
  search: string = "search"

  constructor(
     private entityService: EntityService,
      private cdr: ChangeDetectorRef,
      private elementRef: ElementRef,
      private aktuelMemberData: Message
  ){

  }

   // Get currentStep
  getCurrentStep(): number | undefined {
    return  this.currentStep;
  }

  ngOnInit(): void {

    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        map((query) => query ?? ''),  // Convertit null/undefined en une chaîne vide
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
          if(Array.isArray(this.memberData)){
            this.results = (this.memberData || [])
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


      // Update actuel member role
      this.aktuelMemberData.roleChangeData$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {

      if(msg === null){

      } else {
        this.memberData.forEach((item: any) => {

          if (item.memberEmail === msg[0]?.memberEmail){
            item.role = msg[0]?.role
          }
        });
      }
    });

    this.initializeOwnerInfo();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.dropdownSearchValue === false) {
        console.log(this.dropdownSearchValue);

        this.clickOutside.emit(this.dropdownSearchValue = false);

      } else{
        // If the dropdown is open and we click outside, close it
        if (this.currentStep !== 2){
          this.clickOutside.emit(this.dropdownSearchValue = false);
        }

        // If we are on the second step and we click outside, we want to return to the first step
        if (this.currentStep === 2 && this.isChangeRole === false){
          this.currentStep = 1
        }

        // If we are on the second step and we click outside, but we have changed the role, we want to stay on the second step but reset the isChangeRole to false for the next click outside
        if (this.currentStep === 2 && this.isChangeRole === true){
          this.currentStep = 2
          this.isChangeRole = false
        }

      }
    }
  }

  private initializeOwnerInfo(): void {
    const currentUserId = localStorage.getItem('User-Id');


      console.log(currentUserId);

      console.log(this.userId);
    if (this.userId === currentUserId) {
      this.ownerName = localStorage.getItem('UserName') ||
                       localStorage.getItem('UserEmail') ||
                       'Owner';
      this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();

      console.log(this.ownerInitials);

    }
  }



  // Open Dropdown
  async handleOpenDropdown(event: string) {

    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('boards', this.getBoardId));

    this.userId = currentBoard[0]?.userId ?? '';

    this.members = currentBoard[0]?.members;

    // Find clicked member data
    this.memberEdit = this.members?.filter((item) => item.memberEmail === event)

    this.currentStep = 2;

    this.cdr.detectChanges();
  }

  // Return to previous step
  prevStep() {
    if (this.currentStep === 2){
      this.currentStep = 1
    }
  }

  handleCloseDropdown() {
    this.closeSearchMemberDP.emit()
  }

  handleCloseDropdownMember() {
    this.dropdownSearchValue = false
  }

  handleChangeRolestatus($event: any){
    this.isChangeRole = $event
  }

 generateRandomColor(index?: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
    ];

    const i = index !== undefined ? index : Math.floor(Math.random() * colors.length);
    return colors[i % colors.length];
  }

}
