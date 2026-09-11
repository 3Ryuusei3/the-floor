# 🎮 Prompt Maestro: Aplicación Web "The Floor" (Juego de Televisión)

Actúa como un desarrollador Frontend Senior experto en **React, Vite, SCSS, Tailwind CSS y shadcn/ui**. 

Tu objetivo es construir una aplicación web completa, interactiva, moderna y con estética televisiva (pantallas gigantes de LEDs, luces oscuras, neones y efectos de tensión) basada en el famoso concurso de televisión **"The Floor"**.

---

## 🛠️ 1. STACK TECNOLÓGICO Y ARQUITECTURA
- **Framework & Bundler:** React 18+ con Vite (TypeScript recomendado o JavaScript moderno).
- **Estilos:** SCSS (módulos o estructurado) combinado con Tailwind CSS para componentes de **shadcn/ui**.
- **Componentes UI:** shadcn/ui (Dialog, Button, Slider, Input, Badge, Progress, Card, Tooltip, Sheet, etc.).
- **Iconos:** `lucide-react`.
- **Efectos y Animaciones:** `framer-motion` o transiciones SCSS nativas / CSS animations para el giro de casillas, conquista de territorio y temporizadores.
- **Audio:** Web Audio API / `Howler.js` o sintetizador de sonidos integrado para efectos (tic-tac de reloj, acierto, paso, alerta de 5s, victoria, conquista).
- **Estructura de Datos:** Carga estática de categorías desde `/public/categories/` o `/src/data/categories/`.

---

## 📦 2. FORMATO Y ESTRUCTURA DE DATOS (JSON)
Las categorías y preguntas deben seguir estrictamente el siguiente esquema JSON:

```json
[
  {
    "id": 1,
    "name": "Nombre Principal",
    "aliases": [
      "Nombre Principal",
      "Variante sin tildes",
      "Traducción",
      "Sinónimo directo"
    ],
    "category": "nombre_categoria_slug",
    "image": "nombre_categoria_slug_01.jpg"
  }
]
```

- Las imágenes se alojarán en `/public/categories/[categoria_slug]/[categoria_slug]_01.jpg` a `30.jpg`.
- La aplicación debe incluir un índice/registro de categorías disponibles para listarlas y asignarlas a los jugadores al inicio de la partida.

---

## ⚙️ 3. FASES Y PANTALLAS DE LA APLICACIÓN

### 🕹️ Fase 1: Configuración de la Partida (Setup)
1. **Configuración del Tablero:**
   - Dimensiones del tablero seleccionables: Desde 3x3, 4x4, 6x6, 8x8 hasta 10x10 (hasta 100 casillas).
2. **Configuración de Jugadores:**
   - Añadir / eliminar jugadores con nombre y color personalizado asignado.
   - Distribución de casillas: Asignación automática equitativa o manual de una o más casillas por jugador.
   - Asignación de categorías: Asignar una categoría temática del catálogo JSON a cada jugador/territorio inicial.
3. **Botón de Iniciar Partida ("Start The Floor")**: Pasa a la vista principal del tablero.

---

### 🗺️ Fase 2: Vista del Tablero y Selección de Reto (The Floor Board)
1. **Renderizado del Tablero Cuadriculado:**
   - Grid interactivo con el color de cada jugador dominando sus casillas y mostrando la categoría que defiende.
   - Los territorios conquistados se fusionan visualmente manteniendo el color del jugador dominante.
2. **Mecánica de Selección:**
   - **Selector Aleatorio ("El suelo elige"):** Animación estilo ruleta o luces parpadeantes que selecciona al azar el primer retador.
   - **Selección de Rival:** El jugador activo sólo puede retar a un oponente que comparta frontera (adyacente ortogonalmente: arriba, abajo, izquierda, derecha) con su territorio.
   - Al hacer clic en un rival adyacente, se abre un modal de confirmación mostrando:
     - **Retador** (con su tiempo y territorio).
     - **Defensor** (y la categoría en juego, que es la del defensor).
   - Botón de **"¡Al Duelo!"**.

---

### ⚔️ Fase 3: Modo Duelo / Pantalla de Presentador (The Duel)
Diseñada para ser proyectada en pantalla grande o TV mientras el presentador controla la acción.

