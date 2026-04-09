import { StrapiMedia5 } from './product.model';

export interface IngredientItem {
  quantity: string;
  unit: string;
  name: string;
  note?: string;
}

export interface InstructionStep {
  blogHeroData: any; // Mantengo tu propiedad específica
  description: string;
}

export interface Tag {
  id: number;
  attributes: { // Nota: Si tus tags también son Strapi 5, esto podría ser plano luego
    name: string;
    slug: string;
  };
}

export interface Recipe {
  id: number;
  documentId: string;
  titulo: string;
  slug: string;
  shortDescription: string;         
  preparationTimeMinutes: number;
  servings: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  videoUrl: string | null;
  cookingTip: string | null;
  position: 'left' | 'right';
  likes: number;
  comments: number;
  
  // Relaciones directas Strapi 5
  mainImage: StrapiMedia5[] | null; 
  bannerImage: StrapiMedia5 | null;
  tags: Tag[] | any[] | null;
  videoThumbnail: StrapiMedia5 | null;
  ingredients: IngredientItem[];
  instructions: InstructionStep[];
}

export interface RecipeResponse {
  data: Recipe[];
  meta: any;
}