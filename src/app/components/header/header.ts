import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, lastValueFrom, map, Subject, takeUntil, tap } from 'rxjs';
import { Board } from '../../models/board.model';
import { EntityService } from '../../services/entity-service';
import { Message } from '../../services/message';
import { Reload } from '../../services/reload';
import { AuthService } from '../../services/authentication/auth-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faBell, faQuestion } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Font Awesome icons
  faBars = faBars;
  faBell = faBell;
  faQuestion = faQuestion;

  // Output events to communicate with parent component
  @Input() name : any = "name"
  @Output() closeAllOpenDropdown: EventEmitter<void> = new EventEmitter<void>();
  searchControl: FormControl = new FormControl();
  private destroy$ = new Subject<void>();

  openModalCreateBoard: boolean = false;
  isCloseDropdown?: boolean = false
  boards?: Board []
  board?: Board []
  results?: Board []
  isResult: boolean = false
  activ = ''
  activeIndex?: string | null = null
  isSignedIn?: boolean = false
  sign_up: boolean = false
  sign_in: boolean = false
  isConnected: boolean = false

  constructor (
    private entityService: EntityService,
    private detectChange: ChangeDetectorRef,
    private message: Message,
    private authService: AuthService,
    private reload: Reload
  ) {

  }

  // Lifecycle hook to initialize the component
  ngOnInit(): void {
    this.searchControl.valueChanges
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      map((query) => query ?? ''),  // Convert null or undefined to an empty string
      tap(query => {
        if (query.trim() === '') {
          this.isResult = false; // Reset isResult if the query is empty
          this.results = []; // Clear results if the query is empty
          this.detectChange.detectChanges();
        }
      }),
      filter((query) => query.trim() !== ''),  // Only proceed if the query is not empty
      takeUntil(this.destroy$)  // Automatically unsubscribe
    )
    .subscribe({
      next: (query: string) => {
        this.authService.searchData('board', query)
          .subscribe({
            next: (data: any) => {
              this.results = data;
              this.isResult = true;

            },
            error: (error: any) => {
              console.log(error);
              this.isResult = false;

            },
          });
      },
      error: (error: any) => {
        console.log(error);
        this.isResult = false;

      }
    });

    this.message.connected$.pipe(takeUntil(this.destroy$)).subscribe(
      (msg: boolean) => this.isConnected = msg

    );
    // this.message.disconnect$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => this.isSignedIn = msg)


    // Initial load of boards
    this.detectChange.detectChanges();

    // Get Board data
    this.getBoard();
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sign In and Sign Up
  handleSignIn(){
    // Send sign in status to the Sign In component
    this.sign_in = true
    this.sign_up = false
    this.message.messageSignIn(this.sign_in)
    this.message.messageSignUp(this.sign_up)
  }

  // Sign Up
  handleSignUp(){
    // Send sign up status to the Sign Up component
    this.sign_up = true
    this.sign_in = false

    this.message.messageSignIn(this.sign_in)
    this.message.messageSignUp(this.sign_up)
  }

  // Close all open dropdowns
  handlecloseAllOpenDropdown(){
    this.isCloseDropdown = true
    this.message.messageBooleanCloseAll(this.isCloseDropdown)
  }

  // Open Create Board Modal
  onCreateBoard() {
    this.openModalCreateBoard = true
    console.log('Sending openModalCreateBoard:', this.openModalCreateBoard);
    this.message.messageBooleanOpenModal(this.openModalCreateBoard)
  }

  // Get Board data
  async getBoard(index: number = 0) {
    const boardData: Board[] = await lastValueFrom(this.authService.get<Board[]>("board"));

    if (boardData) {
      const current: any = boardData
      this.boards = current
    }

    if (this.boards) {
      // Send default active board
      this.message.messageAny(this.boards[index])
      this.activeIndex = this.boards[0]?.name
    }
  }

  // Open Board
  async handleOpenBoard(event: any, name?: string) {

    // Get clicked board data
    const clickedBoard  = await lastValueFrom(this.authService.getDataById("board", event));

    this.activeIndex = name

    // Clear array results[]
    this.results = []

    // Reset input field
    this.searchControl.reset()

    if(this.isResult === true) {
      this.isResult = false
    }

    // Get clicked board data and send output event
    if (clickedBoard) {
      // Send clicked board data to Board component
      const current: any = clickedBoard
      this.board = current

      // Send clicked board data to Board component
      this.message.messageAny(this.board)
    }
  }

  handleDisconnect(){
    // Remove authentication data from localStorage
    // localStorage.removeItem('Api-Secret');
    // localStorage.removeItem('User-Id');
    // localStorage.removeItem('userEmail');
    // localStorage.removeItem('isAuthenticated');
    // localStorage.removeItem('connected');

    // Update connection status

    this.message.messageDisconnect();
    this.message.messageConnected(false);
  }
}
