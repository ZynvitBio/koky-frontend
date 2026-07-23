import { CommonModule } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { CartService, CartItem } from '../services/cart/cart.service';
import intlTelInput from 'intl-tel-input';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../services/order/order.service';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DeliveryService } from '../services/delivery/delivery.service';
import { environment } from '../../environments/environment';

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
  templateUrl: './checkout.component.html',
  host: {
    'ngSkipHydration': 'true'
  }
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
  destinoLat: number = 0;
  destinoLng: number = 0;
  procesandoOrden: boolean = false;
  orderSaved: boolean = false;

  readonly PRECIOS_ENVIO: { [key: string]: number } = {
    Suba: 5000,
    Usaquén: 6000,
    Engativá: 7500,
    'Barrios Unidos': 7500,
    Chapinero: 8500,
    Teusaquillo: 8500,
    Fontibón: 9500,
    'Puente Aranda': 9500,
    'Los Mártires': 10000,
    'Santa Fe': 11000,
    Kennedy: 12000,
    Bosa: 14000,
    'Ciudad Bolívar': 15000,
    Tunjuelito: 13000,
    'Antonio Nariño': 12000,
    'Rafael Uribe Uribe': 14000,
    'San Cristóbal': 15000,
    Usme: 18000,
    DEFAULT: 8000,
  };

  constructor(
    private deliveryService: DeliveryService,
    private http: HttpClient,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
      this.calculateTotal();
    });

    this.route.queryParams.subscribe((params) => {
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

    const inputTel = document.querySelector(
      '#checkout_phonenumber',
    ) as HTMLInputElement;
    if (!inputTel) return;

    this.iti = intlTelInput(inputTel, {
      initialCountry: 'co',
      separateDialCode: true,
      autoPlaceholder: 'polite',
      placeholderNumberType: 'MOBILE',
      loadUtils: () => import('intl-tel-input/utils'),
    });

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
    this.subtotal = this.cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    this.totalFinal = this.subtotal + this.costoEnvio - this.discount;
  }

  initAutocomplete() {
    if (!isPlatformBrowser(this.platformId)) return;

    const input = document.getElementById('txtDireccion') as HTMLInputElement;
    if (!input || typeof google === 'undefined') return;

    const options = {
      bounds: bogotaBounds,
      componentRestrictions: { country: 'co' },
      fields: ['address_components', 'geometry'],
      strictBounds: true,
    };

    // Inicializamos Autocomplete fuera de la zona de Angular para evitar ciclos de change detection al digitar
    this.ngZone.runOutsideAngular(() => {
      const autocomplete = new google.maps.places.Autocomplete(input, options);

      input.addEventListener('input', () => {
        if (!input.value || input.value.trim() === '') {
          this.ngZone.run(() => {
            this.direccionValida = false;
            this.mensajeDireccion =
              'Debes elegir una dirección de las sugerencias de Google.';
            this.costoEnvio = 0;
            this.calculateTotal();
          });
        } else {
          if (this.direccionValida) {
            this.ngZone.run(() => {
              this.direccionValida = false;
              this.costoEnvio = 0;
              this.calculateTotal();
              this.mensajeDireccion =
                'Debes elegir una dirección de las sugerencias de Google.';
            });
          } else {
            if (this.mensajeDireccion !== 'Debes elegir una dirección de las sugerencias de Google.') {
              this.ngZone.run(() => {
                this.mensajeDireccion =
                  'Debes elegir una dirección de las sugerencias de Google.';
              });
            }
          }
        }
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            this.direccionValida = false;
            this.mensajeDireccion =
              'Debes elegir una dirección de las sugerencias de Google.';
            return;
          }

          // Obtenemos las coordenadas reales del lugar seleccionado
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.destinoLat = lat;
          this.destinoLng = lng;

          // Extraemos la localidad / barrio para rellenar el input
          let localidadDetectada = '';
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('sublocality_level_1')) {
                localidadDetectada = component.long_name;
                break;
              }
            }

            if (!localidadDetectada) {
              const barrio = place.address_components.find((c: any) =>
                c.types.includes('neighborhood')
              );
              if (barrio) localidadDetectada = barrio.long_name;
            }
          }

          const campoLocalidad = document.getElementById(
            'checkout_state'
          ) as HTMLInputElement;
          if (campoLocalidad) {
            campoLocalidad.value = localidadDetectada || 'Bogotá';
          }

          // Llamamos a la nueva función que consulta Cabify
          this.consultarCostoEnvio({ lat, lng });
        });
      });
    });
  }

  processOrder() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.procesandoOrden) return;
    this.procesandoOrden = true;

    if (!this.direccionValida) {
      alert('Por favor, selecciona una dirección válida.');
      document.getElementById('txtDireccion')?.focus();
      this.procesandoOrden = false;
      return;
    }

    if (!this.telefonoValido || !this.iti) {
      alert('Por favor, ingresa un número celular válido.');
      (document.querySelector('#checkout_phonenumber') as HTMLElement)?.focus();
      this.procesandoOrden = false;
      return;
    }

    this.telefonoFinal = this.iti.getNumber();
    const direccionFinal = (
      document.getElementById('txtDireccion') as HTMLInputElement
    ).value;

    const nombreInput = document.getElementById(
      'checkout_name',
    ) as HTMLInputElement;
    const nombreCliente = nombreInput?.value.trim() || 'Cliente Sin Nombre';

    const datosOrden = {
      cliente: {
        nombre: nombreCliente,
        telefono: this.telefonoFinal,
        direccion: direccionFinal,
        notas:
          (document.getElementById('checkout_notes') as HTMLTextAreaElement)
            ?.value || '',
      },
      productos: this.cartItems,
      pago: {
        subtotal: this.subtotal,
        envio: this.costoEnvio,
        descuento: this.discount,
        total: this.totalFinal,
      },
    };

    this.abrirCheckoutWompi(datosOrden);
  }

  private abrirCheckoutWompi(orden: any) {
    if (!isPlatformBrowser(this.platformId)) return;

    const referencia = `KOKY_${Date.now()}`;
    const total = orden.pago.total;
    const amountInCents = Math.round(total * 100);

    // Solicitamos la firma de integridad de forma segura a nuestro backend en Railway
    this.orderService.getWompiSignature(referencia, amountInCents, 'COP').subscribe({
      next: (res: any) => {
        const signatureHex = res.signature;
        this.iniciarWompiWidget(orden, referencia, amountInCents, signatureHex);
      },
      error: (err) => {
        console.error('❌ Error al obtener la firma de Wompi desde el backend:', err);
        // Si hay un error, abrimos Wompi sin firma (como fallback)
        this.iniciarWompiWidget(orden, referencia, amountInCents, '');
      }
    });
  }

  private iniciarWompiWidget(orden: any, referencia: string, amountInCents: number, signatureHex: string) {
    const checkoutConfig: any = {
      currency: 'COP',
      amountInCents: amountInCents,
      reference: referencia,
      publicKey: environment.wompiPublicKey,
    };

    if (signatureHex) {
      checkoutConfig.signature = signatureHex;
      console.log('✅ Checkout de Wompi configurado con firma de integridad.');
    } else {
      console.warn('⚠️ Abriendo checkout de Wompi sin firma de integridad (no configurada o falló).');
    }

    const checkout = new (window as any).WidgetCheckout(checkoutConfig);

    checkout.open((result: any) => {
      const transaction = result.transaction;

      if (transaction.status === 'APPROVED') {
        console.log('--- EVENTO WOMPI APPROVED ---', {
          id: transaction.id,
          status: transaction.status,
          orderSaved: this.orderSaved,
        });

        if (this.orderSaved) {
          console.warn('⚠️ Se bloqueó una llamada duplicada de Wompi.');
          return;
        }
        this.orderSaved = true;
        console.log('🚀 Enviando petición de creación de orden a Strapi...');

        const inputNombre = document.getElementById(
          'checkout_name',
        ) as HTMLInputElement;
        const nombreParaStrapi = inputNombre
          ? inputNombre.value.trim()
          : 'Jonathan Barrios';

        const metodoFinal = String(
          transaction.paymentMethodType || 'CARDX',
        ).trim();

        const orderData = {
          whatsapp_id: String(orden.cliente.telefono),
          customer_name: nombreParaStrapi,
          total_amount: Number(orden.pago.total),
          wompi_reference: String(transaction.id),
          source: String(this.detectedSource || 'whatsapp'),
          items: orden.productos,
          payment_method: metodoFinal,
          shipping_address: String(orden.cliente.direccion),
          shipping_latitude: Number(this.destinoLat),
          shipping_longitude: Number(this.destinoLng),
          shipping_notes: String(orden.cliente.notas),
        };

        this.orderService.createOrder(orderData).subscribe({
          next: (res) => {
            console.log('¡Orden Guardada!', res);
            
            // Guardamos la información en localStorage para la vista de confirmación
            localStorage.setItem('last_koky_order', JSON.stringify({
              productos: orden.productos,
              pago: orden.pago,
              referencia: String(transaction.id)
            }));

            this.cartService.clearCart();
            this.router.navigate(['/orderconfirmation']);
          },
          error: (err) => {
            console.error('Error al guardar:', err);
            this.router.navigate(['/orderconfirmation']);
          },
        });
      } else {
        // Permitimos volver a intentar si el pago fue rechazado o cerrado
        this.procesandoOrden = false;
      }
    });
  }
  consultarCostoEnvio(destino: { lat: number; lng: number }) {
    this.deliveryService.calcularEnvio(destino).subscribe({
      next: (res) => {
        if (res.success) {
          this.costoEnvio = res.data.deliveries[0].estimation.price.amount;
          this.calculateTotal();
          this.direccionValida = true;
          this.mensajeDireccion = 'Dirección válida ✔';
        } else {
          this.direccionValida = false;
          this.mensajeDireccion = 'No se pudo calcular el envío para esta dirección.';
        }
      },
      error: (err) => {
        console.error('Error al calcular envío:', err);
        this.direccionValida = false;
        this.mensajeDireccion = 'Error al obtener tarifa de envío. Intenta de nuevo.';
      },
    });
  }
}
