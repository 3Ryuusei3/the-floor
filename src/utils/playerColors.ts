/**
 * Paleta de colores vibrantes, luminosos y de alto contraste
 * especialmente diseñada para concurso de televisión (The Floor).
 * Ningún color es negro ni oscuro para garantizar máxima visibilidad
 * y contraste entre todos los concursantes.
 */

export const VIBRANT_PLAYER_COLORS: string[] = [
  "#00f0ff", // 1. Azul Royal
  "#ff2a4b", // 2. Rojo Carmesí
  "#ffd700", // 3. Oro Eléctrico
  "#00f784", // 4. Verde Menta Neón
  "#f772d6", // 5. Rosa Chicle
  "#7300d1", // 6. Violeta Profundo
  "#ff9900", // 7. Naranja Intenso
  "#845241", // 8. Marrón Cálido
  "#0356dc", // 9. Verde Bosque
  "#FFFFFF", // 10. Blanco Puro
  "#980000", // 11. Granate
  "#049842", // 12. Cyan Neón
  "#4cc9f0", // 13. Azul Cielo Luminoso
  "#ff6b6b", // 14. Salmón Vivo
  "#b5179e", // 15. Púrpura Orquídea
  "#7209b7", // 16. Amatista Luminoso
  "#4361ee", // 17. Índigo Brillante
  "#a7c957", // 18. Lima Neón
  "#f4a261", // 19. Melocotón Dorado
  "#2ec4b6", // 20. Turquesa Intenso
  "#ffb703", // 21. Ámbar Neón
  "#fb8500", // 22. Mandarina Neón
  "#52b788", // 23. Verde Jade
  "#d90429", // 24. Rubí Neón
  "#8338ec", // 25. Púrpura Neón
  "#38b000", // 26. Verde Manzana
  "#ff0054", // 27. Frambuesa Neón
  "#70d6ff", // 28. Celeste Glaciar
  "#ff9f1c", // 29. Naranja Fuego
  "#c77dff", // 30. Lila Neón
  "#05f140", // 31. Verde Lima Eléctrico
  "#e056fd", // 32. Fucsia Violeta
];

/**
 * Convierte HSL a código Hexadecimal (#rrggbb)
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Obtiene un color único, vibrante y de máximo contraste para un concursante según su índice.
 * Usa la paleta curada para los primeros concursantes y el ángulo de la Proporción Áurea (137.5°)
 * con luminosidad controlada (55%-65%) y alta saturación (90%-100%) para concursantes adicionales.
 */
export function getDistinctPlayerColor(index: number): string {
  if (index < VIBRANT_PLAYER_COLORS.length) {
    return VIBRANT_PLAYER_COLORS[index];
  }
  // Generación matemática de máxima dispersión de color (Golden Ratio Hue)
  const goldenAngle = 137.50776405;
  const hue = Math.round((index * goldenAngle) % 360);
  const saturation = 95; // Saturación alta para colores vivos
  const lightness = 58; // Luminosidad media-alta: nunca oscuro ni negro
  return hslToHex(hue, saturation, lightness);
}
