import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class Alert {
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  @Output() discard: EventEmitter<void> = new EventEmitter<void>();

  handleCancel() {
    this.cancel.emit();
  }

  handleDiscard(){
    this.discard.emit()
  }
}
