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

@Component({
  selector: 'app-search-member',
  imports: [CommonModule, ReactiveFormsModule, ShowMember, CharacterPipe],
  templateUrl: './search-member.html',
  styleUrl: './search-member.css',
})
export class SearchMember {
  @Input() memberData!: any;
  @Input() getBoardId!: any
  @Input() isChangeRole: boolean = false
  searchControl: FormControl = new FormControl();
  @Output() openSearchMemberDP: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeSearchMemberDP: EventEmitter<void> = new EventEmitter<void>();
  @Output() closeMemberDP: EventEmitter<any> = new EventEmitter<any>();
  @Output() clickOutside: EventEmitter<any> = new EventEmitter<any>();
  private destroy$ = new Subject<void>();

  @Input() currentStep?: number = 1;
  boards?: BoardModel []
  results?: any []
  members?: Members[];
  memberDropdown: any[] = [];
  memberEdit: Members[] = [];
  isResult:boolean = false
  activeIndex?: string | null = null
  form: FormGroup | undefined
  dropdownSearchValue?: boolean = false
  search: string = "search"

  constructor(
     private entityService: EntityService,
      private detectChange: ChangeDetectorRef,
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
            this.detectChange.detectChanges();
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
          this.detectChange.detectChanges();
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

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Call ngOnchange, if @Input change
  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentStep'] && changes['currentStep'].currentValue ) {
      console.log(changes['currentStep'].currentValue);
      this.prevStep()

    }
  }

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.dropdownSearchValue === false) {
        this.clickOutside.emit(this.dropdownSearchValue = true);

      } else{
        if (this.currentStep !== 2){
          this.clickOutside.emit(this.dropdownSearchValue = false);
        }

        if (this.currentStep === 2 && this.isChangeRole === false){
          this.currentStep = 1
        }

        if (this.currentStep === 2 && this.isChangeRole === true){
          this.currentStep = 2
          this.isChangeRole = false
        }

      }
    }
  }


  // Open Dropdown
  async handleOpenDropdown(event: string) {

    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', this.getBoardId));

    this.members = currentBoard[0]?.members;

    // Find clicked member data
    this.memberEdit = this.members?.filter((item) => item.memberEmail === event)

    this.currentStep = 2;

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

}
