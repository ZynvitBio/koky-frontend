import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment'; // 1. Importamos el environment

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  
  // 2. Cambiamos el string fijo por la variable de Railway
  private readonly STRAPI_URL = environment.apiUrl; 
  private apiUrl = `${this.STRAPI_URL}/api`;

  // Obtener lista completa
 getProducts(): Observable<any[]> {
  return this.http.get<any>(`${this.apiUrl}/products?populate=*`).pipe(
    map(res => {
      if (!res || !res.data) return [];
      // Obligamos a cada producto a pasar por tu filtro de Railway
      return res.data.map((item: any) => this.mapProductData(item));
    })
  );
}

  getProductBySlug(slug: string): Observable<any> {
    const url = `${this.apiUrl}/products?filters[slug][$eq]=${slug}&populate=*`;
    console.log('1. Disparando petición a:', url);

    return this.http.get<any>(url).pipe(
      map(res => {
        const data = res.data;
        const productData = Array.isArray(data) ? data[0] : data;
        if (!productData) return null;
        return this.mapProductData(productData);
      })
    );
  }

  getRelatedProducts(currentSlug?: string): Observable<any[]> {
    let url = `${this.apiUrl}/products?populate=*&pagination[limit]=8`;
    if (currentSlug) {
      url += `&filters[slug][$ne]=${currentSlug}`;
    }
    return this.http.get<any>(url).pipe(
      map(res => res.data.map((item: any) => this.mapProductData(item)))
    );
  }

  // 3. Tu función de mapeo original, solo cambiando localhost por la variable
 private mapProductData(data: any) {
  // 1. Strapi a veces envuelve todo en 'attributes'
  const attrs = data.attributes ? data.attributes : data;

  // 2. BUSCAMOS LAS URLS (Definimos las variables para que no den error)
  
  // Para la imagen principal
  const imageUrl = attrs.image?.url || attrs.image?.data?.attributes?.url;

  // Para el banner (revisamos si es un objeto directo, un array o viene en .data)
  const bannerData = attrs.bannerImage?.data || attrs.bannerImage;
  let bannerUrl = null;

  if (Array.isArray(bannerData) && bannerData.length > 0) {
    // Si es un array, tomamos la URL del primero
    bannerUrl = bannerData[0].attributes?.url || bannerData[0].url;
  } else if (bannerData) {
    // Si es un objeto único
    bannerUrl = bannerData.attributes?.url || bannerData.url;
  }

  return {
    id: data.id,
    documentId: data.documentId,
    name: attrs.name,
    slug: attrs.slug,
    price: attrs.price,
    oldPrice: attrs.oldPrice,
    shortDescription: attrs.shortDescription,
    longDescription: attrs.longDescription,
    benefits: attrs.benefits,
    sku: attrs.sku,
    unitAbbreviation: attrs.unitAbbreviation,
    contentPerUnit: attrs.contentPerUnit,
    unitMeasure: attrs.unitMeasure,
    brand: attrs.brand,
    
    // 3. MAPEO DE BANNERS (Usando la lógica de Railway)
    bannerImage: bannerUrl 
      ? (bannerUrl.startsWith('http') ? bannerUrl : `${this.STRAPI_URL}${bannerUrl}`) 
      : null,
    
    galleryImages: attrs.galleryImages?.map((img: any) => {
      const gUrl = img.attributes?.url || img.url;
      return gUrl.startsWith('http') ? gUrl : `${this.STRAPI_URL}${gUrl}`;
    }) || [],
    
    // 4. MAPEO DE IMAGEN PRINCIPAL
    image: imageUrl 
      ? (imageUrl.startsWith('http') ? imageUrl : `${this.STRAPI_URL}${imageUrl}`)
      : 'assets/img/placeholder.jpg'
  };
}
}