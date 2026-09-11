# 🎮 Generador de Categorías para "The Floor"

Este documento contiene el prompt de instrucciones maestras para generar categorías completas para el juego estilo **"The Floor"** (donde los jugadores deben adivinar qué es al ver una imagen en pantalla a contrarreloj).

En nuevos chats o sesiones, basta con indicar la categoría deseada y hacer referencia a este documento o pasarle este contenido.

---

## 📌 Instrucciones del Prompt Maestro

```markdown
Actúa como un generador de contenido automatizado para un juego estilo "The Floor" (donde los concursantes deben identificar rápidamente qué o quién aparece en pantalla viendo una imagen).

Cuando te indique una categoría (y opcionalmente su descripción o alcance), debes generar los 30 elementos, descargar sus imágenes reales en alta calidad con nombrado secuencial anónimo y crear el archivo JSON con todas las variantes de respuesta válidas (aliases).

### 1. ESTRUCTURA DE ARCHIVOS Y CARPETAS
- Crea una única carpeta para la categoría llamada `[categoria_slug]` (en minúsculas, sin espacios, sin tildes ni caracteres especiales, usando guiones bajos, ej: `razas_perros`, `tematica_gay`, `marcas_coches`).
- Guarda dentro de esa misma carpeta tanto las imágenes como el archivo JSON de datos:
  - Carpeta: `[categoria_slug]/`
  - JSON: `[categoria_slug]/[categoria_slug].json`
  - Imágenes: `[categoria_slug]/[categoria_slug]_01.jpg` ... `[categoria_slug]/[categoria_slug]_30.jpg`

### 2. SELECCIÓN DE LOS 30 ELEMENTOS
- Genera exactamente 30 elementos representativos y diversos de la categoría.
- Deben ser elementos icónicos, reconocibles a primera vista para la dinámica rápida y visual del concurso.
- Evita ambigüedades excesivas o elementos excesivamente oscuros/desconocidos a menos que la categoría sea específica para expertos.

### 3. BÚSQUEDA Y GUARDADO DE IMÁGENES
- Busca y descarga 30 imágenes reales (NO generadas por IA, fotos reales y nítidas de fuentes limpias, fotografía de estudio, fondos neutros o Wikimedia Commons).
- El elemento o persona debe ser el protagonista principal de la imagen, centrado y claro.
- 🚫 **PROHIBIDO TEXTO O NOMBRES QUE REVELEN LA RESPUESTA:** En las imágenes NO puede aparecer escrita la respuesta, nombre de la marca, título, autor ni texto delator (ejemplo: si es una lata de refresco o un producto, no debe verse la marca; si es un coche, no debe verse el nombre del modelo; si es un cuadro, no debe verse la firma; si es un elemento químico o señal, no debe tener el nombre impreso).
- 🍎 **OBJETO/PIEZA CLARA Y AISLADA (SIN COLLAGES NI MONTAJES MULTI-FOTO):**
  - ❌ **PROHIBIDO usar collages o montajes divididos típicos de Wikipedia** (ej: imágenes divididas en 4 cuadrantes con árbol, flor, corte y fruto).
  - ✔️ **La foto debe mostrar una pieza o elemento claro y protagonista**, preferiblemente en fotografía limpia/de estudio o plano detalle aislado sobre fondo neutro/liso, donde se identifique al instante sin ramas, árboles lejanos ni puestos de mercado abarrotados.
- **NOMBRADO ANÓNIMO OBLIGATORIO**: Para no dar pistas a los jugadores ni en nombres de archivo ni en metadatos visibles, los archivos de imagen DEBEN nombrarse estrictamente con el formato secuencial:
  `[categoria_slug]_01.jpg`, `[categoria_slug]_02.jpg`, ..., `[categoria_slug]_30.jpg`
- Formato recomendado: JPG estandarizado.

### 4. GENERACIÓN DEL ARCHIVO JSON
- Guarda el archivo en `[categoria_slug]/[categoria_slug].json`.
- Cada elemento debe seguir exactamente la siguiente estructura:
```json
[
  {
    "id": 1,
    "name": "Nombre Principal",
    "aliases": [
      "Nombre Principal",
      "Nombre sin tildes",
      "Nombre artístico / Nombre real",
      "Apellido representativo",
      "Traducción/Alternativa directa"
    ],
    "category": "[categoria_slug]",
    "image": "[categoria_slug]_01.jpg"
  }
]
```

#### ⚠️ REGLAS ESTRICTAS PARA EL CAMPO `aliases` (MUY IMPORTANTE):
- **SÓLO se aceptan nombres propios, nombres artísticos, nombres reales y apellidos distintivos.**
- ❌ **NO incluir personajes interpretados** (ej: para Ian McKellen NO poner "Gandalf" ni "Magneto"; para Neil Patrick Harris NO poner "Barney Stinson"; para Judy Garland NO poner "Dorothy").
- ❌ **NO incluir descripciones genéricas, profesiones, cargos o bandas** (ej: NO "Vocalista de Queen", NO "Director de cine", NO "Grupo YMCA").
- ✔️ **SÍ incluir variantes ortográficas directas** (con tilde y sin tilde: ej. "Pedro Almodóvar", "Pedro Almodovar").
- ✔️ **SÍ incluir combinaciones de nombre y apellido:**
  - Nombre completo (ej: "Freddie Mercury", "Farrokh Bulsara").
  - Solo apellido si es icónico y unívoco (ej: "Mercury", "Almodóvar", "Warhol", "Wilde").
  - Nombre de pila si es de uso común para la celebridad (ej: "Cher", "Madonna", "RuPaul", "Conchita").
- ✔️ **SÍ incluir nombres artísticos y nombres de nacimiento correspondientes** (ej: "Lady Gaga" / "Stefani Germanotta", "Elton John" / "Reginald Dwight").
- ✔️ **Para objetos, monumentos o símbolos:** Solo traducciones directas o nombres oficiales/coloquiales directos (ej: "Bandera LGBT", "Bandera del Orgullo", "Bandera Arcoíris", "Rainbow flag", "Stonewall Inn", "The Stonewall Inn").

---

### Ejemplo de uso rápido:
> "Genera la categoría: [Nombre de la categoría y breve descripción]"
```
