import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-show-admin',
  imports: [],
  templateUrl: './show-admin.html',
  styleUrl: './show-admin.css',
})
export class ShowAdmin {
  @Input() ownerName?: string;
  @Input() ownerEmail?: string;
  @Input() ownerInitials?: string;
  @Output() closeMemberModal = new EventEmitter<void>();
  @Output() clickOutside = new EventEmitter<boolean>();

  dropdownValue = false;

  constructor(private elementRef: ElementRef) {}

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.dropdownValue === false) {
        this.clickOutside.emit(this.dropdownValue = true);
      } else {
        this.clickOutside.emit(this.dropdownValue = false);
      }
    }
  }

  handleCloseDropdown() {
    this.closeMemberModal.emit();
  }
}
