import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { IMAGE_CONFIG } from '@angular/common'; // ← agregar

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()), 
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes, 
      withInMemoryScrolling({ 
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ), 
    provideClientHydration(
      withHttpTransferCacheOptions({
        filter: (req) => {
          // Permite que el servidor SSR pre-renderice para Google SEO,
          // pero hace que el navegador del cliente SIEMPRE consulte en vivo el stock a Strapi sin re-desplegar
          return !req.url.includes('/api/products') && 
                 !req.url.includes('/api/same-day') &&
                 !req.url.includes('/api/home-hero-setting');
        }
      })
    ),
    
    // ← agregar esto: elimina el timer de NG0913 que bloquea la estabilización
    {
      provide: IMAGE_CONFIG,
      useValue: { 
        disableImageSizeWarning: true, 
        disableImageLazyLoadWarning: true 
      }
    }
  ]
};