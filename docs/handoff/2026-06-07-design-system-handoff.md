# Handoff de diseño · Costa Brava → Boat Club

Sistema de diseño "Salt Memory" para replicar EXACTAMENTE los colores y la estructura
de la web de Costa Brava Rent a Boat en el proyecto del Boat Club.

Fuentes de verdad en el repo original:
- Tokens: `client/src/index.css`
- Mapeo Tailwind: `tailwind.config.ts`
- Sistema documentado: `DESIGN.md`
- Ejemplo vivo (modal cross-promo): `client/src/components/BoatClubModal.tsx`

El Boat Club usa **Tailwind v4**; la web original usa v3. Los tokens (variables CSS) son
idénticos en ambos; solo cambia cómo se mapean a utilidades (ver paso 3).

---

## Paso 1 · Fuentes

Copia estos dos archivos de `client/public/fonts/` al `public/fonts/` del Boat Club:
- `ClashDisplay-Variable.woff2` (titulares)
- `Archivo-Variable.woff2` (cuerpo/UI)

Y declara el `@font-face` al principio del CSS global:

```css
@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/ClashDisplay-Variable.woff2') format('woff2');
  font-weight: 200 700;
  font-display: swap;
  font-style: normal;
  size-adjust: 105%;
}
@font-face {
  font-family: 'Archivo';
  src: url('/fonts/Archivo-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
  size-adjust: 101%;
}
```

Regla: **Clash Display para titulares, Archivo para cuerpo/UI. Nunca intercambiar.**

---

## Paso 2 · Tokens de color (copia tal cual)

Todos los colores son canales HSL sin envolver, pensados para `hsl(var(--token) / alpha)`.
Modo claro es el principal (la marca vive bajo el sol). Modo oscuro incluido por si montas
el panel de socio/admin.

