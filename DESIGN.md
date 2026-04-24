---
name: Costa Brava Rent a Boat
description: Boat rental platform in Blanes — the salt memory of a day on the water.
colors:
  deep-navy-cta: "#1a1a3e"
  coastal-navy: "#1f3044"
  soft-steel: "#c4cdd5"
  salt-mist: "#f5f7f8"
  warm-card: "#f2f5f7"
  teal-ring: "#1fb8a8"
  warm-coral-cta-dark: "#d96740"
  signal-red: "#bf1a1a"
  sea-green-fuel: "#16a34a"
  amber-popular: "#f59e0b"
typography:
  display:
    fontFamily: "'Clash Display', 'Archivo', sans-serif"
    fontSize: "clamp(1.75rem, 5.5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Clash Display', 'Archivo', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  title:
    fontFamily: "'Clash Display', 'Archivo', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "'Archivo', Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Archivo', Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.deep-navy-cta}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.deep-navy-cta}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.coastal-navy}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.coastal-navy}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  card-default:
    backgroundColor: "{colors.warm-card}"
    textColor: "{colors.coastal-navy}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "{colors.coastal-navy}"
    rounded: "{rounded.md}"
    padding: "12px"
  badge-default:
    backgroundColor: "{colors.coastal-navy}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-container:
    backgroundColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "12px 24px"
---

# Design System: Costa Brava Rent a Boat

## 1. Overview

**Creative North Star: "The Salt Memory"**

What remains after a day on the water: warmth on the skin, the smell of salt, light reflecting off a surface that never stays still. This design system captures that afterglow. It is not about the boat. It is about the feeling of having been out there, and the pull to go back.

The system rejects three things by name. It is not a luxury yacht charter site (too cold, too aspirational, too much marble and gold). It is not a budget excursion aggregator (clip art, stock photos, screaming prices). It is not a generic travel platform (Booking.com templates, conversion-machine UI, soulless grids). The Salt Memory sits in the space between: professional enough to trust with your family, warm enough to feel like a recommendation from someone who lives here.

Surfaces are quiet. Photography carries emotion. Typography is confident without shouting. The palette is coastal but never obvious. Interactions feel tactile: buttons that respond, cards that breathe, a system that rewards touch.

**Key Characteristics:**
- Light mode. A tourist on the beach in July, phone tilted against the sun. High contrast is not optional.
- Mobile-first. Most visitors browse on phones. Every element is designed for thumbs, not cursors.
- Photography-led. The sea sells itself. The interface recedes.
- Pill-shaped CTAs as the signature interactive element.
- Flat by default, elevated on interaction. Depth is earned, not decorative.
- GPU-composited motion only. Transform and opacity. Nothing else animates.

## 2. Colors: The Salt Palette

A restrained coastal palette built on tinted navy neutrals. The CTA is the single point of commitment; everything else stays quiet so photography dominates.

### Primary

