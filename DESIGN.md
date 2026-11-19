# DESIGN.md — Sistema visual "flat, squircle y gamificado"

Aplica este sistema de diseño a todo el proyecto. No es una sugerencia: es la identidad visual.
Trátalo como la fuente de la verdad del diseño. Si algo de lo que ya hay lo contradice, gana este documento.

## 0. Filosofía (léela antes de tocar nada)
- **El diseño es la bandera del producto.** Objetivo: que aunque algo falle, quien lo use piense "esto falla, pero se ve tan bien que con arreglarlo me vale". Una pantalla no está terminada porque funcione: tiene que verse pulida en el móvil y en el escritorio, en claro y en oscuro.
- **Público joven (adolescentes y veinteañeros)**: moderno, directo, con un punto de juego, pero serio. Ni infantil ni corporativo.
- **Flat y mate**: sin sombras (ni `shadow-*`, ni en toasts ni en diálogos), sin degradados, sin brillos ni glassmorphism. La profundidad sale del **color de superficie, el borde fino y el espacio en blanco**.
- **Nada de look de panel de administración**: sin sidebars, sin menús laterales, sin dashboards corporativos y sin tablas densas como pantalla principal. Se navega con **tarjetas grandes y táctiles** (estilo IFTTT).
- **Squircle en todas partes**: las esquinas son superelipses (como los iconos de iOS), no círculos. Es la firma visual más reconocible del sistema.
- **Tipografía con mucho peso**: los títulos van en extrabold. La jerarquía se marca con peso y tamaño, no con colores.
- Ante la duda entre "funciona" y "funciona y se ve genial", siempre lo segundo.

## 1. Stack de referencia
Vite + React + TypeScript · **Tailwind CSS v4** (configuración en el CSS con `@theme`, sin `tailwind.config`) · **shadcn/ui** (estilo `radix-nova`, `baseColor: neutral`, `cssVariables: true`, iconos `lucide`) · Radix · `tw-animate-css` · **lucide-react** · **sonner** para los toasts · fuente **Montserrat Variable** autoalojada con `@fontsource-variable/montserrat` (nunca desde Google Fonts ni otro CDN).

Si el proyecto usa otro stack, traduce los tokens y las reglas: lo que tiene que quedar igual es el resultado visual, no las clases (ver el apartado 11).

## 2. El CSS base: cópialo entero en `src/index.css`
Todos los colores están en OKLCH y tienen el contraste AA comprobado en los dos temas. **Usa siempre los tokens y nunca colores fijos** (`bg-white`, `text-gray-500`, `#hex`...: prohibidos).