```css
/* ── LIGHT MODE ─────────────────────────────────────────────── */
:root {
  --button-outline: rgba(0,0,0, .10);
  --badge-outline: rgba(0,0,0, .05);
  --opaque-button-border-intensity: -8;
  --elevate-1: rgba(0,0,0, .03);
  --elevate-2: rgba(0,0,0, .08);

  --background: 0 0% 100%;
  --foreground: 215 45% 20%;        /* Coastal Navy — texto, titulares */
  --border: 210 14% 91%;
  --card: 210 20% 97%;              /* Warm Card — fondo de tarjetas */
  --card-foreground: 210 60% 20%;
  --card-border: 200 15% 92%;

  --popover: 200 18% 92%;
  --popover-foreground: 210 60% 20%;
  --popover-border: 200 15% 86%;

  --primary: 215 45% 20%;
  --primary-foreground: 200 20% 98%;
  --secondary: 200 18% 88%;
  --secondary-foreground: 210 60% 20%;
  --muted: 210 15% 93%;
  --muted-foreground: 215 25% 38%;
  --accent: 185 20% 92%;
  --accent-foreground: 210 60% 20%;

  --destructive: 0 75% 45%;         /* Signal Red */
  --destructive-foreground: 0 20% 98%;
  --success: 142 78% 22%;           /* Sea Green — combustible/disponible */
  --success-foreground: 0 0% 98%;
  --popular: 38 92% 32%;            /* Amber Popular — destacados/escasez */
  --popular-foreground: 0 0% 98%;

  --input: 200 15% 82%;
  --ring: 185 75% 45%;              /* Teal Ring — foco/acento */

  --cta: 240 53% 11%;               /* Deep Navy CTA — el ÚNICO color de acción */
  --cta-foreground: 200 20% 98%;

  --whatsapp: 142 70% 49%;
  --whatsapp-hover: 152 68% 34%;
  --whatsapp-active: 157 80% 24%;
  --hero-cta-secondary: 210 35% 76%;
  --hero-cta-secondary-hover: 210 30% 70%;
  --dark-surface: 240 53% 11%;

  /* Paneles (CRM/dashboard) */
  --sidebar: 200 12% 94%;
  --sidebar-foreground: 210 60% 20%;
  --sidebar-border: 200 15% 90%;
  --sidebar-primary: 210 85% 25%;
  --sidebar-primary-foreground: 200 20% 98%;
  --sidebar-accent: 200 15% 90%;
  --sidebar-accent-foreground: 210 60% 20%;
  --sidebar-ring: 185 75% 45%;
  --chart-1: 210 85% 25%;
  --chart-2: 185 75% 35%;
  --chart-3: 15 80% 55%;
  --chart-4: 45 60% 65%;
  --chart-5: 270 60% 55%;

  /* Tipografía y radios */
  --font-sans: 'Archivo', Inter, sans-serif;
  --font-display: 'Clash Display', 'Archivo', sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Menlo, monospace;
  --radius: .5rem;

  /* Sombras (todas con tinte navy, nunca negro puro) */
  --shadow-2xs: 0px 1px 2px 0px hsl(210 15% 25% / 0.05);
  --shadow-xs: 0px 1px 3px 0px hsl(210 15% 25% / 0.08);
  --shadow-sm: 0px 2px 4px 0px hsl(210 15% 25% / 0.06), 0px 1px 2px -1px hsl(210 15% 25% / 0.06);
  --shadow: 0px 4px 6px -1px hsl(210 15% 25% / 0.05), 0px 2px 4px -1px hsl(210 15% 25% / 0.04);
  --shadow-md: 0px 6px 12px -2px hsl(210 15% 25% / 0.05), 0px 2px 4px -1px hsl(210 15% 25% / 0.04);
  --shadow-lg: 0px 10px 15px -3px hsl(210 15% 25% / 0.04), 0px 4px 6px -2px hsl(210 15% 25% / 0.03);
  --shadow-xl: 0px 20px 25px -5px hsl(210 15% 25% / 0.04), 0px 8px 10px -6px hsl(210 15% 25% / 0.03);
  --shadow-2xl: 0px 25px 50px -12px hsl(210 15% 25% / 0.15);
}

/* ── DARK MODE (opcional, para el panel) ───────────────────────── */
.dark {
  --button-outline: rgba(255,255,255, .10);
  --badge-outline: rgba(255,255,255, .05);
  --opaque-button-border-intensity: 9;
  --elevate-1: rgba(255,255,255, .04);
  --elevate-2: rgba(255,255,255, .09);

  --background: 215 50% 12%;
  --foreground: 200 15% 92%;
  --border: 215 30% 18%;
  --card: 215 45% 15%;
  --card-foreground: 200 15% 92%;
  --card-border: 215 35% 20%;

  --popover: 215 40% 18%;
  --popover-foreground: 200 15% 92%;
  --popover-border: 215 35% 22%;

  --primary: 210 70% 35%;
  --primary-foreground: 200 20% 98%;
  --secondary: 215 35% 20%;
  --secondary-foreground: 200 15% 92%;
  --muted: 215 30% 16%;
  --muted-foreground: 200 10% 65%;
  --accent: 185 15% 18%;
  --accent-foreground: 200 15% 92%;

  --destructive: 0 65% 45%;
  --destructive-foreground: 0 20% 98%;
  --success: 142 60% 45%;
  --success-foreground: 0 0% 10%;
  --popular: 38 92% 55%;
  --popular-foreground: 215 45% 20%;

  --input: 215 25% 25%;
  --ring: 185 60% 55%;
  --cta: 15 75% 55%;                /* en oscuro el acento pasa a Warm Coral */
  --cta-foreground: 200 20% 98%;

  --sidebar: 215 48% 13%;
  --sidebar-foreground: 200 15% 92%;
  --sidebar-border: 215 35% 18%;
  --sidebar-primary: 210 70% 35%;
  --sidebar-primary-foreground: 200 20% 98%;
  --sidebar-accent: 215 35% 18%;
  --sidebar-accent-foreground: 200 15% 92%;
  --sidebar-ring: 185 60% 55%;
  --chart-1: 210 75% 65%;
  --chart-2: 185 70% 55%;
  --chart-3: 15 75% 65%;
  --chart-4: 45 55% 75%;
  --chart-5: 270 55% 65%;

  --shadow-2xs: 0px 1px 2px 0px hsl(215 50% 8% / 0.15);
  --shadow-xs: 0px 1px 3px 0px hsl(215 50% 8% / 0.20);
  --shadow-sm: 0px 2px 4px 0px hsl(215 50% 8% / 0.18), 0px 1px 2px -1px hsl(215 50% 8% / 0.18);
  --shadow: 0px 4px 6px -1px hsl(215 50% 8% / 0.22), 0px 2px 4px -1px hsl(215 50% 8% / 0.18);
  --shadow-md: 0px 6px 12px -2px hsl(215 50% 8% / 0.22), 0px 2px 4px -1px hsl(215 50% 8% / 0.18);
  --shadow-lg: 0px 10px 15px -3px hsl(215 50% 8% / 0.22), 0px 4px 6px -2px hsl(215 50% 8% / 0.15);
  --shadow-xl: 0px 20px 25px -5px hsl(215 50% 8% / 0.22), 0px 8px 10px -6px hsl(215 50% 8% / 0.15);
  --shadow-2xl: 0px 25px 50px -12px hsl(215 50% 8% / 0.35);
}
```

