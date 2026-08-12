import { Component, OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, ChangeDetectorRef, ApplicationRef, inject } from '@angular/core';
import { SlickCarouselModule, SlickCarouselComponent } from 'ngx-slick-carousel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeroService } from '../services/home/hero/hero.service';
import { AboutService } from '../services/home/about/about.service';
import { StrapiMedia5 } from '../models/product.model';
import { ProductService } from '../services/product/product.service'; // Ajusta la ruta si es necesario
import { Product } from '../models/product.model';
import { BannerSlide } from '../models/home.model'; // O la ruta donde guardaste BannerSlide
import { RecipeService } from '../services/blog/blog.service';
import { RouterLink, RouterModule } from '@angular/router';
import { Recipe } from '../models/blog.model';
import { CartService, CartItem} from '../services/cart/cart.service';
import { NotificationService } from '../services/notification/notification.service'
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { Inject, PLATFORM_ID } from '@angular/core'; // Añade estos
import { isPlatformBrowser } from '@angular/common'; // Asegúrate de que esté
import { Title, Meta, } from '@angular/platform-browser';
import { NgZone } from '@angular/core';
import { filter, take } from 'rxjs'
import { ComingSoonService } from '../services/coming-soon/coming-soon.service';
import { FoodScannerComponent } from '../food-scanner/food-scanner.component';
import { getDynamicAnnouncementText } from '../utils/delivery-helper';
import { FaqService } from '../services/faq/faq.service';














@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SlickCarouselModule,
    FormsModule,
    RouterLink,
    RouterModule,
    FoodScannerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  private isSyncing = false;
  cs = inject(ComingSoonService);
  faqService = inject(FaqService);
  faqs: any[] = [];
  categories: any[] = [
    { name: 'Envíos y Compras', icon: 'icofont-delivery-time', items: [] },
    { name: 'Nutrición y Dieta', icon: 'icofont-heart-beat', items: [] },
    { name: 'Salud y Digestión', icon: 'icofont-medical-sign', items: [] },
    { name: 'Cocina y Conservación', icon: 'icofont-restaurant', items: [] },
    { name: 'Preguntas Generales', icon: 'icofont-question-circle', items: [] }
  ];
  activeCategoryIndex = 0;
    @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;
 
    @ViewChild('slickBanner') slickBanner!: SlickCarouselComponent;
@ViewChild('slickProducts') slickProducts!: SlickCarouselComponent;
@ViewChild('slickPartners') slickPartners!: SlickCarouselComponent;
@ViewChild('slickModalTestimonialImg') testimonialImgCarousel!: SlickCarouselComponent;
@ViewChild('slickModalTestimonialText') testimonialTextCarousel!: SlickCarouselComponent;
@ViewChild('slickFeatures') slickFeatures!: SlickCarouselComponent;
    bannerSlides: BannerSlide[] = [];
    aboutData: any;
    products: Product[] = [];
    extraPhotos: StrapiMedia5[] = [];
    heroBackgroundImage: string = '';  // Para la sección del Hero
    aboutBackgroundImage: string = ''; // Para la sección de Nosotros (About)
    leftRecipes: Recipe[] = []; 
    rightRecipes: Recipe[] = [];
    isBrowser = false;
    testimonialImageItems: any[] = [];
    testimonialTextItems: any[] = [];
    googleReviews: any[] = []; // 👈 Guarda las reseñas reales de Google Maps
    showDeliveryModal = false; // Controla la visibilidad del modal de delivery
    dynamicDeliveryText = ''; // Guarda el texto dinámico calculado de envíos

  

bannerSliderConfig = {
  infinite: true,
  autoplay: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplaySpeed: 6000,
  arrows: false,
  dots: true,
};

sliderConfig = {
  infinite: false,
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 2000,
  arrows: false,
  dots: true,
  responsive: [
    { breakpoint: 1500, settings: { slidesToShow: 4, infinite: true } },
    { breakpoint: 1201, settings: { slidesToShow: 3, dots: true } },
    { breakpoint: 991,  settings: { slidesToShow: 2, dots: true } },
    { breakpoint: 600,  settings: { slidesToShow: 1, dots: true } },
    { breakpoint: 300,  settings: { slidesToShow: 1, dots: true } }
  ]
};

