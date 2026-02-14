import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/authentication/auth-service';
import { Reload } from '../../services/reload';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
 @Input() email: string = '';
  @Input() password: string = '';
  @Output() closeSignUp_OpenSignIn: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() isConnected: EventEmitter<boolean> = new EventEmitter<boolean>();

  isSignIn: boolean = true;
  form: FormGroup
  errorMessage: string = '';

  constructor(
    private formbuilder : FormBuilder,
    private auth: AuthService,
    private reloadService: Reload
  ) {
    this.form = formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]]
    })
  }

  // Method to handle form submission
  async handleSignUpSubmit(event: any){
    // Here you can add your sign-in logic, such as form validation and API calls
    event?.preventDefault()
    // Mark all form controls as touched to trigger validation messages
    this.form.markAllAsTouched()

    // If the form is invalid, return early
    if (this.form.invalid) {
      return;
    }

    try {
      const userData = this.form.value;
      const response = await lastValueFrom(this.auth.getUserByEmailAndPassword('user/validate', userData));

      if (response) {

        // Parse la réponse JSON
        const authData = JSON.parse(response);

        // Stocker l'API Secret et l'User ID dans localStorage
        localStorage.setItem('Api-Secret', authData.apiSecret);
        localStorage.setItem('User-Id', authData.userId);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('connected', 'true');

        // Rediriger vers le tableau de bord ou une autre page protégée
        this.isConnected.emit(true);
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect.';
      }

    } catch (error: any) {
      if (error.status === 401) {
        this.errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.status === 400) {
        this.errorMessage = 'Paramètres invalides.';
      } else {
        this.errorMessage = 'Une erreur inattendue s\'est produite.';
        console.error('Erreur de connexion:', error);
      }
    }

    // Reload the page to update the state of the application
    this.reloadService.reloadPage();
  }

  // Method to handle sign-up redirect
  handleSignUpRedirect() {
    this.isSignIn = false;
    this.closeSignUp_OpenSignIn.emit(this.isSignIn);
  }

}