### Referencia rápida de color (hex aproximado)

| Token | Rol | HSL | ≈ Hex |
|---|---|---|---|
| `--cta` | Acción única (botones, foco) | `240 53% 11%` | `#1a1a3e` navy casi negro |
| `--foreground` / `--primary` | Texto, titulares | `215 45% 20%` | `#1f3044` coastal navy |
| `--background` | Fondo | `0 0% 100%` | blanco |
| `--card` | Tarjetas/secciones | `210 20% 97%` | `#f2f5f7` warm card |
| `--muted-foreground` | Texto secundario | `215 25% 38%` | `#4a5a6b` |
| `--popular` | Destacado/escasez | `38 92% 32%` | `#9c6500` ámbar oscuro |
| `--success` | Disponible/incluido | `142 78% 22%` | `#0c6b32` verde mar |
| `--ring` | Foco/acento teal | `185 75% 45%` | `#1fb8a8` |
| `--destructive` | Error/destructivo | `0 75% 45%` | `#bf1a1a` |

---

## Paso 3 · Mapeo a utilidades

### Tailwind v4 (Boat Club) — en el CSS global, tras los `:root`:

```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-cta: hsl(var(--cta));
  --color-cta-foreground: hsl(var(--cta-foreground));
  --color-popular: hsl(var(--popular));
  --color-popular-foreground: hsl(var(--popular-foreground));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --font-sans: 'Archivo', Inter, sans-serif;
  --font-display: 'Clash Display', 'Archivo', sans-serif;
  --font-heading: 'Clash Display', Inter, sans-serif;

  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
}
```

Esto habilita `bg-cta`, `text-foreground`, `bg-card`, `text-popular`, `font-display`,
`font-heading`, `rounded-lg`, etc. — exactamente como en la web original.

### Tailwind v3 (referencia) — en `tailwind.config.ts`:

```ts
colors: {
  background: "hsl(var(--background) / <alpha-value>)",
  foreground: "hsl(var(--foreground) / <alpha-value>)",
  cta: { DEFAULT: "hsl(var(--cta) / <alpha-value>)", foreground: "hsl(var(--cta-foreground) / <alpha-value>)" },
  popular: { DEFAULT: "hsl(var(--popular) / <alpha-value>)", foreground: "hsl(var(--popular-foreground) / <alpha-value>)" },
  // ...resto igual que arriba
},
fontFamily: {
  sans: ["'Archivo'", "Inter", "var(--font-sans)"],
  display: ["'Clash Display'", "'Archivo'", "sans-serif"],
  heading: ["'Clash Display'", "Inter", "sans-serif"],
},
borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.25rem" },
```

### Base global (ambos)

```css
@layer base {
  * { border-color: hsl(var(--border)); }
  body { font-family: var(--font-sans); background: hsl(var(--background)); color: hsl(var(--foreground)); -webkit-font-smoothing: antialiased; }
  /* Foco siempre navy CTA, no teal */
  a:focus-visible, button:focus-visible, [role="button"]:focus-visible,
  input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid hsl(var(--cta));
    outline-offset: 2px;
  }
  h1,h2,h3,h4,h5,h6 { text-wrap: balance; }
  p,li,figcaption,blockquote { text-wrap: pretty; }
}
```

---

## Paso 4 · Tipografía (jerarquía)

Diferencia siempre por **peso + escala** (ratio ≥ 1.25 entre niveles). Nunca jerarquía plana.

