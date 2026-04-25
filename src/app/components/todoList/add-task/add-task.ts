import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Message } from '../../../services/message';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Description } from "../description/description";
import { CommonModule } from '@angular/common';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { Members } from "../members/members";
import { Labels } from "../labels/labels";
import { CamelcasePipe } from '../../../pipes/camelcase-pipe';
import { faClock, faList, faPlus, faTag, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { EntityService } from '../../../services/entity-service';

@Component({
  selector: 'app-add-task',
  imports: [CommonModule, ReactiveFormsModule, Description, CharacterPipe, Members, Labels, CamelcasePipe, FontAwesomeModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.css',
})
export class AddTask {
  readonly faUsers = faUsers;
  readonly faListAlt = faList;
  readonly faClock = faClock;
  readonly faPlus = faPlus;
  readonly faTag = faTag;

  @Input() currentBoard!: any;
  @Input() isTaskOpen: boolean = false;
  @Input() isEditTask: boolean = false;
  @Input() taskToEdit: any = null;  // ← Ajouter
  @Output() taskUpdated = new EventEmitter<any>();  // ← Ajouter
  @Input() columnId!: string;
  @Output() closeTaskModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() closeTimeModal: EventEmitter<void> = new EventEmitter<void>();
  @Output() clickOutside = new EventEmitter<void>();
  @Output() taskCreated = new EventEmitter<any>();

  private destroy$ = new Subject<void>();

  selectedItem: any = { name: 'Yellow', colorChoice: '#f5cc00', bgColor: '#ffffe0' };
  myModal: any
  defaultColors: Array<any> = []
  members: any[] = []
  selectedMembers: any[] = []
  selectedMember?: any | undefined[] = []
  selectedLabel?: any | undefined[] = []
  selectedLabels: any[] = []
  time: number | undefined;
  isMembers: boolean = false;
  isLabels: boolean = false;
  isEstimateTime: boolean = false;
  isTimeValue: boolean = false;
  isDescription: boolean = false;

  isMemberSelected: Boolean = false
  isLabelSelected: Boolean = false
  form: FormGroup

  constructor(
    private fb: FormBuilder,
    private message: Message,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private entityService: EntityService,
  ) {
    this.form = fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      colors: this.fb.array([]),
      members: this.fb.array([]),
      labels: this.fb.array([]),
      description: [''],
      date: [''],
      time: [''],
    });
  }

  ngOnInit(): void {
    this.handleColorArray();

    this.message.openMembersDropdown$.pipe(takeUntil(this.destroy$)).subscribe((msg: boolean) => {
      this.isMembers = msg;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    // Pré-remplir après l'initialisation de la vue
    if (this.isEditTask && this.taskToEdit) {
      this.form.patchValue({
        name: this.taskToEdit.name,
        description: this.taskToEdit.description || '',
      });

      // Pré-remplir les membres avec la propriété 'checked: true'
      if (this.taskToEdit.members?.length) {
        this.selectedMembers = this.taskToEdit.members.map((m: any) => ({
          ...m,
          checked: true
        }));
        this.isMemberSelected = true;
      }

      // Pré-remplir les labels
      if (this.taskToEdit.labels?.length) {
        this.selectedLabels = this.taskToEdit.labels.map((label: string | any) => ({
          label: typeof label === 'string' ? label : label.label || label,
          checked: true
        }));
        this.isLabelSelected = true;
      }

      // Pré-remplir la couleur
      if (this.taskToEdit.colors?.[0]) {
        const color = this.defaultColors.find(c => c.colorChoice === this.taskToEdit.colors[0]);
        if (color) {
          this.selectedItem = color;
        }
      }

      // Gérer le temps
      if (this.taskToEdit.time) {
        const timeValue = this.taskToEdit.time.toString().split(':')[0];
        this.time = parseInt(timeValue);
        this.form.patchValue({ time: this.time });
        this.isTimeValue = true;
      }

      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get colors(): FormArray {
    return this.form?.get('colors') as FormArray;
  }

  get labels(): FormArray {
    return this.form?.get('labels') as FormArray;
  }

  // If outside this component is clicked, send output on the board
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {

      // Check if the task modal is open
      if (this.isTaskOpen === true) {

        if (this.isMembers === true || this.isLabels === true || this.isDescription === true || this.isEstimateTime === true) {
          this.isMembers = false;
          this.isLabels = false;
          this.isDescription = false;
          this.isEstimateTime = false;
          this.cdr.detectChanges();
        } else {
          this.clickOutside.emit();
        }

      }
    }
  }

  // Update the selected item when a color is selected
  selectItem(data: any) {
    this.selectedItem = data.value; //  Updates the selected item
  }

  // Add default color in defaultColor array
  handleColorArray() {
    this.defaultColors = [
      { name: 'Yellow', colorChoice: '#f5cc00', bgColor: '#ffffe0' },
      { name: 'Red', colorChoice: '#ff858f', bgColor: '#ffccd0' },
      { name: 'Orange', colorChoice: '#faa200', bgColor: '#ffeac2' },
      { name: 'Blue', colorChoice: '#70b0ff', bgColor: '#cce3ff' }
    ];

    this.defaultColors.forEach((color) => {
      this.colors.push(this.fb.group({
        name: [color.name],
        colorChoice: [color.colorChoice],
        bgColor: [color.bgColor]
      }),);
    });

    return this.colors
  }

  // Open or close Dropdown menu
  handleDropdown(event: string) {

    // for Members
    // for Members
if (event === 'member') {
  if (this.isMembers === false) {
    this.isMembers = true;
    this.isLabels = false;
    this.isDescription = false;
    this.isEstimateTime = false;

    // Charger les membres du board
    this.members = this.currentBoard[0].members;

    // Si en mode édition, marquer les membres sélectionnés comme cochés
    if (this.isEditTask && this.selectedMembers.length > 0) {
      this.members = this.members.map((member: any) => ({
        ...member,
        checked: this.selectedMembers.some((sm: any) =>
          (sm.id || sm) === (member.id || member)
        )
      }));
    }
  } else {
    this.isMembers = false;
  }
  this.cdr.detectChanges();
}

    // for Labels
    if (event === 'label') {
      if (this.isLabels === false) {
        this.isLabels = true
        this.isMembers = false
        this.isDescription = false
        this.isEstimateTime = false
      } else {
        this.isLabels = false
      }
    }

    if (event === 'description') {
      if (this.isDescription === false) {
        this.isDescription = true
        this.isMembers = false
        this.isLabels = false
        this.isEstimateTime = false
      } else {
        this.isDescription = false
      }
    }

    if (event === 'time') {

      if (this.isEstimateTime === false) {
        this.isEstimateTime = true
        this.isMembers = false
        this.isLabels = false
        this.isDescription = false
      } else {
        this.isEstimateTime = false
      }
    }

    this.cdr.detectChanges();
    return this.members
  }

  // Receive and show selected Members
  handleSelectedMember(event: any) {
    this.selectedMember = event

    if (this.selectedMember.length > 0) {
      this.isMemberSelected = true
    }

    this.selectedMember?.forEach((element: any) => {
      this.selectedMembers = this.selectedMembers?.filter((item: any) => item !== element);

      if (this.selectedMembers) {
        this.selectedMembers.push(element);
      } else {
        // If members2 is null/undefined, initialize it with an array containing the element
        this.selectedMembers = [element];
      }

    })

    return this.selectedMembers;
  }

  // Remove deselected Members
  handleDeselectedMember(event: any) {
    // event contient l'email du membre désélectionné
    this.selectedMembers = this.selectedMembers?.filter((item: any) => {
      const itemEmail = item?.memberEmail || item;
      return itemEmail !== event;
    });

    // Si aucun membre n'est sélectionné, masquer la section
    if (this.selectedMembers.length === 0) {
      this.isMemberSelected = false;
    }

    // Forcer la détection des changements pour mettre à jour l'affichage
    this.cdr.detectChanges();

    return this.selectedMembers;
  }

  // Receive and show selected Labels
  handleSelectedLabel(event: any) {

    this.selectedLabel = event

    if (this.selectedLabel && this.selectedLabel.length > 0) {
      this.isLabelSelected = true
      this.selectedLabels = event
    } else {
      this.isLabelSelected = false
      this.selectedLabels = []
    }

    console.log("Add HandleSelectedLabel: ", this.selectedLabels);

    return this.selectedLabels
  }

  // Remove deselected Labels
  handleDeselectedLabel(event: any) {
    this.selectedLabels = event || []

    if (this.selectedLabels.length === 0) {
      this.isLabelSelected = false
    }

    // Forcer la détection des changements pour mettre à jour l'affichage
    this.cdr.detectChanges();

    return this.selectedLabels
  }

  handleDescriptionChange(value: string) {
    this.form.get('description')?.setValue(value, { emitEvent: false });
  }

  handleCloseModal() {
    this.closeTaskModal.emit()
  }

  // handle Time event
  handleAddTime() {
    this.time = this.form.get('time')?.value;

    if (this.time && this.time !== undefined) {
      this.isTimeValue = true;
    } else {
      this.isTimeValue = false;
    }
  }

  handleSubmitAddTask() {
  if (this.form.get('name')?.invalid) return;

  const taskData = {
    name: this.form.get('name')?.value,
    description: this.form.get('description')?.value || null,
    members: this.selectedMembers.map((m: any) => m?.id || m),
    labels: this.selectedLabels.map((l: any) => l.label),
    colors: this.selectedItem?.colorChoice ? [this.selectedItem.colorChoice] : [],
    time: this.time ? `${String(this.time).padStart(2, '0')}:00:00` : null,
    columnId: this.columnId,
  };

  if (this.isEditTask && this.taskToEdit) {
    // Mode édition
    this.entityService.updateData('tasks', { ...taskData, id: this.taskToEdit.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.taskUpdated.emit(task);
          this.form.reset();
        },
        error: (err) => console.error('Error updating task:', err),
      });
  } else {
    // Mode création
    this.entityService.addData<any>('tasks', taskData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.taskCreated.emit(task);
          this.form.reset();
        },
        error: (err) => console.error('Error creating task:', err),
      });
  }
}

}