partnerSliderConfig = {
  infinite: false,
  slidesToShow: 5,
  slidesToScroll: 2,
autoplay: false,
  autoplaySpeed: 2000,
  arrows: true,
  responsive: [
    { breakpoint: 1500, settings: { slidesToShow: 4, infinite: true } },
    { breakpoint: 1201, settings: { slidesToShow: 3, dots: true } },
    { breakpoint: 991,  settings: { slidesToShow: 2, dots: true, arrows: false } },
    { breakpoint: 600,  settings: { slidesToShow: 2, dots: true, arrows: false } }
  ]
};

productSliderConfig = {
  infinite: false,
  slidesToShow: 5,
  slidesToScroll: 2,
autoplay: false,
  autoplaySpeed: 2000,
  arrows: true,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 3, infinite: true } },
    { breakpoint: 600,  settings: { slidesToShow: 2, dots: true } },
    { breakpoint: 300,  settings: 'unslick' }
  ]
};

testimonialImgConfig = {
  speed: 500,
  arrows: false,
  autoplay: true,
  autoplaySpeed: 2000,
  slidesToShow: 1,
  slidesToScroll: 1,
  centerMode: true,
  centerPadding: '0px',
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 1, slidesToScroll: 1, centerMode: true, focusOnSelect: true, centerPadding: '0px' } },
    { breakpoint: 768,  settings: { slidesToShow: 1, slidesToScroll: 1, centerMode: true, focusOnSelect: true, centerPadding: '0px' } },
    { breakpoint: 575,  settings: { slidesToShow: 1, slidesToScroll: 1, centerMode: true, focusOnSelect: true, centerPadding: '0px' } }
  ]
};

testimonialTextConfig = {
  infinite: true,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 2000,
  arrows: true,
  centerPadding: '0px',
  dots: false,
  speed: 1000,
  prevArrow: '<i class="icofont-double-right"></i>',
  nextArrow: '<i class="icofont-double-left"></i>',
  responsive: [
    { breakpoint: 991, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    { breakpoint: 767, settings: { slidesToShow: 1, slidesToScroll: 1 } }
  ]
};
 

featureItems = [
  { iconClass: 'icofont icofont-cheese', title: 'Tofu Blando', slug: 'tofu-blando' },
  { iconClass: 'icofont icofont-bricks', title: 'Tofu Seco', slug: 'tofu-firme' },
  { iconClass: 'icofont icofont-bbq', title: 'Tofu Ahumado', slug: 'tofu-firme-ahumado' },
  { iconClass: 'icofont icofont-wave', title: 'Tofu en Hojas', slug: 'tofu-hoja' },
  { iconClass: 'icofont icofont-sausage', title: 'Rollo Ahumado', slug: 'tofu-rollo-ahumado' },
  { iconClass: 'icofont icofont-popcorn', title: 'Tofu Frito', slug: 'tofu-frito' },
  { iconClass: 'icofont icofont-milk', title: 'Leche de Soya', slug: 'leche-de-soya' },
  { iconClass: 'icofont icofont-asparagus', title: 'Nata de Soya', slug: 'nata-de-soya' }
];



  tofuTypesList = [
    { name: 'Tofu Semiduro', link: '#', quantity: 0, unit: 'G', selectedQuantity: 0 },
    { name: 'Tofu Seco', link: '#', quantity: 0, unit: 'G', selectedQuantity: 0 },
    { name: 'Tofu Ahumado', link: '#', quantity: 0, unit: 'G', selectedQuantity: 0 },
    { name: 'Tofu en Hojas', link: '#', quantity: 0, unit: 'G', selectedQuantity: 0 },
    { name: 'Rollo Ahumado', link: '#', quantity: 0, unit: 'Unidad', selectedQuantity: 0 }
  ];

  // --- Propiedades para el Reproductor de Video ---
  videoList: string[] = [
    'https://storage.googleapis.com/kokyfood/tofudplatos.mp4',
   
  ];
  currentVideoIndex: number = 0;

  get currentVideoUrl(): string {
    return this.videoList[this.currentVideoIndex];
  }

  sameDayProduct = {
    name: 'Tofu Fresco del Día',
    quantity: '',
    unit: 'Disponible para',
    deliveryMessage: '¡Entregar Hoy Mismo!',
    linkText: 'VER DISPONIBLES AHORA',
    linkUrl: '#'
  };

  
  
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private heroService: HeroService,
    private aboutService: AboutService,
    private productService: ProductService,
    private recipeService: RecipeService,
    private cartService: CartService,
    private notify: NotificationService,
    private route: ActivatedRoute,
    private titleService: Title, // <--- Añadir esto
    private metaService: Meta,     // <--- Añadir esto
     private ngZone: NgZone,
     private appRef: ApplicationRef,
    
    
  ) { this.isBrowser = isPlatformBrowser(this.platformId);}

