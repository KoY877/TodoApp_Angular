import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
import { ShowAdmin } from "../boardElement/show-admin/show-admin";
import { ShowMember } from "../boardElement/show-member/show-member";
import { SearchMember } from "../boardElement/search-member/search-member";
import { InviteMember } from "../boardElement/invite-member/invite-member";
import { Alert } from "../boardElement/alert/alert";
import { Members } from '../../models/members.model';
import { EntityService } from '../../services/entity-service';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Board as BoardModel } from '../../models/board.model';
import { CharacterPipe } from '../../pipes/character-pipe';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faFilter, faPencil, faBars } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { Message } from '../../services/message';
import { List } from "../todoList/column/column";
import { FormsModule } from '@angular/forms';

interface DropdownState {
  readonly name: string;
  isDropdown: boolean;
}

@Component({
  selector: 'app-board',
  imports: [CommonModule, FormsModule, ShowAdmin, ShowMember, SearchMember, InviteMember, Alert, CharacterPipe, FontAwesomeModule, List],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  // Font Awesome icons
  readonly faPlus = faPlus;
  readonly faFilter = faFilter;
  readonly faPencil = faPencil;
  readonly faBars = faBars;
  readonly faClock = faClock;

  // Input and Output properties
  @Input() clickedBoard?: BoardModel;
  @Input() isCloseAllDropdown = false;
  @Output() sendMemberData = new EventEmitter<Members>();
  @Output() allDropdownClosed = new EventEmitter<void>();
  @Output() sendTaskData = new EventEmitter<BoardModel[]>();
  @Output() closeMemberModal = new EventEmitter<void>();
  @Output() clickOutside = new EventEmitter<void>();

  // Component state
  isEditingBoardName = false;
  editedBoardName = '';
  boardId = '';
  ownerName = '';
  ownerInitials = '';
  boards: BoardModel[] = [];
  members: Members[] = [];
  memberColors: string[] = [];
  isOpenDropdown: DropdownState[] = [];
  memberEdit: Members[] = [];
  memberEmails?: Members[];
  isMembers = false;
  sendBoardId = '';
  currentBoard?: BoardModel[];
  isAlert = false;
  position: 'start' | 'end' = 'start';
  numberOfMember = 0;
  someProperty = true;
  isDropdown = true;
  isCompleteEmail = false;
  isClipboard = false;
  isOwner = false;
  isConfirmDelete = false;

  // Subject to manage unsubscriptions
  private readonly destroy$ = new Subject<void>();
  // Base dropdowns that are always present
  private readonly baseDropdowns: ReadonlyArray<string> = [
    'editBoardName', 'owner', 'members', 'invite'
  ];

  constructor(
    private readonly entityService: EntityService,
    private readonly cdr: ChangeDetectorRef,
    private readonly elementRef: ElementRef,
    private message: Message
  ) { }

  /**
   * Lifecycle hook to initialize the component and set up subscriptions
   */
  ngOnInit(): void {
    // Initialize dropdown states and owner information
    this.initializeDropdowns();
    this.initializeOwnerInfo();

    // Subscribe to MessageService observables
    this.members = this.clickedBoard?.members || [];
    this.numberOfMember = (this.members?.length || 0) + 1;
    this.memberColors = this.members.map(() => this.generateRandomColor());
    this.addMemberDropdowns();


    // Initialize currentBoard on load
    if (this.clickedBoard?.id) {
      this.boardId = this.clickedBoard.id;
      this.loadBoardMembers(this.boardId);
      console.log(this.boardId);

    }

    // Subscribe to MessageService observables
    this.message.boolCloseAll$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.isCloseAllDropdown = msg;
      if (this.isCloseAllDropdown) {
        this.handleCloseAllDropdown(this.isCloseAllDropdown);
      }
    });

    this.message.profileUpdated$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.ownerName = data.username;
      this.ownerInitials = data.username.substring(0, 2).toUpperCase();
      this.cdr.detectChanges();
    });

    this.cdr.detectChanges();
  }

  /**
   * Lifecycle hook to respond to changes in input properties
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isCloseAllDropdown'] && changes['isCloseAllDropdown'].currentValue) {
      this.handleCloseAllDropdown(this.getisCloseDropdown());
    }

    if (changes['clickedBoard']?.currentValue) {
      this.initializeDropdowns();
      this.memberEmails = this.clickedBoard?.members;
      console.log('👥 memberEmails set to:', this.memberEmails);  // ← Ajouter ce log

      if (this.clickedBoard?.id) {
        this.boardId = this.clickedBoard.id;
        this.loadBoardMembers(this.boardId);
      }
    }

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Method to handle member search input changes
  onIsCompleteEmailChange(value: boolean) {
    this.isCompleteEmail = value;
  }

  getisCloseDropdown(): boolean {
    return this.isCloseAllDropdown;
  }


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Verify if the click is on elements that should not trigger dropdown closing
    if (this.shouldIgnoreClick(target)) {
      return;
    }

    // Verfiry if the click is inside the component
    const clickedInside = this.elementRef.nativeElement.contains(target);

    // If the click is outside, close all simple dropdowns
    if (!clickedInside) {
      this.closeSimpleDropdowns();
    }

    // Alert if necessary
    this.cdr.detectChanges();
  }

  handleCloseAllDropdown(closeAll: boolean | undefined) {
    if (closeAll === true) {
      this.isOpenDropdown = this.isOpenDropdown.map(dropdown => ({
        ...dropdown,
        isDropdown: false
      }));

      // Fermer le dropdown d'édition du board
      this.isEditingBoardName = false;
      this.editedBoardName = '';

      this.cdr.detectChanges();
      this.allDropdownClosed.emit(); // optional
    }
  }

  // Method to handle opening a dropdown based on its name
  handleOpenDropdown(dropdownName: string | undefined): void {
    if (!dropdownName) return;

    if (dropdownName === 'editBoardName') {
      this.isEditingBoardName = true;
      this.editedBoardName = this.clickedBoard?.name || '';
      this.cdr.detectChanges();
      return;
    }

    setTimeout(() => {
      this.isOpenDropdown = this.isOpenDropdown.map(dropdown => ({
        ...dropdown,
        isDropdown: dropdown.name === dropdownName ||
          (dropdownName === 'search' && dropdown.isDropdown)
      }));

      this.memberEdit = this.members?.filter(
        item => item.memberEmail === dropdownName
      ) ?? [];

      this.isCloseAllDropdown = false;
      this.allDropdownClosed.emit();

      this.cdr.detectChanges()
    }, 0);
  }

  handleCloseEditBoardName(): void {
    this.isEditingBoardName = false;
    this.editedBoardName = '';
    this.cdr.detectChanges();
  }

  async handleUpdateBoardName(): Promise<void> {
    if (!this.editedBoardName?.trim()) {
      alert('Board name cannot be empty');
      return;
    }

    if (this.editedBoardName === this.clickedBoard?.name) {
      this.handleCloseEditBoardName();
      return;
    }

    try {
      const updatedBoard = {
        id: this.boardId,
        name: this.editedBoardName.trim(),
      };

      await lastValueFrom(
        this.entityService.putData('boards', this.boardId, updatedBoard)
      );

      // Mettre à jour localement
      if (this.clickedBoard) {
        this.clickedBoard.name = this.editedBoardName.trim();
      }

      this.handleCloseEditBoardName();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error updating board name:', error);
      alert('Failed to update board name');
    }
  }

  // Handle close dropdown when clicking outside or on another dropdown
  handleCloseDropdown(identifier: string | boolean | undefined): void {
    if (identifier === undefined) return;

    this.isOpenDropdown = this.isOpenDropdown.map(dropdown => {
      // identifier is a string -> toggle the corresponding dropdown
      if (typeof identifier === 'string') {
        return {
          ...dropdown,
          isDropdown: dropdown.name === identifier ? false : dropdown.isDropdown
        };
      }

      // identifier === false -> close all open dropdowns
      if (identifier === false && dropdown.isDropdown) {
        return { ...dropdown, isDropdown: false };
      }

      return dropdown;
    });

    this.isAlert = false;
  }


  alertOnClickOutside(hasOpenDropdown: boolean): void {
    const hasAnyOpen = this.isOpenDropdown.some(dropdown => dropdown.isDropdown);

    // Check if an email is being entered
    if (!hasAnyOpen && hasOpenDropdown) {
      this.isAlert = true;

    } else {
      this.isAlert = false;
    }
  }

  handleCancel(): void {
    this.isAlert = false;
  }

  // Private methods
  private initializeDropdowns(): void {
    this.isOpenDropdown = this.baseDropdowns.map(name => ({
      name,
      isDropdown: false
    }));
  }

  private initializeOwnerInfo(): void {
    const currentUserId = localStorage.getItem('User-Id');

    // Vérifier si l'utilisateur est le propriétaire
    this.isOwner = this.clickedBoard?.userId === currentUserId;

    if (this.isOwner || this.clickedBoard?.userId === undefined) {
      this.ownerName = localStorage.getItem('UserName') ||
      localStorage.getItem('UserEmail') ||
      'Owner';
      this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();
      this.isOwner = true;
    }
  }

  // load board members and assign random colors to each member
  private async loadBoardMembers(id: string): Promise<void> {
    try {
      console.log('🔍 Loading board data for ID:', id);
      this.currentBoard = await lastValueFrom(
        this.entityService.getDataById<BoardModel>('boards', id)
      );

      console.log('✅ Board data received:', this.currentBoard);

      if (this.currentBoard?.[0]) {
        const board = this.currentBoard[0];
        console.log('📊 Board columns count:', board.columns?.length || 0);
        console.log('👥 Board members count:', board.members?.length || 0);

        setTimeout(() => {
          this.members = board.members;
          this.numberOfMember = (this.members?.length || 0) + 1;
          this.memberColors = this.members.map(() => this.generateRandomColor());
          this.addMemberDropdowns();
          this.memberEmails = board.members;
          this.cdr.detectChanges();
        }, 0);
      }

      // Trigger change detection to update the view with new member data
      this.cdr.detectChanges();
    } catch (error) {
      console.error('❌ Error loading board:', error);
      this.members = [];
      this.numberOfMember = 1;
    }
  }

  private addMemberDropdowns(): void {
    const memberDropdowns = this.members
      .filter(item => item.memberEmail)
      .map(item => ({
        name: item.memberEmail as string,
        isDropdown: false
      }));

    this.isOpenDropdown = [...this.isOpenDropdown, ...memberDropdowns];
  }

  private closeSimpleDropdowns(): void {
    const simpleDropdownIndices: Array<number> = [];

    // Identify simple dropdowns (those that are not member-specific)
    this.isOpenDropdown.forEach((dropdown, index) => {
      simpleDropdownIndices.push(index);
    });

    // Close only simple dropdowns
    this.isOpenDropdown = this.isOpenDropdown.map((dropdown, index) => ({
      ...dropdown,
      isDropdown: simpleDropdownIndices.includes(index) ? false : dropdown.isDropdown
    }));
  }

  private shouldIgnoreClick(target: HTMLElement): boolean {
    return !!(
      target.closest('app-header') ||
      target.closest('.header') ||
      target.closest('.dropdown-board') ||
      target.closest('.btn-right') ||
      target.closest('.menu')
    );
  }

  generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
  }

  handleDeleteBoard(): void {
    this.isConfirmDelete = true;
    this.cdr.detectChanges();
  }

  handleConfirmDelete(): void {
    this.entityService.deleteData('boards', this.boardId).subscribe({
      next: () => {
        this.isConfirmDelete = false;
        this.isEditingBoardName = false;
        this.sendTaskData.emit(); // Notifie le parent de fermer le board
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting board:', error);
        this.isConfirmDelete = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleCancelDelete(): void {
    this.isConfirmDelete = false;
    this.cdr.detectChanges();
  }

}
