import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ComingSoonService {
  visible = signal(true);

  open()  { this.visible.set(true); }
  close() { this.visible.set(false); }
}