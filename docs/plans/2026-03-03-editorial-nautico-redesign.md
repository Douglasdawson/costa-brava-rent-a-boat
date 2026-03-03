# Editorial Nautico - Premium Polish Redesign

## Context
Audit of current design identified "AI slop" patterns: excessive shadows, saturated colors, stock shadcn components, wave dividers, bounce animations. Goal: elevate to Nautal/Click&Boat level while keeping current structure and functionality.

## Approach
Polish premium over current structure. Editorial Nautico aesthetic: neutral palette + single coral accent, dramatic typography, generous spacing, clean cards.

---

## 1. Design System Base

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Background | #FFFFFF | Page background (pure white) |
| Foreground | #1A2B4A | Primary text (navy) |
| Muted | #6B7C93 | Secondary text (blue-gray) |
| Card | #F5F7FA | Card backgrounds |
| Border | #E8ECF1 | Borders, dividers |
| CTA | #E86C4F | Primary actions only |
| CTA hover | #D4583B | CTA hover state |
| Success | #34D399 | Availability indicator |

### Typography
- Headings: Outfit `font-light` for large titles (5xl-8xl), `font-medium` for section titles (3xl-4xl)
- Body: Inter (unchanged)
- No bold headings - elegance through size and lightness

### Buttons
- Primary (CTA): coral, `rounded-full` (pill), `px-8 py-3`
- Secondary: outline with gray border, `rounded-full`
- Ghost: no border, text + underline on hover
- Remove `elevate` variant entirely

### Cards
- Border: `1px solid #E8ECF1`, no shadow
- Hover: border-color transitions to coral or navy
- `rounded-2xl` (16px) instead of xl (12px)
- Internal padding: `p-6` instead of `p-4`

### Spacing
- Between sections: `py-24 md:py-32` (96-128px) vs current `py-12 md:py-16`

---

## 2. Navigation
- Keep transparent -> white on scroll
- Simplify links: Logo | Flota, Destinos, Blog | CTA "Reservar" pill coral
- Language selector: globe icon, discrete
- Mobile: bottom sheet instead of hamburger
- Move FAQ, Gift Cards to footer only

## 3. Hero
- Overlay reduced to 35-40% (show more photo)
- Title XXL centered: `text-5xl md:text-7xl lg:text-8xl font-light tracking-tight`
- Subtitle: `text-lg font-light opacity-80`
- Single CTA: coral pill "Reservar ahora"
- Trust: horizontal minimal line below CTA ("4.8 Google | +2000 clientes | Asegurado")
- Remove bounce chevron
- Price "Desde 70EUR" as discrete badge next to CTA

## 4. Fleet / Boat Cards
- Image: 55-60% of card (3:2 ratio), no hover overlay
- Name: `text-xl font-medium`
- Specs: horizontal row, gray text ("6 personas | 40 CV | Sin licencia")
- Price: right-aligned, coral ("Desde 70EUR/h")
- Single button: "Ver detalles" as text link with arrow
- License badge: light gray pill (subtle)
- Availability: small green/red dot, not large badge

## 5. Features Section
- Reduce to 3 key features in horizontal row
- "Sin licencia necesaria", "Todo incluido", "Puerto de Blanes"
- Each: linear icon (stroke) + title + 1-line description
- Move extras to booking flow context
- Alternative: "Como funciona" with 3 numbered steps

## 6. Reviews
- Large rating: "4.8" as hero number + 5 stars + "X opiniones en Google"
- Review cards: white bg, large typographic quotes (serif decorative), name + date
- Horizontal carousel with peek (not grid)
- Google Reviews logo for credibility

## 7. Footer
- Background: navy #1A2B4A (consistent with palette)
- 3 columns: Empresa | Contacto | Legal
- Orphaned nav links moved here
- Newsletter: input + pill button in one line
- Social: monochrome white icons
- Much cleaner, less text

## 8. Remove "AI Slop" Elements
- Wave dividers -> remove completely (spacing only)
- Bounce animations -> remove
- Excessive gradient overlays -> reduce opacity
- Colored circle icons -> linear monochrome icons
- Multicolor badges -> neutral gray pills
- Shadow-lg on cards -> subtle border
- Gift card banner -> redesign as editorial section or move to footer

---

## Reference Sites
- Nautal (nautal.com): clean card-based, neutral palette, trust-heavy
- Click&Boat (clickandboat.com): generous whitespace, mosaic layouts, strong social proof

## Success Criteria
- No visible shadcn defaults remaining
- Consistent single-accent color usage
- Generous whitespace throughout
- Typography hierarchy clearly editorial
- Cards look custom, not template
- Zero decorative animations (waves, bounces)