mensajeActual: any;
ngOnInit(): void {
  this.dynamicDeliveryText = getDynamicAnnouncementText();
  // 1. Verificación inicial de seguridad

  if (this.isBrowser) {
    // Como main.ts ya limpió la URL, solo nos aseguramos de que el servicio esté al día
    setTimeout(() => {
    this.cs.revalidate();
  }, 100);
    // Si el popup debe verse, forzamos el renderizado inmediato para evitar parpadeos
    if (this.cs.visible()) {
      this.cdr.detectChanges();
    }
  }

  // --- 2. CARGA CRÍTICA (Hero y visuales inmediatos) ---
  this.loadHeroSlides();
  this.loadHeroBackground();

  // --- 3. CARGA DIFERIDA (Para no bloquear el hilo principal) ---
  setTimeout(() => {
    this.loadRecipes();
    this.loadProducts();
    this.loadAboutData();
    this.loadGoogleReviews(); // 👈 Reemplaza carga de testimonios viejos por reviews de Google
    this.loadSameDayOffer();
    this.loadFaqs();
    
    // Una última comprobación de UI por si hubo cambios durante la carga
    if (this.isBrowser && this.cs.visible()) {
      this.cdr.detectChanges();
    }
    
    console.log('🚀 Koky Food: Carga de datos completada.');
  }, 100);
}

/**
 * NUEVO: Carga la oferta de Tofu del día desde Strapi
 */
private loadSameDayOffer(): void {
  this.aboutService.getSameDayOffer().subscribe({
    next: (data) => {
      if (data) {
        // Mapeamos los atributos de Strapi al objeto local
        // Usamos los valores actuales como respaldo (fallback) si falta algún campo
        this.sameDayProduct = {
          name: data.name || this.sameDayProduct.name,
          quantity: data.quantity || this.sameDayProduct.quantity,
          unit: data.unit || this.sameDayProduct.unit,
          deliveryMessage: data.deliveryMessage || this.sameDayProduct.deliveryMessage,
          linkText: data.linkText || this.sameDayProduct.linkText,
          linkUrl: data.linkUrl || this.sameDayProduct.linkUrl
        };
        console.log('✅ Oferta SameDay cargada:', this.sameDayProduct);
        this.cdr.detectChanges();
      }
    },
    error: (err) => console.error('❌ Error cargando Tofu del día:', err)
  });
}

/**
 * 1. PRODUCTOS
 */
private loadProducts(): void {
  this.productService.getProducts().subscribe({
    next: (data) => {
      this.products = data;
      console.log('✅ PRODUCTOS CARGADOS:', this.products);
      this.cdr.detectChanges();
    },
    error: (err: any) => console.error('Error cargando productos:', err)
  });
}

/**
 * 2. RECETAS
 */
private loadRecipes(): void {
  this.recipeService.getRecipes().subscribe({
    next: (recetas: Recipe[]) => {
      this.leftRecipes = recetas.filter(r => r.position === 'left');
      this.rightRecipes = recetas.filter(r => r.position === 'right');
      console.log('✅ Recetas cargadas:', recetas.length);
      
      // Forzamos el refresco en el siguiente ciclo
      setTimeout(() => {
        this.cdr.markForCheck(); // Si usas OnPush
        this.cdr.detectChanges(); // Si usas Default
      }, 0);
    },
    error: (err) => console.error('❌ Error en Recetas:', err)
  });
}

/**
 * 3. SECCIÓN ABOUT (Nosotros)
 */
private loadAboutData(): void {
  this.aboutService.getAll().subscribe({
    next: (res) => {
      if (res.data && res.data.length > 0) {
        const raw = res.data[0];
        const attrs = raw.attributes || raw;

        const getUrlFromArray = (field: any) => {
          const data = field?.data || field;
          if (Array.isArray(data) && data.length > 0) {
            const file = data[0].attributes || data[0];
            const path = file.url;
            return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
          }
          return '';
        };

        this.aboutBackgroundImage = getUrlFromArray(attrs.backgroundImage);
        this.aboutData = {
          ...attrs,
          title: 'El mejor tofu de Bogotá',
          iconImage: { url: getUrlFromArray(attrs.icon) }
        };

        console.log('✅ About cargado');
        this.cdr.detectChanges();
      }
    },
    error: (err) => console.error('Error en About:', err)
  });
}

