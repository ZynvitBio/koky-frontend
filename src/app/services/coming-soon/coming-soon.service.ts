import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ComingSoonService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private readonly KEY = 'koky_coming_soon_closed';

  // El signal se inicializa en falso para desactivar el popup
  visible = signal(false);

  /**
   * Determina si el popup debe mostrarse basándose en la ruta limpia
   */
  private shouldShow(): boolean {
    return false;
  }

  /**
   * Fuerza al signal a actualizar su valor.
   */
  revalidate() {
    this.visible.set(false);
  }

  open() {
    this.visible.set(false);
  }

  close() {
    this.visible.set(false);
  }
}