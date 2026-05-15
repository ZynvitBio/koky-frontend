import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ComingSoonService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private readonly KEY = 'koky_coming_soon_closed';

  // El signal se inicializa con el valor calculado al arranque
  visible = signal(this.shouldShow());

  /**
   * Determina si el popup debe mostrarse basándose en la ruta limpia
   * e ignorando los parámetros de rastreo (UTM, fbclid, etc.)
   */
  private shouldShow(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    // window.location.pathname solo nos da "/home", ignorando los "?" de Instagram
    const currentPath = window.location.pathname;
    const yaMostrado = sessionStorage.getItem(this.KEY) === 'true';

    // Se muestra solo en Home o Raíz si no se ha cerrado en esta sesión
    return (currentPath === '/home' || currentPath === '/') && !yaMostrado;
  }

  /**
   * NUEVO: Fuerza al signal a actualizar su valor.
   * Se debe llamar desde el HomeComponent después de limpiar la URL.
   */
  revalidate() {
    this.visible.set(this.shouldShow());
  }

  open() {
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.KEY, 'true');
    }
  }
}