```css
@import 'tailwindcss';
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/montserrat";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
    --font-heading: var(--font-sans);
    --font-sans: 'Montserrat Variable', ui-sans-serif, system-ui, sans-serif;
    --color-ring: var(--ring);
    --color-input: var(--input);
    --color-border: var(--border);
    --color-destructive: var(--destructive);
    --color-success-foreground: var(--success-foreground);
    --color-success: var(--success);
    --color-highlight-foreground: var(--highlight-foreground);
    --color-highlight: var(--highlight);
    --color-accent-foreground: var(--accent-foreground);
    --color-accent: var(--accent);
    --color-muted-foreground: var(--muted-foreground);
    --color-muted: var(--muted);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-secondary: var(--secondary);
    --color-primary-foreground: var(--primary-foreground);
    --color-primary: var(--primary);
    --color-popover-foreground: var(--popover-foreground);
    --color-popover: var(--popover);
    --color-card-foreground: var(--card-foreground);
    --color-card: var(--card);
    --color-foreground: var(--foreground);
    --color-background: var(--background);
    --color-chart-1: var(--chart-1);
    --color-chart-2: var(--chart-2);
    --color-chart-3: var(--chart-3);
    --color-chart-4: var(--chart-4);
    --color-chart-5: var(--chart-5);
    --radius-sm: calc(var(--radius) * 0.6);
    --radius-md: calc(var(--radius) * 0.8);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) * 1.4);
    --radius-2xl: calc(var(--radius) * 1.8);
    --radius-3xl: calc(var(--radius) * 2.2);
    --radius-4xl: calc(var(--radius) * 2.6);
}

/*
 * Palette — flat and matte.
 *   Paper / Ink   warm neutrals for surfaces and text
 *   Violet        brand and primary actions
 *   Lime          competitive/reward highlight — use sparingly
 *   Green / Red   success / error
 */
:root {
    --background: oklch(0.985 0.004 85);
    --foreground: oklch(0.21 0.015 275);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.21 0.015 275);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.21 0.015 275);
    --primary: oklch(0.52 0.14 285);
    --primary-foreground: oklch(0.985 0.004 85);
    --secondary: oklch(0.945 0.022 285);
    --secondary-foreground: oklch(0.38 0.11 285);
    --muted: oklch(0.955 0.006 85);
    --muted-foreground: oklch(0.49 0.015 275);
    --accent: oklch(0.955 0.006 85);
    --accent-foreground: oklch(0.21 0.015 275);
    --highlight: oklch(0.88 0.14 125);
    --highlight-foreground: oklch(0.26 0.05 125);
    --success: oklch(0.53 0.11 155);
    --success-foreground: oklch(0.985 0.004 85);
    --destructive: oklch(0.56 0.17 25);
    --border: oklch(0.91 0.008 85);
    --input: oklch(0.65 0.012 85);
    --ring: oklch(0.52 0.14 285);
    --chart-1: oklch(0.52 0.14 285);
    --chart-2: oklch(0.88 0.14 125);
    --chart-3: oklch(0.56 0.11 155);
    --chart-4: oklch(0.72 0.08 285);
    --chart-5: oklch(0.49 0.015 275);
    --radius: 0.875rem;
}

.dark {
    --background: oklch(0.17 0.012 275);
    --foreground: oklch(0.95 0.005 85);
    --card: oklch(0.205 0.014 275);
    --card-foreground: oklch(0.95 0.005 85);
    --popover: oklch(0.205 0.014 275);
    --popover-foreground: oklch(0.95 0.005 85);
    --primary: oklch(0.72 0.12 285);
    --primary-foreground: oklch(0.17 0.012 275);
    --secondary: oklch(0.27 0.04 285);
    --secondary-foreground: oklch(0.88 0.05 285);
    --muted: oklch(0.245 0.014 275);
    --muted-foreground: oklch(0.72 0.012 275);
    --accent: oklch(0.245 0.014 275);
    --accent-foreground: oklch(0.95 0.005 85);
    --highlight: oklch(0.85 0.13 125);
    --highlight-foreground: oklch(0.22 0.04 125);
    --success: oklch(0.72 0.12 155);
    --success-foreground: oklch(0.17 0.012 275);
    --destructive: oklch(0.68 0.15 25);
    --border: oklch(0.29 0.014 275);
    --input: oklch(0.52 0.014 275);
    --ring: oklch(0.72 0.12 285);
    --chart-1: oklch(0.72 0.12 285);
    --chart-2: oklch(0.85 0.13 125);
    --chart-3: oklch(0.72 0.12 155);
    --chart-4: oklch(0.55 0.08 285);
    --chart-5: oklch(0.72 0.012 275);
}

/*
 * Squircle corners EVERYWHERE. A squircle corner looks tighter than a round one with the
 * same radius, so the base radius is bumped where `corner-shape` is supported.
 * Browsers without it keep regular rounded corners (graceful fallback).
 */
@supports (corner-shape: squircle) {
  html:root { --radius: 1.4rem; }   /* `html:root` outranks `:root` */
  *, ::before, ::after { corner-shape: squircle; }
}

/*
 * `squircle` utility: the ONLY shape for icon tiles, avatars and monograms (never circles).
 * Proportional radius → same look at any size.
 */
@utility squircle {
  border-radius: 30%;
  @supports (corner-shape: squircle) {
    border-radius: 50%;
    corner-shape: squircle;
  }
}

/*
 * Scrollbar: thin, floating, violet on hover, no arrows.
 * NEVER mix scrollbar-width/scrollbar-color with ::-webkit-scrollbar on the same element:
 * Chromium >= 121 ignores the webkit rules if the standard ones are present.
 */
:root {
  --scrollbar-thumb: color-mix(in oklch, var(--muted-foreground) 45%, transparent);
  --scrollbar-thumb-hover: var(--primary);
}
::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb) padding-box;
  border: 3px solid transparent;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover { background-color: var(--scrollbar-thumb-hover); }
::-webkit-scrollbar-thumb:active { background-color: var(--scrollbar-thumb-hover); border-width: 2px; }
::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
@supports not selector(::-webkit-scrollbar) {
  * { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) transparent; }
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { @apply font-sans antialiased; color-scheme: light; }
  html.dark { color-scheme: dark; }
  body { @apply bg-background text-foreground; }
  h1, h2, h3 { @apply font-heading tracking-tight; }
}
```

