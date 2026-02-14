import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Members } from '../../../models/members.model';
import { EntityService } from '../../../services/entity-service';
import { Reload } from '../../../services/reload';
import { Message } from '../../../services/message';
import { lastValueFrom } from 'rxjs';
import { Board as BoardModel } from '../../../models/board.model';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { ChangeRole } from "../change-role/change-role";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-show-member',
  imports: [CommonModule, CharacterPipe, ChangeRole],
  templateUrl: './show-member.html',
  styleUrl: './show-member.css',
})
export class ShowMember {
  @Input() memberData!: Members[];
  @Input() getBoardId!: string;
  @Input() currentStep!: number;
  @Output() closeMemberModal = new EventEmitter<void>();
  @Output() sendChangeRoleToSearch = new EventEmitter<boolean>();
  @Output() clickOutside = new EventEmitter<boolean>();

  members?: Members[];
  selectedMember?: Members[];
  delete?: Members[];
  isChangeRole = false;
  dropdownValue = false;


  constructor(
    private entityService: EntityService,
    private reloadPage : Reload,
    private detectChange: ChangeDetectorRef,
    private elementRef: ElementRef,
    private sendMemberData: Message
  ) {

  }

  ngOnInit(): void {

  }

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.dropdownValue === false) {

        this.clickOutside.emit(this.dropdownValue = true);

        if (this.isChangeRole === true && this.currentStep === 2 ){
          this.isChangeRole = false;
        }

      } else {
        if (this.isChangeRole === false) {
          this.clickOutside.emit(this.dropdownValue = false);
        }

        if (this.isChangeRole === true && this.currentStep === undefined ){
          this.isChangeRole = false;
        }

      }
    }
  }

  async handleMemberEdit(event: string | undefined, id: string | undefined): Promise<void> {
    if (!event || !id) return;

    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

    this.members = currentBoard[0]?.members;

    this.selectedMember = this.members?.filter((item: Members) => item.memberEmail === event);

    // Change role visible
    this.isChangeRole = true

    if (this.currentStep === 2){
      this.sendChangeRoleToSearch.emit(this.isChangeRole = true)
    }

  }

  async handlRemoveMember(event: string | undefined, id: string | undefined): Promise<void> {
    if (!event || !id) return;

    // Get current board data
    const currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

    this.members = currentBoard[0]?.members;

    this.delete = this.members?.filter((item) => item.memberEmail !== event);

    this.delete?.forEach((item: Members) => {
      if (currentBoard[0]?.members) {
        const index = currentBoard[0].members.indexOf(item);
        if (index !== -1) {
          currentBoard[0].members.splice(index, 1);
        }
      }
    });

    const updateBoard = await lastValueFrom(this.entityService.updateData('board', currentBoard));

    this.reloadPage.reloadPage();
  }

  handleCloseDropdown() {
    this.closeMemberModal.emit()
  }

  handleCloseChangeRole(event: Members | undefined): void {
    if (event === undefined) {
      // Change role hidden
      this.isChangeRole = false;
    } else {
      // Actualize memberData
      this.memberData = [event];
      this.sendMemberData.messageRoleChange(event)

      // Change role hidden
      this.isChangeRole = false
    }

    this.sendChangeRoleToSearch.emit(this.isChangeRole)
  }
}