/**
 * 4. SECCIÓN HERO (Slides)
 */
private loadHeroSlides(): void {
  this.heroService.getHeroData().subscribe({
    next: (response: any) => {
      if (response && response.data) {
        this.bannerSlides = response.data.map((item: any) => ({
          id: item.id,
          ...item.attributes,
          ...item
        }));
        console.log('✅ Slides cargados:', this.bannerSlides.length);
        this.cdr.detectChanges();
      }
    },
    error: (err: any) => console.error('Error cargando slides:', err)
  });
}

/**
 * 5. SECCIÓN HERO (Fondo)
 */
private loadHeroBackground(): void {
  this.heroService.getHeroImage().subscribe({
    next: (res: any) => {
      const item = res?.data?.[0];
      const imgData = item?.heroImage || item?.attributes?.heroImage;
      const path = imgData?.url;

      if (path) {
        this.heroBackgroundImage = path.startsWith('http')
          ? path
          : `${environment.apiUrl}${path}`;
      }
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error fondo Hero:', err)
  });
}

openFounderRegistration() {
    this.notify.showFounderRegistration();
  }
ngAfterViewInit(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  this.cdr.detectChanges();

  // Video fuera de zona
  this.ngZone.runOutsideAngular(() => {
    if (this.videoPlayerRef?.nativeElement) {
      this.videoPlayerRef.nativeElement.muted = true;
      this.videoPlayerRef.nativeElement.play().catch((err: any) =>
        console.warn('Autoplay bloqueado:', err)
      );
    }
  });

  // Activar autoplay manualmente en las instancias de slick
this.appRef.isStable.pipe(
  filter((stable: boolean) => stable),
  take(1)
).subscribe(() => {
  this.ngZone.runOutsideAngular(() => {
    // Validamos que la referencia exista Y que el componente esté inicializado
    if (this.slickBanner?.initialized) this.slickBanner.slickPlay();
    if (this.slickFeatures?.initialized) this.slickFeatures.slickPlay();
    if (this.slickProducts?.initialized) this.slickProducts.slickPlay();
    if (this.slickPartners?.initialized) this.slickPartners.slickPlay();
    if (this.testimonialImgCarousel?.initialized) this.testimonialImgCarousel.slickPlay();
    if (this.testimonialTextCarousel?.initialized) this.testimonialTextCarousel.slickPlay();
  });
});

  // Observador de scroll para animaciones en la sección "¿Cómo Funciona?"
  // Usamos un retraso de 500ms para asegurar que la hidratación de Angular haya finalizado
  // y estemos observando el elemento DOM real y definitivo en el navegador.
  setTimeout(() => {
    this.ngZone.runOutsideAngular(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const section = document.querySelector('.how-it-works-section');
            if (section) {
              section.classList.add('animate-in');
            }
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15 // Umbral original que funcionaba bien
      });

      const targetElement = document.querySelector('.how-it-works-section');
      if (targetElement) {
        observer.observe(targetElement);
      }
    });
  }, 500);

  // Auto-despliegue del modal de delivery en la carga inicial (una vez por sesión)
  if (typeof window !== 'undefined') {
    const shown = sessionStorage.getItem('koky_delivery_modal_shown');
    if (shown !== 'true') {
      setTimeout(() => {
        this.openDeliveryModal();
        sessionStorage.setItem('koky_delivery_modal_shown', 'true');
      }, 1500); // 1.5 segundos de retardo tras la carga inicial
    }
  }
}

openDeliveryModal() {
  this.showDeliveryModal = true;
}

