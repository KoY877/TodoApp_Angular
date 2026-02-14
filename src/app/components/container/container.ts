import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { SignIn } from "../sign-in/sign-in";
import { SignUp } from "../sign-up/sign-up";
import { ModalCreateBoard } from "../modals/modal-create-board/modal-create-board";
import { Board } from "../board/board";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Message } from '../../services/message';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-container',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SignUp, SignIn, ModalCreateBoard, Board],
  templateUrl: './container.html',
  styleUrl: './container.css',
})
export class Container {
  @Output() closedDropdown:  EventEmitter<void> = new EventEmitter<void>()
  @Output() closeModal2: EventEmitter<void> = new EventEmitter<void>()
  private destroy$ = new Subject<void>()

  sign_in: boolean = false
  sign_up: boolean = false
  isConnected: boolean = false
  isDisconnected: boolean = false
  openBoard: boolean = false
  openModalCreateBoard: boolean = false
  modalData?: string = ""
  isCloseAllDropdown: boolean = false
  clickedBoard?: any;
  emailValChange: boolean = false

  constructor(
    private message : Message,
    private cdr: ChangeDetectorRef
  ){ }

  ngOnInit():void {

    // Check if user has valid authentication credentials
    const apiSecret = localStorage.getItem("Api-Secret");
    const userId = localStorage.getItem("User-Id");
    const username = localStorage.getItem("username");
    const hasValidAuth = !!(apiSecret && userId);

    // Restore state from localStorage on page reload
    if (hasValidAuth) {
      // User is authenticated - show board, hide sign-in/sign-up
      this.isConnected = true;

      // Update localStorage AND MessageService BEFORE subscriptions
      localStorage.setItem("connected", "true");

      // Force BehaviorSubjects to emit correct values
      this.message.messageConnected(true);
      this.message.messageSignIn(false);
      this.message.messageSignUp(false);

      // Restore last viewed board if exists
      const savedBoard = localStorage.getItem('lastViewedBoard');
      if (savedBoard) {
        try {
          this.clickedBoard = JSON.parse(savedBoard);
        } catch (e) {
          console.error('Error parsing saved board:', e);
        }
      }

      this.cdr.detectChanges();
    } else {
      // User is not authenticated - show sign-in by default
      this.isConnected = false;
      this.sign_in = true;
      this.sign_up = false;

      // Update localStorage AND MessageService
      localStorage.setItem("connected", "false");

      this.message.messageConnected(false);

      // Clear potentially stale state
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("lastViewedBoard");
    }

    // Receive sign in status from header-component
    this.message.signIn$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.sign_in = msg;
      this.sign_up = !msg; // Inverse of sign_in
    });

    // Receive sign up status from header-component
    this.message.signUp$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.sign_up = msg;
      this.sign_in = !msg; // Inverse of sign_up
    });

    // Receive connected status from sign-in-component
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

      console.log('Container connected$:', this.isConnected, 'openBoard:', this.openBoard);
      this.cdr.detectChanges();
    });

    // Receive disconnect status from header-component
    this.message.disconnect$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      if (msg === true) {
        // User clicked disconnect - clear state and show sign-in
        this.isConnected = false;
        this.clickedBoard = undefined;
        this.sign_in = true;
        this.sign_up = false;
        this.openBoard = false;

        console.log('Container disconnect$: clearing state');

        localStorage.setItem("connected", "false");
        localStorage.setItem("sign_in", "true");
        localStorage.setItem("sign_up", "false");
        localStorage.removeItem("lastViewedBoard");

        this.cdr.detectChanges();
      }
    });

    // Receive isModalVisibleIncontainer data from header-component
    this.message.boolOpenModal$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {    this.openModalCreateBoard = msg;
      console.log('Container 3: openModalCreateBoard:', this.openModalCreateBoard, 'isConnected:', this.isConnected, 'openBoard:', this.openBoard, 'sign_in:', this.sign_in, 'sign_up:', this.sign_up, 'modalData:', this.modalData, 'isCloseAllDropdown:', this.isCloseAllDropdown);
      if (this.openModalCreateBoard === true) {
        document.body.style.overflow = "hidden"; // disable scroll when modal is open
      } else {
        document.body.style.overflow = ""; // restore scroll
      }
    });
  }

  // Method to handle Open Sign Up
  handleOpenSignUp(){
    this.sign_in = false;
    this.sign_up = true
  }

  // Method to handle Open Sign In
  handleOpenSignIn(){
    this.sign_in = true
    this.sign_up = false
  }

  handleCloseModal(){
    this.openModalCreateBoard = false;
    this.openBoard = true;
    document.body.style.overflow = ""; // restore scroll
    this.cdr.detectChanges();
  }
}
