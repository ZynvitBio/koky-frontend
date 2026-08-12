import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private readonly STRAPI_URL = environment.apiUrl; 
  private apiUrl = `${this.STRAPI_URL}/api`;

  constructor(private http: HttpClient) { }

  getFaqs(): Observable<any[]> {
    const url = `${this.apiUrl}/faqs?populate=*&pagination[limit]=100`;
    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response || !response.data) return [];
        return response.data.map((item: any) => {
          const attrs = item.attributes ? item.attributes : item;
          return {
            id: item.id,
            topic: attrs.topic || '',
            information: attrs.information || '',
            active: attrs.active !== undefined ? attrs.active : true
          };
        });
      })
    );
  }
}
