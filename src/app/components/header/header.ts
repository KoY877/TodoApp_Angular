import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {  lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Board } from '../../models/board.model';
import { Message } from '../../services/message';
import { AuthService } from '../../services/authentication/auth-service';
import { TokenService } from '../../services/authentication/tokenService';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faBell, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { EntityService } from '../../services/entity-service';



@Component({
  selector: 'app-header',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  // Font Awesome icons
  readonly faBars = faBars;
  readonly faBell = faBell;
  readonly faQuestion = faQuestion;



  @Input() clickedBoard!: Board;
  @Input() isCloseAllDropdown = false;
  @Output() allDropdownClosed = new EventEmitter<void>();
  @Output() closeAllOpenDropdown: EventEmitter<void> = new EventEmitter<void>();

  // Form control for search input
  searchControl: FormControl = new FormControl();

  // Component state variables
  ownerName = '';
  ownerInitials = '';
  boards: Board[] = [];
  activeIndex: string | null = null;
  isDropdownOpenBoards = false;
  isDropdownOpenUser = false;
  isConnected = false;
  isCloseDropdown = false;
  isEditProfileOpen = false;
  editedUsername = '';
  editedEmail = '';
  editedPassword = '';
  editedPasswordConfirm = '';

  private readonly destroy$ = new Subject<void>();
  private openModalCreateBoard = false;
  private sign_up = false;
  private sign_in = false;



  constructor (
    private cdr: ChangeDetectorRef,
    private message: Message,
    private entityService: EntityService,
    private authService: AuthService,
    private tokenService: TokenService,
    private elementRef: ElementRef,
  ) { }


  /** Lifecycle hook to initialize subscriptions and listen for board deletions */
  ngOnInit(): void {
    this.setupSubscriptions();

    this.message.boardDeleted$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadBoards();
    });
  }

  /** Lifecycle hook to clean up all active subscriptions */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Resolve and display the current user's name and initials.
   * Uses TokenService as primary source with localStorage as fallback.
   */
  private async initializeOwnerInfo(): Promise<void> {
    try {
      // Use TokenService instead of localStorage
      const currentUserId = this.tokenService.getUserId();
      const userData = this.tokenService.getUserData();

      if (!currentUserId) {
        console.warn('No User-Id found - attempting fallback to localStorage');
        // Do not force isConnected = false here
        // La valeur de isConnected est gérée par le service Message
        // On essaie quand même de récupérer les infos depuis localStorage
      }

      // Utiliser les données du TokenService en priorité, avec fallback sur localStorage
      const username = userData?.username || localStorage.getItem('UserName');
      const email = userData?.email || localStorage.getItem('UserEmail');

      this.ownerName = username || email || 'Owner';
      this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();

      console.log('Owner info initialized:', { ownerName: this.ownerName, ownerInitials: this.ownerInitials, isConnected: this.isConnected });

      this.isCloseAllDropdown = false;
      this.allDropdownClosed.emit();
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Erreur lors du chargement du user:', error);
      // Fallback sur localStorage
      const username = localStorage.getItem('UserName');
      const email = localStorage.getItem('UserEmail');
      this.ownerName = username || email || 'Owner';
      this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();
    }
  }

  /** Emit a request to open the board creation modal */
  onCreateBoard(): void {
    this.activeIndex = null;
    this.openModalCreateBoard = true;
    this.isDropdownOpenBoards = false;

    // Emit message to open the modal in the Container
    this.message.messageBooleanOpenModal(true);

    console.log('Header: messageBooleanOpenModal(true) emitted');
  }

  /**
   * Load all boards for the authenticated user.
   * Creates a default board automatically when none exist.
   * @param defaultIndex - index of the board to activate by default
   */
  private async loadBoards(defaultIndex: number = 0): Promise<void> {
    // Verify with TokenService
    const isAuthenticated = this.tokenService.isAuthenticated();

    if (!isAuthenticated) {
      this.boards = [];
      return;
    }

    try {
      // Tous les utilisateurs sont administrateurs - récupère tous les boards
      const boardsData = await lastValueFrom(
        this.entityService.getData<Board>('boards/all')
      );

      // S'assurer que c'est un tableau
      this.boards = Array.isArray(boardsData) ? boardsData : [boardsData];

      console.log('Boards loaded:', this.boards);

      // Si aucun board n'existe, créer un board par défaut
      if (this.boards.length === 0) {
        console.log('No boards found - creating default board...');
        await this.createDefaultBoard();
        return; // createDefaultBoard va recharger les boards
      }

      // Vérifier s'il y a un board sauvegardé dans localStorage
      const savedBoardId = localStorage.getItem('lastViewedBoardId');
      let boardToLoad: Board | undefined;

      if (savedBoardId) {
        // Chercher le board sauvegardé
        boardToLoad = this.boards.find(b => b.id === savedBoardId);
        console.log('Saved board found:', boardToLoad?.name);
      }

      // Si pas de board sauvegardé ou board introuvable, utiliser le premier
      if (!boardToLoad) {
        boardToLoad = this.boards[defaultIndex];
        console.log('Loading first board:', boardToLoad?.name);
      }

      if (boardToLoad) {
        this.activeIndex = boardToLoad.name;
        this.message.messageAny(boardToLoad);
        // Sauvegarder le board chargé
        localStorage.setItem('lastViewedBoardId', boardToLoad.id!);
      }
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error('Error loading boards:', error);

      // L'intercepteur gère automatiquement les 401 et le refresh
      // Si on arrive ici après un 401, c'est que le refresh a échoué

      this.boards = [];
      this.cdr.detectChanges();
    }
  }

  /**
   * Load a specific board by ID and notify the rest of the app via Message
   * @param boardId - the board's UUID
   * @param name - the board name (sets the active nav tab)
   * @param clickEvent - optional click event to stop propagation
   */
  async handleOpenBoard(
    boardId: string,
    name?: string,
    clickEvent?: MouseEvent
  ): Promise<void> {
    clickEvent?.stopPropagation();

    this.openModalCreateBoard = false;

    try {
      const clickedBoardArray = await lastValueFrom(
        this.authService.getDataById("boards", boardId)
      );

      console.log(clickedBoardArray);

      const clickedBoard = Array.isArray(clickedBoardArray)
        ? clickedBoardArray[0]
        : clickedBoardArray;

      this.activeIndex = name ?? null;

      if (clickedBoard && (clickedBoard as Board).id) {
        this.message.messageAny(clickedBoard);
        // Save the selected board in localStorage
        const board = clickedBoard as Board;
        localStorage.setItem('lastViewedBoardId', board.id!);
        console.log('Board saved:', board.name || board.id);
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  }


  /** Open the sign-in panel and close the sign-up panel */
  handleSignIn(): void {
    this.sign_in = true;
    this.sign_up = false;
    this.message.messageSignIn(this.sign_in);
    this.message.messageSignUp(this.sign_up);
  }

  /** Open the sign-up panel and close the sign-in panel */
  handleSignUp(): void {
    this.sign_up = true;
    this.sign_in = false;
    this.message.messageSignIn(this.sign_in);
    this.message.messageSignUp(this.sign_up);
  }

  // Handle user disconnection and clear local storage
  handleDisconnect(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.tokenService.clearAll();
        localStorage.removeItem('lastViewedBoardId');
        this.message.messageDisconnect();
        this.message.messageConnected(false);
      }
    });
  }

  /**
   * Create a default board with 4 standard Kanban columns.
   * Called automatically when the authenticated user has no boards yet.
   */
  private async createDefaultBoard(): Promise<void> {
    try {
      console.log('Creating default board...');

      // 1. Créer le board
      const boardData = {
        name: 'Board',
        description: 'Default board'
      };

      const createdBoard: any = await lastValueFrom(
        this.entityService.addData('boards', boardData)
      );

      console.log('Default board created:', createdBoard);

      const boardId = createdBoard.id;

      // 2. Créer les 4 colonnes par défaut
      const defaultColumns = [
        { columnName: 'To-do', columnOrder: 0, limitWorkInProgress: null },
        { columnName: 'Do-today', columnOrder: 1, limitWorkInProgress: null },
        { columnName: 'In progress', columnOrder: 2, limitWorkInProgress: 3 },
        { columnName: 'Done', columnOrder: 3, limitWorkInProgress: null }
      ];

      for (const col of defaultColumns) {
        await lastValueFrom(
          this.entityService.addData('board/kanban-column', {
            columnName: col.columnName,
            columnOrder: col.columnOrder,
            limitWorkInProgress: col.limitWorkInProgress,
            boardId: boardId
          })
        );
      }

      console.log('Default columns created');

      // 3. Recharger les boards pour afficher le board créé
      await this.loadBoards();

    } catch (error) {
      console.error('Error creating default board:', error);
    }
  }

  /**
   * Set up all RxJS subscriptions for auth state changes.
   * Loads boards on connect, clears state on disconnect.
   *
   * PROTECTED: disconnect$ guard `if (msg !== true) return` is mandatory
   * to prevent the BehaviorSubject initial false value from disconnecting the header.
   */
  private setupSubscriptions(): void {
    console.log('Header setupSubscriptions - initial state:', { isConnected: this.isConnected });

    this.message.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isConnected => {
        const wasDisconnected = !this.isConnected;

        console.log('Header received connected$:', {
          isConnected,
          wasDisconnected,
          currentIsConnected: this.isConnected,
          willLoadBoards: isConnected && wasDisconnected
        });

        this.isConnected = isConnected;

        // If the user just connected, load boards
        if (isConnected && wasDisconnected) {
          console.log('User connected - loading boards...');
          this.loadBoards();
          this.initializeOwnerInfo();
        }

        this.cdr.detectChanges();
      });

    this.message.disconnect$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg: boolean) => {
        if (msg !== true) return;
        console.log('Header received disconnect$');
        this.isConnected = false;
        this.boards = [];
        this.ownerName = '';
        this.ownerInitials = '';
        this.cdr.detectChanges();
      });
  }

  /** Emit a global close-all-dropdowns event to the rest of the app */
  handlecloseAllOpenDropdown(){
    this.isCloseDropdown = true
    this.message.messageBooleanCloseAll(this.isCloseDropdown)
  }


  /** Open the profile editing modal pre-filled with the current user data */
  handleEditProfile(): void {
  console.log('Edit Profile clicked');

  // Récupérer les données actuelles
  const userData = this.tokenService.getUserData();
  this.editedUsername = userData?.username || this.ownerName;
  this.editedEmail = userData?.email || '';

  // Fermer le dropdown user et ouvrir le modal profile
  this.isDropdownOpenUser = false;
  this.isEditProfileOpen = true;

  this.cdr.detectChanges();
}

  /** Close the profile editing modal */
  handleCloseEditProfile(): void {
  this.isEditProfileOpen = false;
  this.cdr.detectChanges();
}

  /**
   * Validate and submit the profile update form.
   * Updates TokenService in memory and emits a profileUpdated event.
   */
  async handleUpdateProfile(): Promise<void> {
  if (!this.editedUsername?.trim()) {
    alert('Username cannot be empty');
    return;
  }

  if (!this.editedEmail?.trim()) {
    alert('Email cannot be empty');
    return;
  }

  if (this.editedPassword !== this.editedPasswordConfirm) {
    alert('Passwords do not match');
    return;
  }

  try {
    const userId = this.tokenService.getUserId();
    const updateData = {
      username: this.editedUsername.trim(),
      email: this.editedEmail.trim(),
      password: this.editedPassword.trim() ? this.editedPassword.trim() : undefined,
    };

    await lastValueFrom(
      this.authService.patchData('user/profile', userId!, updateData)
    );

    // Mettre à jour le TokenService
    const currentUserData = this.tokenService.getUserData();
    this.tokenService.setUserData({
      userId: currentUserData?.userId || userId!,
      username: this.editedUsername.trim(),
      email: this.editedEmail.trim(),
      role: currentUserData?.role || 'USER'
    });

   // Mettre à jour l'affichage
    this.ownerName = this.editedUsername.trim();
    this.ownerInitials = this.ownerName.substring(0, 2).toUpperCase();

    // Notify before clearing fields
    this.message.messageProfileUpdated({
      username: this.editedUsername.trim(),
      email: this.editedEmail.trim()
    });

    this.handleCloseEditProfile(); // vide editedUsername/editedEmail APRÈS
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile');
  }
}

}


