import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
   constructor(private router: Router,
                ) {}
    goToBlog() {
    this.router.navigate(['/blog']);
  }
  goToPolitic(path: string) {
    this.router.navigate([path]).then(() => {
      window.scrollTo(0, 0); // Esto asegura que el usuario aparezca arriba de la nueva página
    });
  }

}
