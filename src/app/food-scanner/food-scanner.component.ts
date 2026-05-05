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
  sliderOpacity: number = 50;
  isDragging = false;
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Breve animación de presentación
    setTimeout(() => {
      this.introAnimation();
    }, 800);
  }

introAnimation() {
  const start = 50;
  const end = 80;
  const duration = 3600;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const ease = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    this.sliderOpacity = start + (end - start) * ease;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
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
  this.isDragging = true;
  this.updateSlider(event);
}

// 2. ÚNICA función de movimiento (Solo actúa si isDragging es true)
onMove(event: any) {
  if (!this.isDragging) return; 
  this.updateSlider(event);
}

// 3. Cuando el usuario suelta o el mouse sale del área
stopDrag() {
  this.isDragging = false;
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