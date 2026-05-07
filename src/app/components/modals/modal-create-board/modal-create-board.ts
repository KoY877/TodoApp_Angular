import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Board } from '../../board/board';
import { EntityService } from '../../../services/entity-service';
import { Message } from '../../../services/message';
import { AuthService } from '../../../services/authentication/auth-service';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CamelcasePipe } from '../../../pipes/camelcase-pipe';
import { Reload } from '../../../services/reload';

@Component({
  selector: 'app-modal-create-board',
  imports: [CommonModule, ReactiveFormsModule, CamelcasePipe, FormsModule],
  templateUrl: './modal-create-board.html',
  styleUrl: './modal-create-board.css',
})
export class ModalCreateBoard {
  @Input() modelData?: string
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>()
  @Output() openBoard: EventEmitter<boolean> = new EventEmitter<boolean>()

  isSubmitted: Boolean = true
  isDisplayModal : boolean = false
  isColumnsModal : boolean = true
  isButtonRemove : boolean = true
  isDone : boolean = false
  isDoneDeleted : boolean = false
  limitProgress : boolean = false
  isEmailCreate : boolean = false
  isExpanded: boolean = false
  defaultColumns: Array<any> = []
  submitColumns: Array<any> = []
  submitFinishedTask: Array<any> = []
  step3_columns: Array<any> = []
  step4_columns: Array<any> = []
  orderColumns: Array<any> = []
  draggedIndex: number | null = null
  columnsLength : number =  1
  selectedIndex: number | null = null;
  isModalVisible: boolean = false
  form: FormGroup;
  responsData: any;
  // Actuel Index
  currentStep = 0;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private entityService : EntityService,
    private reload: Reload,
    private message: Message,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {

    this.form = formBuilder.group({
      name: ['', Validators.required],
      columns: this.formBuilder.array([]),
      added_columns: this.formBuilder.array([]),
      selectedTask: [''],
      globalOption: [''],
      email: ['', Validators.required],
      members: this.formBuilder.array([]),
    })

  }

  ngOnInit() {
    // Add 4 default columns
    this.addDefaultColumns()
  }

  // Navigate to next step
  nextStep() {
    // Move to next step if current step is less than 5
    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }

