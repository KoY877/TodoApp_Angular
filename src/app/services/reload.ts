import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Reload {
  constructor(private router: Router) { }

  // Recharge toute la page (hard reload)
  reloadPage(): void {
    window.location.reload();
  }

  // Recharge la route actuelle (soft reload - recommandé)
  reloadCurrentRoute(): void {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  // Navigation vers une route spécifique avec reload
  navigateAndReload(route: string): void {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([route]);
    });
  }
}
