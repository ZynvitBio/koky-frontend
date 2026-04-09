import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
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
    provideClientHydration(withEventReplay()),
    
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