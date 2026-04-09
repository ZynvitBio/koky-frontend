import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { RecipeService } from '../services/blog/blog.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-blogdetails',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './blogdetails.component.html',
  styleUrl: './blogdetails.component.css'
})
export class BlogdetailsComponent implements OnInit {

  receta: any = null;
  public STRAPI_URL = environment.apiUrl;

  showVideo: boolean = false;
  imagenSeleccionada: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    console.log('--- COMPONENTE BLOG DETAILS INICIADO ---');

    const slug = this.route.snapshot.paramMap.get('slug');
    console.log('Slug:', slug);

    if (slug) {
      this.cargarReceta(slug);
    } else {
      console.error('Slug null');
    }
  }

  // ✅ FUNCIÓN UNIVERSAL (LA IMPORTANTE)
  resolveImageUrl(image: any): string {
    const FALLBACK = 'assets/img/placeholder.jpg';

    if (!image) return FALLBACK;

    let url: string | null = null;

    if (typeof image === 'string') {
      url = image;
    } 
    else if (Array.isArray(image) && image.length > 0) {
      const first = image[0];
      if (typeof first === 'string') {
        url = first;
      } else if (first?.url) {
        url = first.url;
      }
    } 
    else if (typeof image === 'object') {
      if (image.url) {
        url = image.url;
      }
    }

    if (!url) return FALLBACK;

    if (url.startsWith('http')) return url;

    return `${this.STRAPI_URL}${url}`;
  }

  // ✅ CARGA LIMPIA (SIN TRANSFORMACIONES RARAS)
  cargarReceta(slug: string) {
    this.http.get<any>(`${this.STRAPI_URL}/api/recipes?filters[slug][$eq]=${slug}&populate=*`)
      .subscribe({
        next: (res) => {
          if (res.data && res.data.length > 0) {
            const rawData = res.data[0];
            const attrs = rawData.attributes || rawData;

            this.receta = {
              ...attrs,
              id: rawData.id
            };

            console.log('✅ Receta cargada:', this.receta);
          }
        },
        error: (err) => console.error('❌ Error:', err)
      });
  }

  filtrarPorTag(slug: string) {
    this.router.navigate(['/blog'], { queryParams: { tag: slug } });
  }

  // 🎬 VIDEO
  getSafeVideoUrl(url: string) {
    if (!url) return '';

    const videoId = url.split('/').pop()?.split('?')[0];
    const finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;

    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }

  openVideo() { this.showVideo = true; }
  closeVideo() { this.showVideo = false; }

  // 🔍 ZOOM IMAGEN
  abrirImagenGrande(url: string) {
    this.imagenSeleccionada = url;
  }

  cerrarImagenGrande() {
    this.imagenSeleccionada = null;
  }
}