### Para qué sirve cada color
| Token | Uso | No lo uses para |
|---|---|---|
| `background` / `foreground` | Papel cálido y tinta. Fondo de la página y texto. | — |
| `card` | Superficie de tarjetas, inputs y filas (blanco puro sobre papel). | — |
| `primary` (violeta mate) | Marca, botón principal, paso actual, selección, foco, "tú". | Decorar sin motivo |
| `secondary` (violeta suave) | Tiles de icono neutros, badges secundarios, fondo de lo seleccionado. | — |
| `muted` / `muted-foreground` | Chips inactivos, skeletons, texto de apoyo. | — |
| `highlight` (lima mate) | **Solo lo que premia o compite**: puntos, primer puesto, pantalla de resultado, logros. Con mucha moderación. | Botones o enlaces normales |
| `success` / `destructive` | Acierto o error, confirmación o borrado. Casi siempre **en versión suave**: `bg-success/10`, `bg-destructive/10` con texto del mismo color. | Fondos sólidos grandes |
| `accent` | Neutro: lo usa shadcn para el hover de los menús. | Destacar cosas |

Regla de oro: en cada pantalla, **un solo** elemento violeta sólido llamativo (la acción principal) y la lima casi nunca.

## 3. Tema claro y oscuro
- `darkMode` por clase (`.dark` en `<html>`). Hay tres preferencias: `light`, `dark` y `system` (la de por defecto). Se guarda en `localStorage` con try/catch, porque puede fallar.
- **Sin parpadeo**: un script inline en `index.html`, antes de que se pinte nada, aplica la clase:
```html
<meta name="color-scheme" content="light dark" />
<script>
  (function () {
    var preference = 'system'
    try { preference = localStorage.getItem('app.theme') || 'system' } catch (e) {}
    var dark = preference === 'dark' ||
      (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  })()
</script>
```
- Si la preferencia es `system`, escucha `matchMedia('(prefers-color-scheme: dark)')` para cambiar en vivo.
- `ThemeToggle`: un botón `ghost size="icon"` con Sol o Luna que abre un `DropdownMenu` con un `RadioGroup` (Claro / Oscuro / Sistema, con los iconos Sun, Moon y Monitor).
- **Comprueba cada pantalla en los dos temas.** Si algo solo se ve bien en uno, está mal.

## 4. Forma: radios y squircle
- El radio base es `--radius`: 0.875rem, que sube a 1.4rem con `corner-shape: squircle`. Todo lo que lleva `rounded-*` hereda la curva squircle sin hacer nada más.
- Escala de uso:
  - `rounded-3xl`: tarjetas grandes, paneles, diálogos y el bloque hero de resultado.
  - `rounded-2xl`: filas de listado, opciones de respuesta y filas de ranking.
  - `rounded-xl`: botones e inputs.
  - `rounded-lg`: botones `sm` y elementos pequeños.
  - `rounded-full`: **solo** chips o pills de texto (badges, etiquetas de puntos) y barras de progreso.
