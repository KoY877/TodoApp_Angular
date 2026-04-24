import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, input, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-description',
  imports: [],
  templateUrl: './description.html',
  styleUrl: './description.css',
})
export class Description {

  @ViewChild('textArea') textArea!: ElementRef;
  @Input() initialDescription: string = '';
  @Output() descriptionChange = new EventEmitter<string>();
  private destroy$ = new Subject<void>();

  descriptions?: string;
  form?: any;
  selectedText?: string;

  constructor (
    private formBuilder : FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.formBuilder.group({
      description: [
        '',
        [Validators.minLength(3),       // minimum 3 caracteres
        Validators.pattern(/^[a-zA-Z\s]+$/)] // just letters and spaces
      ]
    });
  }

  getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }

  format(command: string) {
    this.selectedText = this.getSelectedText();
    console.log('Formatage de:', this.selectedText);

    if (!this.selectedText) {
      console.log('Aucun texte sélectionné');
      return;
    }

    let formattedText = '';

    switch(command) {
      case 'bold':
        formattedText = `**${this.selectedText}**`;

        break;
      case 'italic':
        formattedText = `__${this.selectedText}__`;

        break;
      default:
        console.log('Commande de formatage inconnue');
        return;

    }

    // Remplacer la sélection par le texte formaté en Markdown
    document.execCommand('insertText', false, formattedText);

    // Mettre à jour le FormControl
    const content = this.textArea.nativeElement.textContent;
    this.description.setValue(content, { emitEvent: true });

    console.log('Texte formaté:', formattedText);
  }

  ngAfterViewInit(): void {
    // Pré-remplir le textArea avec la description initiale
    if (this.initialDescription && this.textArea) {
      this.textArea.nativeElement.textContent = this.initialDescription;
      this.description.setValue(this.initialDescription);
      this.cdr.detectChanges();
    }
  }

  get description(): FormControl{
    return this.form.get('description') as FormControl;
  }

  ngOnInit(): void {

    this.cdr.detectChanges();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showContent(): void {

    // Recevoir le content de l´id textArea
    const content = this.textArea.nativeElement.textContent;
    console.log('Contenu de la zone de texte:', content);

    // mettre le text entre ** ** en bold et entre __ __ en italic
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
      .replace(/__(.*?)__/g, '<em>$1</em>'); // italic
    console.log('Contenu formaté:', formattedContent);

    document.execCommand(formattedContent, false, '');

    // Mettre à jour le FormControl avec le contenu formaté et affiché

    const contentAfterFormat = this.textArea.nativeElement.innerHTML;
    this.description.setValue(contentAfterFormat, { emitEvent: true });

  }

  isPreviewMode: boolean = false;
  originalContent: string = '';

  togglePreview(): void {
    if (!this.isPreviewMode) {
      // Passer en mode prévisualisation
      this.originalContent = this.textArea.nativeElement.textContent || '';

      const htmlContent = this.originalContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<em>$1</em>');

      this.textArea.nativeElement.innerHTML = htmlContent;
      this.textArea.nativeElement.setAttribute('contenteditable', 'false');
      this.isPreviewMode = true;
    } else {
      // Retour en mode édition
      this.textArea.nativeElement.textContent = this.originalContent;
      this.textArea.nativeElement.setAttribute('contenteditable', 'true');
      this.isPreviewMode = false;
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  onContentChange(event: Event): void {
    // Ne pas mettre à jour si on est en mode preview
    if (this.isPreviewMode) {
      return;
    }

    const target = event.target as HTMLElement;
    const content = target.textContent || '';

    // Update the form control with the new content
    this.description.setValue(content, { emitEvent: true });
    this.descriptionChange.emit(content);

    console.log(this.description.value);

  }
}
