import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';
import { AuthService } from './auth-service';

/**
 * 🔐 TokenService - Stockage SÉCURISÉ des tokens JWT
 *
 * SÉCURITÉ:
 * - accessToken → Mémoire (JavaScript) - Perdu au rafraîchissement de page
 * - refreshToken → httpOnly cookie (Backend) - Inaccessible en JavaScript
 *
 * PROTECTION CONTRE XSS:
 * ✅ Le refreshToken ne peut pas être volé par un script malveillant
 * ✅ L'accessToken est en mémoire, perdu si la page est fermée
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  // 🔒 Token stocké EN MÉMOIRE (non persistant)
  private accessToken: string | null = null;

  // 📊 Observable pour notifier les changements d'authentification
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // 👤 Données utilisateur en mémoire
  private userData: {
    userId?: string;
    username?: string;
    email?: string;
    role?: string;
  } | null = null;

  constructor() {
    // Au démarrage, vérifier si on a déjà un token en mémoire
    // (sera null après refresh de page → nécessite re-login ou refresh token)
    console.log('🔧 TokenService initialized - Tokens in memory only');
  }

  /**
   * 💾 Sauvegarder l'access token EN MÉMOIRE
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.isAuthenticatedSubject.next(true);
    console.log('✅ Access token stored in memory');
  }

  /**
   * 📖 Récupérer l'access token depuis la mémoire
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * 🗑️ Supprimer l'access token de la mémoire
   */
  clearAccessToken(): void {
    this.accessToken = null;
    this.isAuthenticatedSubject.next(false);
    console.log('🗑️ Access token cleared from memory');
  }

  /**
   * ✅ Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * 💾 Sauvegarder les données utilisateur
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
   * 📖 Récupérer les données utilisateur
   */
  getUserData(): typeof this.userData {
    return this.userData;
  }

  /**
   * 📖 Récupérer l'ID utilisateur
   */
  getUserId(): string | null {
    return this.userData?.userId || localStorage.getItem('User-Id');
  }

  /**
   * 🗑️ Nettoyer toutes les données (logout)
   */
  clearAll(): void {
    this.accessToken = null;
    this.userData = null;
    this.isAuthenticatedSubject.next(false);

    // Nettoyer localStorage (données non sensibles)
    localStorage.removeItem('User-Id');
    localStorage.removeItem('UserName');
    localStorage.removeItem('UserEmail');
    localStorage.removeItem('Role');
    localStorage.removeItem('connected');
    localStorage.removeItem('isAuthenticated');

    console.log('🗑️ All tokens and user data cleared');
  }

  // Dans token.service.ts

  /**
   * 🔄 Tenter de restaurer la session au démarrage
   * Utilise le refreshToken dans le cookie httpOnly
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
      console.log('✅ Session restaurée automatiquement après reload');
      return true;
    } catch (error) {
      console.log('❌ Impossible de restaurer la session - Refresh token expiré');
      this.clearAll();
      return false;
    }
  }
}
