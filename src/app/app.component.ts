import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { ComingSoonService } from './services/coming-soon/coming-soon.service';
import { AuthService } from './services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ComingSoonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  cs          = inject(ComingSoonService);
  authService = inject(AuthService);
  title       = 'koky';

  onClose() {
    console.log('El usuario cerró el contador');
  }

  onRegister(data: { name: string; whatsapp: string }) {
    // Strapi necesita username, email y password obligatorios
    // Usamos el whatsapp como base para generar email y password únicos
    const registroData = {
      username: data.name.trim(),
      email:    `${data.whatsapp.replace(/\D/g, '')}@koky.food`,
      password: `Koky${data.whatsapp.replace(/\D/g, '')}!`
    };

    // Mostramos loading mientras se registra
    Swal.fire({
      title: 'Registrando...',
      text: 'Un momento, estamos guardando tu cupo.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.authService.register(registroData).subscribe({
      next: () => {
        // Cerramos el coming-soon al registrarse exitosamente
        this.cs.close();

        Swal.fire({
          title: '¡Bienvenido al Club, Fundador!',
          text: 'Kira te ha registrado con éxito. Ahora, haz clic abajo para activar tus beneficios VIP por WhatsApp.',
          icon: 'success',
          confirmButtonText: '<i class="icofont-whatsapp"></i> Hablar con Kira',
          confirmButtonColor: '#25D366',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            const mensaje = `¡Hola! Soy ${data.name}. Acabo de registrarme como Miembro Fundador de Koky desde la web. ¡Quiero mis beneficios! 🥦`;
            const whatsappUrl = `https://wa.me/573007979419?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');
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