Ultima actualizacion: Abril 2026

# Costa Brava Rent a Boat - Design Guidelines

## Design Approach
**Editorial Nautico**: Premium, clean aesthetic inspired by Nautal and Click&Boat. The design emphasizes trust, generous whitespace, and a single CTA accent color (dark navy in light mode, coral in dark mode) against a neutral navy/white palette. No gradients, no decorative animations, no shadows on cards.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Navy: #1A2B4A / 215 45% 20% (primary text and foreground)
- Pure White: #FFFFFF / 0 0% 100% (page background)
- Subtle Gray: #F5F7FA / 210 20% 97% (card backgrounds)

**CTA Accent (adaptive per mode):**
- Light mode CTA: 240 53% 11% (dark navy-indigo - primary actions, book buttons)
- Dark mode CTA: 15 75% 55% (coral - primary actions, book buttons)

**Neutral:**
- Muted text: #6B7C93 / 215 20% 46%
- Border: #E8ECF1 / 210 14% 91%

**Status (no additional colors):**
- Availability/success indicators use navy (`bg-primary`) instead of green
- Warning/caution uses coral (`bg-cta/10`, `text-cta`)
- Destructive/error is the only exception: `--destructive` (red)

### B. Typography
- **Headings**: Clash Display (variable, 200-700) - used via `font-heading` or `font-display`. `font-light` for large titles (5xl-8xl), `font-medium` for section titles (3xl-4xl)
- **Body**: Archivo (variable, 100-900 + italic) - used via `font-sans`. Clean, readable sans-serif. Inter is only a system fallback.
- **Key principle**: Headings use Clash Display (`font-heading`). Body uses Archivo (`font-sans`). Large titles use `font-light` + `tracking-tight` for editorial elegance. Never bold for main headings.

### C. Layout System
**Spacing between sections**: `py-24 md:py-32` (96-128px) - generous breathing room
- Internal padding: p-6 for cards, p-8 for feature items
- Grid gaps: gap-4 sm:gap-6 lg:gap-8

### D. Component Styles

**Buttons**: Pill-shaped (`rounded-full`), no shadows, no elevate effects
- Primary CTA: `bg-cta text-cta-foreground`, px-8 py-3 (dark navy in light mode, coral in dark mode)
- Secondary: outline with border, rounded-full
- Ghost: no border, hover:underline

**Cards**: `rounded-2xl`, border only (`border-border`), no shadow (`shadow-none`)
- Hover: border-color transitions to cta/50
- Internal padding: p-6

**Badges**: Pill-shaped (`rounded-full`), neutral gray (`bg-foreground/10 text-foreground`), `font-medium`

**Touch Targets (WCAG 2.1 AA):**
- All buttons: `min-h-11` (44px) minimum
- All inputs: `h-11` (44px) with `py-3`
- Icon buttons: `h-11 w-11` (44px square)
- Tappable links: minimum `py-2 px-3` padding

**Safe Areas (iOS):**
- `viewport-fit=cover` enabled in HTML meta
- `.pb-safe`, `.pt-safe`, `.mb-safe`, `.mt-safe`, `.bottom-safe` CSS utilities
- Applied to: booking modal, sticky CTA, WhatsApp button, fixed nav

**Navigation**: Fixed header, 3 links (Flota, Destinos, Blog) + CTA pill button (`bg-cta`)
- Transparent on hero, white with border-b on scroll
- No backdrop-blur, no shadow

**Hero**: Full-viewport, reduced overlay (35-40%), centered content
- Title: XXL (5xl-8xl), font-light, tracking-tight, white
- Single CTA pill button (`bg-cta`)
- Trust indicators: inline text line, no colored icons

**Boat Cards**: Large image (55-60%), specs as inline text ("6 personas | 40 CV"), single text-link CTA
- Availability: small navy dot (`bg-primary`), not large badge
- License badge: neutral pill on image

**Footer**: Navy (#1A2B4A) background, 3 columns, monochrome social icons

## Visual Treatment

### What We Use
- Subtle borders for card separation
- Generous whitespace for visual hierarchy
- Real photography (no AI-generated images)
- Linear stroke icons (not filled, not colored circles)

### What We Do NOT Use
- Gradients (no blue-to-turquoise, no hero gradients beyond overlay)
- Wave dividers or decorative SVG separators
- Bounce or decorative animations
- Shadow-based elevation (no shadow-sm, shadow-lg on cards)
- Colored icon circles (no bg-green-100 rounded-full, no bg-blue-50 circles)
- Multiple CTA colors (`--cta` is the only accent, adapts per color mode)
- Hardcoded Tailwind colors (no blue-*, green-*, purple-*, yellow-*, amber-*, indigo-*, slate-*)
- Only exceptions: WhatsApp brand green (#25D366) and red destructive states

### CSS Design Tokens (index.css)
All colors via CSS custom properties in HSL:

**Light mode:**
- `--background`: 0 0% 100% (white)
- `--foreground` / `--primary`: 215 45% 20% (navy)
- `--cta`: 240 53% 11% (dark navy-indigo)
- `--muted`: 210 15% 93%
- `--destructive`: 0 75% 45% (red)

**Dark mode:**
- `--background`: 215 50% 12%
- `--foreground`: 200 15% 92%
- `--primary`: 210 70% 35%
- `--cta`: 15 75% 55% (coral)

## Key Design Principles
1. **Editorial Clarity**: Clean layouts, dramatic typography, generous spacing
2. **Single Accent**: CTA color adapts per mode (dark navy in light mode, coral in dark mode) - everything else is navy/white/gray
3. **Trust Through Simplicity**: Less decoration = more professional
4. **Mobile-First WCAG 2.1 AA**: 44px touch targets, safe areas, 14px min text, contrast ratios
5. **Real Photography**: Genuine boat and customer photos, never AI-generated
6. **YAGNI**: No decorative elements that don't serve conversion