- **Iconos en caja, avatares, monogramas, números de posición y círculos de paso: siempre con la clase `squircle`**, nunca con `rounded-full` ni con un `rounded-*` fijo.

## 5. Tipografía
- Montserrat Variable en toda la app, `antialiased`, y `tracking-tight` en h1, h2 y h3.
- Escala:
  - H1 de página: `text-3xl sm:text-4xl font-extrabold break-words`.
  - Eyebrow (la línea sobre el H1): `text-sm font-bold text-primary`.
  - Subtítulo: `text-muted-foreground max-w-2xl`.
  - H2 de sección: `text-lg font-extrabold` (o `text-xl font-bold` en los paneles de estado).
  - Título de tarjeta: `text-base sm:text-lg font-bold`.
  - Texto de apoyo: `text-sm text-muted-foreground`.
  - Micro-etiqueta: `text-[0.7rem] font-semibold uppercase text-muted-foreground`.
  - Pregunta o enunciado protagonista: `text-2xl sm:text-3xl font-extrabold leading-snug`.
  - Cifra hero (puntos): `text-6xl font-extrabold tabular-nums`.
- **Todos los números que cambian o se comparan llevan `tabular-nums`** (puntos, posiciones, "3 de 10").
- Los botones van en `font-semibold` y los badges en `font-bold`. Casi nunca se usa peso normal salvo en los párrafos.
- En un input con texto grande o en negrita, añade `placeholder:font-normal` y un placeholder que empiece por "Ej.:"; si no, parece texto ya escrito.

## 6. Layout y navegación
- **Shell**: una cabecera ligera (`max-w-6xl mx-auto px-4 sm:px-6 py-4`) con el logo a la izquierda y, a la derecha, idioma, tema y menú de usuario (botones `ghost size="icon"`). Debajo, `main` con `max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-16`. **Sin sidebar y sin footer pesado.**
- **Logo**: un tile `squircle` de `size-8` en `bg-primary text-primary-foreground` con un icono de lucide `size-5` dentro, más el nombre en `text-lg font-extrabold tracking-tight`.
- **Pantalla principal de cada área = una cuadrícula de tarjetas (`ModuleGrid` + `ModuleCard`)**. Cada tarjeta lleva a una parte: un formulario, un listado, un detalle o el juego.
- **Pantallas de destino**: un `PageHeader` con un botón "← Volver" (`ghost sm -ml-3`) que lleva a la cuadrícula de origen, el eyebrow, el H1 y el subtítulo, con el hueco `aside` para badges o acciones. `mb-8` bajo la cabecera.
- Los listados se muestran como tarjetas o filas amplias, nunca como una tabla densa.
- Un formulario largo se divide en pasos con `StepIndicator`.
- **Mobile-first**: lo primero que se diseña es el ancho del móvil. Las tarjetas son filas compactas en el móvil y tiles en `sm:` y más.

## 7. Componentes clave (recetas exactas)

### ModuleCard + ModuleGrid (la pieza estrella)
```tsx
// Grid
<ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">…<li>card</li>…</ul>

// Card (Link when it has a destination; div with opacity-70 + "Próximamente" badge when not)
const base = 'group block h-full rounded-3xl border bg-card p-4 text-card-foreground sm:p-6'
const interactive = 'outline-none transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0'

<div className="flex items-center gap-4 sm:h-full sm:flex-col sm:items-stretch sm:gap-0">
  <div className="flex items-start justify-between gap-3">
    <span aria-hidden className="grid size-12 shrink-0 place-items-center squircle text-xl font-extrabold uppercase bg-primary text-primary-foreground">
      <Icon className="size-6" />   {/* or an initial letter for entities without an icon */}
    </span>
    <span className="hidden sm:inline-flex">{/* ArrowRight or "Soon" badge */}</span>
  </div>
  <div className="min-w-0 flex-1 space-y-1 sm:mt-5">
    <h3 className="text-base font-bold break-words sm:text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
    {/* optional meta: flex flex-wrap gap-2 pt-1 with badges */}
  </div>
  <span className="sm:hidden">{/* ArrowRight on mobile, on the right */}</span>
</div>

// Arrow
<ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground motion-reduce:transition-none" />
```
Tonos del tile de icono: `primary` (bg-primary), `highlight` (bg-highlight, para lo competitivo) y `neutral` (bg-secondary text-secondary-foreground).
"Próximamente": `rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground`, y la tarjeta sin enlace con `opacity-70 aria-disabled`.

