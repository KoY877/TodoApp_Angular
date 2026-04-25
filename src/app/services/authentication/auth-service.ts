import { Injectable } from '@angular/core';
import { environement } from '../../environements/environement.dev';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, of, tap, throwError } from 'rxjs';
import { TokenService } from './tokenService';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
   private readonly apiUrl = environement.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService  // 🔐 Inject TokenService
  ) { }

  private ensureAuthenticated(): void {
    const accessToken = this.tokenService.getAccessToken();
    const userId = this.tokenService.getUserId();

    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
  }

  restoreSession(): Observable<boolean> {
    const hasUserId = !!this.tokenService.getUserId();
    const hasToken = this.tokenService.isAuthenticated();

    // ✅ Si les deux existent déjà, session déjà active
    if (hasToken && hasUserId) {
      console.log('✅ Session déjà active (token + userId en mémoire)');
      return of(true);
    }

    // ✅ NOUVELLE LOGIQUE: Essayer TOUJOURS le refresh, même sans userId
    // Le cookie httpOnly peut exister même si localStorage est vide
    console.log('🔄 Tentative de restauration via refresh token (cookie httpOnly)...');

    return this.refreshAccessToken().pipe(
      tap(response => {
        console.log('✅ Refresh réussi - Restauration des données utilisateur');

        // ✅ Sauvegarder l'accessToken ET les données utilisateur
        this.tokenService.setAccessToken(response.accessToken);

        if (response.userId && response.username && response.email && response.role) {
          this.tokenService.setUserData({
            userId: response.userId,
            username: response.username,
            email: response.email,
            role: response.role
          });
        }

        localStorage.setItem('connected', 'true');
        localStorage.setItem('isAuthenticated', 'true');
      }),
      map(() => true),
      catchError((error) => {
        console.warn('⚠️ Impossible de restaurer la session (cookie invalide/expiré ou réseau)');
        console.error('Détails:', error);
        this.tokenService.clearAll();
        return of(false);
      })
    );
  }

  // Endpoint pour rafraîchir le token
  refreshAccessToken(): Observable<{
    accessToken: string;
    refreshToken: string | null;
    userId: string;
    username: string;
    email: string;
    role: string;
    tokenType: string;
  }> {
    // ℹ️ Le refreshToken est maintenant dans un httpOnly cookie
    // Il sera envoyé automatiquement par le navigateur avec withCredentials: true

    console.log('🔄 Appel de l\'endpoint /auth/refresh...');
    console.log('🍪 Le refreshToken sera envoyé automatiquement via cookie httpOnly');

    return this.http.post<{
      accessToken: string;
      refreshToken: string | null;
      userId: string;
      username: string;
      email: string;
      role: string;
      tokenType: string;
    }>(
      `${this.apiUrl}/auth/refresh`,
      {},  // ✅ Body vide, le token est dans le cookie
      { withCredentials: true }  // ✅ Envoyer les cookies httpOnly
    ).pipe(
      map(response => {
        console.log('✅ Réponse 200 OK du refresh reçue');
        console.log('📦 Réponse du refresh:', {
          hasAccessToken: !!response.accessToken,
          accessTokenPreview: response.accessToken?.substring(0, 20) + '...',
          userId: response.userId,
          username: response.username
        });

        // ℹ️ Note: Les tokens sont sauvegardés par l'intercepteur
        return response;
      }),
      catchError((err: any) => {
        console.error('❌ ÉCHEC de l\'appel /auth/refresh');
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Body:', err.error);

        // Si refresh échoue (401), nettoyer et déconnecter
        if (err.status === 401) {
          console.warn('🚪 Refresh token invalide - Nettoyage des tokens');
          this.tokenService.clearAll();  // 🔐 Clear from memory
        }

        return throwError(() => err);
      })
    );
  }

  // ========== ENDPOINTS PUBLICS (without Auth) ==========
  addUser<T>(entity: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data, {
      withCredentials: true  // ✅ Envoyer cookies pour register
    });
  }

  getUserByEmailAndPassword(entity: string, data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${entity}`, data, {
      withCredentials: true  // ✅ Envoyer cookies pour login
    });
  }

  // ========== ENDPOINTS AUTHENTIFIÉS ==========
  get<T>(entity: string): Observable<T> {
    this.ensureAuthenticated();
    return this.http.get<T>(`${this.apiUrl}/${entity}`);
  }

  // GET user by id authentification
  getUserById<T extends { id?: string }>(entity: string, id?: string): Observable<T[]> {
    this.ensureAuthenticated();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!id) return items;
        return Array.isArray(items) ? items.filter(item => item.id === id) : [];
      })
    );
  }

  // POST authentification
  post<T>(entity: string, data: any): Observable<T> {
    this.ensureAuthenticated();
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data);
  }

  // PUT authentification
  put<T>(entity: string, data: any): Observable<T> {
    this.ensureAuthenticated();
    return this.http.put<T>(`${this.apiUrl}/${entity}`, data);
  }

  // PATCH authentification
  patchData<T>(entity: string, id: string, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${entity}/${id}`, data);
  }

  // DELETE authentification
  delete<T>(entity: string, id?: string): Observable<T> {
    this.ensureAuthenticated();
    const url = id ? `${this.apiUrl}/${entity}/${id}` : `${this.apiUrl}/${entity}`;
    return this.http.delete<T>(url);
  }

  // GET by ID authentification
  getDataById<T>(entity: string, id?: string): Observable<T[]> {
    this.ensureAuthenticated();
    if (!id) return of([]);
    return this.http.get<T>(`${this.apiUrl}/${entity}/${id}`).pipe(
      map(item => item ? [item] : [])
    );
  }

  // SEARCH authentification
  searchData<T extends {name: string}>(entity: string, query: string): Observable<T[]> {
    this.ensureAuthenticated();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        return items.filter(item => item.name.toLowerCase().includes(normalizedQuery));
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(undefined as any))
    );
  }

}
