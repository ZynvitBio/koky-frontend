import { StrapiMedia5 } from './product.model';

export interface BannerSlide {
  id: number;
  documentId: string;
  h1Prefix: string;
  h1HighlightedText: string;
 h1_suffix?: string;
  subtitle: string;
  description: string;
  linkText: string;
  linkUrl: string;
  order: number;
  // Añadimos la relación con la imagen de Strapi 5
  backgroundImage: StrapiMedia5 | null; 
}

// También necesitaremos el contenedor para cuando pidas la lista de banners
export interface HeroResponse {
  data: BannerSlide[];
  meta: any;
}