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
  orderSaved: boolean = false;

  readonly PRECIOS_ENVIO: { [key: string]: number } = {
    Suba: 6100,
    Usaquén: 7300,
    Engativá: 9200,
    'Barrios Unidos': 9200,
    Chapinero: 10400,
    Teusaquillo: 10400,
    Fontibón: 11600,
    'Puente Aranda': 11600,
    'Los Mártires': 12200,
    'Santa Fe': 13400,
    'La Candelaria': 13400,
    Kennedy: 14600,
    Bosa: 17100,
    'Ciudad Bolívar': 18300,
    Tunjuelito: 15900,
    'Antonio Nariño': 14600,
    'Rafael Uribe Uribe': 17100,
    'San Cristóbal': 18300,
    Usme: 22000,
    DEFAULT: 9800,
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
            this.mensajeDireccion = 'Por favor escribe tu dirección.';
            this.costoEnvio = 0;
            this.calculateTotal();
          });
        } else {
          // Si digitó algo, verifiquemos si seleccionó una localidad en el select dropdown
          const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
          const localidad = selectLocalidad?.value || '';
          this.ngZone.run(() => {
            if (localidad) {
              this.direccionValida = true;
              this.mensajeDireccion = 'Dirección y localidad válidas ✔';
            } else {
              this.direccionValida = false;
              this.mensajeDireccion = 'Por favor selecciona tu localidad de la lista.';
            }
          });
        }
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            this.direccionValida = false;
            this.mensajeDireccion = 'Debes elegir una dirección de las sugerencias o seleccionarla de la lista.';
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

          // Seteamos el valor de la localidad detectada en el dropdown select
          const selectLocalidad = document.getElementById(
            'checkout_state_select'
          ) as HTMLSelectElement;
          if (selectLocalidad) {
            const matchingLoc = Object.keys(this.PRECIOS_ENVIO).find(
              k => k.toLowerCase() === (localidadDetectada || '').toLowerCase()
            );
            if (matchingLoc) {
              selectLocalidad.value = matchingLoc;
            } else {
              selectLocalidad.value = '';
            }
          }

          // Llamamos a la función que consulta Cabify
          this.consultarCostoEnvio({ lat, lng });
        });
      });
    });
  }

  processOrder() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.direccionValida) {
      alert('Por favor, selecciona una dirección válida.');
      document.getElementById('txtDireccion')?.focus();
      return;
    }

    if (!this.telefonoValido || !this.iti) {
      alert('Por favor, ingresa un número celular válido.');
      (document.querySelector('#checkout_phonenumber') as HTMLElement)?.focus();
      return;
    }

    this.telefonoFinal = this.iti.getNumber();
    let direccionFinal = (
      document.getElementById('txtDireccion') as HTMLInputElement
    ).value;

    const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
    const localidad = selectLocalidad?.value || '';
    if (localidad) {
      direccionFinal += `, ${localidad}`;
    }

    const nombreInput = document.getElementById(
      'checkout_name',
    ) as HTMLInputElement;
    const nombreCliente = nombreInput?.value.trim() || 'Cliente Sin Nombre';

    const datosOrden = {
      cliente: {
        nombre: nombreCliente,
        telefono: this.telefonoFinal,
        direccion: direccionFinal,
        notes:
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

    const inputNombre = document.getElementById(
      'checkout_name',
    ) as HTMLInputElement;
    const nombreParaStrapi = inputNombre
      ? inputNombre.value.trim()
      : 'Jonathan Barrios';

    const orderData = {
      whatsapp_id: String(orden.cliente.telefono),
      customer_name: nombreParaStrapi,
      total_amount: Number(orden.pago.total),
      wompi_reference: String(referencia), // ✅ Guardamos la referencia correcta
      source: String(this.detectedSource || 'whatsapp'),
      items: orden.productos,
      payment_method: 'PENDING', // Empieza como pendiente
      shipping_address: String(orden.cliente.direccion),
      shipping_latitude: Number(this.destinoLat),
      shipping_longitude: Number(this.destinoLng),
      shipping_notes: String(orden.cliente.notes),
    };

    console.log('🚀 Pre-creando orden en Strapi:', orderData);

    this.orderService.createOrder(orderData).subscribe({
      next: (orderRes: any) => {
        console.log('✅ Orden pre-creada con éxito en Strapi:', orderRes);
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
      },
      error: (err) => {
        console.error('❌ Error al pre-crear la orden en Strapi:', err);
        alert('Tuvimos un inconveniente al procesar tu pedido en el servidor. Por favor, intenta de nuevo en unos minutos.');
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
      checkoutConfig.signature = {
        integrity: signatureHex
      };
      console.log('✅ Checkout de Wompi configurado con firma de integridad.');
    } else {
      console.warn('⚠️ Abriendo checkout de Wompi sin firma de integridad (no configurada o falló).');
    }

    try {
      const checkout = new (window as any).WidgetCheckout(checkoutConfig);

      checkout.open((result: any) => {
        console.log('Wompi callback received:', result);

        if (result && result.transaction && result.transaction.status === 'APPROVED') {
          console.log('--- EVENTO WOMPI APPROVED ---', {
            id: result.transaction.id,
            status: result.transaction.status,
          });

          // Guardamos la información en localStorage para la vista de confirmación
          localStorage.setItem('last_koky_order', JSON.stringify({
            productos: orden.productos,
            pago: orden.pago,
            referencia: String(referencia)
          }));

          this.cartService.clearCart();
          this.router.navigate(['/orderconfirmation']);
        }
      });
    } catch (e) {
      console.error('❌ Error al inicializar o abrir el Widget de Wompi:', e);
      alert('Tuvimos un problema al abrir el portal de pagos de Wompi. Por favor, verifica tu conexión o recarga la página.');
    }
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
          // Fallback en caso de que la API de Cabify responda sin éxito
          this.aplicarTarifaFijaDeLocalidad();
        }
      },
      error: (err) => {
        console.error('Error al calcular envío:', err);
        // Fallback en caso de fallo de conexión o caída de Cabify
        this.aplicarTarifaFijaDeLocalidad();
      },
    });
  }

  aplicarTarifaFijaDeLocalidad() {
    const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
    const localidad = selectLocalidad?.value || 'DEFAULT';
    this.costoEnvio = this.PRECIOS_ENVIO[localidad] || this.PRECIOS_ENVIO['DEFAULT'];
    this.direccionValida = true;
    this.mensajeDireccion = 'Dirección válida (Tarifa fija de contingencia aplicada) ✔';
    this.calculateTotal();
  }

  onLocalityChange(event: any) {
    const localidad = event.target.value;
    const inputDireccion = document.getElementById('txtDireccion') as HTMLInputElement;
    const direccionText = inputDireccion?.value.trim() || '';

    if (direccionText.length < 5) {
      this.direccionValida = false;
      this.mensajeDireccion = 'Por favor escribe tu dirección antes de seleccionar la localidad.';
      this.costoEnvio = 0;
      this.calculateTotal();
      return;
    }

    if (localidad) {
      this.costoEnvio = this.PRECIOS_ENVIO[localidad] || this.PRECIOS_ENVIO['DEFAULT'];
      this.direccionValida = true;
      this.mensajeDireccion = 'Dirección y localidad válidas ✔';
      this.calculateTotal();
    }
  }

  getLocalidades(): string[] {
    return Object.keys(this.PRECIOS_ENVIO).filter(k => k !== 'DEFAULT');
  }
}
