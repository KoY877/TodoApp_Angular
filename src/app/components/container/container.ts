import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { SignUp } from "../sign-up/sign-up";
import { ModalCreateBoard } from "../modals/modal-create-board/modal-create-board";
import { Board } from "../board/board";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Message } from '../../services/message';
import { TokenService } from '../../services/authentication/tokenService';
import { CommonModule } from '@angular/common';
import { SignIn } from '../sign-in/sign-in';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SignUp, SignIn, ModalCreateBoard, Board],
  templateUrl: './container.html',
  styleUrl: './container.css',
})
export class Container implements OnInit {
  // @Input () clickedBoard: Board | undefined;
  @Input() isCloseAllDropdown = false;
  @Output() closedDropdown:  EventEmitter<void> = new EventEmitter<void>()
  @Output() closeModal2: EventEmitter<void> = new EventEmitter<void>()
  @Output() dropdownStateChange = new EventEmitter<boolean>();
  @Output() closeAllOpenDropdown = new EventEmitter<void>();

  private destroy$ = new Subject<void>()

  ownerName: string = "";
  ownerInitials: string = "";
  sign_in: boolean = false
  sign_up: boolean = false
  isConnected: boolean = false
  isDisconnected: boolean = false
  openBoard: boolean = false
  openModalCreateBoard: boolean = false
  modalData?: string = ""
  clickedBoard?: any;
  emailValChange: boolean = false
  isAnyDropdownOpen = false;
  memberDropdown: Array<{name: string; isDropdown: boolean}> = [];

  constructor(
    private message : Message,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ){ }

  async ngOnInit(): Promise<void> {

    // ✅ SOUSCRIRE AUX OBSERVABLES
    // L'initialisateur d'app a déjà restauré la session si possible

    this.message.signIn$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.sign_in = msg;
      this.sign_up = !msg;
    });

    this.message.signUp$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.sign_up = msg;
      this.sign_in = !msg;
    });

    this.message.connected$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.isConnected = msg;

      if (this.isConnected) {
        this.sign_in = false;
        this.sign_up = false;
        this.openBoard = true;
      } else {
        this.sign_in = true;
        this.sign_up = false;
        this.openBoard = false;
      }

      this.cdr.detectChanges();
    });

    this.message.disconnect$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      if (msg === true) {
        this.isConnected = false;
        this.clickedBoard = undefined;
        this.sign_in = true;
        this.sign_up = false;
        this.openBoard = false;
        localStorage.removeItem("lastViewedBoardId");
        this.cdr.detectChanges();
      }
    });

    this.message.boolOpenModal$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.openModalCreateBoard = msg;
      document.body.style.overflow = msg ? "hidden" : "";
    });

    this.message.any$.pipe(takeUntil(this.destroy$)).subscribe((boardData: any) => {
      if (boardData) {
        const board = Array.isArray(boardData) ? boardData[0] : boardData;
        this.clickedBoard = { ...board };
        this.openBoard = true;
        // ✅ Sauvegarder uniquement l'ID du board
        if (board.id) {
          localStorage.setItem('lastViewedBoardId', board.id);
        }
        this.cdr.detectChanges();
      }
    });

    // Écouter les mises à jour du profil
    this.message.profileUpdated$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.ownerName = data.username;
      this.ownerInitials = data.username.substring(0, 2).toUpperCase();
      this.cdr.detectChanges();
    });

    // ✅ Initialiser l'état basé sur l'authentification actuelle
    // (déjà restaurée par l'APP_INITIALIZER si possible)
    const isAuth = this.tokenService.isAuthenticated();

    if (isAuth) {
      console.log('✅ Container: Utilisateur authentifié détecté');
      // Le messageConnected(true) a déjà été appelé par l'initializer
    } else {
      console.log('ℹ️ Container: Aucune authentification - Affichage du login');
      this.showSignIn();
    }

    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isCloseAllDropdown']?.currentValue !== undefined) {
      this.closeAllOpenDropdown.emit(); // pour les enfants directs si tu veux
    }

    if (changes['UserName']?.currentValue !== undefined) {
      this.emailValChange = true;
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthodes pour gérer les dropdowns et modals
  onDropdownStateChange(isOpen: boolean) {
    this.isAnyDropdownOpen = isOpen;
  }

  // Method to handle Open Sign Up
  handleOpenSignUp(){
    this.sign_in = false;
    this.sign_up = true;
    this.message.messageSignIn(false);
    this.message.messageSignUp(true);
  }

  // Method to handle Open Sign In
  handleOpenSignIn(){
    this.showSignIn();
  }

  handleCloseSignUp(isOpen: boolean){
    if (!isOpen) {
      this.showSignIn();
    }
  }

  handleCloseModal(){
    this.openModalCreateBoard = false;
    this.openBoard = true;
    document.body.style.overflow = ""; // restore scroll
    this.cdr.detectChanges();
  }

  // Method to close all simple dropdowns
  handleCloseAllDropdown(closeAll: boolean | undefined){
    if (closeAll=== true) {
      for (let i = 0; i < this.memberDropdown.length; i++) {
        if ( this.memberDropdown[i].isDropdown === true){
          this.memberDropdown[i].isDropdown = false
        }
      }
    }
  }

  // Method to handle Close Dropdown
  handleClosedDropdown(){
    this.isCloseAllDropdown = false
  }

  private showSignIn(): void {
    this.isConnected = false;
    this.sign_in = true;
    this.sign_up = false;
    this.openBoard = false;
    this.message.messageConnected(false);
    this.message.messageSignIn(true);
    this.message.messageSignUp(false);
  }

  handleBoardDeleted(): void {
    // Fermer le board et retourner à l'état initial
    this.openBoard = false;
    this.clickedBoard = undefined;

    // Notifier le header de rafraîchir la liste des boards
    this.message.messageBoardDeleted();

    this.cdr.detectChanges();
  }



}
