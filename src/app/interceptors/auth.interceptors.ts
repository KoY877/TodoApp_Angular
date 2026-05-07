// auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  Observable
} from 'rxjs';
import { AuthService } from '../services/authentication/auth-service';
import { TokenService } from '../services/authentication/tokenService';
import { Message } from '../services/message';

// ─── État partagé du refresh (module-level, singleton) ───────────────────────
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

// ─── Constantes ──────────────────────────────────────────────────────────────
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];
const RETRY_HEADER = 'X-Retry-Request';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check whether a request targets a public endpoint (login, register, refresh).
 * Public requests bypass token injection.
 * @param url - the full request URL
 */
function isPublic(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Clone an HTTP request and add the Authorization Bearer header.
 * Optionally marks it as a retry to prevent infinite refresh loops.
 * @param req - the original HTTP request
 * @param token - the JWT access token to inject
 * @param markRetry - if true, adds X-Retry-Request header
 */
function cloneWithToken(req: HttpRequest<unknown>, token: string, markRetry = false): HttpRequest<unknown> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  // Add retry marker so a second 401 is not retried again
  if (markRetry) headers[RETRY_HEADER] = 'true';
  return req.clone({ setHeaders: headers, withCredentials: true });
}

/**
 * Handle a fully expired session: clear tokens in memory and emit disconnected state.
 * @param tokenService - service holding the in-memory access token
 * @param messageService - event bus to notify components
 * @param error - the original HTTP error
 */
function handleSessionExpired(
  tokenService: TokenService,
  messageService: Message,
  error: unknown
): Observable<HttpEvent<never>> {
  tokenService.clearAll();
  messageService.messageConnected(false);
  return throwError(() => error);
}

// ─── Main interceptor function ─────────────────────────────────────────────────
/**
 * Functional HTTP interceptor — handles JWT injection and transparent token refresh.
 *
 * Flow:
 * 1. Public endpoints: skip token injection, send with credentials only.
 * 2. Authenticated endpoints: inject Bearer token if available.
 * 3. On 401: if no refresh is in progress, launch a refresh and retry.
 *            if a refresh is already in progress, queue the request.
 *            if the retried request also gets a 401, expire the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService    = inject(AuthService);
  const tokenService   = inject(TokenService);
  const messageService = inject(Message);

  // 1. Endpoints publics : envoyer les cookies uniquement, sans Authorization
  if (isPublic(req.url)) {
    return next(req.clone({ withCredentials: true }));
  }

  // 2. Pas de token en mémoire → tenter quand même, et retry via refresh si 401
  const token = tokenService.getAccessToken();

  const requestWithOptionalToken = token
    ? cloneWithToken(req, token)
    : req.clone({ withCredentials: true });

  // 3. Requête standard (avec ou sans token)
  return next(requestWithOptionalToken).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      // On ne traite que les 401 ; les 403, 405, etc. remontent directement
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Une requête déjà retentée qui échoue encore → session vraiment expirée
      if (req.headers.has(RETRY_HEADER)) {
        console.error('The refreshed token is itself rejected by the backend.');
        return handleSessionExpired(tokenService, messageService, error);
      }

      // ── Refresh en cours : mettre la requête en attente ──────────────────
      if (isRefreshing) {
        return waitForRefreshAndRetry(req, next);
      }

      // ── Lancer le refresh ─────────────────────────────────────────────────
      return startRefresh(req, next, authService, tokenService, messageService);
    })
  );
};

// ─── Launch a new refresh and retry the original request ────────────────────
/**
 * Call /auth/refresh, save the new access token, and retry the failed request.
 * Also unblocks all queued requests that were waiting for the new token.
 * @param req - the original failed request
 * @param next - the next handler in the chain
 * @param authService - service owning the refresh endpoint call
 * @param tokenService - service that stores the in-memory access token
 * @param messageService - event bus for auth state changes
 */
function startRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  tokenService: TokenService,
  messageService: Message
): Observable<HttpEvent<unknown>> {
  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authService.refreshAccessToken().pipe(
    switchMap(response => {
      isRefreshing = false;
      const newToken = response.accessToken;

      tokenService.setAccessToken(newToken);
      refreshTokenSubject.next(newToken); // ← débloque les requêtes en attente

      console.log('Token refreshed. New session active.');
      // Les erreurs de la requête retentée (ex: 500) remontent normalement
      return next(cloneWithToken(req, newToken, true));
    }),
    catchError(error => {
      // Si isRefreshing est encore true → switchMap n'a pas tourné → c'est une erreur de refresh
      if (isRefreshing) {
        isRefreshing = false;
        refreshTokenSubject.error(error);
        refreshTokenSubject = new BehaviorSubject<string | null>(null);
        console.error('Refresh failed - session expired.', error);
        return handleSessionExpired(tokenService, messageService, error);
      }
      // isRefreshing est false → switchMap a tourné → erreur de la requête retentée (ex: 500)
      return throwError(() => error);
    })
  );
}

// ─── Queue requests while a refresh is in progress ──────────────────────────
/**
 * Wait for the ongoing refresh to complete, then retry the queued request
 * with the new access token.
 * @param req - the request waiting for a new token
 * @param next - the next handler in the chain
 */
function waitForRefreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return refreshTokenSubject.pipe(
    // Ignore null values emitted while refresh is pending
    filter((token): token is string => token !== null),
    take(1),
    switchMap(newToken => next(cloneWithToken(req, newToken, true))),
    catchError(err => throwError(() => err))
  );
}
