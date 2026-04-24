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
import { MemberService } from '../../../services/member-service';
import { faPencil} from '@fortawesome/free-solid-svg-icons';
import {  } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-show-member',
  imports: [CommonModule, CharacterPipe, ChangeRole, FontAwesomeModule],
  templateUrl: './show-member.html',
  styleUrl: './show-member.css',
})
export class ShowMember {
  // Font Awesome icon
  readonly faPencil = faPencil;

  // 
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
    private memberService: MemberService,
    private reloadPage: Reload,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private sendMemberData: Message
  ) {}

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Utiliser setTimeout pour éviter ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        if (this.dropdownValue === false) {
          this.clickOutside.emit(this.dropdownValue = true);

          if (this.isChangeRole === true && this.currentStep === 2) {
            this.isChangeRole = false;
          }
        } else {
          if (this.isChangeRole === false) {
            this.clickOutside.emit(this.dropdownValue = false);
          }

          if (this.isChangeRole === true && this.currentStep === undefined) {
            this.isChangeRole = false;
          }
        }
        this.cdr.detectChanges();
      }, 0);
    }

   
    
  }


  async handleMemberEdit(event: string | undefined, id: string | undefined): Promise<void> {
    if (!event || !id) return;
    
    try {
      const allMembers = await lastValueFrom(
        this.memberService.getMemberData<Members>('board/member')
      );

      console.log(allMembers);

      if (!allMembers || !allMembers[0]) {
        console.error('Board not found');
        return;
      }

      this.selectedMember = allMembers?.filter(
        (item: Members) => item.memberEmail === event
      );
      
      // Change role visible dans setTimeout
      setTimeout(() => {
        this.isChangeRole = true;

        if (this.currentStep === 2) {
          this.sendChangeRoleToSearch.emit(true);
        }

        this.cdr.detectChanges();
      }, 0);

    } catch (error) {
      console.error('Error editing member:', error);
    }
  }

  async handlRemoveMember(event: any): Promise<void> {
    if (!event) return;
    try {

      // Delete member
      await lastValueFrom(
        this.memberService.delete('board/member', event)
      );
      
      this.reloadPage.reloadPage();
    
    } catch (error) {
      console.error('Error removing member:', error);
      alert('An error occurred while removing the member');
    }
  }

  handleCloseDropdown(): void {
    this.closeMemberModal.emit();
  }

  handleCloseChangeRole(event: Members | undefined): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (event === undefined) {
        // Change role hidden
        this.isChangeRole = false;
      } else {
        // Actualize memberData
        this.memberData = [event];
        this.sendMemberData.messageRoleChange(event);       

        // Change role hidden
        this.isChangeRole = false;
      }

      this.sendChangeRoleToSearch.emit(this.isChangeRole);
      this.cdr.detectChanges();
    }, 0);
  }

}
