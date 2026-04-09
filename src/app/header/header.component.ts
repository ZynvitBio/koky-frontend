import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  totalItems: number = 0;
  constructor(private router: Router,
              private cartService: CartService) {}

  ngOnInit() {
    // Nos suscribimos al flujo del carrito
    this.cartService.cart$.subscribe(items => {
      // Sumamos las cantidades de todos los items
      this.totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    });
  }            
  goToBlog() {
    this.router.navigate(['/blog']);
  }

}
