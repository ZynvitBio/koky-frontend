import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { CartService, CartItem } from '../services/cart/cart.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification/notification.service'; 

@Component({
  selector: 'app-cartoverview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cartoverview.component.html',
  styleUrl: './cartoverview.component.css'
})
export class CartoverviewComponent implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  discount: number = 0; 
  couponCode: string = '';
  invalidCoupon: boolean = false;

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private notify: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object // Inyectamos el ID de plataforma
  ) {}

  ngOnInit(): void {
    // Solo ejecutamos la suscripción y lógica pesada si estamos en el navegador
    // Esto evita que el servidor falle al intentar acceder al estado del carrito que depende de localStorage
    if (isPlatformBrowser(this.platformId)) {
      this.cartService.cart$.subscribe(items => {
        console.log('DATOS CRUDOS:', items);
        
        const strapiUrl = 'http://localhost:1337';

        this.cartItems = items.map(item => {
          return {
            id: item.id,
            name: item.name || 'Sin nombre',
            price: item.price || 0,
            quantity: item.quantity || 1,
            slug: item.slug || '',
            image: item.image ? (item.image.startsWith('http') ? item.image : `${strapiUrl}${item.image}`) : 'assets/img/placeholder.png',
            contentPerUnit: item.contentPerUnit,
            unitAbbreviation: item.unitAbbreviation
          };
        });

        this.calculateTotal();
        this.cdr.detectChanges(); 
      });
    }
  }

  calculateTotal(): void {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  // --- MÉTODOS PARA LOS BOTONES DEL TEMPLATE ---

  increaseQuantity(item: CartItem): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cartService.addToCart({ ...item, quantity: 1 });
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cartService.decreaseQuantity(item.id);
    }
  }

  async removeItem(productId: number) {
    if (isPlatformBrowser(this.platformId)) {
      const confirmado = await this.notify.confirmAction(
        '¿Quitar del carrito?',
        'Podrás volver a añadirlo cuando quieras'
      );

      if (confirmado) {
        this.cartService.removeFromCart(productId);
        this.notify.showSuccess('Producto eliminado');
      }
    }
  }

  applyCoupon() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.couponCode.trim().toUpperCase() === 'KOKY10') {
        this.discount = this.subtotal * 0.10;
        this.invalidCoupon = false;
        alert('¡Cupón aplicado! Tienes un 10% de descuento.');
      } else {
        this.discount = 0;
        this.invalidCoupon = true;
        alert('Cupón no válido.');
      }
      this.cdr.detectChanges();
    }
  }
}