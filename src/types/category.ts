export interface CategoryItem {
  id: number;
  name: string;
  aliases: string[];
  category: string;
  image?: string;
  audio?: string;
  prompt?: string; // Pregunta, pista o palabra que aparece en pantalla en modo texto
}

export interface CategoryMeta {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  isAudio?: boolean;
  totalItems: number;
}
