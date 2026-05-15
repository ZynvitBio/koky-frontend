import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * SOLUCIÓN RADICAL: Limpiamos la URL antes de arrancar Angular.
 * Esto sucede en JS puro, así que el Router de Angular recibirá 
 * la URL limpia desde el primer milisegundo.
 */
const url = new URL(window.location.href);

// Si detectamos rastro de Instagram o Facebook
if (url.searchParams.has('utm_source') || url.searchParams.has('fbclid')) {
  // Reemplazamos la historia del navegador con la ruta limpia (ej: /home)
  window.history.replaceState({}, document.title, url.pathname);
  
  // Opcional: un log para que veas en consola que funcionó
  console.log('✅ URL de Instagram saneada antes del bootstrap');
}

// Ahora sí, arrancamos la App con la URL ya limpia
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));