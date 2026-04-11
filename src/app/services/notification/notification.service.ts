import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../auth/auth.service'; // <--- 1. AJUSTA ESTA RUTA A TU AUTH SERVICE

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // 2. Inyectamos el AuthService en el constructor
  constructor(private authService: AuthService) { }

  showSuccess(title: string, message?: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      iconColor: '#28a745',
      background: '#ffffff'
    });
    Toast.fire({ icon: 'success', title: title, text: message });
  }

  showError(title: string, message: string) {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#28a745'
    });
  }

  async confirmAction(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    return result.isConfirmed;
  }

async showFounderRegistration(): Promise<{ name: string; whatsapp: string } | null> {
  const { value: formValues } = await Swal.fire({
    title: '¡Sé un Miembro Fundador!',
    text: 'Kira te espera en la cocina VIP',
    html:
      '<input id="swal-name" class="swal2-input" placeholder="Tu Nombre">' +
      '<input id="swal-phone" class="swal2-input" placeholder="Tu WhatsApp">',
    focusConfirm: false,
    confirmButtonText: '¡Unirme ahora!',
    confirmButtonColor: '#28a745',
    showCancelButton: true,
    cancelButtonText: 'Después',
    preConfirm: () => {
      const name  = (document.getElementById('swal-name') as HTMLInputElement).value;
      const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
      if (!name || !phone) {
        Swal.showValidationMessage('Por favor llena ambos campos');
        return;
      }
      return { name, phone };
    }
  });

  // Solo retorna los datos, no registra ni muestra éxito
  return formValues ? { name: formValues.name, whatsapp: formValues.phone } : null;
}

}