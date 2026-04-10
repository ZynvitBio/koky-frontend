import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  PLATFORM_ID,
  inject,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComingSoonComponent implements OnInit, OnDestroy {
 
  @Input() launchDate: string | Date = '2026-05-09T00:00:00.000Z';
  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<{ name: string; whatsapp: string }>();
 
  private platformId = inject(PLATFORM_ID);
  private zone       = inject(NgZone);
  private cdr        = inject(ChangeDetectorRef);
 
  visible  = true;
  days     = '00';
  hours    = '00';
  minutes  = '00';
  seconds  = '00';
 
  name        = '';
  whatsapp    = '';
  message     = '';
  messageType: 'success' | 'error' = 'success';
 
  private timer: ReturnType<typeof setInterval> | null = null;
 
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ Fuera de Angular Zone → no bloquea estabilización ni hidratación
      this.zone.runOutsideAngular(() => {
        this.tick();
        this.timer = setInterval(() => {
          this.tick();
          // Vuelve a Angular solo para pintar la vista
          this.zone.run(() => this.cdr.markForCheck());
        }, 1000);
      });
    }
  }
 
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
 
private tick(): void {
  const target = new Date(this.launchDate).getTime();
  
  // ✅ Protección contra NaN en SSR
  if (isNaN(target)) return;

  const diff = target - Date.now();

  if (diff <= 0) {
    this.days = this.hours = this.minutes = this.seconds = '00';
    if (this.timer) clearInterval(this.timer);
    return;
  }

  this.days    = this.pad(Math.floor(diff / 86_400_000));
  this.hours   = this.pad(Math.floor((diff % 86_400_000) / 3_600_000));
  this.minutes = this.pad(Math.floor((diff % 3_600_000)  / 60_000));
  this.seconds = this.pad(Math.floor((diff % 60_000)     / 1_000));
}
 
  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }
 
  close(): void {
    this.visible = false;
    this.closed.emit();
  }
 
  submit(): void {
    if (!this.name.trim() || !this.whatsapp.trim()) {
      this.message     = 'Por favor completa ambos campos.';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return;
    }
    this.registered.emit({ name: this.name.trim(), whatsapp: this.whatsapp.trim() });
    this.message     = '¡Listo! Te avisamos cuando lancemos.';
    this.messageType = 'success';
    this.name        = '';
    this.whatsapp    = '';
    this.cdr.markForCheck();
  }
}