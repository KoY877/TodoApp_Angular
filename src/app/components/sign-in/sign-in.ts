import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/authentication/auth-service';
import { TokenService } from '../../services/authentication/tokenService';
import { Reload } from '../../services/reload';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Message } from '../../services/message';

interface AuthResponse {
  accessToken: string;
  refreshToken: string | null;  // Can be null (stored in httpOnly cookie)
  tokenType: string;
  userId: string;
  email: string;
  username?: string;
  role: string;
}

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
   @Input() email: string = '';
  @Input() password: string = '';
  @Output() closeSignIn_OpenSignUp: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() isConnected: EventEmitter<boolean> = new EventEmitter<boolean>();

  isSignIn: boolean = true;
  form: FormGroup
  errorMessage: string = '';

  constructor(
    private formbuilder : FormBuilder,
    private auth: AuthService,
    private tokenService: TokenService,
    private reloadService: Reload,
    private message: Message,
    private cdr: ChangeDetectorRef
  ) {
    this.form = formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  /**
   * Handle sign-in form submission.
   * On success: stores the access token in memory (never localStorage) and emits messageConnected.
   * On failure: displays a localized error message.
   *
   * PROTECTED:
   * - No Validators.minLength() on password (would silently block submission)
   * - cdr.detectChanges() in catch is mandatory for async error display
   * - error.status === 0 handles CORS / server unreachable
   */
  async handleSignInSubmit(event: any){
    event?.preventDefault()
    this.form.markAllAsTouched()

    if (this.form.invalid) {
      return;
    }

    try {
      const userData = this.form.value;
      const response = await lastValueFrom(this.auth.getUserByEmailAndPassword('auth/login', userData));

      if (response) {
        // Backend returns AuthResponse with JWT tokens
        const authData = response as unknown as AuthResponse; // Already parsed by HttpClient

        console.log(authData);

        // SECURITY: Store ONLY the accessToken in MEMORY
        this.tokenService.setAccessToken(authData.accessToken);

        // Store user data (non-sensitive)
        this.tokenService.setUserData({
          userId: authData.userId,
          username: authData.username || authData.email.split('@')[0],
          email: authData.email,
          role: authData.role
        });

        localStorage.setItem('connected', 'true');
        localStorage.setItem('isAuthenticated', 'true');

        console.log('Login successful - Tokens secured');
        console.log('AccessToken stored in memory');
        console.log('RefreshToken stored in httpOnly cookie (not accessible in JS)');
        console.log('User data:', {
          userId: authData.userId,
          username: authData.username,
          email: authData.email,
          connected: localStorage.getItem('connected')
        });

        // Emit events to update application state
        this.message.messageConnected(true);

        // Do not reload the page - let Angular handle state update
        // The connected$ observable will trigger the UI update

      } else {
        this.errorMessage = 'Email ou mot de passe incorrect.';
        this.cdr.detectChanges();
      }

    } catch (error: any) {
      if (error.status === 401) {
        this.errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.status === 400) {
        this.errorMessage = 'Paramètres invalides.';
      } else if (error.status === 0) {
        this.errorMessage = 'Impossible de joindre le serveur. Veuillez réessayer.';
      } else {
        this.errorMessage = 'Une erreur inattendue s\'est produite.';
        console.error('Erreur de connexion:', error);
      }
      this.cdr.detectChanges();
    }

  }

  /** Close the sign-in panel and open the sign-up panel */
  handleSignUpRedirect() {
    this.isSignIn = false;
    this.closeSignIn_OpenSignUp.emit(this.isSignIn);
  }

}
