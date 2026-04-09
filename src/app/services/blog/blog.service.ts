import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STRAPI_URL = environment.apiUrl; 
  private apiUrl = `${this.STRAPI_URL}/api`;

  constructor(private http: HttpClient) { }

  getRecipes(): Observable<any[]> {
    const finalUrl = `${this.apiUrl}/recipes?populate=*`;
    return this.http.get<any>(finalUrl).pipe(
      map(response => {
        if (!response || !response.data) return [];
        return response.data.map((item: any) => this.mapListItem(item));
      })
    );
  }

getRecipesBySlug(slug: string): Observable<any> {
  const url = `${this.apiUrl}/recipes?filters[slug][$eq]=${slug}&populate=*`;
  
  return this.http.get<any>(url).pipe(
    map(res => {
      // 1. Verificamos si hay datos
      if (!res.data || res.data.length === 0) {
        console.error("❌ No se encontró la receta con el slug:", slug);
        return null;
      }

      // 2. Extraemos el primer resultado (la receta)
      const rawData = res.data[0];
      const attrs = rawData.attributes ? rawData.attributes : rawData;

      console.log("📦 Datos que Strapi envía para esta receta:", attrs);

      // 3. Función interna para limpiar las URLs y evitar el "appnull"
      const getCleanUrl = (field: any, debugLabel: string) => {
        if (!field) {
          console.warn(`⚠️ El campo ${debugLabel} está vacío en Strapi`);
          return null;
        }
        // Probamos todas las rutas de Strapi (data.attributes o directo)
        const path = field.url || field.data?.attributes?.url || field.attributes?.url;
        
        if (!path) {
          console.error(`❌ El campo ${debugLabel} existe pero no tiene .url`);
          return null;
        }

        // Construimos la URL final de Railway
        const finalUrl = path.startsWith('http') ? path : `https://koky-backend-production.up.railway.app${path}`;
        console.log(`✅ ${debugLabel} URL:`, finalUrl);
        return finalUrl;
      };

      // 4. Mapeamos manualmente para que el HTML reciba lo que espera
      const recetaMapeada = {
        ...attrs,
        id: rawData.id,
        // Probamos con bannerImage o Banner (por si acaso)
        bannerImage: getCleanUrl(attrs.bannerImage || attrs.Banner, 'BANNER'),
        videoThumbnail: getCleanUrl(attrs.videoThumbnail, 'MINIATURA')
      };

      return recetaMapeada;
    })
  );
}

  getRecipesByCategory(categorySlug: string): Observable<any[]> {
    const filterUrl = `${this.apiUrl}/recipes?filters[categories][slug][$eq]=${categorySlug}&populate=*`;
    return this.http.get<any>(filterUrl).pipe(
      map(res => res.data.map((item: any) => this.mapListItem(item)))
    );
  }

  searchRecipes(term: string): Observable<any[]> {
    const url = `${this.apiUrl}/recipes?filters[titulo][$containsi]=${term}&populate=*`;
    return this.http.get<any>(url).pipe(
      map(res => res.data.map((item: any) => this.mapListItem(item)))
    );
  }

  getBlogHero(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/blog-hero?populate=*`);
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories?sort=name:asc`);
  }

  // --- FUNCIONES DE APOYO CORREGIDAS ---
private mapRecipeData(data: any) {
  const attrs = data.attributes ? data.attributes : data;

  // 1. ESTO ES LO MÁS IMPORTANTE: Ver qué nombres de campos existen
  console.log("🔍 CAMPOS QUE VIENEN DE STRAPI:", Object.keys(attrs));

  const getUrl = (field: any, debugName: string) => {
    if (!field) {
      console.warn(`⚠️ Campo ${debugName} está vacío (null/undefined)`);
      return null;
    }
    const path = field.url || field.data?.attributes?.url || field.attributes?.url;
    return path ? (path.startsWith('http') ? path : `${this.STRAPI_URL}${path}`) : null;
  };

  // 2. Aquí intentamos capturar el banner con los nombres más comunes
  const banner = getUrl(attrs.bannerImage, 'bannerImage') || 
                 getUrl(attrs.banner, 'banner') || 
                 getUrl(attrs.Banner, 'Banner');

  console.log("✅ RESULTADO FINAL BANNER:", banner);

  return {
    ...attrs,
    id: data.id,
    bannerImage: banner,
    videoThumbnail: getUrl(attrs.videoThumbnail, 'videoThumbnail')
  };
}
  private mapListItem(item: any) {
    const attr = item.attributes || item;
    
    // Usamos la misma lógica de extracción para la imagen principal
    const getUrl = (field: any) => {
      if (!field) return null;
      // Strapi a veces manda la imagen como array o como objeto único
      const imgData = Array.isArray(field) ? field[0] : field;
      const path = imgData?.url || imgData?.data?.attributes?.url || imgData?.attributes?.url;
      if (!path) return null;
      return path.startsWith('http') ? path : `${this.STRAPI_URL}${path}`;
    };

    return {
      id: item.id,
      titulo: attr.titulo || 'Sin título',
      slug: attr.slug || '',
      position: attr.position || 'left',
      createdAt: attr.createdAt,
      likes: 0,
      comments: 0,
      mainImage: getUrl(attr.mainImage) || 'assets/img/news2.jpg'
    };
  }
}