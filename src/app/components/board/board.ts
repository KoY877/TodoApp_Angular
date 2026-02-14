import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ShowAdmin } from "../boardElement/show-admin/show-admin";
import { ShowMember } from "../boardElement/show-member/show-member";
import { SearchMember } from "../boardElement/search-member/search-member";
import { InviteMember } from "../boardElement/invite-member/invite-member";
import { List } from "../todoList/list/list";
import { Alert } from "../boardElement/alert/alert";
import { Members } from '../../models/members.model';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntityService } from '../../services/entity-service';
import { lastValueFrom } from 'rxjs';
import { Board as BoardModel } from '../../models/board.model';
import { CharacterPipe } from '../../pipes/character-pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-board',
  imports: [CommonModule, ShowAdmin, ShowMember, SearchMember, InviteMember, Alert, CharacterPipe],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  @Input() clickedBoard!: BoardModel;
  @Input() isCloseAllDropdown = false;
  @Output() sendMemberData = new EventEmitter<Members>();
  @Output() allDropdownClosed = new EventEmitter<void>();
  @Output() sendTaskData = new EventEmitter<unknown>();

  boardId: string = ''
  boards: BoardModel[] = []
  members: Members[] = []
  memberColors: string[] = []
  memberDropdown: Array<{name: string; isDropdown: boolean}> = []
  memberEdit: Members[] = []
  memberEmails?: Members[]
  isMembers = false
  sendBoardId = ''
  currentBoard?: BoardModel[]
  isAlert = false
  position: 'start' | 'end' = 'start'
  index = 7;
  numberOfMember?: number
  form : FormGroup

 constructor(
  private formBuilder :FormBuilder,
  private entityService : EntityService
  ) {

    this.form =  this.formBuilder.group({
      name: ['', Validators.required],
      columns: this.formBuilder.array([]),
      added_columns: this.formBuilder.array([]),
      selectedTask: [''],
      globalOption: [''],
      email: ['', [Validators.required, Validators.email]],
      members: this.formBuilder.array([])
    });

    const board: BoardModel = new BoardModel('', '', [], '', '', []);
  }


  // Call ngOnchange, if @Input change
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isCloseAllDropdown'] && changes['isCloseAllDropdown'].currentValue) {
      this.handleCloseAllDropdown(this.getisCloseDropdown());
    }

    if (changes['clickedBoard'] && changes['clickedBoard'].currentValue) {
      this.getCurrentBoardData(this.getBoardData());

      this.memberEmails = this.clickedBoard?.members
    }

    // receive board member data
    this.handleBoardMember(this.boardId);
  }

  // Get Id
  getId(): string | undefined {
    return this.clickedBoard?.id;
  }

  getId2(): string | undefined {
    return this.clickedBoard?.id;
  }

  getBoardData(): BoardModel | undefined {
    return this.clickedBoard;
  }

  getisCloseDropdown(): boolean | undefined{
    return this.isCloseAllDropdown;
  }

  // Get current boardId
  getCurrentBoardData(data: BoardModel | undefined) {
    if (data) {
      this.boardId = data.id || '';
    }

  }

  handleCloseAllDropdown(closeAll: boolean | undefined){
    if (closeAll=== true) {
      for (let i = 0; i < this.memberDropdown.length; i++) {
        if ( this.memberDropdown[i].isDropdown === true){
          this.memberDropdown[i].isDropdown = false
        }
      }
    }
  }

  ngOnInit(): void {

    this.memberDropdown = [
      {name: "admin", isDropdown: false},
      {name: "search", isDropdown: false},
      {name: "invite", isDropdown: false},
      {name: "timer", isDropdown: false},
      {name: "filter", isDropdown: false},
      {name: "edit", isDropdown: false},
      {name: "menu", isDropdown: false},
    ]

  }

  // Get email
  get email(): FormArray{
    return this.form.get('email') as FormArray;
  }

  // Get member data
  get memberColumns(): FormArray{
    return this.form.get('members') as FormArray;
  }

  // receive board member data
  async handleBoardMember (id: string | undefined) {
    // Get current board data
    this.currentBoard = await lastValueFrom(this.entityService.getDataById<BoardModel>('board', id));

    this.sendTaskData.emit(this.currentBoard)
     // Number of admin + members
     this.numberOfMember = this.currentBoard![0]?.members.length + 1;

    this.members = this.currentBoard![0]?.members ;

    // Give an text color
    this.memberColors = this.members?.map(() => this.getRandomColor());

    // Add member in memberDropdown array
    this.members?.forEach((item) => {
      if (item.memberEmail) {
        this.memberDropdown.push({
          name: item.memberEmail,
          isDropdown: false
        });
      }
    });

  }

  // Open Alert
  alertOnClickOutside(event: any): void {
    for (let i = 0; i < this.memberDropdown.length; i++) {
      if ( this.memberDropdown[i].isDropdown === true && event=== true){
        this.isAlert = true
      }
    }
  }

  // Close Alert
  handleCancel(): void {
    this.isAlert = false
  }

  // Return Hexdecimal color
  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color: string | null = '#'

    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }

    return color
  }

  // Open Dropdown
  handleOpenDropdown(event: string | undefined) {
    // if (!event) return;

    for (let i = 0; i < this.memberDropdown.length; i++) {

      if ( this.memberDropdown[i].name === event || (event === 'search' && this.memberDropdown[i].isDropdown === true)){
        this.memberDropdown[i].isDropdown = true
      } else {
        this.memberDropdown[i].isDropdown = false
      }
    }

    // Find clicked member data
    this.memberEdit = this.members?.filter((item) => item.memberEmail === event)

    this.isCloseAllDropdown = false

    this.allDropdownClosed.emit()
  }

  // Close Dropdown
  handleCloseDropdown(event: any) {

    for (let i = 0; i < this.memberDropdown.length; i++) {
      if ( this.memberDropdown[i].name === event ){

        this.memberDropdown[i].isDropdown = false

      } else if (event === false && this.memberDropdown[i].isDropdown === true){
        this.memberDropdown[i].isDropdown = false
      }
    }

    this.isAlert = false
  }
}