  // Return to previous step
  prevStep() {
    // Move to previous step if current step is greater than 0
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Quick access to name FormArray
  get formControls() : FormArray{
    return this.form.get('name') as FormArray;
  }

  // Quick access to row FormArray
  get columns(): FormArray{
    return this.form.get('columns') as FormArray;
  }

  // Quick access to added_columns FormArray
  get added_columns(): FormArray{
    return this.form.get('added_columns') as FormArray;
  }

  // Quick access to email FormArray
  get email(): FormArray{
    return this.form.get('email') as FormArray;
  }

  // Quick access to members FormArray
  get members(): FormArray{
    return this.form.get('members') as FormArray;
  }

  // Add Row with default value
  addDefaultColumns(): void {
    // Default Columns
    this.defaultColumns = [
      { name: 'To-do'},
      { name: 'Do-today'},
      { name: 'In progress'},
      { name: 'Done' }
    ]

    // Push default columns in FormArray
    this.defaultColumns.forEach((column) => {
      this.columns.push(this.formBuilder.group({
        columnName: [column.name], // Column name
      }),);
    });
  }

  // Add a new row
  addRow() {
    // Push empty row in FormArray
    this.columns.push(this.formBuilder.group({
      columnName: [''], // Empty Column
    }));

    // Show remove button when columns.length > 1
    const removeLastRow = this.columns.length

    // Show remove button
    if (removeLastRow > 1) {
      this.isButtonRemove = true
    }
  }

  // Delete a row at the specified index
  removeRow(index: number) {
    // Remove row if columns.length > 1
    if (this.columns.length > 1) {
      this.columns.removeAt(index );
    }

    // Remove button when columns.length = 1
    const removeLastRow = this.columns.length

    // Hide remove button
    if (removeLastRow === 1) {
      this.isButtonRemove = !this.isButtonRemove
    }
  }

  // Draggable
  onDragStart(index: any): void {
    // Store the index of the dragged row
    this.draggedIndex = index;
  }

  // Drag end
  onDragEnd(): void {
    // Clear the dragged index
    this.draggedIndex = null;
  }

  // Drop event
  onDrop(event: DragEvent, targetIndex: any): void {
    // Prevent default behavior
    event.preventDefault();

    // Reorder the rows based on the dragged index and target index
    if(this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
      // Get the dragged row and insert it at the target index
      const draggedRow = this.columns.at(this.draggedIndex);
      this.columns.removeAt(this.draggedIndex);
      this.columns.insert(targetIndex, draggedRow);
    }

    // Clear the dragged index
    this.draggedIndex = null;
  }

  // Allow drop event
  onDragOver(event: DragEvent): void {
    // Prevent default behavior to allow dropping
    event.preventDefault();
  }

  // Go to Step 1
  async handleNextStepPage_1(event?: Event){
    event?.preventDefault()
    this.isSubmitted = true;

    // Check the value name
    // if name is empty
    if (this.form.value.name === "")
    {
      // Show alert
      alert("Name is required");
    } else {

      // Verify if name exists in DB
      await this.verifyIfNameExistsInDB()

    }
  }

  // Verify if name exists in DB
  async verifyIfNameExistsInDB (){
    // Get all board data
    let allBoadData = await lastValueFrom(this.entityService.getData("boards/all"));

    // Filter name
    let name = allBoadData.filter((item: any) => item?.name === this.form.value.name)

    // If name not exists
    if (name.length === 0) {
      // Go to Step 2
      this.nextStep()
      // Reset isSubmitted
      this.isSubmitted = false
      // Detect changes to update the view
      this.cdr.detectChanges();
    } else {
      // Show alert
      alert("Board name already exists !");
    }
  }

  // Go to Step 2
  handleNextStepPage_2() {
    // Get submited columns data
    this.submitColumns = this.form.value.columns;

    // Delete array columns data
    this.added_columns.clear()

    // Save Columns Data in the Array added_columns
    this.submitColumns.forEach((item: any)  => {
      // Toggle isDone boolean
      if (item.columnName === "Done" ){
        // Toggle isDone boolean
        this.isDone = !this.isDone
      } else {
        // Toggle isDoneDeleted boolean
        this.isDoneDeleted = !this.isDoneDeleted
      }

      // Push submited data in array columns and added_columns
      this.pushColumnsDataInArray(item)

    })

    this.setInitialSelection();

    // Next step
    this.nextStep();
  }

  // Push columns data in columns and added_columns Array
  pushColumnsDataInArray (item : any ){
    // Push submited data in array columns
    if(item.columnName === "In progress"){
      // Push with default limitWorkInProgress value
      this.added_columns.push(this.formBuilder.group({
        columnName: [item.columnName],
        limitWorkInProgress: [3],
      }))

    } else {
      // Push without limitWorkInProgress value
      this.added_columns.push(this.formBuilder.group({
        columnName: [item.columnName],
        limitWorkInProgress: [],
      }))
    }
  }

  // Go to step 1 (from Step 2)
  handlePrevStep() {
    // Restaurer les colonnes depuis added_columns
    this.columns.clear();

    // Source de données : priorité à added_columns, puis submitColumns en fallback
    const columnsData = this.added_columns.length > 0
      ? this.added_columns.value
      : this.submitColumns;

    if (columnsData && columnsData.length > 0) {
      // Repeupler le FormArray columns
      columnsData.forEach((item: any) => {
        this.columns.push(this.formBuilder.group({
          columnName: [item.columnName || '']
        }));
      });
    }

    // Reset flags
    this.isDone = false;
    this.isDoneDeleted = false;

    this.setInitialSelection();

    // Previous step
    this.prevStep();
  }

  // Show Text more or less
  toggleText() {
    this.isExpanded = !this.isExpanded
  }


  setInitialSelection(): void {
    // Trouver le dernier index de added_columns qui a une valeur pour columnName
    const lastWithValueIndex = this.added_columns.controls
      .map((control, index) => ({ control, index }))
      .filter(({ control }) => control.get('columnName')?.value) // Filtrer les champs avec des valeurs
      .map(({ index }) => index)
      .pop(); // Récupérer le dernier index avec une valeur

    // Trouver l´index de la colonne "Done" dans added_columns
    const doneColumnIndex = this.added_columns.controls
      .map((control, index) => ({ control, index }))
      .find(({ control }) => control.get('columnName')?.value === 'Done')?.index;


    // Si un index valide est trouvé, définir la valeur par défaut
    if (doneColumnIndex !== undefined) {
      this.form.get('selectedTask')?.setValue('Done'); // Affecter "Done" comme valeur par défaut
    } else if (lastWithValueIndex !== undefined) {
      const initialTask = this.added_columns.at(lastWithValueIndex).get('columnName')?.value;
      this.form.get('selectedTask')?.setValue(initialTask); // Affecter la valeur par défaut
    }

    // Global option : "Add a Done column for me" si la colonne "Done" n´existe pas, sinon "No, I will add a Done column by myself"
    if (doneColumnIndex === undefined) {
      this.form.get('globalOption')?.setValue('Add a Done column for me');
    } else {
      this.form.get('globalOption')?.setValue('finished task in ');
    }
  }

  isLastWithValue(index: number): boolean {
    const lastWithValueIndex = this.added_columns.controls
      .map((control, idx) => ({ control, idx }))
      .filter(({ control }) => control.get('columnName')?.value)
      .map(({ idx }) => idx)
      .pop();
    return index === lastWithValueIndex;
  }

  isRadioDisabled(type: 'task' | 'global'): boolean {
    // Désactive tous les autres radios sauf celui sélectionné
    if (type === 'task') {
      return this.selectedIndex !== null ;
    }

    return this.selectedIndex !== null;

  }

  // Step 3
  handleLimitProgress() {
    this.limitProgress = true;

    // Sauvegarder les données AVANT de clear
    this.step3_columns = this.form.value.added_columns;

    // Remove the object "Done"
    const value = this.step3_columns.find(item => item.columnName === "Done")
    this.step3_columns = this.step3_columns.filter(item => item.columnName !== "Done")

    // Push object "Done" at end, if it exists
    if (value) {
      this.step3_columns.push(value)
    }

    // Delete column data AVANT de repeupler
    this.columns.clear()
    this.added_columns.clear()

    // Repeupler avec les données sauvegardées (UN SEUL PUSH par item)
    this.step3_columns.forEach((item) => {
      if (item.columnName === "Done") {
        this.isDone = true
      } else {
        this.isDoneDeleted = true
      }

      // UN SEUL PUSH (pas de duplication)
      this.added_columns.push(this.formBuilder.group({
        columnName: [item.columnName],
        limitWorkInProgress: [item.limitWorkInProgress]
      }))
    })

    // If "Add" Column is checked
    this.handleAddColumn(value);

    this.nextStep()
  }

  // Add Columns
  handleAddColumn(value: String) {
    // Add column Done, if "Add a Done column for me" is checked
    if (!value && (this.form.value.globalOption === 'Add a Done column for me')) {
      // UN SEUL PUSH avec le bon nom de propriété (columnName, pas value)
      this.added_columns.push(this.formBuilder.group({
        columnName: ['Done'],
        limitWorkInProgress: []
      }))
    }
  }

  // Go to Step 1
  handlePrevTaskStep() {
    // Sauvegarder les modifications actuelles de l'utilisateur
    this.step3_columns = this.form.value.added_columns;

    // Previous step (les données sont déjà dans step3_columns pour réutilisation)
    this.prevStep();
  }

  // Go to Step 2
 // Go to Step 2 (from Step 3)
  handlePrevChoiceStep() {
    this.limitProgress = false;

    // Restaurer columns depuis step3_columns pour pouvoir revenir au Step 1
    if (this.step3_columns && this.step3_columns.length > 0) {
      this.columns.clear();
      this.step3_columns.forEach((item: any) => {
        this.columns.push(this.formBuilder.group({
          columnName: [item.columnName || '']
        }));
      });
    }

    this.setInitialSelection();

    this.prevStep();
  }

  handleInviteMember0(){
    this.limitProgress = false;

    // Renitialize currentstep
    this.currentStep = 3;

    this.nextStep()
  }

  // Step 4
  handleInviteMember1(){
    this.limitProgress = false;

    this.nextStep()
  }

   // Go to Step 3
  handlePrevProgressStep(){
    this.prevStep()
  }

  // Step 4
  inviteMember(event: any) {
    event?.preventDefault()
    // Receive email value
    const emailValue = this.form.value.email;

    // Regex to valid email addresse
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(emailValue && emailRegex.test(emailValue))
    {
      // Add email in memberColumns array

      this.isEmailCreate = true
      this.members.push(this.formBuilder.group({
        memberEmail: [emailValue],
        role: ['Standard']
      })),
      this.email.reset()


      this.isSubmitted = false
    } else {
      this.isSubmitted = true
      alert('Please enter a correct email address')
    }

  }

  // Remove member
  removeMember(index: number){
    if (this.members.length > 0) {
      this.members.removeAt(index );
    }
  }

  // Submit data
  async handleSubmit(event: any){
    // Prevent default behavior
    event?.preventDefault()
    // Mark all form controls as touched to trigger validation messages
    this.form.markAllAsTouched()

    // Validate form
    if (!this.form.value.name || this.form.value.name.trim() === '') {
      alert('Board name is required');
      return;
    }

    try {
      const boardData = {
        name: this.form.value.name.trim(),
        description: this.form.value.description || ''
        // No userId - extracted from JWT on the backend side
      };

      console.log('Creating board:', boardData);

      // 1. Create the board
      const response: any = await lastValueFrom(
        this.entityService.addData('boards', boardData)
      );

      console.log('Board created successfully:', response);
      this.responsData = response;

      const boardId: string = response.id;

      // 2. Save KanbanColumns linked to the new board
      const columnsToSave: any[] = this.form.value.added_columns ?? [];
      for (const col of columnsToSave) {
        if (col.columnName?.trim()) {
          await lastValueFrom(
            this.entityService.addData('board/kanban-column', {
              columnName: col.columnName.trim(),
              limitWorkInProgress: col.limitWorkInProgress ?? null,
              boardId
            })
          );
        }
      }

      // 3. Save Members linked to the new board
      const membersToSave: any[] = this.form.value.members ?? [];
      const failedMembers: string[] = [];
      for (const m of membersToSave) {
        if (m.memberEmail?.trim()) {
          try {
            await lastValueFrom(
              this.entityService.addData('board/member', {
                memberEmail: m.memberEmail.trim(),
                role: m.role ?? 'Standard',
                boardId
              })
            );
          } catch (memberError: any) {
            console.warn(`Could not add member ${m.memberEmail}:`, memberError);
            failedMembers.push(m.memberEmail.trim());
          }
        }
      }

      // Notify other components about the new board
      this.message.messageAny(response);
      this.message.messageOpenBoard(true);

      // Close modal
      this.closeModal.emit();

      // Warn if some members could not be added (email not registered)
      if (failedMembers.length > 0) {
        alert(`Board created successfully!\n\nThe following email(s) could not be added as members (not registered):\n${failedMembers.join('\n')}`);
      }

    } catch (error: any) {
      console.error('Error creating board:', error);

      // Handle specific error cases
      if (error.status === 401) {
        this.errorMessage = 'Authentication required. Please sign in again.';
      } else if (error.status === 400) {
        this.errorMessage = error.error?.message || 'A board with this name already exists. Please choose a different name.';
      } else if (error.status === 403) {
        this.errorMessage = 'You do not have permission to create a board.';
      } else if (error.status === 0) {
        // Network error - board might have been created
        console.warn('Network error (status 0) - checking if board was created...');
        this.closeModal.emit();
        setTimeout(() => {
          this.reload.reloadPage();
        }, 500);
        return;
      } else {
        this.errorMessage = error.error?.message || 'An error occurred while creating the board. Please try again.';
      }

      alert(this.errorMessage);
    }
  }
   // Fermer le modal
  handleCloseModal() {
    this.closeModal.emit();
  }

  // Fermer en cliquant sur le backdrop
  handleBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleCloseModal();
    }
  }

  // Fermer avec la touche Escape
  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    this.handleCloseModal();
  }
}
