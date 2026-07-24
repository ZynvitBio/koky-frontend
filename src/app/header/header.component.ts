import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CartService } from '../services/cart/cart.service';
import { RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { getDynamicAnnouncementText } from '../utils/delivery-helper';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  totalItems = 0;
  menuOpen   = false;  // 👈 controla el menú
  showAnnouncement = false; // 👈 Comienza en false para que el servidor (SSR) no lo renderice y evitar parpadeos de carga

  getAnnouncementText(): string {
    return getDynamicAnnouncementText();
  }

  constructor(
    private router: Router, 
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    });

    // 👈 cierra el menú en cada navegación
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen = false);

    // 👈 Activar en el cliente tras la carga si NO ha sido cerrado en esta sesión
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('koky_announcement_dismissed');
      if (dismissed !== 'true') {
        this.showAnnouncement = true;
        this.cdr.detectChanges(); // Fuerza a Angular a renderizar y animar la cápsula flotante
      }
    }
  }

  closeAnnouncement(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showAnnouncement = false;
    this.cdr.detectChanges(); // Fuerza el refresco visual instantáneo
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('koky_announcement_dismissed', 'true'); // Persiste solo durante la sesión actual de navegación
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  goToBlog() {
    this.router.navigate(['/blog']);
    this.closeMenu();
  }
}
