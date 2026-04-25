import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Message } from '../../../services/message';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AddTask } from "../add-task/add-task";
import { Column } from '../../../models/column.model';
import { faPlus} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { EntityService } from '../../../services/entity-service';
import { CharacterPipe } from '../../../pipes/character-pipe';
import { forkJoin, of } from 'rxjs';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormatTextPipe } from '../../../pipes/format-text-pipe';

@Component({
  selector: 'app-column',
  imports: [CommonModule, ReactiveFormsModule, AddTask, FaIconComponent, CharacterPipe, FormatTextPipe, CdkDropList, CdkDrag],
  templateUrl: './column.html',
  styleUrl: './column.css',
})
export class List implements OnChanges {
  readonly faPlus = faPlus

  @Input() clikedBoard!: any;

  isOpenTaskModal?: boolean = false
  isEditTask: boolean = false
  selectedTask: any = null
  column : Column[] = []
  selectedColumnId: string = ''

  constructor(
    private message: Message,
    private elementRef: ElementRef,
    private entityService: EntityService,
    private cdr: ChangeDetectorRef,
  ){}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clikedBoard'] && this.clikedBoard?.[0]?.columns) {
      this.column = this.clikedBoard[0].columns;
      this.loadTasksForColumns();
    }
  }

  private loadTasksForColumns(): void {
    if (!this.column.length) return;

    // Initialiser tasks comme tableau vide pour chaque colonne
    this.column.forEach(col => {
      if (!col.tasks) col.tasks = [];
    });

    const requests = this.column.map(col =>
      col.id ? this.entityService.getData<any>(`tasks/column/${col.id}`) : of([])
    );

    forkJoin(requests).subscribe({
      next: (taskArrays: any[]) => {
        taskArrays.forEach((tasks, i) => {
          this.column[i] = { ...this.column[i], tasks: tasks || [] };
        });
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  get filteredTasks() {
    if (this.clikedBoard && this.clikedBoard[0] && this.clikedBoard[0].columns) {
      return this.column;
    }
    return [];
  }

  handleAddTask(columnId: string) {
    // Ouvrir le modal d'ajout de tâche pour la colonne spécifiée
    this.selectedColumnId = columnId;
    this.isOpenTaskModal = true
    this.isEditTask = false

    // Fermer tous les dropdowns ouverts
    const dropdowns = this.elementRef.nativeElement.querySelectorAll('.menu-dropdown');
    dropdowns.forEach((dropdown: any) => {
      dropdown.classList.remove('active');
    });

    // Ajouter un écouteur de clic pour détecter les clics en dehors du modal
    const clickListener = (clickEvent: any) => {
      if (!this.elementRef.nativeElement.contains(clickEvent.target)) {
        this.isOpenTaskModal = false;
        this.isEditTask = false;
        document.removeEventListener('click', clickListener);
      }
    };

    // Ajouter l'écouteur de clic au document
    document.addEventListener('click', clickListener);
  }

  handleCloseTaskModal(){
    this.isOpenTaskModal = false
    this.isEditTask = false
  }

  // handleTaskCreated(newTask: any) {
  handleTaskCreated(newTask: any) {

    const col = this.column.find(col => col.id === this.selectedColumnId);
    if (col) {
      if (!col.tasks) col.tasks = [];
      col.tasks = [...col.tasks, newTask];
    }
    this.isOpenTaskModal = false;
  }

 drop(event: CdkDragDrop<any[], any[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    const task = event.previousContainer.data[event.previousIndex];
    const targetCol = this.column.find(col => col.tasks === event.container.data);
    const targetColumnId = targetCol?.id;

    // Vérifier la limite WIP
    if (targetCol?.limitWorkInProgress !== null && targetCol?.limitWorkInProgress !== undefined) {
      const currentCount = event.container.data.length;
      if (currentCount >= targetCol.limitWorkInProgress) {
        return; // Limite atteinte → annuler le drop
      }
    }

    if (targetColumnId && task?.id) {
      // Update optimiste
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const taskPayload = {
        ...task,
        columnId: targetColumnId,
        members: (task.members || []).map((member: any) => member?.id || member),
        labels: (task.labels || []).map((label: any) => label?.name || label),
      };

      this.entityService.updateData(`tasks`, taskPayload).subscribe({
        next: () => {},
        error: (err) => {
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          console.error('Erreur lors du déplacement de la tâche:', err);
        }
      });
    }
  }
}
  get connectedDropLists(): string[] {
    return this.column.map((_, i) => 'drop-list-' + i);
  }

  generateRandomColor(num: number): string {
    const colors = [
      '#5595E8', '#C9A700', '#A5889E', '#4CAF50', '#E57373',
      '#64B5F6', '#FFB74D', '#81C784', '#BA68C8', '#4DB6AC'
    ];
    return colors[num % colors.length];
  }

  editTask(task: any) {
    // Logique pour éditer la tâche
    this.isEditTask = true;
    this.selectedTask = task;  // ← Stocker la tâche
    this.selectedColumnId = task.columnId;
    this.isOpenTaskModal = true;
  }

  handleTaskUpdated(updatedTask: any) {
    // Trouver et mettre à jour la tâche dans la colonne
    const column = this.column.find(col => col.id === updatedTask.columnId);
    if (column && column.tasks) {
      const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        column.tasks[taskIndex] = updatedTask;
      }
    }
    this.isOpenTaskModal = false;
    this.isEditTask = false;
    this.selectedTask = null;
  }
}
