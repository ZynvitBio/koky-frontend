import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { ComingSoonService } from './services/coming-soon/coming-soon.service';
import { AuthService } from './services/auth/auth.service';
import { NotificationService } from './services/notification/notification.service';
import Swal from 'sweetalert2';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ComingSoonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  cs                  = inject(ComingSoonService);
  authService         = inject(AuthService);
  notificationService = inject(NotificationService);
  private router      = inject(Router);
  private platformId  = inject(PLATFORM_ID);
  private document    = inject(DOCUMENT);
  title               = 'koky';
  isHomeRoute         = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.location.hostname === 'www.koky.food') {
        window.location.replace(
          'https://koky.food' + window.location.pathname + window.location.search
        );
        return;
      }
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const path = e.urlAfterRedirects || e.url;
        this.isHomeRoute = path === '/' || path === '' || path.startsWith('/#') || path.startsWith('#') || path === '/home' || path.startsWith('/home#');
        this.updateCanonicalAndOgUrl(path);
      });
  }

  private updateCanonicalAndOgUrl(path: string) {
    const domain = 'https://koky.food';
    const cleanPath = path.split('?')[0].split('#')[0];
    const canonicalUrl = `${domain}${cleanPath === '/' ? '' : (cleanPath === '/home' ? '' : cleanPath)}`;

    // Actualizar o crear Canonical Link
    let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
    if (link) {
      link.setAttribute('href', canonicalUrl);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      this.document.head.appendChild(link);
    }

    // Actualizar o crear og:url Meta Tag
    let ogUrl: HTMLMetaElement | null = this.document.querySelector("meta[property='og:url']");
    if (ogUrl) {
      ogUrl.setAttribute('content', canonicalUrl);
    } else {
      ogUrl = this.document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      ogUrl.setAttribute('content', canonicalUrl);
      this.document.head.appendChild(ogUrl);
    }
  }

  isHome(): boolean {
    const path = this.router.url;
    return path === '/' || path === '' || path.startsWith('/#') || path.startsWith('#') || path === '/home' || path.startsWith('/home#');
  }

  onClose() {
    console.log('El usuario cerró el contador');
  }

  async openFounderModal() {
    const formData = await this.notificationService.showFounderRegistration();
    if (!formData) return;
    this.onRegister(formData);
  }

  onRegister(data: { name: string; whatsapp: string }) {
  const registroData = {
    username: data.name.trim(),
    email:    `${data.whatsapp.replace(/\D/g, '')}@koky.food`, // Coincide perfectamente con el Backend
    password: `Koky${data.whatsapp.replace(/\D/g, '')}!`
  };

  Swal.fire({
    title: 'Registrando...',
    text: 'Un momento, estamos guardando tu cupo.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  this.authService.register(registroData).subscribe({
    next: () => {
      this.cs.close();
      Swal.fire({
        title: '¡Bienvenido al Club, Fundador!',
        text: 'Kira te ha registrado con éxito.',
        icon: 'success',
        confirmButtonText: '<i class="icofont-whatsapp"></i> Hablar con Kira',
        confirmButtonColor: '#25D366',
        allowOutsideClick: true,
        showCloseButton: true,
        showDenyButton: true,
        denyButtonText: 'Cerrar',
        denyButtonColor: '#6c757d',
      }).then((result) => {
        if (result.isConfirmed) {
          // El mensaje incluye el string exacto que el backend interceptará como "vieneDeWeb"
          const mensaje = `¡Hola! Soy ${data.name}. Acabo de registrarme como Miembro Fundador de Koky desde la web.🥦`;
          window.open(`https://wa.me/573019447660?text=${encodeURIComponent(mensaje)}`, '_blank');
        }
      });
    },
    error: (err) => {
      console.error('Error en el registro de producción:', err);
      Swal.fire({
        title: 'Error',
        text: 'No pudimos procesar tu registro. Por favor, reintenta.',
        icon: 'error'
      });
    }
  });
}
}