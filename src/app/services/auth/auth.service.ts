import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Ajusta la URL si tu Strapi está en otro puerto
   public STRAPI_URL = environment.apiUrl;
  private apiUrl = `${this.STRAPI_URL}/api/auth/local/register`;

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(this.apiUrl, userData);
  }
}