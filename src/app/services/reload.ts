import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Reload {
  constructor(private router: Router) { }

  reloadPage() {
    window.location.reload();

  }
}
