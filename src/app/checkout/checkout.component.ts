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
  styleUrl: './checkout.component.css',
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
  calculandoEnvio: boolean = false;
  mostrarSelectorLocalidad: boolean = false;
  zonaDetectada: string = '';
  suggestionsList: Array<{ text: string; placePrediction: any }> = [];
  sessionToken: any = null;
  debounceTimer: any = null;
  geocoder: any = null;

  // Lógica de Doble Despacho y Fusión / Omitir Lotes
  consolidarEnManana: boolean = false;
  omitirManana: boolean = false;
  baseDeliveryPrice: number = 0;

  get itemsToday(): CartItem[] {
    return this.cartItems.filter(item => item.availableToday === true);
  }

  get itemsTomorrow(): CartItem[] {
    return this.cartItems.filter(item => !item.availableToday);
  }

  get hasTodayItems(): boolean {
    return this.itemsToday.length > 0;
  }

  get hasTomorrowItems(): boolean {
    return this.itemsTomorrow.length > 0;
  }

  get isMixedDelivery(): boolean {
    return this.hasTodayItems && this.hasTomorrowItems;
  }

  get isDoubleDeliveryActive(): boolean {
    return this.isMixedDelivery && !this.consolidarEnManana && !this.omitirManana;
  }

  get activeCartItems(): CartItem[] {
    if (!this.isMixedDelivery) {
      return this.cartItems;
    }
    if (this.omitirManana) {
      return this.itemsToday;
    }
    return this.cartItems;
  }

  get subtotalHoy(): number {
    return this.itemsToday.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  get subtotalManana(): number {
    return this.itemsTomorrow.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  get costoEnvioUnitario(): number {
    if (this.baseDeliveryPrice > 0) return this.baseDeliveryPrice;
    return this.isDoubleDeliveryActive ? Math.round(this.costoEnvio / 2) : this.costoEnvio;
  }

  readonly PRECIOS_ENVIO: { [key: string]: number } = {
    // SUBA
    'Suba - Niza / Pontevedra / Bulevar': 7500,
    'Suba - Colina / San José de Bavaria / Mazurén': 9500,
    'Suba - Centro / Rincón / Aures': 12000,
    'Suba - Gaitana / Lisboa / Tibabuyes': 14500,
    'Suba - Guaymaral / Corpas': 17000,

    // USAQUÉN
    'Usaquén - Santa Bárbara / Unicentro': 8500,
    'Usaquén - Cedritos / Contador': 9500,
    'Usaquén - San Cristóbal Norte / Servitá': 11500,
    'Usaquén - Torca / Autopista Norte': 16000,

    // ENGATIVÁ
    'Engativá - Las Ferias / Bonanza / Metrópolis': 10500,
    'Engativá - Álamos / Minuto de Dios / Boyacá Real': 11500,
    'Engativá - Centro / Villas de Granada / Garcés Navas': 13500,
    'Engativá - Engativá Pueblo / Aeropuerto': 15500,

    // FONTIBÓN
    'Fontibón - Ciudad Salitre / Carlos Lleras': 11500,
    'Fontibón - Modelia / Hayuelos / Capellanía': 13500,
    'Fontibón - Centro / Villemar / Fontibón Pueblo': 16500,
    'Fontibón - Zona Franca / HB / Puente Grande': 18500,

    // KENNEDY
    'Kennedy - Castilla / Marsella / Américas': 13500,
    'Kennedy - Kennedy Central / Timiza / Carvajal': 15500,
    'Kennedy - Tintal / Calandaima': 17500,
    'Kennedy - Patio Bonito / Corabastos / El Amparo': 19000,

    // BOSA
    'Bosa - Bosa Central / Laureles': 18500,
    'Bosa - San Bernardino / Bosa Porvenir': 21000,

    // CHAPINERO & TEUSAQUILLO
    'Chapinero - Chicó / El Virrey / Parque 93': 9500,
    'Chapinero - Chapinero Central / Alto': 11500,
    'Teusaquillo - Galerías / Palermo / La Soledad': 11500,
    'Teusaquillo - Salitre Oriental / CAN / Quinta Paredes': 12500,

    // BARRIOS UNIDOS
    'Barrios Unidos - Polo / Castellana / Andes': 9500,
    'Barrios Unidos - 12 de Octubre / 7 de Agosto': 10500,

    // PUENTE ARANDA & LOS MÁRTIRES
    'Puente Aranda - Ciudad Montes / Salazar Gómez / Trinidad': 13500,
    'Los Mártires - Paloquemao / Santa Isabel / Ricaurte': 13500,

    // CENTRO Y SUR
    'Santa Fe / La Candelaria - Centro Histórico / Las Aguas': 14500,
    'Antonio Nariño - Restrepo / Santander / Ciudad Berna': 15500,
    'Tunjuelito - Venecia / San Vicente / Tunjuelito': 17000,
    'Rafael Uribe Uribe - Olaya / Quiroga / Marruecos': 18500,
    'San Cristóbal - 20 de Julio / San Blas / Sur Oriental': 19500,
    'Ciudad Bolívar - Perdomo / Ismael Perdomo / Candelaria': 19500,
    'Ciudad Bolívar - Meissen / San Francisco / Arborizadora': 22000,
    'Usme - Usme Pueblo / Yomasa / Santa Librada': 24000,

    DEFAULT: 11000,
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
    this.subtotal = this.activeCartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    this.totalFinal = this.subtotal + this.costoEnvio - this.discount;
  }

  despachoHoyActivo: boolean = true;
  despachoMananaActivo: boolean = true;

  consolidarTodoEnManana() {
    this.despachoHoyActivo = false;
    this.despachoMananaActivo = true;
    this.consolidarEnManana = true;
    this.omitirManana = false;
    this.recalcularEnvioYTotal();
  }

  omitirEntregaManana() {
    this.despachoHoyActivo = true;
    this.despachoMananaActivo = false;
    this.omitirManana = true;
    this.consolidarEnManana = false;
    this.recalcularEnvioYTotal();
  }

  restaurarDobleDespacho() {
    this.despachoHoyActivo = true;
    this.despachoMananaActivo = true;
    this.consolidarEnManana = false;
    this.omitirManana = false;
    this.recalcularEnvioYTotal();
  }

  toggleDespachoHoy() {
    this.despachoHoyActivo = !this.despachoHoyActivo;
    if (!this.despachoHoyActivo) {
      this.despachoMananaActivo = true;
      this.consolidarEnManana = true;
      this.omitirManana = false;
    } else {
      this.consolidarEnManana = false;
      this.omitirManana = false;
    }
    this.recalcularEnvioYTotal();
  }

  toggleDespachoManana() {
    this.despachoMananaActivo = !this.despachoMananaActivo;
    if (!this.despachoMananaActivo) {
      this.despachoHoyActivo = true;
      this.omitirManana = true;
      this.consolidarEnManana = false;
    } else {
      this.consolidarEnManana = false;
      this.omitirManana = false;
    }
    this.recalcularEnvioYTotal();
  }

  recalcularEnvioYTotal() {
    if (this.baseDeliveryPrice > 0) {
      this.costoEnvio = this.isDoubleDeliveryActive
        ? this.baseDeliveryPrice * 2
        : this.baseDeliveryPrice;
    }
    this.calculateTotal();
  }

  async initAutocomplete() {
    if (!isPlatformBrowser(this.platformId)) return;

    const input = document.getElementById('txtDireccion') as HTMLInputElement;
    if (!input || typeof google === 'undefined' || !google.maps) return;

    if (google.maps.importLibrary) {
      try {
        await google.maps.importLibrary('places');
      } catch (e) {
        console.warn('Google Places library load error:', e);
      }
    }

    if (google.maps && google.maps.Geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    input.addEventListener('input', () => {
      const val = input.value?.trim() || '';
      this.ngZone.run(() => {
        this.destinoLat = 0;
        this.destinoLng = 0;
        this.zonaDetectada = '';

        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }

        if (!val) {
          this.direccionValida = false;
          this.mensajeDireccion = 'Por favor escribe tu dirección.';
          this.costoEnvio = 0;
          this.suggestionsList = [];
          this.calculateTotal();
        } else {
          this.direccionValida = false;
          this.mensajeDireccion = 'Selecciona tu dirección de las sugerencias o elige tu sector.';
          this.debounceTimer = setTimeout(() => {
            this.buscarSugerencias(val);
          }, 250);
        }
      });
    });

    // Cerrar sugerencias si hace clic fuera
    document.addEventListener('click', (e: any) => {
      if (!e.target.closest('#txtDireccion') && !e.target.closest('.places-suggestions-container')) {
        this.ngZone.run(() => {
          this.suggestionsList = [];
        });
      }
    });
  }

  async buscarSugerencias(query: string) {
    if (!query || query.length < 3 || typeof google === 'undefined' || !google.maps) {
      this.suggestionsList = [];
      return;
    }

    try {
      if (!this.sessionToken && google.maps.places?.AutocompleteSessionToken) {
        this.sessionToken = new google.maps.places.AutocompleteSessionToken();
      }

      const request: any = {
        input: query,
        includedRegionCodes: ['co'],
        locationBias: {
          north: bogotaBounds.north,
          south: bogotaBounds.south,
          west: bogotaBounds.west,
          east: bogotaBounds.east,
        }
      };

      if (this.sessionToken) {
        request.sessionToken = this.sessionToken;
      }

      if (google.maps.places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
        const response = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        this.ngZone.run(() => {
          if (response && response.suggestions && response.suggestions.length > 0) {
            this.suggestionsList = response.suggestions.map((s: any) => ({
              text: s.placePrediction?.text?.text || s.placePrediction?.mainText?.text || '',
              placePrediction: s.placePrediction
            })).filter((item: any) => item.text.length > 0);
          } else {
            this.suggestionsList = [];
          }
        });
      }
    } catch (error) {
      console.warn('Error fetching Places suggestions:', error);
      this.suggestionsList = [];
    }
  }

  async seleccionarSugerencia(sug: { text: string; placePrediction: any }) {
    const input = document.getElementById('txtDireccion') as HTMLInputElement;
    if (input) {
      input.value = sug.text;
    }
    this.suggestionsList = [];
    this.mostrarSelectorLocalidad = false;

    this.calculandoEnvio = true;
    this.mensajeDireccion = 'Calculando costo de envío en tiempo real...';

    try {
      if (sug.placePrediction && sug.placePrediction.toPlace) {
        const place = sug.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
        });

        const lat = place.location ? (typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat) : 0;
        const lng = place.location ? (typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng) : 0;

        this.sessionToken = null;

        if (place.addressComponents) {
          this.sincronizarSectorDesdeGoogle(place.addressComponents);
        }

        if (lat && lng) {
          this.destinoLat = lat;
          this.destinoLng = lng;
          this.consultarCostoEnvio({ lat, lng });
          return;
        }
      }
    } catch (err) {
      console.warn('Place fetchFields error, usando geocoder de respaldo:', err);
    }

    this.geocodificarDireccion(sug.text);
  }

  private sincronizarSectorDesdeGoogle(components: any[]) {
    if (!components) return;
    let barrio = '';
    let localidad = '';

    for (const comp of components) {
      const name = comp.longText || comp.long_name || comp.text || '';
      const types = comp.types || [];
      if (types.includes('neighborhood') && !barrio) {
        barrio = name;
      }
      if ((types.includes('sublocality_level_1') || types.includes('sublocality')) && !localidad) {
        localidad = name;
      }
    }

    if (barrio && localidad && barrio.toLowerCase() !== localidad.toLowerCase()) {
      this.zonaDetectada = `${barrio} (${localidad})`;
    } else if (barrio) {
      this.zonaDetectada = barrio;
    } else if (localidad) {
      this.zonaDetectada = localidad;
    } else {
      this.zonaDetectada = '';
    }

    const searchTarget = (barrio || localidad || '').toLowerCase();
    if (searchTarget) {
      const matchingSector = Object.keys(this.PRECIOS_ENVIO).find(sec =>
        sec.toLowerCase().includes(searchTarget)
      );
      const selectSector = document.getElementById('checkout_state_select') as HTMLSelectElement;
      if (selectSector && matchingSector) {
        selectSector.value = matchingSector;
      }
    }
  }

  geocodificarDireccion(direccion: string, callback?: (success: boolean) => void) {
    if (typeof google === 'undefined' || !google.maps) {
      if (callback) callback(false);
      return;
    }

    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    this.calculandoEnvio = true;
    this.mensajeDireccion = 'Calculando costo de envío en tiempo real...';

    const cleanAddress = direccion.toLowerCase().includes('bogot') ? direccion : `${direccion}, Bogotá, Colombia`;

    this.geocoder.geocode(
      {
        address: cleanAddress,
        bounds: bogotaBounds,
        componentRestrictions: { country: 'CO' }
      },
      (results: any, status: any) => {
        this.ngZone.run(() => {
          if (status === 'OK' && results && results.length > 0) {
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            this.destinoLat = lat;
            this.destinoLng = lng;

            this.sincronizarSectorDesdeGoogle(results[0].address_components);

            this.consultarCostoEnvio({ lat, lng }, () => {
              if (callback) callback(true);
            });
          } else {
            console.warn('⚠️ Google Geocoder no pudo ubicar la dirección exacta:', status);
            this.calculandoEnvio = false;
            this.mostrarSelectorLocalidad = true;
            const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
            const localidad = selectLocalidad?.value;
            if (localidad && this.PRECIOS_ENVIO[localidad]) {
              this.aplicarTarifaFijaDeLocalidad();
              if (callback) callback(true);
            } else {
              this.direccionValida = false;
              this.mensajeDireccion = 'Por favor selecciona tu sector/localidad de la lista.';
              if (callback) callback(false);
            }
          }
        });
      }
    );
  }

  processOrder() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.calculandoEnvio) {
      alert('Estamos calculando el costo de tu envío. Por favor espera un segundo.');
      return;
    }

    const inputDireccion = document.getElementById('txtDireccion') as HTMLInputElement;
    const direccionText = inputDireccion?.value?.trim() || '';

    if (!direccionText || direccionText.length < 5) {
      alert('Por favor, ingresa tu dirección de entrega.');
      inputDireccion?.focus();
      return;
    }

    // Si aún no tenemos coordenadas GPS reales y tampoco se calculó el costo con una localidad manual:
    if (!this.destinoLat || !this.destinoLng) {
      const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
      const localidad = selectLocalidad?.value || '';

      this.geocodificarDireccion(direccionText, (success) => {
        if (success && this.costoEnvio > 0) {
          this.continuarProcesoOrden();
        } else if (localidad && this.PRECIOS_ENVIO[localidad]) {
          this.aplicarTarifaFijaDeLocalidad();
          this.continuarProcesoOrden();
        } else {
          this.mostrarSelectorLocalidad = true;
          alert('Por favor selecciona tu localidad de la lista para calcular el costo de tu envío.');
          document.getElementById('checkout_state_select')?.focus();
        }
      });
      return;
    }

    if (!this.direccionValida || this.costoEnvio <= 0) {
      alert('Por favor, confirma una dirección válida para calcular el envío.');
      inputDireccion?.focus();
      return;
    }

    this.continuarProcesoOrden();
  }

  private continuarProcesoOrden() {
    if (!this.telefonoValido || !this.iti) {
      alert('Por favor, ingresa un número celular válido.');
      (document.querySelector('#checkout_phonenumber') as HTMLElement)?.focus();
      return;
    }

    this.telefonoFinal = this.iti.getNumber();
    let direccionFinal = (
      document.getElementById('txtDireccion') as HTMLInputElement
    ).value.trim();

    const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
    const localidad = selectLocalidad?.value || '';
    if (localidad && !direccionFinal.toLowerCase().includes(localidad.toLowerCase())) {
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
      productos: this.activeCartItems,
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
      : 'Cliente Koky';

    let deliveryWindowTag = 'MAÑANA';
    let notesPrefix = '';

    if (this.isDoubleDeliveryActive) {
      deliveryWindowTag = 'DOBLE_DESPACHO_HOY_MANANA';
      notesPrefix = '[DOBLE DESPACHO: 1 Hoy + 1 Mañana] ';
    } else if (this.isMixedDelivery && this.consolidarEnManana) {
      deliveryWindowTag = 'MAÑANA_CONSOLIDADA';
      notesPrefix = '[ENTREGA CONSOLIDADA MAÑANA (Tofu Semiduro elaborado fresco esta noche)] ';
    } else if (this.isMixedDelivery && this.omitirManana) {
      deliveryWindowTag = 'HOY';
      notesPrefix = '[DESPACHO HOY (Lote de mañana omitido por cliente)] ';
    } else if (this.hasTodayItems && !this.hasTomorrowItems) {
      deliveryWindowTag = 'HOY';
    }

    const orderData = {
      whatsapp_id: String(orden.cliente.telefono),
      customer_name: nombreParaStrapi,
      total_amount: Number(orden.pago.total),
      wompi_reference: String(referencia),
      source: String(this.detectedSource || 'whatsapp'),
      items: orden.productos,
      payment_method: 'PENDING',
      delivery_window: deliveryWindowTag,
      shipping_address: String(orden.cliente.direccion),
      shipping_latitude: Number(this.destinoLat),
      shipping_longitude: Number(this.destinoLng),
      shipping_notes: `${notesPrefix}${orden.cliente.notes || ''}`.trim(),
    };

    console.log('🚀 Pre-creando orden en Strapi:', orderData);

    this.orderService.createOrder(orderData).subscribe({
      next: (orderRes: any) => {
        console.log('✅ Orden pre-creada con éxito en Strapi:', orderRes);
        this.orderService.getWompiSignature(referencia, amountInCents, 'COP').subscribe({
          next: (res: any) => {
            const signatureHex = res.signature;
            this.iniciarWompiWidget(orden, referencia, amountInCents, signatureHex);
          },
          error: (err) => {
            console.error('❌ Error al obtener la firma de Wompi desde el backend:', err);
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

  consultarCostoEnvio(destino: { lat: number; lng: number }, onComplete?: () => void) {
    this.calculandoEnvio = true;
    this.mensajeDireccion = 'Calculando costo de envío en tiempo real...';

    this.deliveryService.calcularEnvio(destino).subscribe({
      next: (res) => {
        this.calculandoEnvio = false;
        if (res.success) {
          const rawAmount = res.data.deliveries[0].estimation.price.amount;
          this.baseDeliveryPrice = rawAmount;
          this.costoEnvio = this.isDoubleDeliveryActive ? rawAmount * 2 : rawAmount;
          this.calculateTotal();
          this.direccionValida = true;
          this.mensajeDireccion = this.isDoubleDeliveryActive
            ? 'Dirección válida (Doble despacho calculado con Cabify) ✔'
            : 'Dirección y costo de envío verificados ✔';
        } else {
          this.mostrarSelectorLocalidad = true;
          this.aplicarTarifaFijaDeLocalidad();
        }
        if (onComplete) onComplete();
      },
      error: (err) => {
        console.error('Error al calcular envío:', err);
        this.calculandoEnvio = false;
        this.mostrarSelectorLocalidad = true;
        this.aplicarTarifaFijaDeLocalidad();
        if (onComplete) onComplete();
      },
    });
  }

  aplicarTarifaFijaDeLocalidad() {
    const selectLocalidad = document.getElementById('checkout_state_select') as HTMLSelectElement;
    const localidad = selectLocalidad?.value || '';
    const baseCost = localidad && this.PRECIOS_ENVIO[localidad]
      ? this.PRECIOS_ENVIO[localidad]
      : this.PRECIOS_ENVIO['DEFAULT'];

    this.baseDeliveryPrice = baseCost;
    this.costoEnvio = this.isDoubleDeliveryActive ? baseCost * 2 : baseCost;
    this.direccionValida = true;
    this.mensajeDireccion = this.isDoubleDeliveryActive
      ? 'Dirección válida (Doble despacho de contingencia aplicado) ✔'
      : (localidad ? `Tarifa fija (${localidad}) aplicada ✔` : 'Tarifa estándar aplicada ✔');
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
      if (!this.destinoLat || !this.destinoLng) {
        this.zonaDetectada = localidad;
        const baseCost = this.PRECIOS_ENVIO[localidad] || this.PRECIOS_ENVIO['DEFAULT'];
        this.baseDeliveryPrice = baseCost;
        this.costoEnvio = this.isDoubleDeliveryActive ? baseCost * 2 : baseCost;
        this.direccionValida = true;
        this.mensajeDireccion = this.isDoubleDeliveryActive
          ? `Localidad ${localidad} (Doble despacho) ✔`
          : `Localidad ${localidad} seleccionada ✔`;
        this.calculateTotal();
      }
    }
  }

  getLocalidades(): string[] {
    return Object.keys(this.PRECIOS_ENVIO).filter(k => k !== 'DEFAULT');
  }
}
