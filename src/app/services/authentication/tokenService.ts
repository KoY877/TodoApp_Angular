import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';
import { AuthService } from './auth-service';

/**
 * TokenService - Secure storage for JWT tokens
 *
 * SECURITY:
 * - accessToken: JavaScript memory (lost on page refresh)
 * - refreshToken: httpOnly cookie (backend) - inaccessible in JavaScript
 *
 * XSS PROTECTION:
 * The refreshToken cannot be stolen by a malicious script
 * The accessToken is in memory and is lost when the page is closed
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  // Token stored IN MEMORY (non-persistent)
  private accessToken: string | null = null;

  // Observable to notify authentication state changes
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // User data in memory
  private userData: {
    userId?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null = null;

  constructor() {
    // Au démarrage, vérifier si on a déjà un token en mémoire
    // (sera null après refresh de page → nécessite re-login ou refresh token)
    console.log('TokenService initialized - Tokens in memory only');
  }

  /**
   * Save the access token IN MEMORY
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.isAuthenticatedSubject.next(true);
    console.log('Access token stored in memory');
  }

  /**
   * Retrieve the access token from memory
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Remove the access token from memory
   */
  clearAccessToken(): void {
    this.accessToken = null;
    this.isAuthenticatedSubject.next(false);
    console.log('Access token cleared from memory');
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Save user data
   */
  setUserData(data: { userId: string; username: string; email: string; role: string }): void {
    this.userData = data;
    // Garder userId en localStorage pour la compatibilité (non sensible)
    localStorage.setItem('User-Id', data.userId);
    localStorage.setItem('UserName', data.username);
    localStorage.setItem('UserEmail', data.email);
    localStorage.setItem('Role', data.role);
  }

  /**
   * Retrieve user data
   */
  getUserData(): typeof this.userData {
    return this.userData;
  }

  /**
   * Retrieve the user ID
   */
  getUserId(): string | null {
    return this.userData?.userId || localStorage.getItem('User-Id');
  }

  /**
   * Clear all data (logout)
   */
  clearAll(): void {
    this.accessToken = null;
    this.userData = null;
    this.isAuthenticatedSubject.next(false);

    // Clear non-sensitive localStorage data
    localStorage.removeItem('User-Id');
    localStorage.removeItem('UserName');
    localStorage.removeItem('UserEmail');
    localStorage.removeItem('Role');
    localStorage.removeItem('connected');
    localStorage.removeItem('isAuthenticated');

    console.log('All tokens and user data cleared');
  }

  // Dans token.service.ts

  /**
   * Attempt to restore the session at startup.
   * Uses the refreshToken from the httpOnly cookie.
   */
  async tryRestoreSession(): Promise<boolean> {
    // Si on a déjà un token en mémoire, pas besoin de refresh
    if (this.accessToken) {
      return true;
    }

    // Vérifier si l'utilisateur était connecté (userId en localStorage)
    const userId = localStorage.getItem('User-Id');
    if (!userId) {
      return false; // Pas d'utilisateur précédemment connecté
    }

    try {
      // Le refresh utilisera automatiquement le cookie httpOnly
      const response = await lastValueFrom(
        inject(AuthService).refreshAccessToken()
      );

      this.setAccessToken(response.accessToken);
      console.log('Session restored automatically after reload');
      return true;
    } catch (error) {
      console.log('Cannot restore session - refresh token expired');
      this.clearAll();
      return false;
    }
  }
}