### Button (shadcn adaptado)
- Base: `rounded-xl font-semibold`, foco `focus-visible:ring-3 ring-ring/50` y `active:translate-y-px` (un pequeño "click" físico).
- **Tamaños táctiles**: `default` = `h-11 px-5`, `sm` = `h-9`, `lg` = `h-12 px-6 text-base`, `icon` = `size-11`. Nada interactivo por debajo de 40 px.
- Variantes:
  - `default`: `bg-primary`, con `hover:bg-primary/80`.
  - `secondary`: `bg-secondary text-secondary-foreground`.
  - `outline`: `border-border bg-background hover:bg-muted`; en oscuro, `bg-input/30`.
  - `ghost`: `hover:bg-muted`.
  - **`destructive` es suave**: `bg-destructive/10 text-destructive hover:bg-destructive/20`, nunca rojo sólido.
- Los iconos van dentro con `data-icon="inline-start|inline-end"` y miden `size-4` por defecto.
- No metas datos de longitud variable (emails, nombres) dentro de un botón: se cortan en el móvil. Ponlos en el texto de alrededor y deja el botón corto.
- La CTA final en el móvil va a lo ancho: `size="lg" className="w-full"`.

### Input / Textarea / Select
`h-11 rounded-xl border border-input bg-card px-3.5 text-base md:text-sm`, con foco `border-ring ring-3 ring-ring/50` y error `aria-invalid:border-destructive ring-destructive/20`. En oscuro, `bg-input/30`.
**Nada de controles nativos** (select, checkbox, date picker, radio): usa siempre shadcn o Radix con el mismo aspecto.

### Badge
`h-6 rounded-4xl px-2.5 text-xs font-bold`. Variantes: `default` (violeta), `secondary`, **`highlight` (lima)**, `destructive` (suave), `outline`.
Pills informativas sueltas: `rounded-full px-2.5 py-1 text-xs font-bold`, en la versión suave del color (`bg-success/15 text-success`, `bg-destructive/10 text-destructive`, `bg-secondary text-secondary-foreground`).

### Chips de filtro (ChipGroup)
Un `ToggleGroup` de selección única con `spacing={2}` y **`flex-wrap`** (nunca scroll horizontal: en el móvil el último chip queda cortado y no se nota que hay más). Inactivo `bg-muted`, activo `data-[state=on]:bg-primary text-primary-foreground`.

### StatusPanel (vacío, error o sin acceso)
```tsx
<section className="flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-card px-6 py-12 text-center sm:py-16">
  <span className="grid size-16 place-items-center squircle bg-secondary text-secondary-foreground">
    <Icon className="size-8" />   {/* error: bg-destructive/10 text-destructive, role="alert" */}
  </span>
  <div className="max-w-md space-y-2">
    <h2 className="text-xl font-bold">Título amable</h2>
    <div className="text-muted-foreground">Qué pasa y qué puedes hacer</div>
  </div>
  <div className="flex flex-wrap justify-center gap-2">{/* actions */}</div>
</section>
```
**Borde discontinuo + icono grande en squircle + título + acción.** Cada vista tiene sus estados de carga, vacío y error, y todos se ven así de cuidados. En un error inesperado, enseña la referencia o correlationId en texto pequeño.

