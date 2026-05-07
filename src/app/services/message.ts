import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Message {
  private CloseAll = new BehaviorSubject<boolean>(false);
  private OpenModal = new BehaviorSubject<boolean>(false);
  private OpenBoard = new BehaviorSubject<boolean>(false);
  private any = new BehaviorSubject<any>(null);
  private editMemberrole = new BehaviorSubject<any>(null);
  private openTaskModal = new BehaviorSubject<any>(null);
  private signIn = new BehaviorSubject<boolean>(this.getInitialSignInState());
  private signUp = new BehaviorSubject<boolean>(this.getInitialSignUpState());
  // Do not initialize 'connected' with localStorage - the APP_INITIALIZER will set it after token verification
  private connected = new BehaviorSubject<boolean>(false);
  private disconnect = new BehaviorSubject<boolean>(false);
  private openMembersDropdown = new BehaviorSubject<boolean>(false);
  private sendMessage = new BehaviorSubject<any>(null);
  private boardDeleted = new Subject<void>();
  private profileUpdated = new Subject<{ username: string; email: string }>();


  boolCloseAll$ = this.CloseAll.asObservable();
  boolOpenModal$ = this.OpenModal.asObservable();
  any$ = this.any.asObservable();
  openTaskModal$ = this.openTaskModal.asObservable();
  roleChangeData$ = this.editMemberrole.asObservable();
  signIn$ = this.signIn.asObservable();
  signUp$ = this.signUp.asObservable();
  connected$ = this.connected.asObservable();
  disconnect$ = this.disconnect.asObservable();
  openBoard$ = this.OpenBoard.asObservable();
  openMembersDropdown$ = this.openMembersDropdown.asObservable();
  sendMessage$ = this.sendMessage.asObservable();
  boardDeleted$ = this.boardDeleted.asObservable();
  profileUpdated$ = this.profileUpdated.asObservable();


  constructor() { }

  // ─── Private initializers ───────────────────────────────────────────────────

  /**
   * Read the sign-in panel visibility flag stored in localStorage
   * @returns true if the sign-in panel was open before the last page reload
   */
  private getInitialSignInState(): boolean {
    return localStorage.getItem('sign_in') === 'true';
  }

  /**
   * Read the sign-up panel visibility flag stored in localStorage
   * @returns true if the sign-up panel was open before the last page reload
   */
  private getInitialSignUpState(): boolean {
    return localStorage.getItem('sign_up') === 'true';
  }

  /**
   * Read the connected flag stored in localStorage
   * @returns true if the user was connected before the last page reload
   * @deprecated Not used — APP_INITIALIZER sets the connected state via cookie
   */
  private getInitialConnectedState(): boolean {
    return localStorage.getItem('connected') === 'true';
  }

  // ─── Emitters ────────────────────────────────────────────────────────────────

  /**
   * Emit a close-all-dropdowns event
   * @param message - true to close, false otherwise
   */
  messageBooleanCloseAll(message: boolean) {
    this.CloseAll.next(message);
  }

  /**
   * Emit an open/close modal event
   * @param message - true to open, false to close
   */
  messageBooleanOpenModal (message: boolean) {
    this.OpenModal.next(message);
  }

  /**
   * Emit a generic payload to any subscriber
   * @param message - arbitrary data
   */
  messageAny(message: any) {
    this.any.next(message);
  }

  /**
   * Emit a member-role change payload (member + new role)
   * @param message - the role change data
   */
  messageRoleChange(message: any){
    this.editMemberrole.next(message);
  }

  /**
   * Emit an event to open a task detail modal
   * @param message - the task data to display
   */
  messageOpenTaskModal(message: any){
    this.openTaskModal.next(message);
  }

  /**
   * Emit the sign-in panel visibility state
   * @param message - true to show the sign-in panel
   */
  messageSignIn(message: boolean) {
    this.signIn.next(message);
  }

  /**
   * Emit the sign-up panel visibility state
   * @param message - true to show the sign-up panel
   */
  messageSignUp(message: boolean) {
    this.signUp.next(message);
  }

  /**
   * Emit the global authentication state
   * Called exclusively by APP_INITIALIZER after cookie validation
   * @param message - true if the user is authenticated
   */
  messageConnected(message: boolean) {
    this.connected.next(message);
  }

  /** Emit a disconnect request (logout triggered from any component) */
  messageDisconnect() {
    // Emitting true signals an explicit logout request
    this.disconnect.next(true);
  }

  /**
   * Emit the board panel open/close state
   * @param message - true to open, false to close
   */
  messageOpenBoard(message: boolean) {
    this.OpenBoard.next(message);
  }

  /**
   * Emit the members dropdown open/close state
   * @param message - true to open, false to close
   */
  messageOpenMembersDropdown(message: boolean) {
    this.openMembersDropdown.next(message);
  }

  /**
   * Emit a message or notification payload
   * @param message - the data to broadcast
   */
  messageSendMessage(message: any) {
    this.sendMessage.next(message);
  }

  /** Emit a board-deleted notification (e.g. to reload the board list) */
  messageBoardDeleted(): void {
    this.boardDeleted.next();
  }

  /**
   * Emit updated profile data after a successful profile edit
   * @param data - the new username and email
   */
  messageProfileUpdated(data: { username: string; email: string }): void {
    this.profileUpdated.next(data);
  }
}