- **Deep Navy CTA** (#1a1a3e / HSL 240 53% 11%): the singular action color. Booking buttons, primary CTAs, focus outlines. Used sparingly and always on interactive surfaces. In dark mode, this role shifts to Warm Coral (#d96740 / HSL 15 75% 55%) for contrast against dark backgrounds.

### Secondary

- **Teal Ring** (#1fb8a8 / HSL 185 75% 45%): focus rings and accent indicators. Never used as a background fill; always a signal. Links keyboard and pointer focus to a single, recognizable color.

### Neutral

- **Coastal Navy** (#1f3044 / HSL 215 45% 20%): primary text, foreground, headings. The darkest surface in light mode.
- **Soft Steel** (#c4cdd5 / HSL 210 14% 80%): borders, dividers, input strokes. Quiet enough to disappear; present enough to structure.
- **Warm Card** (#f2f5f7 / HSL 210 20% 97%): card backgrounds, section fills. A blue-tinted off-white that reads warmer than pure gray.
- **Salt Mist** (#f5f7f8 / HSL 210 15% 97%): muted backgrounds, secondary surfaces. Nearly white, with just enough blue to avoid sterility.

### Semantic

- **Signal Red** (#bf1a1a / HSL 0 75% 45%): destructive actions, errors. Used at full weight; never diluted to pink.
- **Sea Green** (#16a34a / HSL 142 76% 36%): fuel-included badges, availability dots, success states.
- **Amber Popular** (#f59e0b / HSL 38 92% 50%): popularity badges, limited-availability warnings.

### Named Rules

**The Quiet Surface Rule.** Backgrounds never compete with photography. Card backgrounds stay within 3% lightness of the page background. If a surface is louder than the image on it, the surface is wrong.

**The One Action Rule.** Deep Navy CTA appears on at most two interactive elements per viewport. Its rarity is what makes it unmissable. Secondary actions use outline or ghost variants.

## 3. Typography

**Display Font:** Clash Display (variable, 200-700) with Archivo fallback
**Body Font:** Archivo (variable, 100-900) with Inter fallback
**Mono:** Menlo (system)

**Character:** Clash Display is geometric and confident without being cold. Its wide apertures and clean terminals feel modern-Mediterranean: structured enough for trust, open enough for warmth. Archivo handles body text with quiet competence; its extensive weight range allows hierarchy through weight alone.

### Hierarchy

- **Display** (700, clamp(1.75rem, 5.5vw, 3.5rem), 1.08): hero headlines only. Uppercase, tight tracking (-0.01em). Always white on photography or Coastal Navy on light surfaces.
- **Headline** (600, 1.5rem, 1.2): section headings, page titles. Clash Display. Tight tracking.
- **Title** (500, 1.125rem, 1.3): card titles, boat names, step labels. Clash Display at medium weight. The workhorse heading level.
- **Body** (400, 1rem/16px, 1.6): descriptions, paragraphs, form labels. Archivo. Max line length 65-75ch.
- **Label** (500, 0.75rem, 1.4): badges, meta text, timestamps, auxiliary info. Archivo at medium weight with slight tracking (0.01em).

### Named Rules

**The Weight Ladder Rule.** Adjacent hierarchy levels must differ by at least one weight step (100 units) AND one size step (ratio >= 1.25). Display 700 to Headline 600. Headline 600 to Title 500. Flat hierarchy (same weight, different size only) is prohibited.

## 4. Elevation

Flat by default. Surfaces sit at the same plane until interaction proves otherwise. There are no decorative shadows at rest; depth is a response to state, not a permanent attribute.

### Shadow Vocabulary

- **2xs** (`0px 1px 2px hsl(210 15% 25% / 0.05)`): pressed/active state feedback. Barely visible.
- **xs** (`0px 1px 3px hsl(210 15% 25% / 0.08)`): default resting shadow for outline buttons. A whisper of separation.
- **sm** (`0px 2px 4px hsl(210 15% 25% / 0.06)`): input focus, dropdown triggers. Just enough to say "I'm active."
- **elevated** (`0 4px 14px hsl(var(--foreground) / 0.35)`): primary CTA buttons at rest. This is the signature shadow; it gives pill buttons their tactile, floating quality.
- **elevated-hover** (`0 6px 20px hsl(var(--foreground) / 0.45)`): CTA hover. Deeper, wider. Combined with translateY(-2px) for a physical lift.

All shadow values use the foreground hue (navy-tinted), never pure black. In dark mode, shadow opacity drops by 50% because ambient contrast is already high.

### Named Rules

**The Earned Depth Rule.** Shadows appear only as a response to state: hover, focus, active, open. A card at rest has no shadow. A card being hovered gets sm. A modal gets lg. If a surface has a shadow and no interaction caused it, the shadow is wrong.

## 5. Components

### Buttons

Tactile and confident. The pill shape (rounded-full) is the signature; it distinguishes this system from every rectangular-button SaaS template.

- **Shape:** pill (border-radius 9999px). Always. No exceptions.
- **Primary:** Deep Navy CTA background, white text. Padding 10px 24px (default), 14px 32px (large). Elevated shadow at rest. Combined `btn-elevated` + `cta-pulse` classes create a floating button with a breathing ring animation.
- **Hover:** translateY(-2px), shadow deepens. Feels like lifting a physical object.
- **Active:** translateY(0), shadow compresses. The click lands.
- **Focus:** 2px solid teal ring, 2px offset. Visible on keyboard navigation; invisible on pointer.
- **Secondary (outline):** transparent background, 1px border at 10% opacity, foreground text. Hover darkens border to 30%. No shadow.
- **Ghost:** transparent background, transparent border (prevents layout shift), foreground text. Hover adds underline. The quietest action.
- **Disabled:** 50% opacity, pointer-events none. No special color treatment.

### Chips / Badges

Small, pill-shaped status indicators. Never interactive (use buttons for actions).

- **Default:** foreground at 10% opacity background, foreground text. Quiet, informational.
- **Semantic badges:** full-saturation backgrounds (amber for popular, green for fuel-included, CTA for recommended). White text, bold weight. Used on boat card images with backdrop-blur for legibility over photography.
- **Season indicators:** tinted backgrounds matching season (green-50 for low, amber-50 for mid). Used inline in pricing.

### Cards / Containers

- **Corner Style:** generous rounding (16px / rounded-2xl). Larger than buttons to create visual hierarchy between interactive and container elements.
- **Background:** Warm Card (#f2f5f7). A blue-tinted near-white that separates from the page without a border.
- **Shadow Strategy:** flat at rest (The Earned Depth Rule). On hover: subtle 3D perspective tilt (2deg rotateY + 1.015 scale) for boat cards. This is GPU-composited and works on 60fps mobile.
- **Border:** card-border token (HSL 200 15% 92%). Barely visible; structural, not decorative.
- **Internal Padding:** 24px (p-6) for header and content. Content sections use pt-0 when following the header to avoid double spacing.

### Inputs / Fields

- **Style:** white background, 1px border (input token), rounded-md (8px). NOT pill-shaped; inputs use softer rounding to differentiate from buttons.
- **Height:** 44px (h-11), matching button default height for alignment.
- **Focus:** 2px ring in teal, 2px offset. Border stays; ring adds.
- **Error:** destructive color border. No background change.
- **Disabled:** 50% opacity, not-allowed cursor.
- **iOS protection:** font-size forced to 16px on touch devices to prevent Safari auto-zoom.

### Navigation

The floating pill navigation is the most distinctive structural element.

- **Container:** fixed, inset from edges (12px mobile, 24px desktop), rounded-2xl, white background at 95% opacity with backdrop-blur-xl. This creates a frosted-glass bar that floats above the page.
- **Desktop links:** foreground at 70% opacity, medium weight. Active state: full opacity, semibold. Transition on color only.
- **Mobile menu:** max-height transition (200ms ease-in-out) with opacity fade. Full-width items at 56px touch height (py-3.5).
- **CTA in nav:** Deep Navy CTA pill with pulse animation. Always visible, always the last nav item.

### Hero (Signature Component)

Full-viewport immersive entry. The hero is where The Salt Memory begins.

- **Height:** 100dvh, min 600px. Full bleed, no container.
- **Background:** responsive picture element (AVIF/WebP). Slight saturation boost (1.05) to compensate for outdoor screen washout.
- **Overlay:** gradient from black/50 (top) through black/25 (center) to black/50 (bottom). The lighter center lets the sea breathe; the darker edges anchor text.
- **Typography:** Display weight, uppercase, white with drop-shadow for legibility. Fluid sizing via clamp().
- **Dual CTA:** Primary (quiz/booking trigger) + Secondary (fleet scroll). The secondary button uses sky-blue (#A8C4DD) on desktop, white/90 on mobile, for contrast hierarchy.
- **Trust strip:** foreground/90 background bar at the bottom. Grid on mobile (2-col), flex on desktop. White text, small icons. Establishes credibility before the scroll begins.

## 6. Do's and Don'ts

### Do:

- **Do** use pill-shaped buttons (rounded-full) for every interactive action. This is the system's signature.
- **Do** let photography fill at least 40% of above-the-fold viewport on landing pages. The sea sells itself.
- **Do** test every color pairing at WCAG AA (4.5:1 for text, 3:1 for large text). Outdoor mobile is the baseline viewing condition.
- **Do** use GPU-composited properties only for animation (transform, opacity). The `will-change` property must accompany any animated element.
- **Do** respect `prefers-reduced-motion` by killing all animation and scroll behavior. Already enforced globally.
- **Do** disable hover transforms on touch devices via `@media (hover: none)`. Sticky hover states on mobile are a bug, not a feature.
- **Do** use Clash Display for headings and Archivo for body. Never swap their roles.

### Don't:

- **Don't** make it look like a luxury yacht charter. No gold accents, no black marble textures, no script fonts, no champagne-glass imagery. This is accessible boating.
- **Don't** make it look like a budget excursion site. No clip art, no densely packed grids of tiny thumbnails, no flashing price banners, no comic sans adjacent fonts.
- **Don't** make it look like a generic travel platform. No Booking.com-style search bars, no infinite card grids, no "X reviews" trust badges in the style of TripAdvisor.
- **Don't** add decorative shadows to resting surfaces. Shadows are responses to interaction (The Earned Depth Rule).
- **Don't** use `border-left` or `border-right` greater than 1px as colored accent stripes. Rewrite with background tints or full borders.
- **Don't** use gradient text (`background-clip: text` with gradients). Emphasis through weight or size, never decorative gradients on type.
- **Don't** use glassmorphism decoratively. The navigation's backdrop-blur is structural (legibility over scrolling content); that is the only permitted use.
- **Don't** animate CSS layout properties (width, height, margin, padding). Transform and opacity only.
- **Don't** use `#000` or `#fff` anywhere. Every neutral is tinted toward the coastal navy hue.
- **Don't** use em dashes in copy. Commas, colons, semicolons, periods, or parentheses.
