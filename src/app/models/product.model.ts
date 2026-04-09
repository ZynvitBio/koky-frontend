export interface StrapiMedia5 {
  id: number;
  url: string;
  alternativeText: string;
  name?: string;
}

export interface Product {
  id: number;
  documentId: string; // Strapi 5
  name: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice?: number;
  stock: number;
  immediateDeliveryStock?: number;
  
  // Lógica de medida
  contentPerUnit: number; 
  unitAbbreviation: 'g' | 'kg' | 'und' | 'ml' | 'L'; 
  unitMeasure: 'Gramos' | 'Kilogramos' | 'Unidad' | 'Litros' | 'Mililitros';
  
  // Descripciones y contenido
  shortDescription?: string;
  longDescription?: string;
  benefits?: string;
  videoUrl?: string;
  
  // Estados y Fechas
  availableToday: boolean;
  active: boolean;
  launchDate?: string;
  priorityOrder?: number;
  
  // Marketing y SEO
  brand?: string;
  averageRating?: number;
  reviewCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  externalProductUrl?: string;

  // Medios (Relaciones directas Strapi 5)
  image: StrapiMedia5 | null; 
  galleryImages: StrapiMedia5[] | null;
  
  // Relaciones (Solo los datos básicos por ahora)
  categories?: any[];
  tags?: any[];
  relatedProducts?: Product[];
}

export interface ProductResponse {
  data: Product[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
}
// 1. La base: Define cómo es UNA sola imagen
export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string;
  name?: string;
  formats?: any;
}

// 2. La galería: Define que es una LISTA (array) de esas imágenes
export type StrapiMediaMany = StrapiMedia[];