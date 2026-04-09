import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { HeroResponse } from '../../../models/home.model'; // Asegúrate de que la ruta sea correcta
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HeroService {
  // Cambiamos el localhost por la variable del environment
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los mensajes del Hero con sus imágenes
   */
 getHeroData(): Observable<HeroResponse> {
  // Usamos sort[0]=order:asc para que los mensajes salgan en el orden que definiste en Strapi
  return this.http.get<HeroResponse>(
    `${this.apiUrl}/home-hero-messages?populate=*&sort[0]=order:asc`
  );
}
  /**
   * Obtiene la configuración de imagen del Hero
   */
 getHeroImage(): Observable<any> {
  // Cambiamos el * por el nombre exacto del campo para que no haya duda
  return this.http.get(`${this.apiUrl}/home-hero-settings?populate[heroImage][populate]=*`);
}
}