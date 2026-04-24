import { ChangeDetectorRef, Component, signal, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./components/header/header";
import { Container } from "./components/container/container";
import { Message } from './services/message';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Container],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TodoApp_Angular');
  isCloseAllDropdown = false;

   

  handleCloseAllDropdowns(): void {
     this.isCloseAllDropdown = !this.isCloseAllDropdown;
    // // Appeler la méthode du container
    // if (this.containerComponent) {
    //   this.containerComponent.handleCloseAllDropdowns();
    // }
  }
}