### Skeletons
`animate-pulse bg-muted` con **la misma forma que el contenido real**: una cabecera de 3 líneas (`h-4 w-32`, `h-10 w-2/3`, `h-4 w-1/2`) y una cuadrícula de tarjetas `h-44 rounded-3xl` con el mismo grid que `ModuleGrid`. Lleva `role="status"` con su `aria-label`.

### StepIndicator (formularios por pasos)
Un `ol` en grid de N columnas. Cada paso tiene un círculo `squircle size-8 text-sm font-extrabold`: el actual en `bg-primary`, los hechos en `bg-success` con un `Check strokeWidth={3}` y los pendientes en `bg-muted`. La etiqueta va en `text-sm font-bold` (y en muted si no es el paso actual).

### Opciones de respuesta grandes (quiz, encuestas, elegir)
```tsx
'flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-3 sm:p-4 text-left text-base font-semibold transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=checked]:border-primary data-[state=checked]:bg-secondary'
// Left: squircle size-10 with the letter (A, B, C…) in bg-muted → when selected, bg-primary with a Check
```
Se construyen con los primitivos `RadioGroup` o `Checkbox` de Radix, nunca con inputs nativos.

### Barra de progreso
El texto "Pregunta 3 de 10" en `text-sm font-bold text-muted-foreground tabular-nums`, y debajo la pista `h-2.5 rounded-full bg-muted` con el relleno `bg-primary rounded-full transition-[width] duration-300`. Lleva `role="progressbar"` con `aria-valuenow`.

### Hero de resultado o recompensa (el momento lima)
```tsx
<div className="space-y-4 rounded-3xl bg-highlight p-6 sm:p-8 text-center text-highlight-foreground">
  <Trophy className="mx-auto size-12" />
  <h1 className="text-2xl font-extrabold">¡Lo has bordado!</h1>
  <span className="block text-6xl font-extrabold tabular-nums">1.250</span>
  <span className="text-sm font-semibold">puntos de 1.500 posibles</span>
  <p className="font-bold">8 aciertos de 10</p>
</div>
```
El mensaje cambia según el resultado (≥80 %: "¡Lo has bordado!", ≥50 %: "¡Bien jugado!", menos: "¡A por la revancha!").

### Fila de ranking
`flex items-center gap-3 rounded-2xl border bg-card p-3`. A la izquierda, la posición en un squircle `size-10 font-extrabold tabular-nums`: **el 1.º en `bg-highlight`**, el 2.º y el 3.º en `bg-secondary` y el resto en `bg-muted`. En medio, el nombre en `font-bold truncate` y el subtítulo en `text-xs muted`. A la derecha, los puntos en `text-lg font-extrabold tabular-nums` con su micro-etiqueta en mayúsculas debajo.
**Tu fila**: `border-primary bg-secondary/60` más un badge "Tú".

### Filas de desglose (acierto o fallo)
`rounded-2xl border p-3` en tono suave: acierto `border-success/40 bg-success/10`, fallo `border-destructive/30 bg-destructive/5`, en blanco neutro. A la derecha, el icono (CircleCheck, CircleX o CircleMinus) y la etiqueta en `text-xs font-bold` del mismo color.

### Diálogos
`rounded-3xl bg-popover p-6 sm:p-8 ring-1 ring-foreground/10`, **sin sombra**. El overlay es `bg-black/10` con `backdrop-blur-xs`, la animación `fade + zoom-in-95` dura 100 ms y el footer va con `flex-col-reverse sm:flex-row sm:justify-end`.
- Un diálogo que edita listas no debe enfocar su primer campo al abrirse (en el móvil sale el teclado y lo tapa): enfoca el propio diálogo con `onOpenAutoFocus={e => { e.preventDefault(); e.currentTarget.focus() }}`.
- Si una acción confirmada puede fallar (borrar, quitar), usa un `Button` normal dentro del `AlertDialog`, no `AlertDialogAction`: este cierra el diálogo y el error no se llega a ver.

