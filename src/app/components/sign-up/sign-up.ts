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
  @Output() closeSignUp: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() openSignIn: EventEmitter<boolean> = new EventEmitter<boolean>();

  isSignUp: boolean = true;
  form: FormGroup;
  errorMessage: string = '';

  constructor(
    private formbuilder : FormBuilder,
    private auth: AuthService,
    private reload: Reload
  ) {
    this.form = formbuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(12)]]
    })
  }

  /** Close the sign-up panel by emitting false */
  handleCloseSignUp(){
    this.isSignUp = false;
    this.closeSignUp.emit(this.isSignUp);
  }

  /** Close the sign-up panel and redirect the user to the sign-in panel */
  handleSignUpRedirect(){
    this.isSignUp = false;
    this.closeSignUp.emit(this.isSignUp);
    this.openSignIn.emit(true); // Open the sign-in form when redirecting from sign-up
  }

  /**
   * Handle registration form submission.
   * On success: closes sign-up and opens the sign-in panel.
   * On failure: displays a user-friendly error message.
   */
  async handleSignUpSubmit(event: any){
    // Here you can add your sign-up logic, such as form validation and API calls
    event?.preventDefault()
    // Mark all form controls as touched to trigger validation messages
    this.form.markAllAsTouched()

    // If the form is invalid, you can return early or display validation errors
    try {
      const userData = this.form.value
      const response = await lastValueFrom(this.auth.addUser('auth/register', userData))

      if (response) {
        this.handleCloseSignUp();
        this.openSignIn.emit(true); // Open the sign-in form after successful sign-up
        // this.reload.reloadPage() // Reload the page to update the UI after sign-up
      }

    } catch (error: any) {
      // Handle errors, such as displaying error messages to the user
      if (error.status === 400) {
        // Handle specific error cases, such as email already in use
        if (error.error.message.includes('email')) {
          this.errorMessage = 'This email address is already in use.';
        } else if (error.error.message.includes('username')) {
          this.errorMessage = 'This username is already in use.';
        }

      } else {
        this.errorMessage = 'Email and password are required, and password must be at least 12 characters long.';
      }
    }
  }

}
