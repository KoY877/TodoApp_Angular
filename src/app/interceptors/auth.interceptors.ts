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
function isPublic(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function cloneWithToken(req: HttpRequest<unknown>, token: string, markRetry = false): HttpRequest<unknown> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (markRetry) headers[RETRY_HEADER] = 'true';
  return req.clone({ setHeaders: headers, withCredentials: true });
}

function handleSessionExpired(
  tokenService: TokenService,
  messageService: Message,
  error: unknown
): Observable<HttpEvent<never>> {
  tokenService.clearAll();
  messageService.messageConnected(false);
  return throwError(() => error);
}

// ─── Intercepteur principal ───────────────────────────────────────────────────
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
        console.error('❌ Le token refreshé est lui-même rejeté par le backend.');
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

// ─── Lance un nouveau refresh et retente la requête originale ────────────────
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

      console.log('✅ Token rafraîchi. Nouvelle session active.');
      // Les erreurs de la requête retentée (ex: 500) remontent normalement
      return next(cloneWithToken(req, newToken, true));
    }),
    catchError(error => {
      // Si isRefreshing est encore true → switchMap n'a pas tourné → c'est une erreur de refresh
      if (isRefreshing) {
        isRefreshing = false;
        refreshTokenSubject.error(error);
        refreshTokenSubject = new BehaviorSubject<string | null>(null);
        console.error('❌ Refresh échoué — session expirée.', error);
        return handleSessionExpired(tokenService, messageService, error);
      }
      // isRefreshing est false → switchMap a tourné → erreur de la requête retentée (ex: 500)
      return throwError(() => error);
    })
  );
}

// ─── Attend la fin du refresh en cours, puis retente ────────────────────────
function waitForRefreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap(newToken => next(cloneWithToken(req, newToken, true))),
    catchError(err => throwError(() => err))
  );
}