closeDeliveryModal() {
  this.showDeliveryModal = false;
}

  // --- Métodos para el control de cantidad ---
  incrementQuantity(item: any, event: Event) {
    event.preventDefault();
    if (item.selectedQuantity < item.quantity) {
      item.selectedQuantity++;
      console.log(`Cantidad de ${item.name}: ${item.selectedQuantity}`);
    } else {
      alert(`Solo hay ${item.quantity} ${item.unit} de ${item.name} disponible.`);
    }
  }

  decrementQuantity(item: any, event: Event) {
    event.preventDefault();
    if (item.selectedQuantity > 1) {
      item.selectedQuantity--;
      console.log(`Cantidad de ${item.name}: ${item.selectedQuantity}`);
    }
  }

  onQuantityChange(item: any) {
    if (item.selectedQuantity < 1 || isNaN(item.selectedQuantity)) {
      item.selectedQuantity = 1;
    }
    if (item.selectedQuantity > item.quantity) {
      item.selectedQuantity = item.quantity;
      alert(`Solo hay ${item.quantity} ${item.unit} de ${item.name} disponible.`);
    }
    console.log(`Cantidad de ${item.name} cambiada a: ${item.selectedQuantity}`);
  }

  placeOrder() {
    const itemsToOrder = this.tofuTypesList.filter(item => item.selectedQuantity > 0);
    if (itemsToOrder.length > 0) {
      console.log('Productos seleccionados para ordenar:');
      itemsToOrder.forEach(item => {
        console.log(`- ${item.name}: ${item.selectedQuantity} ${item.unit}`);
      });
      alert('¡Pedido realizado con éxito! Revisa la consola para ver los detalles.');
    } else {
      alert('Por favor, selecciona al menos un producto para ordenar.');
    }
  }

  scrollToOrderCard() {
    const element = document.getElementById('productos-same-day');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // --- Método para el reproductor de video ---
  onVideoEnded(event: Event) {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement) {
      this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videoList.length;
      videoElement.play().catch(error => {
        console.warn('Advertencia al intentar reproducir el siguiente video automáticamente:', error);
      });
    }
  }
