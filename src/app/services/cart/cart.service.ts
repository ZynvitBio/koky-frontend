import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  contentPerUnit: number; 
  unitAbbreviation: 'g' | 'kg' | 'und' | 'ml' | 'L';
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private _cart = new BehaviorSubject<CartItem[]>([]);
  cart$ = this._cart.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // 🛡️ Solo intentamos leer el localStorage si estamos en el Navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedCart = localStorage.getItem('koky_cart');
      if (savedCart) {
        try {
          this.cartItems = JSON.parse(savedCart);
          this._cart.next(this.cartItems);
        } catch (e) {
          console.error("Error al parsear el carrito", e);
          this.cartItems = [];
        }
      }
    }
  }

  addToCart(product: CartItem) {
    const index = this.cartItems.findIndex(i => i.id === product.id);
    if (index > -1) {
      this.cartItems[index].quantity += product.quantity;
    } else {
      this.cartItems.push({ ...product });
    }
    this.updateCart();
  }

  /** Elimina completamente un producto del carrito (Botón "X") */
  removeFromCart(productId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== productId);
    this.updateCart();
  }

  /** Reduce la cantidad en 1. Si llega a 0, lo elimina. */
  decreaseQuantity(productId: number) {
    const index = this.cartItems.findIndex(item => item.id === productId);
    
    if (index > -1) {
      if (this.cartItems[index].quantity > 1) {
        this.cartItems[index].quantity--;
      } else {
        this.cartItems = this.cartItems.filter(item => item.id !== productId);
      }
      this.updateCart();
    }
  }

  /** Limpia todo el carrito (Útil para después de un Checkout exitoso) */
  clearCart() {
    this.cartItems = [];
    this.updateCart();
  }

  private updateCart() {
    // 🛡️ Solo guardamos en localStorage si estamos en el Navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('koky_cart', JSON.stringify(this.cartItems));
    }
    this._cart.next([...this.cartItems]);
  }

  getTotal() {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }
}