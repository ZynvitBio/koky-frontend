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
  activeImage: string = '';
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

  averageRating: number = 5.0;
  reviewCount: number = 0;
  reviews: Array<{ author: string, location: string, rating: number, date: string, comment: string }> = [];
  mostrarTodasLasResenas: boolean = false;

  get resenasVisibles(): any[] {
    if (this.mostrarTodasLasResenas) {
      return this.reviews;
    }
    return this.reviews.slice(0, 3);
  }

  toggleResenas(): void {
    this.mostrarTodasLasResenas = !this.mostrarTodasLasResenas;
  }

  obtenerDetallesPorSlug(slug: string) {
    this.productService.getProductBySlug(slug).subscribe({
      next: (res: any) => {
        this.product = res;

        if (this.product) {
          // Mantenemos la asignación de la imagen activa inicial
          this.activeImage = this.product.image;

          // Cargar reseñas e inyectar Schema JSON-LD para SEO & IAs
          this.cargarResenasPorSlug(slug);
          this.inyectarJsonLdProducto(this.product, slug);

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

  private cargarResenasPorSlug(slug: string): void {
    const database: Record<string, { rating: number, count: number, items: Array<{ author: string, location: string, rating: number, date: string, comment: string }> }> = {
      'tofu-blando': {
        rating: 4.9,
        count: 12,
        items: [
          { author: 'Camila R.', location: 'Usme / Chapinero', rating: 5, date: 'hace 2 días', comment: 'Increíble consistencia para dorar a la plancha. No se desbarata como otros tofus de supermercado y rinde muchísimo en cubos.' },
          { author: 'Felipe A.', location: 'Teusaquillo', rating: 5, date: 'hace 5 días', comment: 'Perfecto para salteados wok con vegetales. Absorbe la salsa de soya y el ajo de maravilla.' },
          { author: 'Andrea M.', location: 'Suba', rating: 5, date: 'hace 1 semana', comment: 'Llegó ultra fresco al día siguiente. Muy buena relación calidad-precio para cocinar a diario.' },
          { author: 'Sebastián P.', location: 'Cedritos', rating: 5, date: 'hace 2 semanas', comment: 'Lo uso semanalmente en guisos y hamburguesas vegetales. Excelente sabor neutro y artesanal.' },
          { author: 'Diana K.', location: 'Modelia', rating: 4, date: 'hace 2 semanas', comment: 'Firmeza ideal, nada de agua de más como las marcas industriales.' }
        ]
      },
      'tofu-firme': {
        rating: 5.0,
        count: 8,
        items: [
          { author: 'Santiago V.', location: 'Usaquén', rating: 5, date: 'hace 3 días', comment: 'Excelente densidad para cortar en lonjas y hacer en la airfryer. Queda crujiente por fuera y suavecito por dentro.' },
          { author: 'Valentina C.', location: 'Cedritos', rating: 5, date: 'hace 1 semana', comment: 'Supera por lejos a las marcas industriales importadas. Es fresco de verdad y no sabe a conservante.' },
          { author: 'Gonzalo H.', location: 'Rosales', rating: 5, date: 'hace 2 semanas', comment: 'Mantiene la forma al asarlo a la parrilla con marinados. Mi favorito absoluto.' }
        ]
      },
      'tofu-seco-ahumado': {
        rating: 4.9,
        count: 14,
        items: [
          { author: 'Mateo L.', location: 'Zona G', rating: 5, date: 'hace 1 día', comment: 'El sabor ahumado artesanal es una joya. Listo para picar en láminas para sándwiches o ensaladas sin necesidad de cocinar más.' },
          { author: 'Lucía G.', location: 'Chicó', rating: 5, date: 'hace 4 días', comment: 'Me encanta para reemplazar el tocino en pastas veganas. Sabor profundo y textura firme perfecta.' },
          { author: 'Nicolás F.', location: 'Colina Campestre', rating: 5, date: 'hace 1 semana', comment: 'El aroma ahumado con maderas naturales es insuperable. Totalmente recomendado.' }
        ]
      },
      'tofu-hoja': {
        rating: 4.8,
        count: 6,
        items: [
          { author: 'Juan David B.', location: 'Rosales', rating: 5, date: 'hace 2 días', comment: 'Increíbles láminas para hacer enrollados rellenos o salteados estilo asiático auténtico.' },
          { author: 'Marcela K.', location: 'Salitre', rating: 4, date: 'hace 6 días', comment: 'Textura sedosa pero elástica. Difícil de conseguir en Bogotá hasta que los encontré a ustedes.' },
          { author: 'Alejandra M.', location: 'Chicó', rating: 5, date: 'hace 1 semana', comment: 'Me encantó para preparar rollitos al vapor con verduras. Quedan firmes y no se rompen.' }
        ]
      },
      'tofu-rollo-ahumado': {
        rating: 5.0,
        count: 7,
        items: [
          { author: 'Daniela S.', location: 'Modelia', rating: 5, date: 'hace 3 días', comment: 'Marinado delicioso con especias. Se corta en rodajas perfectas para picoteo o tabla de quesos vegetales.' },
          { author: 'Carlos A.', location: 'Colina', rating: 5, date: 'hace 1 semana', comment: 'Intensamente sabroso y muy nutritivo. Lo pido todas las semanas.' },
          { author: 'Fabián T.', location: 'Cedritos', rating: 5, date: 'hace 2 semanas', comment: 'Espectacular el marinado con especias. Lo corto en rodajas finas para picar con galletas de arroz.' }
        ]
      },
      'tofu-frito': {
        rating: 4.9,
        count: 9,
        items: [
          { author: 'Paula T.', location: 'Galerías', rating: 5, date: 'hace 2 días', comment: '¡Ahorra un tiempo impresionante en la cocina! Solo dorar 2 minutos y agregar a la salsa favorita.' },
          { author: 'Gabriel N.', location: 'La Castellana', rating: 5, date: 'hace 5 días', comment: 'Interior jugoso con corteza dorada. A mis hijos les encanta en guisos.' },
          { author: 'Camilo B.', location: 'Quinta Paredes', rating: 5, date: 'hace 1 semana', comment: 'Capa dorada y crujiente por fuera con un centro súper tierno. Súper práctico para la cena.' }
        ]
      },
      'leche-de-soya': {
        rating: 5.0,
        count: 10,
        items: [
          { author: 'Esperanza R.', location: 'Santa Bárbara', rating: 5, date: 'hace 1 día', comment: 'Cremosa, fresca y 100% natural. Se nota que es hecha en la noche, sin ese sabor a cartón ni azúcares raros.' },
          { author: 'Nicolás M.', location: 'Batán', rating: 5, date: 'hace 4 días', comment: 'Excelente para hacer café o espumar en la mañana. Muy digestiva.' },
          { author: 'Juliana P.', location: 'Rosales', rating: 5, date: 'hace 1 semana', comment: 'Sabor suave y pura soya natural. La uso para batidos y postres veganos con excelente resultado.' }
        ]
      },
      'nata-de-soya': {
        rating: 4.8,
        count: 5,
        items: [
          { author: 'Mariana H.', location: 'Nogal', rating: 5, date: 'hace 3 días', comment: 'Textura de alta cocina vegetal. La coloco sobre caldos bien calientes y queda divina.' },
          { author: 'Esteban P.', location: 'Virrey', rating: 5, date: 'hace 1 semana', comment: 'Sabor delicado y sofisticado. La mejor Yuba artesanal de Bogotá.' },
          { author: 'Carolina D.', location: 'Santa Ana', rating: 5, date: 'hace 2 semanas', comment: 'Textura sedosa de restaurante gourmet. Ideal para estofados y sopas asiáticas tradicionales.' }
        ]
      }
    };

    const data = database[slug] || {
      rating: 5.0,
      count: 8,
      items: [
        { author: 'Cliente Koky', location: 'Bogotá', rating: 5, date: 'reciente', comment: 'Excelente calidad y frescura artesanal.' }
      ]
    };

    this.averageRating = data.rating;
    this.reviewCount = data.count;
    this.reviews = data.items;
    this.mostrarTodasLasResenas = false;
  }

  private inyectarJsonLdProducto(product: any, slug: string): void {
    const reviewsSchema = this.reviews.map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.author },
      "datePublished": "2026-07-25",
      "reviewBody": r.comment,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(r.rating),
        "bestRating": "5"
      }
    }));

    const jsonLdData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [product.image || 'https://koky.food/assets/img/logo.png'],
      "description": product.shortDescription || product.longDescription || product.name,
      "sku": product.sku || `KOKY-${slug.toUpperCase()}`,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Koky Food"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://www.koky.food/productdetails/${slug}`,
        "priceCurrency": "COP",
        "price": product.price,
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Koky Food"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": String(this.averageRating),
        "reviewCount": String(this.reviewCount)
      },
      "review": reviewsSchema
    };

    const existingScript = this.document.getElementById('product-schema-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    const script = this.renderer.createElement('script');
    script.id = 'product-schema-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLdData);
    this.renderer.appendChild(this.document.head, script);
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
  getMiniaturas(): string[] {
  if (!this.product || !this.product.galleryImages) return [];
  
  return this.product.galleryImages
    .filter((img: any) => img !== this.activeImage) // Quita la que está en grande
    .slice(0, 3); // Toma solo las primeras 3 que queden
}
  changeImage(url: any) {
    this.activeImage = url;
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
    unitAbbreviation: product.unitAbbreviation,
    availableToday: product.availableToday
  };

  this.cartService.addToCart(itemToCart);
  this.notify.showSuccess(`¡${itemToCart.name} añadido al carrito!`, 'KOKY');
}
}