### Toasts (sonner)
`position="top-center"`, siguen el tema de la app, `!shadow-none font-semibold`, con `--normal-bg: var(--popover)`, `--normal-border: var(--border)` y `--border-radius: calc(var(--radius) * 1.4)`. Iconos de color: éxito en `text-success`, información en `text-primary` y error en `text-destructive`.

### Scrollbar
Ya está en el CSS: fina, flotante, sin flechas y violeta al pasar por encima.

## 8. Movimiento y feedback
- Las transiciones son cortas y sutiles (150–300 ms): una tarjeta sube 4 px (`hover:-translate-y-1`), una flecha avanza (`group-hover:translate-x-1`), un botón baja 1 px al pulsarlo y la barra de progreso se anima.
- **Respeta `motion-reduce:`** en todo lo que se mueve.
- **Cada acción tiene su feedback inmediato**: el botón se deshabilita y muestra un spinner mientras envía (y así se evita el doble envío), hay un toast al terminar y un error amable con la solución si falla.
- Nada de animaciones de adorno largas ni de rebotes exagerados.

## 9. Accesibilidad
- El foco siempre se ve: `focus-visible:ring-3 ring-ring/50`. Los iconos decorativos llevan `aria-hidden`.
- Los botones de solo icono llevan `aria-label`. Los errores van con `role="alert"` y la carga con `role="status"`.
- Contraste AA en los dos temas (los tokens ya lo cumplen; no lo rompas con opacidades bajas sobre texto).
- Los elementos táctiles miden 40 px o más, y nunca hay scroll horizontal en la página.

## 10. Voz y microcopy
- **Tutea**, con un tono cercano, directo y con energía, pero sin pasarte de colega. Las frases son cortas.
- Ejemplos del tono: "¡Empezar!", "¡Lo has bordado!", "¡A por la revancha!", "Sin cuenta y sin guardar nada: juega las veces que quieras.", "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.", "Te quedan 2 sin responder".
- Los errores dicen qué ha pasado y qué hacer, nunca "Error 500".
- Usa un lenguaje neutro e inclusivo ("quien gestiona" en lugar de "los gestores").
- Ningún texto visible va escrito a mano en el código: todo pasa por i18n (es/en, como mínimo).

## 11. Si el proyecto no es React + Tailwind (por ejemplo, una app nativa)
- Copia los tokens de color tal cual (OKLCH; pásalos a sRGB o hex si la plataforma no lo admite) con sus variantes clara y oscura.
- Esquinas: usa la curva continua de la plataforma (`borderCurve: 'continuous'` en React Native/iOS; si no existe, un radio generoso). Los iconos y avatares van con una forma superelíptica, nunca en un círculo.
- Montserrat con los pesos 600, 700 y 800 como base de la jerarquía.
- Mismas reglas: flat, sin sombras, tarjetas grandes como navegación, lima solo para recompensas, violeta para la acción principal y estados de vacío, error y carga cuidados.

## 12. Checklist antes de dar por terminada una pantalla
- [ ] Se ve bien en un móvil de 375 px y en el escritorio, sin scroll horizontal.
- [ ] Se ve bien en claro **y** en oscuro.
- [ ] No hay ningún color fijo: todo son tokens.
- [ ] No hay ninguna sombra ni ningún degradado.
- [ ] Los iconos y avatares van en `squircle` y no en círculos.
- [ ] Tiene los estados de carga (un skeleton con la forma real), vacío y error (`StatusPanel`).
- [ ] Hay una sola acción principal violeta, y la lima solo aparece si hay algo que celebrar o que compite.
- [ ] Los números llevan `tabular-nums`.
- [ ] Todo lo táctil mide 40 px o más, el foco se ve y lo que se mueve respeta `motion-reduce`.
- [ ] Los textos salen de i18n y el tono es cercano y en tú.
- [ ] Hay capturas revisadas en el móvil y el escritorio, en los dos temas, y he corregido lo que no estaba a la altura.
