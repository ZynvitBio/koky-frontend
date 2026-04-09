import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../services/blog/blog.service';
import { environment } from '../../environments/environment';

export interface IngredientItem {
  quantity: string;
  unit: string;
  name: string;
  note?: string; // El '?' es porque puede ser opcional
}

export interface InstructionStep {
  blogHeroData: any;
  description: string;
}

// 1. Interfaz de Media simplificada para Strapi 5
interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string;
  formats?: any;
}
export interface Tag {
  id: number;
  attributes: {
    name: string;
    slug: string;
  };
}

// 2. Interfaz Recipe limpia (Sin el objeto attributes)
interface Recipe {
  id: number;
  documentId: string; // Strapi 5 usa documentId para las rutas
  titulo: string;
  slug: string;
  shortDescription: string;         
  preparationTimeMinutes: number;
  servings: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  videoUrl: string | null;
  cookingTip: string | null;
  // En Strapi 5, los componentes y medios suelen venir directos
  mainImage: StrapiMedia[] | null; 
  bannerImage: StrapiMedia | null;
  tags: any[] | null;
  videoThumbnail: StrapiMedia | null;
  ingredients: IngredientItem[];
  instructions: InstructionStep[];
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css'
})
export class BlogComponent implements OnInit {
  searchTerm: string = '';
  recipes: Recipe[] = [];
  categories: any[] = [];
  blogHeroData: any;
  readonly STRAPI_URL =  `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private blogService: RecipeService
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
    this.loadBlogHero();
    this.loadCategories();
  }
  loadCategories(): void {
    this.blogService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data; //
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }
  filterByCategory(slug: string): void {
    this.blogService.getRecipesByCategory(slug).subscribe({
      next: (response: any) => {
        this.recipes = response.data; // Actualiza la lista con recetas filtradas
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error al filtrar:', err)
    });
  }
loadBlogHero() {
  this.blogService.getBlogHero().subscribe({
    next: (res: any) => {
      console.log('Respuesta completa de Strapi:', res); // <--- ESTO ES CLAVE
      
      // Strapi 5 suele devolver la data simplificada
      // Vamos a intentar detectar la estructura automáticamente
      if (res.data?.attributes) {
        this.blogHeroData = res.data.attributes;
      } else {
        this.blogHeroData = res.data;
      }
      
      console.log('Variable blogHeroData asignada:', this.blogHeroData);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error de conexión con Strapi:', err);
    }
  });
}
loadRecipes(): void {
  // Añadimos &pagination[pageSize]=6 al final de la ruta
  this.http.get<{ data: Recipe[] }>(`${this.STRAPI_URL}/api/recipes?populate=*&pagination[pageSize]=6`)
    .subscribe({
      next: (response) => {
        this.recipes = response.data;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Error cargando recetas:', err)
    });
}
resolveImageUrl(image: any): string {
  const FALLBACK = 'assets/img/placeholder.jpg';

  if (!image) return FALLBACK;

  let url: string | null = null;

  // 1. Caso: string directo
  if (typeof image === 'string') {
    url = image;
  }

  // 2. Caso: array
  else if (Array.isArray(image) && image.length > 0) {
    const first = image[0];
    if (typeof first === 'string') {
      url = first;
    } else if (first?.url) {
      url = first.url;
    }
  }

  // 3. Caso: objeto
  else if (typeof image === 'object') {
    if (image.url) {
      url = image.url;
    }
  }

  // 4. Si no hay URL válida
  if (!url) return FALLBACK;

  // 5. Si ya es absoluta (Cloudinary u otra CDN)
  if (url.startsWith('http')) {
    return url;
  }

  // 6. Si es relativa (Strapi local / Railway)
  return `${this.STRAPI_URL}${url}`;
}

  // 3. Método de imagen actualizado para Strapi 5
 getImgUrl(receta: Recipe): string {
  return this.resolveImageUrl(receta.mainImage);
}
  onSearch(): void {
  if (this.searchTerm.trim() === '') {
    this.loadRecipes(); // Si está vacío, muestra todas
    return;
  }
  

  this.blogService.searchRecipes(this.searchTerm).subscribe({
    next: (res: any) => {
      this.recipes = res.data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error en la búsqueda:', err)
  });
}
}