1. **Interfaz del Duelo:**
   - **Lado Izquierdo:** Foto/Avatar, Nombre, Territorio y **Reloj de 45 segundos** del Jugador 1 (Retador).
   - **Lado Derecho:** Foto/Avatar, Nombre, Territorio y **Reloj de 45 segundos** del Jugador 2 (Defensor).
   - **Centro de la Pantalla:**
     - Imagen actual en pantalla gigante y nítida.
     - Categoría en juego en la parte superior.
     - Indicador de racha / turno activo.
     - La respuesta correcta solo es visible para el presentador (o en una barra de pista discreta/toggle).
2. **Controles del Presentador:**
   - **Botón "Acierto" (Tecla Enter o Espacio / Flecha Izquierda/Derecha):**
     - Sonido de acierto.
     - El reloj del jugador actual se pausa inmediatamente y se activa el reloj del rival.
     - Se muestra la siguiente imagen de la categoría.
   - **Botón "Paso" (Tecla 'P' o 'S'):**
     - Sonido de fallo/paso.
     - **Penalización de 3 segundos de congelación:** El reloj del jugador continúa corriendo durante 3 segundos antes de mostrar la siguiente imagen.
3. **Condición de Fin de Duelo:**
   - El reloj de un jugador llega a 00:00.
   - Sonido de alarma/bocina final.
   - Pantalla de victoria con el ganador proclamado.
4. **Post-Duelo:**
   - El ganador absorbe todas las casillas del perdedor en el tablero.
   - Modal de decisión para el ganador:
     - **"Continuar Retando":** Elige un nuevo rival colindante.
     - **"Volver al Tablero":** Cede el turno y el tablero elige un nuevo retador al azar.

---

### 🏆 Fase 4: Fin de Partida (The Floor Champion)
- Cuando un solo jugador domina el 100% de las casillas del tablero.
- Pantalla final de celebración con fuegos artificiales/confeti (`canvas-confetti`), estadísticas de duelos ganados y tiempo total.

---

## 🎨 4. DISEÑO VISUAL Y ESTILO (THE FLOOR TV THEME)
- **Paleta de Colores:** Fondo oscuro profundo (`#0b0d17`, `#111827`), marcos iluminados con neón LED, tonos cian, ámbar, fucsia y dorado.
- **Relojes de 45s:** Tipografía digital de gran tamaño, barra circular o lineal de progreso, cambiando a color rojo pulsante en los últimos 5 segundos.
- **Tablero:** Efecto de perspectiva o vista superior limpia con bordes iluminados y hover interactivo que resalte los vecinos retables.
- **Panel de Control del Presentador (Host Bar):** Barra flotante o drawer con botones táctiles grandes para tablet/móvil o atajos de teclado rápidos.

---

## 🎵 5. SISTEMA DE AUDIO INTEGRADO
Incluye efectos de sonido (pueden ser sintetizados vía Web Audio API o cargados desde `/public/sounds/`):
- `tick.mp3` (reloj corriendo segundo a segundo)
- `warning_5s.mp3` (alarma de últimos 5 segundos)
- `correct.mp3` (campanada o ding de acierto)
- `pass.mp3` (bloqueo de 3s por paso)
- `buzzer.mp3` (tiempo agotado / eliminación)
- `conquer.mp3` (efecto de sonido al teñir el territorio en el tablero)
- `victory.mp3` (fanfarria final)

---

## 📋 6. ENTREGABLES REQUERIDOS EN EL CÓDIGO
1. **Configuración inicial de Vite + SCSS + Tailwind + shadcn/ui**.
2. **Estructura de carpetas modular:**
   - `/src/components/board/` (Tablero, Casillas, Selector Aleatorio).
   - `/src/components/duel/` (Pantalla de Duelo, Cronómetros, Visor de Imágenes, Controles del Presentador).
   - `/src/components/setup/` (Formulario de jugadores, selección de categorías y tamaño de grid).
   - `/src/context/` o `/src/hooks/` (`useGameStore`, `useSoundEffects`, `useTimer`).
   - `/src/data/` (Índice de categorías y carga de archivos JSON).
   - `/src/styles/` (Variables SCSS, animaciones y temas).
3. **Totalmente jugable desde el primer arranque con datos de prueba o categorías reales.**
