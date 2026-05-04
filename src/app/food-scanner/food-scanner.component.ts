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
    // Opcional: si quieres que se mueva solo con el mouse sin clic
    // Pero el input range ya maneja el click/drag por defecto.
  }
}