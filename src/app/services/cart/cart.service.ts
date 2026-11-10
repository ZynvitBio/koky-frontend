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
  availableToday?: boolean;
  immediateDeliveryStock?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private _cart = new BehaviorSubject<CartItem[]>([]);
  cart$ = this._cart.asObservable();

  private _cartOpen = new BehaviorSubject<boolean>(false);
  cartOpen$ = this._cartOpen.asObservable();

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

  openCart() {
    this._cartOpen.next(true);
  }

  closeCart() {
    this._cartOpen.next(false);
  }

  addToCart(product: CartItem) {
    if (product.availableToday) {
      const existingTodayIdx = this.cartItems.findIndex(
        i => i.id === product.id && !!i.availableToday === true
      );

      const maxToday = product.immediateDeliveryStock !== undefined
        ? Number(product.immediateDeliveryStock)
        : (existingTodayIdx > -1 && this.cartItems[existingTodayIdx].immediateDeliveryStock !== undefined
            ? Number(this.cartItems[existingTodayIdx].immediateDeliveryStock)
            : undefined);

      if (maxToday !== undefined) {
        const currentTodayQty = existingTodayIdx > -1 ? this.cartItems[existingTodayIdx].quantity : 0;
        const canAddToday = Math.max(0, maxToday - currentTodayQty);
        const qtyForToday = Math.min(product.quantity, canAddToday);
        const qtyForTomorrow = product.quantity - qtyForToday;

        if (qtyForToday > 0) {
          if (existingTodayIdx > -1) {
            this.cartItems[existingTodayIdx].quantity += qtyForToday;
            this.cartItems[existingTodayIdx].immediateDeliveryStock = maxToday;
          } else {
            this.cartItems.push({ ...product, quantity: qtyForToday, availableToday: true, immediateDeliveryStock: maxToday });
          }
        }

        if (qtyForTomorrow > 0) {
          const existingTomorrowIdx = this.cartItems.findIndex(
            i => i.id === product.id && !i.availableToday
          );
          if (existingTomorrowIdx > -1) {
            this.cartItems[existingTomorrowIdx].quantity += qtyForTomorrow;
            this.cartItems[existingTomorrowIdx].immediateDeliveryStock = maxToday;
          } else {
            this.cartItems.push({ ...product, quantity: qtyForTomorrow, availableToday: false, immediateDeliveryStock: maxToday });
          }
        }

        this.updateCart();
        this.openCart();
        return;
      }
    }

    const index = this.cartItems.findIndex(
      i => i.id === product.id && !!i.availableToday === !!product.availableToday
    );
    if (index > -1) {
      this.cartItems[index].quantity += product.quantity;
    } else {
      this.cartItems.push({ ...product });
    }
    this.updateCart();
    this.openCart(); // 👈 Abre automáticamente el panel lateral al agregar un producto
  }

  /**
   * Sincroniza el carrito con el stock express real de Strapi y divide automáticamente
   * el excedente hacia el lote de mañana si el cliente tenía más unidades que el stock inmediato.
   */
  syncImmediateStockWithLiveProducts(liveProducts: any[]): boolean {
    if (!Array.isArray(liveProducts) || liveProducts.length === 0 || this.cartItems.length === 0) {
      return false;
    }

    let modified = false;
    const newCart: CartItem[] = [];

    const addOrMerge = (item: CartItem) => {
      const idx = newCart.findIndex(
        c => c.id === item.id && !!c.availableToday === !!item.availableToday
      );
      if (idx > -1) {
        newCart[idx].quantity += item.quantity;
        if (item.immediateDeliveryStock !== undefined) {
          newCart[idx].immediateDeliveryStock = item.immediateDeliveryStock;
        }
      } else {
        newCart.push({ ...item });
      }
    };

    for (const item of this.cartItems) {
      const liveProd = liveProducts.find(
        p => p.id === item.id || (p.slug && item.slug && p.slug === item.slug)
      );

      if (!liveProd) {
        addOrMerge(item);
        continue;
      }

      const maxToday = liveProd.availableToday ? Math.max(0, Number(liveProd.immediateDeliveryStock) || 0) : 0;

      if (item.immediateDeliveryStock !== maxToday) {
        item.immediateDeliveryStock = maxToday;
        modified = true;
      }

      if (item.availableToday) {
        if (maxToday <= 0) {
          // Ya no hay stock para hoy -> pasa todo a mañana
          addOrMerge({ ...item, availableToday: false, immediateDeliveryStock: 0 });
          modified = true;
        } else if (item.quantity > maxToday) {
          // Dividir entre lo disponible hoy y el resto para mañana
          const todayQty = maxToday;
          const tomorrowQty = item.quantity - maxToday;
          addOrMerge({ ...item, quantity: todayQty, availableToday: true, immediateDeliveryStock: maxToday });
          addOrMerge({ ...item, quantity: tomorrowQty, availableToday: false, immediateDeliveryStock: maxToday });
          modified = true;
        } else {
          addOrMerge({ ...item, immediateDeliveryStock: maxToday });
        }
      } else {
        addOrMerge({ ...item, immediateDeliveryStock: maxToday });
      }
    }

    if (modified) {
      this.cartItems = newCart;
      this.updateCart();
    }
    return modified;
  }

  /** Elimina completamente un producto del carrito (Botón "X") */
  removeFromCart(productId: number, availableToday?: boolean) {
    if (availableToday !== undefined) {
      this.cartItems = this.cartItems.filter(
        item => !(item.id === productId && !!item.availableToday === !!availableToday)
      );
    } else {
      this.cartItems = this.cartItems.filter(item => item.id !== productId);
    }
    this.updateCart();
  }

  /** Reduce la cantidad en 1. Si llega a 0, lo elimina. */
  decreaseQuantity(productId: number, availableToday?: boolean) {
    const index = this.cartItems.findIndex(
      item => item.id === productId && (availableToday === undefined || !!item.availableToday === !!availableToday)
    );
    
    if (index > -1) {
      if (this.cartItems[index].quantity > 1) {
        this.cartItems[index].quantity--;
      } else {
        this.cartItems.splice(index, 1);
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