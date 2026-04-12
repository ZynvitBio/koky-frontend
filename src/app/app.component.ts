import { Component, inject, OnInit } from '@angular/core';
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
  title               = 'koky';
  isHomeRoute         = false; // 👈 propiedad reactiva

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const path = e.urlAfterRedirects || e.url;
        this.isHomeRoute = path === '/home' || path === '/' || path.startsWith('/home#');
      });
  }
 isHome(): boolean {
    const path = this.router.url;
    return path === '/home' || path === '/' || path.startsWith('/home#');
  }
  onClose() {
    console.log('El usuario cerró el contador');
  }
  async openFounderModal() {
  const formData = await this.notificationService.showFounderRegistration();
  if (!formData) return; // usuario canceló

  this.onRegister(formData);
}

onRegister(data: { name: string; whatsapp: string }) {
  const registroData = {
    username: data.name.trim(),
    email:    `${data.whatsapp.replace(/\D/g, '')}@koky.food`,
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
        showCloseButton: true,      // ✅ la X ahora sí funciona
        showDenyButton: true,
        denyButtonText: 'Cerrar',
        denyButtonColor: '#6c757d',
      }).then((result) => {
        if (result.isConfirmed) {
          const mensaje = `¡Hola! Soy ${data.name}. Acabo de registrarme como Miembro Fundador de Koky desde la web.🥦`;
          window.open(`https://wa.me/573019447660?text=${encodeURIComponent(mensaje)}`, '_blank');
        }
      });
    },
    error: (err) => {
      console.error('Error detallado:', err.error);
      Swal.fire({
        title: 'Registro Fallido',
        text: 'Asegúrate de que tu nombre y WhatsApp no hayan sido registrados antes.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    }
  });
}
}