import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-food-scanner',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './food-scanner.component.html',
  styleUrls: ['./food-scanner.component.css']
})
export class FoodScannerComponent implements OnInit {
  sliderOpacity: number = 0; // Comienza al 100% hamburguesa visible
  isDragging = false;
  private animFrameId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Breve animación de presentación tras cargar
    setTimeout(() => {
      this.introAnimation();
    }, 600);
  }

  introAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    const start = 0;   // 100% hamburguesa
    const end = 50;    // 50% hamburguesa / 50% tofu
    const duration = 1800; // 1.8s recorrido suave
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (this.isDragging) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Curva suave de frenado (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);

      this.sliderOpacity = start + (end - start) * ease;
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  onMouseMove(event: any) {
    const rect = event.currentTarget.getBoundingClientRect();

    let clientX;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else {
      clientX = event.clientX;
    }

    const position = clientX - rect.left;
    const percentage = (position / rect.width) * 100;

    this.sliderOpacity = Math.max(0, Math.min(100, percentage));
  }

  // 1. Cuando el usuario hace clic o toca la pantalla
  startDrag(event: any) {
    this.cancelIntroAnimation();
    this.isDragging = true;
    this.updateSlider(event);
  }

  // 2. ÚNICA función de movimiento (Solo actúa si isDragging es true)
  onMove(event: any) {
    if (!this.isDragging) return; 
    this.cancelIntroAnimation();
    this.updateSlider(event);
  }

  // 3. Cuando el usuario suelta o el mouse sale del área
  stopDrag() {
    this.isDragging = false;
  }

  private cancelIntroAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // Función interna de cálculo para no repetir código
  private updateSlider(event: any) {
    const container = event.currentTarget.closest('.scanner-wrapper');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const position = clientX - rect.left;
    const percentage = (position / rect.width) * 100;

    this.sliderOpacity = Math.max(0, Math.min(100, percentage));
    this.cdr.detectChanges();
  }
}