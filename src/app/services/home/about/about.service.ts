import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importante para limpiar la respuesta
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  public STRAPI_URL = environment.apiUrl;
  
  private aboutUrl = `${this.STRAPI_URL}/api/about-sections`;
  // Ruta para tu nueva colección de Tofu/Ofertas
  private sameDayUrl = `${this.STRAPI_URL}/api/same-day-products`;

  constructor(private http: HttpClient) {}

  // --- Métodos existentes ---
  getAll(): Observable<any> {
    return this.http.get(`${this.aboutUrl}?populate=*`);
  }

  getOne(id: number): Observable<any> {
    return this.http.get(`${this.aboutUrl}/${id}?populate=*`);
  }

  // --- NUEVO MÉTODO: Oferta del Día ---
 getSameDayOffer(): Observable<any> {
  return this.http.get(this.sameDayUrl).pipe(
    map((res: any) => {
      // Strapi suele devolver { data: [...] } o { data: { attributes: ... } }
      if (res && res.data) {
        // Si es una colección (Array)
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data[0].attributes || res.data[0];
        }
        // Si es un Single Type (Objeto)
        return res.data.attributes || res.data;
      }
      return null;
    })
  );
}
private testimonialUrl = `${this.STRAPI_URL}/api/testimonials`;

getTestimonials(): Observable<any> {
  // Usamos populate=* para traer la imagen
  return this.http.get(`${this.testimonialUrl}?populate=*`).pipe(
    map((res: any) => {
      if (res && res.data) {
        return res.data.map((item: any) => {
          const attrs = item.attributes || item;
          
          // Extraer la URL de la imagen (Single Media)
          const imgData = attrs.image?.data?.attributes || attrs.image?.data || attrs.image;
          let imgUrl = 'assets/img/testimonial-1.png'; // Fallback por si no hay imagen

          if (imgData?.url) {
            imgUrl = imgData.url.startsWith('http') 
              ? imgData.url 
              : `${this.STRAPI_URL}${imgData.url}`;
          }

          return {
            quote: attrs.quote,
            author: attrs.author,
            role: attrs.role,
            src: imgUrl
          };
        });
      }
      return [];
    })
  );
}
}