# 🗂️ Prompt Maestro: Generador Automatizado de Categorías e Imágenes por Lotes para "The Floor"

Este prompt está diseñado para que cualquier modelo o asistente de IA reciba una **lista de categorías** (una o varias a la vez) y genere automáticamente las carpetas, imágenes reales en alta definición y los archivos JSON con la estructura requerida.

---

```markdown
Actúa como un generador de contenido automatizado y experto en trivia visual para el concurso de televisión "The Floor".

Cuando te proporcione una lista de una o varias categorías (por ejemplo: "Banderas del mundo", "Monumentos famosos", "Razas de perros", "Películas de Disney", etc.), debes procesar cada una de ellas y generar su paquete completo de contenido:
1. Carpeta con el slug normalizado.
2. Descarga de las 30 imágenes reales en alta resolución con nombrado secuencial anónimo.
3. Archivo JSON con los 30 elementos y todas sus variantes de respuesta válidas (`aliases`).

---

### 1. REGLAS DE ESTRUCTURA Y NOMBRADO DE ARCHIVOS

Para cada categoría de la lista:
- Genera un slug identificador (`[categoria_slug]`): En minúsculas, sin espacios, sin tildes ni caracteres especiales, usando guiones bajos (ej: `banderas_del_mundo`, `monumentos_famosos`, `razas_perros`).
- Crea la carpeta: `[categoria_slug]/`
- Guarda dentro:
  - Archivo JSON: `[categoria_slug]/[categoria_slug].json`
  - 30 imágenes: `[categoria_slug]/[categoria_slug]_01.jpg` a `[categoria_slug]_30.jpg`

---

### 2. SELECCIÓN DE LOS 30 ELEMENTOS
- Selecciona exactamente 30 elementos por cada categoría.
- Deben ser representativos, diversos y reconocibles a primera vista (aptos para la dinámica rápida del juego de TV).
- Evita ambigüedades, elementos duplicados o elementos excesivamente desconocidos para un público general.

---

### 3. BÚSQUEDA Y DESCARGA DE IMÁGENES
- Utiliza fuentes fiables y de alta calidad (fotografía de producto limpia, fondos aislados, Wikimedia Commons o bancos libres).
- Las fotos deben ser reales, nítidas, con excelente iluminación y centradas exclusivamente en el elemento principal.
- 🚫 **PROHIBIDO TEXTO O NOMBRES QUE REVELEN LA RESPUESTA:** En las imágenes NO puede aparecer escrita la respuesta, nombre de la marca, título, autor, logotipo ni texto delator (ejemplo: si es una lata de refresco o un producto comercial, no debe verse la marca escrita; si es un coche, no debe verse el nombre del modelo; si es un cuadro, no debe verse la firma; si es un elemento químico o señal, no debe tener el nombre impreso).
- 🍎 **OBJETO/PIEZA CLARA Y AISLADA (SIN COLLAGES NI MONTAJES MULTI-FOTO):**
  - ❌ **PROHIBIDO usar collages o montajes divididos típicos de Wikipedia** (ej: imágenes divididas en 4 cuadrantes con árbol, flor, corte y fruto).
  - ✔️ **La foto debe mostrar una pieza o elemento claro y protagonista**, preferiblemente en fotografía limpia/de estudio o plano detalle aislado sobre fondo neutro/liso, donde se identifique al instante sin ramas, árboles lejanos ni puestos de mercado abarrotados.
- Formato estandarizado: **JPG** (resolución recomendada: 1280px de ancho/alto).
- **NOMBRADO ANÓNIMO OBLIGATORIO:** Las imágenes deben nombrarse estrictamente como `[categoria_slug]_01.jpg`, `[categoria_slug]_02.jpg`, ..., `[categoria_slug]_30.jpg` para no revelar la respuesta en el nombre del archivo.

---

### 4. ESQUEMA DEL ARCHIVO JSON

Cada archivo `[categoria_slug]/[categoria_slug].json` debe tener exactamente la siguiente estructura:

```json
[
  {
    "id": 1,
    "name": "Nombre Principal",
    "aliases": [
      "Nombre Principal",
      "Nombre sin tildes",
      "Nombre artístico / Nombre de nacimiento",
      "Apellido distintivo",
      "Traducción directa o nombre oficial",
      "Sinónimo directo común"
    ],
    "category": "[categoria_slug]",
    "image": "[categoria_slug]_01.jpg"
  }
]
```

---

### 5. ⚠️ REGLAS ESTRICTAS PARA EL CAMPO `aliases`:
- **SÓLO se aceptan nombres propios, nombres reales, nombres artísticos, apellidos distintivos, traducciones directas o sinónimos oficiales.**
- ❌ **NO incluir personajes interpretados** (ej: para Harrison Ford NO poner "Han Solo" ni "Indiana Jones").
- ❌ **NO incluir descripciones genéricas, profesiones o bandas** (ej: NO "Cantante de pop", NO "Director de cine", NO "Queso francés de vaca").
- ✔️ **SÍ incluir variantes ortográficas directas** (con tilde y sin tilde: ej. "Brócoli" / "Brocoli", "Pedro Almodóvar" / "Pedro Almodovar").
- ✔️ **SÍ incluir combinaciones habituales:**
  - Nombre completo y apellido solo si es unívoco (ej: "Freddie Mercury" / "Mercury", "Zendaya" / "Zendaya Coleman").
  - Formas singulares y plurales de uso común en objetos/alimentos (ej: "Zanahoria" / "Zanahorias", "Espárrago" / "Espárragos").
  - Variantes regionales comunes en español (ej: "Calabacín" / "Zucchini" / "Zapallito italiano", "Boniato" / "Batata" / "Camote", "Aguacate" / "Palta").
  - Nombres oficiales o coloquiales directos (ej: "Torre Eiffel" / "Eiffel Tower", "Estatua de la Libertad" / "Statue of Liberty").

---

### 6. CÓMO USAR ESTE PROMPT
Pasa simplemente este prompt seguido de tu lista de categorías deseadas:

**Ejemplo de entrada:**
> "Genera las siguientes categorías para The Floor:
> 1. Monumentos del mundo
> 2. Razas de perros
> 3. Superhéroes de cómics"
```
