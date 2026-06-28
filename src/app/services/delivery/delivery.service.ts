import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}/api/cabify-delivery/get-price`;

  constructor(private http: HttpClient) {}

  // Este método centraliza la comunicación con tu Backend
  calcularEnvio(destino: { lat: number; lng: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl, { destino });
  }
}