| Nivel | Fuente | Tamaño | Peso | Uso |
|---|---|---|---|---|
| Display | `font-display` | `clamp(1.75rem, 5.5vw, 3.5rem)` | 700 | Héroes. Mayúsculas, tracking `-0.01em` |
| Headline | `font-heading` | `1.5rem` | 600 | Títulos de sección |
| Title | `font-heading` | `1.125rem` | 500 | Nombres de barco, títulos de tarjeta |
| Body | `font-sans` | `1rem` | 400 | Párrafos. Máx. 65–75ch, line-height 1.6 |
| Label | `font-sans` | `0.75rem` | 500 | Badges, meta. Tracking `0.01em` |

---

## Paso 5 · Componentes firma (recetas)

### Botón CTA (pill) — el elemento característico
```html
<a class="inline-flex items-center justify-center gap-2 rounded-full bg-cta px-6 py-3
          font-medium text-white cta-hover-lift">
  Hazte socio
</a>
```
- **Forma píldora (`rounded-full`) SIEMPRE.** Es la firma del sistema.
- Altura mínima 44px (touch target).
- Secundario: `bg-transparent border border-foreground/10 text-foreground` (hover sube a `/30`).
- Ghost: `bg-transparent text-foreground` (hover: subrayado).

### Tarjeta
```html
<div class="rounded-2xl bg-card p-6 text-card-foreground">…</div>
```
- Radio 16px (`rounded-2xl`), mayor que botones para jerarquía.
- **Plana en reposo, sin sombra.** Nada de cards anidadas.

### Destacar una tarjeta (sin sombra)
Borde fino navy + badge pill, NO sombra ni stripe lateral:
```html
<div class="relative rounded-2xl border-2 border-cta bg-card p-6">
  <span class="absolute left-4 top-0 -translate-y-1/2 rounded-full bg-cta px-3 py-0.5
               text-xs font-medium text-white">Recomendado</span>
  …
</div>
```

### Badges
- Default: `bg-foreground/10 text-foreground`.
- Semánticos: `bg-popular text-white` (popular), `bg-success text-white` (incluido), `bg-cta text-white` (recomendado).

### Utilidades de animación (añádelas al CSS global)
```css
/* Lift de CTA al hover — GPU (transform) */
.cta-hover-lift { transition: transform .2s ease, opacity .2s ease; }
.cta-hover-lift:hover { transform: translateY(-1px) scale(1.03); }
.cta-hover-lift:active { transform: translateY(0) scale(.98); }

/* Botón flotante elevado (sombra firma) */
.btn-elevated { box-shadow: 0 4px 14px hsl(var(--foreground) / .35); transition: transform .2s ease, box-shadow .2s ease; will-change: transform, box-shadow; }
.btn-elevated:hover { transform: translateY(-2px); box-shadow: 0 6px 20px hsl(var(--foreground) / .45); }
.btn-elevated:active { transform: translateY(0); box-shadow: 0 2px 8px hsl(var(--foreground) / .3); }
```
Curva de easing estándar del sistema: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out). Sin bounce.

---

## Paso 6 · Leyes de diseño (respétalas o se rompe la marca)

1. **One Action Rule** — `bg-cta` aparece en máximo 1–2 elementos por pantalla. Su rareza lo hace visible.
2. **Earned Depth** — sin sombras en reposo. La sombra es respuesta a interacción (hover/focus/modal).
3. **Quiet Surface** — los fondos no compiten con la fotografía (las tarjetas se quedan a ±3% de luminosidad del fondo).
4. **Píldora siempre** — todo botón es `rounded-full`.
5. **La foto vende** — deja respirar al mar; la interfaz se aparta.
6. **Prohibido:** `#000`/`#fff` (tinta todo hacia el navy), gradient text (`background-clip:text`), stripes laterales de color (`border-l` >1px), glassmorphism decorativo, animar propiedades de layout (solo transform/opacity), y guiones largos en copy.

---

## Ejemplo de referencia

El popup de cross-promo (`client/src/components/BoatClubModal.tsx`) ya aplica todo esto:
cabecera navy (`bg-foreground`) con resplandor ámbar (`bg-popular/25 blur-3xl`), título
`font-heading`, lista de ventajas con icono en círculo `bg-cta/10 text-cta`, precio con
jerarquía por escala, y pill CTA `bg-cta text-white`. Úsalo como plantilla de "cómo se
ve un componente correcto" en este sistema.
