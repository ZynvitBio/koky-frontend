import { CommonModule } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CartService, CartItem } from '../services/cart/cart.service';
import intlTelInput from 'intl-tel-input';
import { Router, ActivatedRoute } from '@angular/router'; 
import { OrderService } from '../services/order/order.service';
import { isPlatformBrowser } from '@angular/common';

declare var google: any;

const bogotaBounds = {
  north: 4.8367,
  south: 4.4711,
  west: -74.2473,
  east: -74.0102,
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  discount: number = 0;
  costoEnvio: number = 0;
  totalFinal: number = 0;
  iti: any;
  telefonoFinal: string = '';
  telefonoValido: boolean = false;
  mensajeTelefono: string = '';
  direccionValida: boolean = false;
  mensajeDireccion: string = '';
  detectedSource: string = 'directo'; 

  readonly PRECIOS_ENVIO: { [key: string]: number } = {
    'Suba': 5000,
    'Usaquén': 6000,
    'Engativá': 7500,
    'Barrios Unidos': 7500,
    'Chapinero': 8500,
    'Teusaquillo': 8500,
    'Fontibón': 9500,
    'Puente Aranda': 9500,
    'Los Mártires': 10000,
    'Santa Fe': 11000,
    'Kennedy': 12000,
    'Bosa': 14000,
    'Ciudad Bolívar': 15000,
    'Tunjuelito': 13000,
    'Antonio Nariño': 12000,
    'Rafael Uribe Uribe': 14000,
    'San Cristóbal': 15000,
    'Usme': 18000,
    'DEFAULT': 8000
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
    });

    this.route.queryParams.subscribe(params => {
      if (params['source']) {
        this.detectedSource = params['source'];
      }
    });

    // Solo ejecutamos inicialización de UI si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initAutocomplete();
        this.initTelInput();
      }, 500);
    }
  }

  initTelInput() {
    if (!isPlatformBrowser(this.platformId)) return;

    const inputTel = document.querySelector("#checkout_phonenumber") as HTMLInputElement;
    if (!inputTel) return;

    this.iti = intlTelInput(inputTel, {
      initialCountry: "co",
      separateDialCode: true,
      autoPlaceholder: "polite",
      placeholderNumberType: "MOBILE",
      loadUtils: () => import('intl-tel-input/utils')
    });

    const input = document.getElementById('txtDireccion') as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        if (!input.value || input.value.trim() === '') {
          this.direccionValida = false;
          this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias de Google.';
          this.costoEnvio = 0;
          this.calculateTotal();
        } else if (!this.direccionValida) {
          this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias de Google.';
        }
      });
    }

    inputTel.addEventListener('input', () => {
      this.validarTelefono();
    });

    inputTel.addEventListener('countrychange', () => {
      this.validarTelefono();
    });
  }

  private validarTelefono() {
    if (!this.iti) return;
    if (!this.iti.isValidNumber()) {
      this.telefonoValido = false;
      this.mensajeTelefono = 'Número inválido.';
      return;
    }
    const type = this.iti.getNumberType();
    if (type !== 1 && type !== 2) {
      this.telefonoValido = false;
      this.mensajeTelefono = 'Debe ser un número celular.';
      return;
    }
    this.telefonoValido = true;
    this.mensajeTelefono = 'Número válido ✔';
  }

  calculateTotal() {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    this.totalFinal = this.subtotal + this.costoEnvio - this.discount;
  }

  initAutocomplete() {
    if (!isPlatformBrowser(this.platformId)) return;

    const input = document.getElementById('txtDireccion') as HTMLInputElement;
    if (!input || typeof google === 'undefined') return;

    const options = {
      bounds: bogotaBounds,
      componentRestrictions: { country: "co" },
      fields: ["address_components", "geometry"],
      strictBounds: true,
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    input.addEventListener('input', () => {
      if (this.direccionValida) {
        this.direccionValida = false;
        this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias de Google.';
        this.costoEnvio = 0;
        this.calculateTotal();
      }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.address_components) {
        this.direccionValida = false;
        this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias de Google.';
        return;
      }

      let localidadDetectada = "";
      for (const component of place.address_components) {
        if (component.types.includes("sublocality_level_1")) {
          localidadDetectada = component.long_name;
          break;
        }
      }

      if (!localidadDetectada) {
        const barrio = place.address_components.find((c: any) => c.types.includes("neighborhood"));
        if (barrio) localidadDetectada = barrio.long_name;
      }

      const campoLocalidad = document.getElementById('checkout_state') as HTMLInputElement;
      if (campoLocalidad && localidadDetectada) {
        campoLocalidad.value = localidadDetectada;
        this.costoEnvio = this.PRECIOS_ENVIO[localidadDetectada.trim()] || this.PRECIOS_ENVIO['DEFAULT'];
        this.calculateTotal();
        this.direccionValida = true;
        this.mensajeDireccion = 'Dirección válida ✔';
      } else {
        this.direccionValida = false;
        this.mensajeDireccion = 'No se pudo detectar la localidad, intenta con una dirección más precisa.';
      }
    });

    input.addEventListener('blur', () => {
      if (!this.direccionValida) {
        this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias de Google.';
      }
    });
  }

  processOrder() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.direccionValida) {
      alert("Por favor, selecciona una dirección válida.");
      document.getElementById('txtDireccion')?.focus();
      return;
    }

    if (!this.telefonoValido || !this.iti) {
      alert("Por favor, ingresa un número celular válido.");
      (document.querySelector("#checkout_phonenumber") as HTMLElement)?.focus();
      return;
    }

    this.telefonoFinal = this.iti.getNumber();
    const direccionFinal = (document.getElementById('txtDireccion') as HTMLInputElement).value;
    
    const nombreInput = document.getElementById('checkout_name') as HTMLInputElement;
    const nombreCliente = nombreInput?.value.trim() || 'Cliente Sin Nombre'; 

    const datosOrden = {
      cliente: {
        nombre: nombreCliente,
        telefono: this.telefonoFinal,
        direccion: direccionFinal,
        notas: (document.getElementById('checkout_notes') as HTMLTextAreaElement)?.value || ''
      },
      productos: this.cartItems,
      pago: {
        subtotal: this.subtotal,
        envio: this.costoEnvio,
        descuento: this.discount,
        total: this.totalFinal
      }
    };

    this.abrirCheckoutWompi(datosOrden);
  }

  private abrirCheckoutWompi(orden: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    const checkout = new (window as any).WidgetCheckout({
      currency: 'COP',
      amountInCents: Math.round(orden.pago.total * 100),
      reference: `KOKY_${Date.now()}`,
      publicKey: 'pub_test_kB5ENAJ1QA4hPWZYlcrehcyjFrhQyUdq',
    });

    checkout.open((result: any) => {
      const transaction = result.transaction;

      if (transaction.status === 'APPROVED') {
        const inputNombre = (document.getElementById('checkout_name') as HTMLInputElement);
        const nombreParaStrapi = inputNombre ? inputNombre.value.trim() : "Jonathan Barrios";

        const metodoFinal = String(transaction.paymentMethodType || "CARDX").trim();

        const orderData = {
          whatsapp_id: String(orden.cliente.telefono),
          customer_name: nombreParaStrapi,
          total_amount: Number(orden.pago.total),
          wompi_reference: String(transaction.id),
          source: String(this.detectedSource || 'whatsapp'),
          items: orden.productos, 
          payment_method: metodoFinal 
        };

        this.orderService.createOrder(orderData).subscribe({
          next: (res) => {
            console.log('¡Orden Guardada!', res);
            this.cartService.clearCart();
            this.router.navigate(['/orderconfirmation']);
          },
          error: (err) => {
            console.error('Error al guardar:', err);
            this.router.navigate(['/orderconfirmation']);
          }
        });
      }
    });
  }
}