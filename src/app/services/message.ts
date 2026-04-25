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
  // ⚠️ Ne pas initialiser 'connected' avec localStorage - l'APP_INITIALIZER va le définir après vérification du token
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

  // Helper methods to get initial state from localStorage
  private getInitialSignInState(): boolean {
    return localStorage.getItem('sign_in') === 'true';
  }

  private getInitialSignUpState(): boolean {
    return localStorage.getItem('sign_up') === 'true';
  }

  private getInitialConnectedState(): boolean {
    return localStorage.getItem('connected') === 'true';
  }

  // Methods to emit messages
  messageBooleanCloseAll(message: boolean) {
    this.CloseAll.next(message);
  }

  messageBooleanOpenModal (message: boolean) {
    this.OpenModal.next(message);
  }

  messageAny(message: any) {
    this.any.next(message);
  }

  messageRoleChange(message: any){
    this.editMemberrole.next(message);
  }

  messageOpenTaskModal(message: any){
    this.openTaskModal.next(message);
  }


  messageSignIn(message: boolean) {
    this.signIn.next(message);
  }

  messageSignUp(message: boolean) {
    this.signUp.next(message);
  }

  messageConnected(message: boolean) {
    this.connected.next(message);
  }

  messageDisconnect() {
    this.disconnect.next(true);
  }

  messageOpenBoard(message: boolean) {
    this.OpenBoard.next(message);
  }

  messageOpenMembersDropdown(message: boolean) {
    this.openMembersDropdown.next(message);
  }

  messageSendMessage(message: any) {
    this.sendMessage.next(message);
  }

  messageBoardDeleted(): void {
    this.boardDeleted.next();
  }

  messageProfileUpdated(data: { username: string; email: string }): void {
    this.profileUpdated.next(data);
  }
}