addToCart(product: any) {
  if (!product) return;

  // No necesitamos strapiUrl, ni concatenar nada.
  // Si el servicio hizo su trabajo, product.image YA ES la URL correcta.
  
  const itemToCart: CartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.image, // <--- USA LO QUE YA VIENE EN EL OBJETO
    slug: product.slug,
    contentPerUnit: product.contentPerUnit,
    unitAbbreviation: product.unitAbbreviation,
    availableToday: product.availableToday
  };

  this.cartService.addToCart(itemToCart);
  this.notify.showSuccess(`¡${itemToCart.name} añadido!`, 'Sigue comprando');
}
setSeoData(): void {
    const title = 'Koky Food | Tofu Artesanal y Derivados de Soya Frescos';
    const description = 'Disfruta el tofu más fresco de Bogotá, hecho diariamente. Tofu ahumado, firme, blando y nata de soya 100% natural y orgánica.';
    const url = 'https://koky.food/';
    const imageUrl = 'https://koky.food/assets/img/512.png';

    this.titleService.setTitle(title);

    this.metaService.addTags([
        { name: 'description', content: description },
        { name: 'keywords', content: 'tofu bogota, tofu artesanal, comida vegana bogota, nata de soya, tofu ahumado' },
        
        // Open Graph (Facebook, WhatsApp)
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: imageUrl },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },

        // Twitter
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: imageUrl }
    ]);
}
navigateToProduct(slug: string, event: Event): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/productdetails/' + slug;
  }
}
handleBannerClick(url: string, event: Event): void {
   console.log('🔗 URL recibida:', JSON.stringify(url));
  if (!url) return;

  // 1. Caso Registro de Fundadores
  if (url.startsWith('trigger:founderRegistration')) {
    event.preventDefault();
     console.log('✅ Abriendo coming soon'); // ← verifica en consola
    this.openFounderRegistration();
    return;
  }

  // 2. Coming Soon
  if (url.startsWith('trigger:coming-soon')) {
    event.preventDefault();
    this.cs.open();
    return;
  }

  // 3. Caso Scroll
  if (url.startsWith('#')) {
    event.preventDefault();
    const targetId = url.substring(1);
    const element = document.getElementById(targetId);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      console.warn('No se encontró la sección con el id:', targetId);
    }
    return;
  }

  // 4. URLs externas (se manejarán por el href normal)
}
scrollToReviews(event: Event): void {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const element = document.getElementById('full-testimonial');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
private loadTestimonials(): void {
  this.aboutService.getTestimonials().subscribe({
    next: (data: any[]) => {
      if (data && data.length > 0) {
        // Llenamos las imágenes manteniendo tu estructura original
        this.testimonialImageItems = data.map(t => ({ 
          src: t.src, 
          alt: t.author 
        }));

        // Llenamos los textos manteniendo tu estructura original
        this.testimonialTextItems = data.map(t => ({
          quote: t.quote,
          author: t.author,
          role: t.role
        }));

        console.log('✅ Testimonios cargados y sincronizados');
        this.cdr.detectChanges();
      }
    },
    error: (err) => console.error('Error cargando testimonios:', err)
  });
}
private loadGoogleReviews(): void {
  this.aboutService.getGoogleReviews().subscribe({
    next: (data: any[]) => {
      // Filtrar destacados y limitar a un máximo de 4
      this.googleReviews = data
        .filter(r => r.featured !== false)
        .slice(0, 4);
      console.log('✅ GOOGLE REVIEWS CARGADAS:', this.googleReviews);
      this.cdr.detectChanges();
    },
    error: (err) => console.error('❌ Error cargando Google Reviews:', err)
  });
}
onTestimonialTextChange(event: any): void {
  if (this.isSyncing) return;
  this.isSyncing = true;
  this.testimonialImgCarousel?.slickGoTo(event.nextSlide);
  setTimeout(() => {
    this.testimonialImgCarousel?.slickPlay();
    this.isSyncing = false;
  }, 1100); // mayor que speed:1000
}

onTestimonialImgChange(event: any): void {
  if (this.isSyncing) return;
  this.isSyncing = true;
  this.testimonialTextCarousel?.slickGoTo(event.nextSlide);
  setTimeout(() => {
    this.testimonialTextCarousel?.slickPlay();
    this.isSyncing = false;
  }, 600); // mayor que speed:500
}
loadFaqs(): void {
    this.faqService.getFaqs().subscribe({
      next: (data) => {
        this.faqs = data.filter(f => f.active).map(f => ({ ...f, isOpen: false }));
        this.groupFaqs(this.faqs);
        console.log('✅ FAQS CARGADAS EN HOME:', this.faqs.length);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ Error cargando FAQs:', err)
    });
  }

  selectCategory(index: number): void {
    this.activeCategoryIndex = index;
  }

  toggleFaq(faq: any): void {
    this.categories[this.activeCategoryIndex].items.forEach((f: any) => {
      if (f !== faq) f.isOpen = false;
    });
    faq.isOpen = !faq.isOpen;
  }

  private groupFaqs(faqs: any[]): void {
    // Reset items to avoid duplicates on hot-reload
    this.categories.forEach(c => c.items = []);

    faqs.forEach(faq => {
      const topicLower = faq.topic.toLowerCase();
      
      if (
        topicLower.includes('envío') || 
        topicLower.includes('domicilio') || 
        topicLower.includes('comprar') || 
        topicLower.includes('dónde') || 
        topicLower.includes('donde') ||
        topicLower.includes('pago') ||
        topicLower.includes('colombia') ||
        topicLower.includes('bogotá')
      ) {
        this.categories[0].items.push(faq);
      } else if (
        topicLower.includes('pollo') || 
        topicLower.includes('proteína') || 
        topicLower.includes('proteina') || 
        topicLower.includes('peso') || 
        topicLower.includes('engorda') || 
        topicLower.includes('dieta') || 
        topicLower.includes('semana') || 
        topicLower.includes('veces')
      ) {
        this.categories[1].items.push(faq);
      } else if (
        topicLower.includes('sano') || 
        topicLower.includes('riñón') || 
        topicLower.includes('riñon') || 
        topicLower.includes('creatinina') || 
        topicLower.includes('barriga') || 
        topicLower.includes('efecto') || 
        topicLower.includes('alergia') || 
        topicLower.includes('soya') || 
        topicLower.includes('soja')
      ) {
        this.categories[2].items.push(faq);
      } else if (
        topicLower.includes('comer') || 
        topicLower.includes('sabor') || 
        topicLower.includes('conservar') || 
        topicLower.includes('dura') || 
        topicLower.includes('receta') || 
        topicLower.includes('cocinar')
      ) {
        this.categories[3].items.push(faq);
      } else {
        this.categories[4].items.push(faq);
      }
    });

    // Filtramos las categorías vacías para que no se muestren pestañas en blanco
    this.categories = this.categories.filter(c => c.items.length > 0);
    if (this.categories.length > 0) {
      this.activeCategoryIndex = 0;
    }
  }


  isHome(): boolean {
  if (!this.isBrowser) return false;
  // pathname NO contiene los parámetros de Instagram, por eso devolverá TRUE
  return window.location.pathname === '/home' || window.location.pathname === '/';
}
}