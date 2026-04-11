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













@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SlickCarouselModule,
    FormsModule,
    RouterLink,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  private isSyncing = false;
  cs = inject(ComingSoonService);
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
  

bannerSliderConfig = {
  infinite: true,
autoplay: false,
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
autoplay: false,
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
autoplay: false,
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
  infinite: false,
  slidesToShow: 1,
  slidesToScroll: 1,
autoplay: false,
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
  { iconClass: 'icofont icofont-bbq', title: 'Tofu Ahumado', slug: 'tofu-seco-ahumado' },
  { iconClass: 'icofont icofont-wave', title: 'Tofu en Hojas', slug: 'tofu-hoja' },
  { iconClass: 'icofont icofont-sausage', title: 'Rollo Ahumado', slug: 'tofu-rollo-ahumado' },
  { iconClass: 'icofont icofont-popcorn', title: 'Tofu Frito', slug: 'tofu-frito' },
  { iconClass: 'icofont icofont-milk', title: 'Leche de Soya', slug: 'leche-de-soya' },
  { iconClass: 'icofont icofont-asparagus', title: 'Nata de Soya', slug: 'nata-de-soya' }
];



  tofuTypesList = [
    { name: 'Tofu Blando', link: '#', quantity: 340, unit: 'G', selectedQuantity: 340 },
    { name: 'Tofu Seco', link: '#', quantity: 500, unit: 'G', selectedQuantity: 500 },
    { name: 'Tofu Ahumado', link: '#', quantity: 500, unit: 'G', selectedQuantity: 500 },
    { name: 'Tofu en Hojas', link: '#', quantity: 500, unit: 'G', selectedQuantity: 500 },
    { name: 'Tofu Rollo Ahumado', link: '#', quantity: 1, unit: 'Unidad', selectedQuantity: 1 }
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
  // --- INICIALIZACIÓN BÁSICA ---


  // --- EJECUCIÓN DE CARGAS ---
  this.loadProducts();
  this.loadRecipes();
  this.loadAboutData();
  this.loadHeroSlides();
  this.loadHeroBackground();
  this.loadTestimonials();
  this.loadSameDayOffer(); // ← Nueva integración
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
      this.cdr.detectChanges();
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
      // Llama slickPlay() directamente en cada instancia
      this.slickBanner?.slickPlay();
      this.slickFeatures?.slickPlay();
      this.slickProducts?.slickPlay();
      this.slickPartners?.slickPlay();
      this.testimonialImgCarousel?.slickPlay();
      this.testimonialTextCarousel?.slickPlay();
    });
  });
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
    unitAbbreviation: product.unitAbbreviation
  };

  this.cartService.addToCart(itemToCart);
  this.notify.showSuccess(`¡${itemToCart.name} añadido!`, 'Sigue comprando');
}
setSeoData(): void {
    const title = 'Koky Food | Tofu Artesanal y Derivados de Soya Frescos';
    const description = 'Disfruta el tofu más fresco de Bogotá, hecho diariamente. Tofu ahumado, firme, blando y nata de soya 100% natural y orgánica.';
    const url = 'https://tu-dominio.com'; // Cambia por tu URL real
    const imageUrl = 'https://res.cloudinary.com/jonathan-barrios/image/upload/v1774915337/logo-seo.jpg';

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
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: imageUrl }
    ]);
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
}