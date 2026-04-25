import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EntityService } from '../../../services/entity-service';
import { Message } from '../../../services/message';
import { Reload } from '../../../services/reload';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'app-labels',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './labels.html',
  styleUrls: ['./labels.css'],
})
export class Labels {
  readonly faBars = faBars;

  @Input() selectedLabels!: any
  @Output() sendSelectedLabel: EventEmitter<any> = new EventEmitter<any>();
  @Output() sendDeselectedLabel: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeDropdownLabels: EventEmitter<void> = new EventEmitter<void>();
  private destroy$ = new Subject<void>();

  memberColumns: any | undefined[] = []
  allLabels: any | undefined[] = []
  form: any;
  isLabel: Boolean = false;
  isViewLabels: Boolean = false;

  constructor(
    private entityService: EntityService,
    private detectChange: ChangeDetectorRef,
    private message: Message,
    private reload: Reload,
    private fb: FormBuilder,
  ) {
    this.form = fb.group({
      label: [
        '',
        [Validators.minLength(3),       // minimum 3 caractères
        Validators.maxLength(30),      // maximum 20 caractères
        Validators.pattern(/^[a-zA-Z\s]+$/)] // seulement lettres et espaces
      ],
      labels: this.fb.array([])
    });
  }

  // Call ngOnchange, if @Input change
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedLabels'] && changes['selectedLabels'].currentValue) {
      this.loadSelectedLabels(changes['selectedLabels'].currentValue);
    }

    this.detectChange.detectChanges();
  }

  // Charger les labels sélectionnés dans le FormArray
  private loadSelectedLabels(labels: any[]) {
    // Vider le FormArray avant de le remplir
    this.labels.clear();
    
    // Charger les labels sélectionnés dans le FormArray
    if (Array.isArray(labels) && labels.length > 0) {
      labels.forEach((label: any) => {
        this.labels.push(this.fb.group({
          label: [typeof label === 'string' ? label : label.label],
          checked: [true]
        }));
      });
      
      // Mettre à jour allLabels pour l'affichage
      this.allLabels = labels.map((label: any) => ({
        label: typeof label === 'string' ? label : label.label,
        checked: true
      }));
    }
  }

  // Get Id
  getLabels(): string | undefined {
    return this.selectedLabels;
  }

  ngOnInit(): void {
    // Charger les labels sélectionnés si disponibles
    if (this.selectedLabels && Array.isArray(this.selectedLabels) && this.selectedLabels.length > 0) {
      this.loadSelectedLabels(this.selectedLabels);
    }

    // If label value change
    this.label.valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {

      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get label(): FormArray {
    return this.form.get('label') as FormArray;
  }

  get labels(): FormArray {
    return this.form.get('labels') as FormArray;
  }

  // Add a label to the list
  async addLabel(event: Event) {

    event.preventDefault()

    if (!(event instanceof KeyboardEvent)) return;

    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value.length >= 3 && value.length <= 30) {
      // Vérifier si le label existe déjà dans le FormArray
      const existsInFormArray = this.labels.value.some((l: any) => l.label === value);

      if (!existsInFormArray) {
        // Ajouter au FormArray
        this.labels.push(this.fb.group({
          label: [value],
          checked: [true]
        }));
      }

      // Vérifier si le label existe déjà dans allLabels
      const existsInAllLabels = this.allLabels.some((l: any) => l.label === value);

      if (!existsInAllLabels) {
        // Ajouter à allLabels pour l'affichage
        this.allLabels.push({ label: value, checked: true });
      }

      this.label.reset();
    }

    // Émettre la liste des labels cochés
    this.sendSelectedLabel.emit(this.allLabels);

    this.detectChange.detectChanges();
  }

  // Remove label from display (allLabels)
  removeLabelFromDisplay(event: any, index: number) {
    event.stopPropagation();

    // Récupérer le label à retirer
    const labelToRemove = this.allLabels[index];

    // Retirer le label de allLabels
    this.allLabels.splice(index, 1);

    // Trouver le label dans le FormArray et le décocher
    const formArrayIndex = this.labels.value.findIndex((l: any) => l.label === labelToRemove.label);
    if (formArrayIndex > -1) {
      const labelFormGroup = this.labels.at(formArrayIndex);
      labelFormGroup.patchValue({ checked: false });
    }

    // Émettre la liste mise à jour
    this.sendDeselectedLabel.emit(this.allLabels);
    
    this.detectChange.detectChanges();
  }

  // Remove label from FormArray
  removeLabel(event: any, index: number) {

    event.stopPropagation();

    this.labels.removeAt(index);

    this.allLabels = this.labels.value.filter((l: any) => l.checked !== false);
    this.sendDeselectedLabel.emit(this.allLabels);
    
    this.detectChange.detectChanges();
  }

  handleCloseDropdown() {
    this.closeDropdownLabels.emit();
  }

  handleCloseDropdownLabels() {
    this.isViewLabels = false;
    this.detectChange.detectChanges();
  }

  handleOpenLabel(event: string) {
    if (event === "label") {
      this.isViewLabels = !this.isViewLabels;
      this.detectChange.detectChanges();
    }
  }

  handleSelectedLabel(event: any, item: any, index: number) {
    event.preventDefault();

    const target = event.target as HTMLInputElement;

    // Si la checkbox est cochée
    if (target.checked) {

      // Vérifier si le label existe déjà dans allLabels
      const alreadyExists = this.allLabels.some(
        (label: any) => label.label === target.value
      );

      if (!alreadyExists) {
        this.allLabels.push({ label: target.value, checked: true });
      }

      // Mettre à jour le statut visuel
      item.checked = true;

      // Mettre à jour le FormGroup
      const labelFormGroup = this.labels.at(index);
      labelFormGroup.patchValue({ checked: true });

      // Envoyer au parent Add-Task
      this.sendSelectedLabel.emit(this.allLabels);
    } else {

      // Si décoché, le retirer de allLabels
      this.allLabels = this.allLabels.filter(
        (label: any) => label.label !== target.value
      );

      // Mettre à jour le statut visuel
      item.checked = false;

      // Mettre à jour le FormGroup
      const labelFormGroup = this.labels.at(index);
      labelFormGroup.patchValue({ checked: false });

      // Envoyer au parent Add-Task
      this.sendDeselectedLabel.emit(this.allLabels);
    }

    this.detectChange.detectChanges();
  }
}
