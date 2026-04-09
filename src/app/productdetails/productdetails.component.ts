import { Component, OnInit, AfterViewChecked, Renderer2, Inject, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router'; 
import { ProductService } from '../services/product/product.service'; 
import { CartService, CartItem} from '../services/cart/cart.service';
import { NotificationService } from '../services/notification/notification.service';
import { Title, Meta } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

declare var $: any;

@Component({
  selector: 'app-productdetails',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productdetails.component.html',
  styleUrl: './productdetails.component.css'
})
export class ProductdetailsComponent implements OnInit, AfterViewChecked {
  product: any = null; 
  productItems: any[] = [];
  private slickInicializado = false;

  constructor(
    private cartService: CartService,
    private route: ActivatedRoute,
    private productService: ProductService,
    private renderer: Renderer2,
    private el: ElementRef,
    private notify: NotificationService,
    private titleService: Title, // 2. INYECTA AQUÍ
    private metaService: Meta,   // 3. INYECTA AQUÍ
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.cargarEstilosSlick();

    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        // RESET TOTAL: Limpiamos datos y bandera para que el HTML se vacíe
        this.productItems = [];
        this.slickInicializado = false;
        
        this.obtenerDetallesPorSlug(slug);
        this.cargarRelacionados(slug);
        
       if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

ngAfterViewChecked(): void {
  if (isPlatformBrowser(this.platformId)) {
    // Solo inicializa si hay items Y si no se ha inicializado ya
    if (this.productItems && this.productItems.length > 0 && !this.slickInicializado) {
      this.inicializarSlickNativo();
    }
  }
}

 private cargarRelacionados(slug: string) {
  this.productService.getRelatedProducts(slug).subscribe({
    next: (items) => {
      this.productItems = items;
      this.slickInicializado = false; // <--- IMPORTANTE: Permitir re-inicializar
    },
    error: (err) => console.error('Error cargando relacionados', err)
  });
}

obtenerDetallesPorSlug(slug: string) {
  this.productService.getProductBySlug(slug).subscribe({
    next: (res: any) => {
      this.product = res;

      if (this.product) {
        // 1. Título: Prioridad al metaTitle de Strapi, si no, usa el name
        const finalTitle = this.product.metaTitle || `${this.product.name} | Koky Food`;
        this.titleService.setTitle(finalTitle);

        // 2. Descripción: Prioridad al metaDescription de Strapi, si no, usa shortDescription o genérico
        const finalDesc = this.product.metaDescription || 
                          this.product.shortDescription || 
                          `Compra ${this.product.name} artesanal en Bogotá. Proteína vegetal de alta calidad.`;
        
        this.metaService.updateTag({ name: 'description', content: finalDesc });

        // 3. Redes Sociales (Open Graph)
        this.metaService.updateTag({ property: 'og:title', content: finalTitle });
        this.metaService.updateTag({ property: 'og:description', content: finalDesc });

        // 4. Imagen para compartir (usando el campo 'image' de tu schema)
        // Nota: Asegúrate de que res.image contenga la URL (a veces Strapi requiere res.image.url)
        if (this.product.image) {
          const imageUrl = typeof this.product.image === 'string' 
                           ? this.product.image 
                           : (this.product.image.url || '');
          if (imageUrl) {
            this.metaService.updateTag({ property: 'og:image', content: imageUrl });
          }
        }
      }
    },
    error: (err: any) => console.error('Error cargando producto', err)
  });
}

private inicializarSlickNativo() {
    // 1. Verificación de plataforma (SSR vs Browser)
    if (!isPlatformBrowser(this.platformId)) {
        return;
    }

    // 2. Selección del elemento en el DOM de Angular
    const slider = $(this.el.nativeElement).find('.product-slider');

    // 3. Control de seguridad: No inicializar si no hay elementos o si ya se está inicializando
    if (slider.length === 0 || this.slickInicializado) {
        return; 
    }

    // Bloqueamos inmediatamente para evitar que ngAfterViewChecked dispare otra ejecución
    this.slickInicializado = true;

    setTimeout(() => {
        // 4. Limpieza preventiva: Si Slick ya estaba montado por un renderizado previo, lo destruimos
        if (slider.hasClass('slick-initialized')) {
            try {
                slider.slick('unslick');
            } catch (e) {
                console.warn("Error al hacer unslick, continuando...", e);
            }
        }

        // 5. Configuración final del Carrusel
        slider.slick({
            infinite: true,
            slidesToShow: 4,
            slidesToScroll: 1, // Reducido a 1 para mejor estabilidad visual
            autoplay: true,
            autoplaySpeed: 3000,
            arrows: true,
            dots: false,
            // Opcional: Asegura que los iconos de icofont se vean en las flechas
            prevArrow: '<button type="button" class="slick-prev"><i class="icofont-rounded-left"></i></button>',
            nextArrow: '<button type="button" class="slick-next"><i class="icofont-rounded-right"></i></button>',
            responsive: [
                {
                    breakpoint: 1500,
                    settings: { slidesToShow: 4 }
                },
                {
                    breakpoint: 1201,
                    settings: { slidesToShow: 3 }
                },
                {
                    breakpoint: 992,
                    settings: { slidesToShow: 2 }
                },
                {
                    breakpoint: 600,
                    settings: { slidesToShow: 1 }
                }
            ]
        });

        console.log("✅ Carrusel KOKY sincronizado con RSS");
    }, 150); // Un delay corto es suficiente para que el *ngFor termine de pintar
}

  private cargarEstilosSlick() {
    
   if (!isPlatformBrowser(this.platformId)) return;
    // ... resto del código

    const head = this.document.head;
    const styles = [
      { id: 'slick-core', href: 'assets/css/slick.css' },
      { id: 'slick-theme', href: 'assets/css/slick-theme.css' }
    ];
    styles.forEach(style => {
      if (!this.document.getElementById(style.id)) {
        const link = this.renderer.createElement('link');
        link.id = style.id;
        this.renderer.setAttribute(link, 'rel', 'stylesheet');
        this.renderer.setAttribute(link, 'href', style.href);
        this.renderer.appendChild(head, link);
      }
    });
  }

 addToCart(product: any) {
  if (!product) return;

  // 1. Extraemos la URL de la imagen de forma segura
  // Strapi a veces envía el objeto { url: '...' } y otras solo el string
  const imageUrl = typeof product.image === 'string' 
    ? product.image 
    : (product.image?.url || 'assets/img/no-image.png'); // Imagen por defecto si falla

  const itemToCart: CartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: imageUrl, // <-- Usamos la URL limpia aquí
    slug: product.slug,
    contentPerUnit: product.contentPerUnit,
    unitAbbreviation: product.unitAbbreviation
  };

  this.cartService.addToCart(itemToCart);
  this.notify.showSuccess(`¡${itemToCart.name} añadido al carrito!`, 'KOKY');
}
}