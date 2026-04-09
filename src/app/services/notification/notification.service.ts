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

  async showFounderRegistration() {
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
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        if (!name || !phone) {
          Swal.showValidationMessage('Por favor llena ambos campos');
        }
        return { name, phone };
      }
    });

if (formValues) {
  const registroData = {
    username: formValues.name,
    email: `${formValues.phone}@koky.food`, 
    password: 'KokyFounder2026'
    // Quitamos whatsapp_id y is_founder temporalmente para probar
  };
  
this.authService.register(registroData).subscribe({
  next: () => {
    // 1. Cerramos el modal de carga y abrimos el de éxito
    Swal.fire({
      title: '¡Bienvenido al Club, Fundador!',
      text: 'Kira te ha registrado con éxito. Ahora, haz clic abajo para activar tus beneficios VIP por WhatsApp.',
      icon: 'success',
      confirmButtonText: '<i class="icofont-whatsapp"></i> Hablar con Kira',
      confirmButtonColor: '#25D366', // Verde oficial de WhatsApp
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        // 2. Preparamos el mensaje personalizado
        const nombre = registroData.username;
        const mensaje = `¡Hola! Soy ${nombre}. Acabo de registrarme como Miembro Fundador de Koky desde la web. ¡Quiero mis beneficios! 🥦`;
        
        // 3. Abrimos WhatsApp (Usa tu número ya configurado en el banner)
        const whatsappUrl = `https://wa.me/573007979419?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
      }
    });
  },
  error: (err) => {
    console.error('Error detallado:', err.error);
    this.showError('Registro Fallido', 'Asegúrate de que tu nombre y WhatsApp no hayan sido registrados antes.');
  }
});
}
  }
}