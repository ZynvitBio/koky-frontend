import { Component,inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component'; // Ajusta la ruta
import { ComingSoonService } from './services/coming-soon/coming-soon.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ComingSoonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
   cs = inject(ComingSoonService);
  title = 'koky';
  onClose() {
    console.log('El usuario cerró el contador');
  }

  onRegister(data: { name: string; whatsapp: string }) {
    console.log('Nuevo Miembro Fundador:', data);
    // Aquí puedes llamar a tu servicio para guardar los datos en tu base de datos
  }
}
