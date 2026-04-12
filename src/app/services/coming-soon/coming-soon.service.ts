import { Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ComingSoonService {
  private platformId = inject(PLATFORM_ID);
  private readonly KEY = 'koky_coming_soon_closed';

  visible = signal(this.shouldShow());

  private shouldShow(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return sessionStorage.getItem(this.KEY) !== 'true';
  }

  open() { this.visible.set(true); }

  close() {
    this.visible.set(false);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.KEY, 'true');
    }
  }
}