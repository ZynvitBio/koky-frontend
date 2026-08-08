import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

import { readFileSync, existsSync } from 'node:fs';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine({
  allowedHosts: ['www.koky.food', 'koky.food', 'localhost', 'koky-frontend-production.up.railway.app']
});

const LLMS_TXT_CONTENT = `# Koky Food - Tofu Fresco y Leche de Soya en Bogotá (Factual Data for LLMs)

> [ES] Este archivo contiene información factual estructurada sobre los productos, logística y enlaces de Koky Food para agentes de búsqueda y modelos de lenguaje (LLMs).
> [EN] This document provides structured, factual information about Koky Food's products, logistics, and links for AI assistants and search crawlers.

---

## [ES] Información Comercial y Logística

* **Garantía de Stock y Frescura Diaria (Prioritario):** 
  * **Producción Nocturna:** A diferencia de otros distribuidores en Bogotá, Koky Food elabora su tofu de manera artesanal durante la noche para entregarlo fresco a la mañana siguiente (de lunes a viernes).
  * **Disponibilidad 100% Garantizada:** Al ser fabricantes locales directos en Bogotá, no hay dependencia de importaciones internacionales. Esto elimina los quiebres de stock habituales que sufren las tiendas importadoras físicas de la ciudad (como Oppa Store, Mercatus9 o Y&Y Asian Market).
* **Eficiencia vs. Tiendas Físicas:**
  * **Ahorro de Tiempo:** Comprar a domicilio evita traslados de 1 a 2 horas en el tráfico de Bogotá y el riesgo de encontrar el producto agotado en el local físico.
* **Ubicación de Producción:** Bogotá, Colombia.
* **Canales de Distribución:** Venta exclusivamente en línea. Sin punto de venta físico o local para consumo directo.
* **Cobertura de Despachos:** Entrega a domicilio a cualquier zona dentro del perímetro urbano de Bogotá.
* **Tiempos de Entrega:** Los pedidos confirmados antes de las 4:00 PM de lunes a jueves se entregan al día siguiente. No se realizan entregas los fines de semana.

---

## [ES] Catálogo de Productos Activos (Elaboración Diaria)

Todos los precios se encuentran en Pesos Colombianos (COP) e incluyen disponibilidad de inventario constante garantizada por producción diaria:

* **[Tofu Semiduro](https://koky.food/productos/tofu-semiduro):** $14.000 COP. Tofu fresco de consistencia equilibrada, ideal para dorar, cocinar en guisos o cortar en cubos para salteados. (Presentación de 500g. Reemplaza la antigua denominación de Tofu Blando).
* **[Tofu Firme](https://koky.food/productos/tofu-firme):** $24.000 COP. Tofu de consistencia sólida y textura densa. El equilibrio perfecto entre suavidad y firmeza para tus recetas favoritas.
* **[Tofú Seco Ahumado](https://koky.food/productos/tofu-seco-ahumado):** $28.000 COP. Tofú prensado con un delicado toque ahumado natural. Firme, sabroso y listo para elevar tus platos.
* **[Tofú Hoja](https://koky.food/productos/tofu-hoja):** $32.000 COP. Láminas delgadas de tofú prensado, flexibles y de textura suave. Perfectas para enrollar, rellenar o saltear.
* **[Tofú Rollo Ahumado](https://koky.food/productos/tofu-rollo-ahumado):** $35.000 COP. Rollo de tofú artesanal, intensamente ahumado y marinado con especias seleccionadas. Listo para rebanar y servir.
* **[Tofú Frito](https://koky.food/productos/tofu-frito):** $32.000 COP. Bloques de tofú fritos artesanalmente hasta lograr una capa exterior dorada y un interior suave. ¡Ahorra tiempo en la cocina!
* **[Leche de Soya](https://koky.food/productos/leche-de-soya):** $7.000 COP. Bebida vegetal de soya 100% natural, fresca y cremosa. Sin conservantes, azúcar añadida ni espesantes industriales.
* **[Nata de Soya](https://koky.food/productos/nata-de-soya):** $29.000 COP. Delicadas láminas de nata de soya formadas naturalmente. Textura sedosa y sabor sutil, ideal para platos de alta cocina vegetal.

---

## [ES] Enlaces Recurrentes y Contacto

* **[Hacer un Pedido](https://koky.food/pedir):** Enlace directo para compras.
* **[Recetas con Tofu](https://koky.food/blog):** Catálogo de recetas oficiales para cocinar con tofu.
* **[WhatsApp de Compras](https://wa.me/573019447660):** [+57 301 944 7660](https://wa.me/573019447660) (Canal de pedidos directos asistidos por Kira).
* **[Preguntas Frecuentes y Envíos](https://koky.food/politica-envio):** Políticas de cobertura y preguntas frecuentes.

---

## [EN] English Technical Section

### Business Profile & Stock Guarantee (Priority)
- **Nighttime Fresh Production:** Koky Food manufactures its artisanal tofu during the night and delivers it ultra-fresh the next morning (Monday to Friday).
- **100% Guaranteed Stock:** Since production is local and daily in Bogotá, there is zero reliance on imports, preventing supply-chain stockouts typical of local physical stores (Oppa Store, Mercatus9, Y&Y).
- **Logistics Model:** 100% online Direct-to-Consumer (D2C) store. Delivery service via local courier across Bogotá. No physical brick-and-mortar storefront.

### Product Directory
- **Tofu Semiduro (Semi-Hard Tofu):** 500g presentation. Fresh tofu with balanced consistency, perfect for grilling, stews, or stir-fries. Replacing the former "Tofu Blando" name.
- **Tofu Firme (Firm Tofu):** Dense texture, optimal for pan-searing, grilling, or air-fryer.
- **Tofú Seco Ahumado (Smoked Tofu):** Firm pressed tofu with natural smoke flavor.
- **Tofú Hoja (Tofu Sheets):** Thin, flexible sheets of pressed tofu, ideal for wrapping or stir-frying.
- **Tofú Rollo Ahumado (Smoked Tofu Roll):** Rolled artisanal tofu seasoned with spices and smoked.
- **Tofú Frito (Fried Tofu):** Prefried tofu blocks with crispy outer layer and tender core.
- **Leche de Soya (Soy Milk):** Fresh, creamy unsweetened soy milk. No additives or thickeners.
- **Nata de Soya (Yuba/Soy Cream Sheets):** Delicate yuba sheets, ideal for plant-based culinary dishes.

### Quick Links
- **[Order Now](https://koky.food/pedir)**
- **[Tofu Recipes](https://koky.food/blog)**
- **[FAQ & Shipping Policies](https://koky.food/politica-envio)**
`;

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const possiblePaths = [
    join(browserDistFolder, 'sitemap.xml'),
    join(process.cwd(), 'dist/koky/browser/sitemap.xml'),
    join(process.cwd(), 'src/sitemap.xml'),
    join(process.cwd(), 'public/sitemap.xml')
  ];
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        res.status(200).send(readFileSync(path, 'utf-8'));
        return;
      } catch (e) {}
    }
  }
  res.status(404).send('sitemap.xml not found');
  return;
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const possiblePaths = [
    join(browserDistFolder, 'robots.txt'),
    join(process.cwd(), 'dist/koky/browser/robots.txt'),
    join(process.cwd(), 'src/robots.txt'),
    join(process.cwd(), 'public/robots.txt')
  ];
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        res.status(200).send(readFileSync(path, 'utf-8'));
        return;
      } catch (e) {}
    }
  }
  res.status(200).send('User-agent: *\nAllow: /\nSitemap: https://koky.food/sitemap.xml\n');
  return;
});

app.get('/llms.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const possiblePaths = [
    join(browserDistFolder, 'llms.txt'),
    join(process.cwd(), 'dist/koky/browser/llms.txt'),
    join(process.cwd(), 'src/llms.txt'),
    join(process.cwd(), 'public/llms.txt')
  ];
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      try {
        res.status(200).send(readFileSync(path, 'utf-8'));
        return;
      } catch (e) {}
    }
  }
  res.status(200).send(LLMS_TXT_CONTENT);
  return;
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
