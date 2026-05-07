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
    private readonly tokenService: TokenService  // Inject TokenService
  ) { }

  /**
   * Guard: throw an error if the user is not currently authenticated
   * Called before any secured HTTP request to fail fast
   */
  private ensureAuthenticated(): void {
    const accessToken = this.tokenService.getAccessToken();
    const userId = this.tokenService.getUserId();

    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
  }

  /**
   * Attempt to restore an existing session at app startup
   * If the access token is already in memory, returns true immediately.
   * Otherwise performs a /auth/refresh call using the httpOnly cookie.
   * @returns Observable<boolean> — true if a valid session was restored
   */
  restoreSession(): Observable<boolean> {
    const hasUserId = !!this.tokenService.getUserId();
    const hasToken = this.tokenService.isAuthenticated();

    // If both already exist, session is already active
    if (hasToken && hasUserId) {
      console.log('Session already active (token + userId in memory)');
      return of(true);
    }

    // Try to refresh regardless - the httpOnly cookie may exist even if localStorage is empty
    console.log('Attempting session restore via refresh token (httpOnly cookie)...');

    return this.refreshAccessToken().pipe(
      tap(response => {
        console.log('Refresh successful - restoring user data');

        // Save the accessToken and user data
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
        console.warn('Cannot restore session (invalid/expired cookie or network error)');
        console.error('Détails:', error);
        this.tokenService.clearAll();
        return of(false);
      })
    );
  }

  /**
   * Call POST /auth/refresh to get a new access token using the httpOnly cookie.
   * The refresh token is never read or stored in JS — the browser sends it automatically.
   * @returns Observable of the auth response containing the new accessToken and user info
   */
  refreshAccessToken(): Observable<{
    accessToken: string;
    refreshToken: string | null;
    userId: string;
    username: string;
    email: string;
    role: string;
    tokenType: string;
  }> {
    // The refreshToken is now in an httpOnly cookie
    // It will be sent automatically by the browser with withCredentials: true

    console.log('Calling /auth/refresh endpoint...');
    console.log('The refreshToken will be sent automatically via httpOnly cookie');

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
      {},  // Empty body, the token is in the cookie
      { withCredentials: true }  // Send httpOnly cookies
    ).pipe(
      map(response => {
        console.log('200 OK response from refresh received');
        console.log('Refresh response:', {
          hasAccessToken: !!response.accessToken,
          accessTokenPreview: response.accessToken?.substring(0, 20) + '...',
          userId: response.userId,
          username: response.username
        });

        // Note: Tokens are saved by the interceptor
        return response;
      }),
      catchError((err: any) => {
        console.error('FAILED /auth/refresh call');
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Body:', err.error);

        // Si refresh échoue (401), nettoyer et déconnecter
        if (err.status === 401) {
          console.warn('Invalid refresh token - clearing tokens');
          this.tokenService.clearAll();  // Clear from memory
        }

        return throwError(() => err);
      })
    );
  }

  // ─── Public endpoints (no auth required) ────────────────────────────────────────────

  /**
   * Register a new user — calls a public endpoint, no token needed
   * @param entity - API path (e.g. 'auth/register')
   * @param data - registration payload
   */
  addUser<T>(entity: string, data: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data, {
      withCredentials: true  // Send cookies on registration
    });
  }

  /**
   * Log in with email + password — calls a public endpoint
   * The response sets the httpOnly refresh-token cookie
   * @param entity - API path (e.g. 'auth/login')
   * @param data - credentials payload
   */
  getUserByEmailAndPassword(entity: string, data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${entity}`, data, {
      withCredentials: true  // Required so the backend can set the httpOnly cookie
    });
  }

  // ─── Authenticated endpoints ──────────────────────────────────────────────────

  /**
   * GET all resources — requires a valid access token
   * @param entity - API resource name
   */
  get<T>(entity: string): Observable<T> {
    this.ensureAuthenticated();
    return this.http.get<T>(`${this.apiUrl}/${entity}`);
  }

  /**
   * GET a single user by ID — fetches the full list then filters client-side
   * @param entity - API resource name
   * @param id - optional user ID to filter by
   */
  getUserById<T extends { id?: string }>(entity: string, id?: string): Observable<T[]> {
    this.ensureAuthenticated();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!id) return items;
        // Return only the item whose id matches
        return Array.isArray(items) ? items.filter(item => item.id === id) : [];
      })
    );
  }

  /**
   * POST to a secured endpoint
   * @param entity - API resource name
   * @param data - request body
   */
  post<T>(entity: string, data: any): Observable<T> {
    this.ensureAuthenticated();
    return this.http.post<T>(`${this.apiUrl}/${entity}`, data);
  }

  /**
   * PUT to a secured endpoint (full replacement)
   * @param entity - API resource name
   * @param data - request body
   */
  put<T>(entity: string, data: any): Observable<T> {
    this.ensureAuthenticated();
    return this.http.put<T>(`${this.apiUrl}/${entity}`, data);
  }

  /**
   * PATCH to a secured endpoint (partial update)
   * @param entity - API resource name
   * @param id - resource ID to patch
   * @param data - partial payload
   */
  patchData<T>(entity: string, id: string, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${entity}/${id}`, data);
  }

  /**
   * DELETE a secured resource
   * @param entity - API resource name
   * @param id - optional resource ID; omit to delete the whole collection endpoint
   */
  delete<T>(entity: string, id?: string): Observable<T> {
    this.ensureAuthenticated();
    // Build the URL with or without an ID segment
    const url = id ? `${this.apiUrl}/${entity}/${id}` : `${this.apiUrl}/${entity}`;
    return this.http.delete<T>(url);
  }

  /**
   * GET a single resource by ID — wraps it in an array for consistent typing
   * @param entity - API resource name
   * @param id - optional resource ID
   */
  getDataById<T>(entity: string, id?: string): Observable<T[]> {
    this.ensureAuthenticated();
    if (!id) return of([]);
    // Wrap the single response object in an array
    return this.http.get<T>(`${this.apiUrl}/${entity}/${id}`).pipe(
      map(item => item ? [item] : [])
    );
  }

  /**
   * Search resources by name (client-side filtering)
   * @param entity - API resource name
   * @param query - search string matched against item.name
   */
  searchData<T extends {name: string}>(entity: string, query: string): Observable<T[]> {
    this.ensureAuthenticated();
    return this.http.get<T[]>(`${this.apiUrl}/${entity}`).pipe(
      map(items => {
        if (!Array.isArray(items)) return [];
        const normalizedQuery = query.toLowerCase();
        // Case-insensitive substring match on the name field
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
