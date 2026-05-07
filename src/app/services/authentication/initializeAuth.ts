import { inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth-service';
import { Message } from '../message';

/**
 * APP_INITIALIZER factory — runs before the app bootstraps.
 * Calls AuthService.restoreSession() to check whether the httpOnly cookie
 * is still valid. Emits the result via Message.messageConnected() so all
 * components can react to the initial auth state synchronously.
 * @returns a Promise<boolean> — Angular waits for it before rendering
 */
export const initializeAuth = () => {
  const authService = inject(AuthService);
  const messageService = inject(Message);

  console.log('Initializing authentication...');

  return lastValueFrom(authService.restoreSession()).then(
    (restored) => {
      console.log('initializeAuth - messageConnected emitted:', restored);
      messageService.messageConnected(restored);

      if (restored) {
        console.log('Session restored automatically');
      } else {
        console.log('No session restored');
      }

      return restored;
    },
    (error) => {
      console.error('Error during initialization:', error);
      console.log('initializeAuth - messageConnected emitted: false (error)');
      messageService.messageConnected(false);
      return false;
    }
  );
};
