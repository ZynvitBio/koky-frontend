import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // La URL de tu Strapi (asegúrate de que el puerto sea el correcto)
  public STRAPI_URL = environment.apiUrl;
 private apiUrl = `${this.STRAPI_URL}/api/orders`;

  constructor(private http: HttpClient) { }

  /**
   * Envía la orden a Strapi tras el éxito en Wompi
   */
  createOrder(orderData: any): Observable<any> {
  // Strapi 5 requiere que los datos vayan envueltos en un objeto "data"
  const payload = {
    data: {
      whatsapp_id: orderData.whatsapp_id,
      customer_name: orderData.customer_name,
      total_amount: orderData.total_amount,
      wompi_reference: orderData.wompi_reference,
      source: orderData.source || 'directo',
      items: orderData.items,
      // AGREGAMOS ESTA LÍNEA (El motor que nos faltaba):
      payment_method: orderData.payment_method, 
      
      users_permissions_user: orderData.userId 
    }
  };

  console.log("🚀 PAYLOAD FINAL ENVIADO A STRAPI:", payload);
  return this.http.post(this.apiUrl, payload);
}
}