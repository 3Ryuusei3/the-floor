import { CategoryMeta, CategoryItem } from '../types/category';

export const BUILTIN_CATEGORIES: CategoryMeta[] = [
  {
    slug: 'banderas_mundo',
    name: 'Banderas',
    description: 'Banderas de países de todos los continentes',
    icon: '🚩',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'capitales',
    name: 'Capitales',
    description: 'Capitales de países del mundo',
    icon: '🏛️',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'chuches',
    name: 'Chuches',
    description: 'Golosinas, caramelos y dulces populares',
    icon: '🍬',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'codigos_iata',
    name: 'IATA',
    description: 'Códigos de aeropuertos del mundo',
    icon: '✈️',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'colores',
    name: 'Colores',
    description: 'Gamas cromáticas y tonalidades',
    icon: '🎨',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'comida_rapida',
    name: 'Comida Rápida',
    description: 'Platos y cadenas de comida rápida',
    icon: '🍔',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'cuerpo_humano',
    name: 'Cuerpo Humano',
    description: 'Órganos, huesos y anatomía',
    icon: '🫀',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'especias_sazonadores',
    name: 'Especias',
    description: 'Condimentos aromáticos de la cocina',
    icon: '🧂',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'famosos_eurovision',
    name: 'Eurovisión',
    description: 'Cantantes y actuaciones de Eurovisión',
    icon: '🎤',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'frutas',
    name: 'Frutas',
    description: 'Frutas tropicales, cítricas y silvestres',
    icon: '🍎',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'gentilicios_espana',
    name: 'Gentilicios',
    description: 'Gentilicios de pueblos y ciudades',
    icon: '🗺️',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'hombres_atractivos',
    name: 'Hombres guapos',
    description: 'Famosos, actores y personalidades',
    icon: '🌟',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'libros_famosos',
    name: 'Libros',
    description: 'Portadas y obras literarias clásicas',
    icon: '📚',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'mamiferos',
    name: 'Mamíferos',
    description: 'Animales y fauna mamífera',
    icon: '🦁',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'marcas_coches',
    name: 'Marcas de Coches',
    description: 'Logos y fabricantes de automóviles',
    icon: '🚗',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'material_escolar',
    name: 'Material Escolar',
    description: 'Útiles de papelería y estudio',
    icon: '✏️',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'meteorologia',
    name: 'El tiempo',
    description: 'Nubes, tormentas y eventos climáticos',
    icon: '⚡',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'metro_madrid',
    name: 'Metro de Madrid',
    description: 'Estaciones y líneas del metro',
    icon: '🚇',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'numeros_romanos',
    name: 'Números Romanos',
    description: 'Cifras y numeración romana',
    icon: '🏛️',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'personajes_comic',
    name: 'Personajes de Cómic',
    description: 'Héroes, villanos y cómics',
    icon: '🦸',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'quesos_del_mundo',
    name: 'Quesos',
    description: 'Variedades de quesos internacionales',
    icon: '🧀',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'razas_perros',
    name: 'Perros',
    description: 'Razas caninas de todo el mundo',
    icon: '🐕',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'refrescos_bebidas',
    name: 'Bebidas',
    description: 'Marcas de bebidas y refrescos',
    icon: '🥤',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'senales_trafico',
    name: 'Señales de Tráfico',
    description: 'Señalización vial y normas de circulación',
    icon: '🚸',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'snacks',
    name: 'Snacks',
    description: 'Aperitivos, patatas y snacks',
    icon: '🍿',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'tabla_periodica',
    name: 'Elementos Químicos',
    description: 'Símbolos y elementos químicos',
    icon: '🧪',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'tapas_espanolas',
    name: 'Tapas',
    description: 'Platos tradicionales y raciones',
    icon: '🥘',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'tematica_gay',
    name: 'GAYSSS',
    description: 'Banderas, símbolos y referentes',
    icon: '🏳️‍🌈',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'tipos_tartas',
    name: 'Tartas',
    description: 'Repostería y tartas del mundo',
    icon: '🍰',
    totalItems: 30,
    isAudio: false
  },
  {
    slug: 'verduras',
    name: 'Verduras',
    description: 'Vegetales, hortalizas y verduras',
    icon: '🥦',
    totalItems: 30,
    isAudio: false
  }
];

const loadedCategoriesCache: Record<string, CategoryItem[]> = {};

export async function loadCategoryItems(categorySlug: string): Promise<CategoryItem[]> {
  if (loadedCategoriesCache[categorySlug]) {
    return loadedCategoriesCache[categorySlug];
  }

  try {
    const response = await fetch(`/categories/${categorySlug}/${categorySlug}.json`);
    if (!response.ok) {
      throw new Error(`Error al cargar categoría ${categorySlug}: ${response.statusText}`);
    }
    const data: CategoryItem[] = await response.json();
    
    const normalizedData = data.map(item => ({
      ...item,
      image: item.image ? `/categories/${categorySlug}/${item.image}` : undefined,
      audio: item.audio ? `/categories/${categorySlug}/${item.audio}` : undefined,
    }));

    loadedCategoriesCache[categorySlug] = normalizedData;
    return normalizedData;
  } catch (error) {
    console.error(`Error loading category ${categorySlug}:`, error);
    return [];
  }
}

export function shuffleItems<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
