import { inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth-service';
import { Message } from '../message';

export const initializeAuth = () => {
  const authService = inject(AuthService);
  const messageService = inject(Message);

  console.log('🔧 Initialisation de l\'authentification...');

  return lastValueFrom(authService.restoreSession()).then(
    (restored) => {
      console.log('📡 initializeAuth - Émission de messageConnected:', restored);
      messageService.messageConnected(restored);

      if (restored) {
        console.log('✅ Session restaurée automatiquement');
      } else {
        console.log('ℹ️ Aucune session restaurée');
      }

      return restored;
    },
    (error) => {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      console.log('📡 initializeAuth - Émission de messageConnected: false (erreur)');
      messageService.messageConnected(false);
      return false;
    }
  );
};
