# Editorial Nautico Premium Polish - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the website from generic shadcn template aesthetic to premium editorial nautico style, matching Nautal/Click&Boat quality.

**Architecture:** Polish-over-structure approach. Change design tokens, component styling, and section layouts without altering functionality or data flow. All changes are CSS/className level.

**Tech Stack:** TailwindCSS, shadcn/ui components, React, CSS variables

**No testing setup exists.** Verify changes via `npm run check` (TypeScript) and visual inspection with `npm run dev`.

---

### Task 1: Design System - Color Palette

Update CSS variables to new editorial nautico palette.

**Files:**
- Modify: `client/src/index.css`

**Step 1: Update light mode CSS variables**

In `client/src/index.css`, replace the light mode `:root` color variables. Key changes:
- `--background`: `200 20% 98%` -> `0 0% 100%` (pure white)
- `--foreground`: `210 60% 20%` -> `215 45% 20%` (navy #1A2B4A)
- `--card`: `200 15% 96%` -> `210 20% 97%` (very subtle gray #F5F7FA)
- `--card-foreground`: keep same
- `--primary`: `210 85% 25%` -> `215 45% 20%` (navy, same as foreground)
- `--primary-foreground`: keep `0 0% 100%`
- `--muted`: `200 15% 90%` -> `210 15% 93%`
- `--muted-foreground`: `210 15% 40%` -> `215 20% 46%` (#6B7C93)
- `--border`: `200 15% 88%` -> `210 14% 91%` (#E8ECF1)
- `--cta`: keep `15 80% 60%` (coral accent stays)

Also update shadow variables to be more subtle:
- `--shadow`: reduce opacity from 0.08 to 0.05
- `--shadow-md`: reduce opacity from 0.08 to 0.05
- `--shadow-lg`: reduce opacity from 0.08 to 0.04
- `--shadow-xl`: reduce opacity from 0.08 to 0.04

**Step 2: Run `npm run check`**

Expected: PASS (CSS-only changes)

**Step 3: Commit**
```
git add client/src/index.css
git commit -m "style: update color palette to editorial nautico theme"
```

---

### Task 2: Design System - Typography & Spacing

Update font weights and add spacing utilities.

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Update border radius**

Change border radius values for rounder, more premium feel:
- `lg`: `.5625rem` -> `0.75rem` (12px)
- `md`: `.375rem` -> `0.5rem` (8px)
- `sm`: `.1875rem` -> `0.25rem` (4px)

**Step 2: Remove bounce-once animation**

Delete the `bounce-once` keyframes and animation from tailwind.config.ts (lines 104-116). This animation is only used by the hero scroll chevron which we're removing.

**Step 3: Run `npm run check`**

**Step 4: Commit**
```
git add tailwind.config.ts
git commit -m "style: update border radius and remove bounce animation"
```

---

### Task 3: Design System - Button Component

Redesign buttons to pill shape, remove elevate effects.

**Files:**
- Modify: `client/src/components/ui/button.tsx`

**Step 1: Update button base classes**

Replace the base classes (line 8-9):
- Remove `hover-elevate active-elevate-2`
- Change `rounded-md` to `rounded-full`
- Keep everything else

**Step 2: Update size variants**

- `default`: `min-h-9 px-4 py-2` -> `min-h-10 px-6 py-2.5`
- `sm`: keep `min-h-8 rounded-md px-3 text-xs` but change `rounded-md` to `rounded-full`
- `lg`: `min-h-10 rounded-md px-8` -> `min-h-11 rounded-full px-8`
- `icon`: keep as-is

**Step 3: Update variant styles**

- `default`: add `shadow-none` (remove any inherited shadow)
- `outline`: keep border but add `hover:border-foreground/30` for subtle hover
- `ghost`: add `hover:underline` for text-link feel

**Step 4: Run `npm run check`**

**Step 5: Commit**
```
git add client/src/components/ui/button.tsx
git commit -m "style: redesign buttons to pill shape, remove elevate effects"
```

---

### Task 4: Design System - Card Component

Clean cards: remove shadow, subtle border, larger radius.

**Files:**
- Modify: `client/src/components/ui/card.tsx`

**Step 1: Update Card base classes**

Line 12: Replace `shadow-sm` with `shadow-none`. The card already has `border` and `bg-card` which is sufficient.

Also change `rounded-xl` to `rounded-2xl` for the larger radius.

**Step 2: Run `npm run check`**

**Step 3: Commit**
```
git add client/src/components/ui/card.tsx
git commit -m "style: clean card component - no shadow, larger radius"
```

---

### Task 5: Design System - Badge Component

Neutral pill badges instead of colorful ones.

**Files:**
- Modify: `client/src/components/ui/badge.tsx`

**Step 1: Update badge base classes**

- Remove `hover-elevate` from base classes
- Change `rounded-md` to `rounded-full` (pill shape)
- Change `font-semibold` to `font-medium`

**Step 2: Update badge variants**

- `default`: change to `border-transparent bg-foreground/10 text-foreground shadow-none` (neutral gray pill)
- `secondary`: change to `border-transparent bg-muted text-muted-foreground shadow-none`
- `outline`: keep but add `shadow-none`

**Step 3: Run `npm run check`**

**Step 4: Commit**
```
git add client/src/components/ui/badge.tsx
git commit -m "style: neutral pill badges, remove hover elevate"
```

---

### Task 6: Hero Section Redesign

Lighter overlay, centered XXL title, single CTA, minimal trust line.

**Files:**
- Modify: `client/src/components/Hero.tsx`

**Step 1: Reduce overlay opacity**

Line 42: Change `from-black/70 via-black/50 to-transparent` to `from-black/50 via-black/30 to-black/10`

**Step 2: Redesign title typography**

Line 48-49: Change H1 classes:
- From: `font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white`
- To: `font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-tight`

Line 50-51: Change subtitle:
- From: `text-lg sm:text-xl md:text-2xl text-white/90`
- To: `text-lg sm:text-xl text-white/70 font-light`

**Step 3: Simplify price badge**

Lines 56-60: Replace the current badge with a simpler inline element next to the CTA. Change the `bg-white/20 backdrop-blur-sm rounded-full` container to just a text span: `text-white/60 text-sm font-light`

**Step 4: Redesign CTA buttons**

Lines 63-82: Replace both buttons with a single pill CTA:
- Remove the secondary "view fleet" button entirely
- Primary button: `bg-cta hover:bg-cta/90 text-white px-10 py-4 text-lg rounded-full shadow-lg font-medium`

**Step 5: Redesign trust badges**

Lines 85-120: Replace the grid of colored-icon badges with a single horizontal line:
- Remove the `bg-white/10 backdrop-blur-sm rounded-lg` container
- Replace with: `flex items-center gap-6 text-white/60 text-sm font-light`
- Each item: just text, no colored icons. Format: "4.8 Google" | "+2000 clientes" | "100% asegurado"
- Use a `text-white/30` divider character "|" between items

**Step 6: Remove scroll indicator**

Lines 126-136: Delete the entire `absolute bottom-8` section with the ChevronDown bounce animation.

**Step 7: Center the content**

Change the content alignment from left-aligned to centered:
- The main content container should use `text-center items-center` instead of left alignment
- Max width: `max-w-3xl mx-auto`

**Step 8: Run `npm run check`**

**Step 9: Commit**
```
git add client/src/components/Hero.tsx
git commit -m "style: hero - lighter overlay, XXL centered title, single CTA, minimal trust"
```

---

### Task 7: Remove Wave Dividers & Update Page Composition

Remove WaveDivider from homepage and increase section spacing.

**Files:**
- Modify: `client/src/App.tsx`

**Step 1: Remove WaveDivider imports and instances**

In App.tsx, find the HomePage component (lines 98-161):
- Remove both `<WaveDivider>` instances (lines 150 and 153)
- Remove the WaveDivider import at top of file

**Step 2: Run `npm run check`**

**Step 3: Commit**
```
git add client/src/App.tsx
git commit -m "style: remove wave dividers from homepage"
```

---

### Task 8: Fleet Section Redesign

Generous spacing, clean title hierarchy.

**Files:**
- Modify: `client/src/components/FleetSection.tsx`

**Step 1: Update section spacing**

Line 69: Change `py-8 sm:py-12 lg:py-16` to `py-16 sm:py-24 lg:py-32`

Also change `bg-gray-50` to `bg-white` (pure white background, cards will have the subtle gray).

**Step 2: Update title typography**

Lines 71-77:
- H2: Change `font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900` to `font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-tight`
- Subtitle: Change `text-sm sm:text-base lg:text-lg text-gray-600` to `text-base text-muted-foreground font-light mt-3`
- Add more bottom margin: `mb-8 sm:mb-12 lg:mb-16` to heading area

**Step 3: Update grid gap**

Line 80: Change `gap-3 sm:gap-4 lg:gap-6` to `gap-4 sm:gap-6 lg:gap-8`

**Step 4: Redesign help section**

Lines 103-125: Simplify the WhatsApp/phone section:
- Remove the `bg-[#25D366]` green button styling
- Use outline style for both: `border border-border text-foreground hover:border-foreground/30 rounded-full px-6 py-3`
- WhatsApp icon can keep green color inline but button itself is outline

**Step 5: Run `npm run check`**

**Step 6: Commit**
```
git add client/src/components/FleetSection.tsx
git commit -m "style: fleet section - generous spacing, clean typography"
```

---

### Task 9: Boat Card Redesign

Larger image, cleaner layout, text-link CTA.

**Files:**
- Modify: `client/src/components/BoatCard.tsx`

**Step 1: Remove hover-elevate from card**

Line 59: Remove `hover-elevate` class. Add `hover:border-cta/50 transition-colors duration-200` for subtle border color change on hover.

**Step 2: Enlarge image area**

Line 61: Change image height from `h-48 sm:h-52 lg:h-56` to `h-52 sm:h-56 lg:h-64` (taller images).

**Step 3: Remove image hover overlay**

Lines 86-90: Remove the `bg-black/0 group-hover:bg-black/10` overlay div and the "View Details" popup text. Keep only the `group-hover:scale-105` on the image itself, but change to `group-hover:scale-[1.03]` (subtler zoom).

**Step 4: Simplify badges**

- License badge (top-left): Change both variants to use the same neutral style: `bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium rounded-full px-3 py-1`
- Availability badge (top-right): Replace large badge with small dot indicator: `w-2.5 h-2.5 rounded-full` (green-500 or gray-300)

**Step 5: Simplify content area**

- Title: Change from `font-heading font-semibold text-base sm:text-lg text-gray-900` to `font-heading font-medium text-lg text-foreground`
- Move price inline with title (same row, right-aligned): `text-cta font-medium`
- Description: Keep `line-clamp-2` but change color to `text-muted-foreground`
- Features: Display as inline text row (`text-sm text-muted-foreground`) separated by " | " instead of separate badges. Format: "6 personas | 40 CV | Sin licencia"

**Step 6: Simplify footer buttons**

Replace two buttons with single text link:
- Remove "View Details" outline button and "Book" primary button
- Replace with: `<a>` styled as `text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1` with text "Ver detalles" + ArrowRight icon (small)

**Step 7: Run `npm run check`**

**Step 8: Commit**
```
git add client/src/components/BoatCard.tsx
git commit -m "style: boat cards - larger image, cleaner layout, text-link CTA"
```

---

### Task 10: Features Section Redesign

Reduce to 3 features, linear icons, remove extras.

**Files:**
- Modify: `client/src/components/FeaturesSection.tsx`

**Step 1: Update section spacing**

Change section padding to `py-16 sm:py-24 lg:py-32` and background to `bg-white`.

**Step 2: Reduce features to 3**

Modify the features array (lines 22-59) to keep only 3:
1. Shield icon - "Sin licencia necesaria" / no license needed
2. Fuel icon - "Todo incluido" / everything included
3. MapPin icon - "Puerto de Blanes" / Port of Blanes

**Step 3: Update grid to 3 columns**

Change grid from `grid-cols-2 lg:grid-cols-3` to `grid-cols-1 sm:grid-cols-3`.

**Step 4: Redesign feature cards**

Replace colored circle icons with linear style:
- Remove `bg-gray-50 rounded-full` circle container
- Icon: `w-8 h-8 text-muted-foreground stroke-[1.5]` (thinner stroke, neutral color)
- Remove `hover-elevate border-0 shadow-sm` from card
- Card should be: `text-center p-8` (no card border/shadow, just content)
- Title: `font-medium text-foreground text-lg mt-4`
- Description: `text-muted-foreground text-sm mt-2`

**Step 5: Simplify extras section**

Move the extras details into the booking flow context. For now, either:
a) Remove the extras subsection entirely from FeaturesSection, OR
b) Redesign as a minimal horizontal strip: 5 items in a row with just icon + name + price, no images

Recommended: option (b) - keep extras but as a clean horizontal list below the 3 features, with a subtle separator. No card styling, just: `flex flex-wrap justify-center gap-8 text-sm text-muted-foreground`

**Step 6: Update section title**

- H2: Use same pattern as fleet: `font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-tight text-center`
- Subtitle: `text-base text-muted-foreground font-light text-center mt-3`

**Step 7: Run `npm run check`**

**Step 8: Commit**
```
git add client/src/components/FeaturesSection.tsx
git commit -m "style: features - 3 key features, linear icons, minimal extras"
```

---

### Task 11: Reviews Section Redesign

Large rating number, horizontal carousel, Google branding.

**Files:**
- Modify: `client/src/components/ReviewsSection.tsx`

**Step 1: Update section spacing and background**

Line 40: Change `py-12 sm:py-16 bg-gray-50` to `py-16 sm:py-24 lg:py-32 bg-card`

**Step 2: Redesign header**

Replace the yellow badge + title with:
- Large rating number: `text-6xl sm:text-7xl font-heading font-light text-foreground` displaying "4.8"
- Stars row below: 5 filled stars in `text-cta` (coral instead of yellow)
- Source text: `text-sm text-muted-foreground mt-2` saying "Basado en X opiniones en Google"
- Center everything: `text-center`

**Step 3: Change grid to horizontal scroll**

Replace `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` with horizontal scroll:
- Container: `flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4`
- Each card: `min-w-[300px] sm:min-w-[350px] snap-start flex-shrink-0`
- This creates a peek carousel effect

**Step 4: Redesign review cards**

- Card: `bg-white rounded-2xl border border-border p-6` (clean, no shadow)
- Remove the gray quote icon
- Add large decorative quote: `text-4xl font-serif text-border leading-none` showing open-quote character
- Comment text: `text-foreground text-sm leading-relaxed mt-3`
- Author: `font-medium text-foreground text-sm mt-4`
- Date: `text-xs text-muted-foreground`
- Stars: move to top of card, smaller, in coral color

**Step 5: Update CTA button**

Change the outline "Ver todas las opiniones" button to text link style:
`text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1` with ArrowRight icon

**Step 6: Run `npm run check`**

**Step 7: Commit**
```
git add client/src/components/ReviewsSection.tsx
git commit -m "style: reviews - large rating, horizontal carousel, clean cards"
```

---

### Task 12: Gift Card Banner Redesign

From blue gradient to editorial style.

**Files:**
- Modify: `client/src/components/GiftCardBanner.tsx`

**Step 1: Replace gradient with editorial design**

Replace the `bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl` with:
- `bg-foreground` (navy background, matching our palette)
- Remove the three decorative circles (lines 14-18)
- Remove the icon box with Gift icon

**Step 2: Simplify content**

- Title: `text-2xl sm:text-3xl font-heading font-light text-white tracking-tight`
- Subtitle: `text-white/60 font-light`
- CTA button: `bg-white text-foreground hover:bg-white/90 rounded-full px-8 py-3 font-medium`

**Step 3: Update section spacing**

Change `py-12 sm:py-16` to `py-16 sm:py-24`

**Step 4: Run `npm run check`**

**Step 5: Commit**
```
git add client/src/components/GiftCardBanner.tsx
git commit -m "style: gift card banner - editorial navy style, no gradient"
```

---

### Task 13: Navigation Redesign

Simplified links, pill CTA.

**Files:**
- Modify: `client/src/components/Navigation.tsx`

**Step 1: Simplify desktop nav links**

In the nav items array (around line 143-150), reduce to essential links:
- Flota (fleet)
- Destinos (destinations - could be a dropdown or link to /alquiler-barcos-blanes)
- Blog

Move FAQ, Gift Cards, Contact to footer only.

**Step 2: Update CTA button styling**

The "Reservar" / Book Now button should be:
- `bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-2 text-sm font-medium shadow-none`

**Step 3: Clean up nav bar styling**

- Transparent state: `bg-transparent` (remove the bg-black/20 backdrop-blur)
- Scrolled state: `bg-white border-b border-border` (clean, no blur, no shadow)

**Step 4: Simplify language selector**

Keep the current language selector but ensure it's styled as a ghost button with just a globe icon + language code.

**Step 5: Run `npm run check`**

**Step 6: Commit**
```
git add client/src/components/Navigation.tsx
git commit -m "style: navigation - simplified links, pill CTA, cleaner transitions"
```

---

### Task 14: Footer Redesign

Navy background, 3 columns, cleaner layout.

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Step 1: Update background color**

Line 51: Change `bg-gray-900 text-gray-300` to `bg-[#1A2B4A] text-white/70`

**Step 2: Simplify to 3 columns**

Change `grid-cols-2 lg:grid-cols-4` to `grid-cols-1 md:grid-cols-3`:
- Column 1: Company (logo + description + social icons)
- Column 2: Navigation (merged quick links + services)
- Column 3: Contact (phone, email, location, hours)

Move legal links to a single horizontal line at the bottom.

**Step 3: Clean up social icons**

Social media icons: change to `text-white/50 hover:text-white transition-colors` (monochrome, no brand colors on hover).

**Step 4: Simplify newsletter**

Input + button in one line:
- Input: `bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-white placeholder:text-white/40`
- Button: `bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-2.5 font-medium`

**Step 5: Clean bottom section**

- Remove the large WhatsApp/Call buttons
- Copyright: `text-white/40 text-xs text-center`
- Legal links: `text-white/40 text-xs flex gap-4 justify-center`

**Step 6: Update section spacing**

Footer padding: `py-16 sm:py-20`

**Step 7: Run `npm run check`**

**Step 8: Commit**
```
git add client/src/components/Footer.tsx
git commit -m "style: footer - navy background, 3 columns, cleaner layout"
```

---

### Task 15: Cleanup - Remove Elevate System

Remove unused CSS classes since buttons/cards/badges no longer use them.

**Files:**
- Modify: `client/src/index.css`

**Step 1: Remove elevate classes**

Delete the `.hover-elevate`, `.active-elevate`, `.hover-elevate-2`, `.active-elevate-2`, `.toggle-elevate` CSS blocks (approximately lines 244-333 in index.css).

Also remove the `--elevate-1` and `--elevate-2` CSS variables from both light and dark mode.

**Step 2: Verify no remaining references**

Run grep for `hover-elevate` and `active-elevate` across the codebase. If any components still reference them (other than button/card/badge which we already cleaned), remove those classes too.

**Step 3: Run `npm run check`**

**Step 4: Commit**
```
git add client/src/index.css
git commit -m "style: remove unused elevate system CSS"
```

---

### Task 16: Final Verification

**Step 1: Run full TypeScript check**
```
npm run check
```
Expected: PASS with zero errors

**Step 2: Visual verification checklist**

Start `npm run dev` and check:
- [ ] Homepage loads without errors
- [ ] Navigation: simplified links, coral pill CTA, clean scroll transition
- [ ] Hero: lighter overlay, large centered light-weight title, single coral CTA, trust text line
- [ ] No wave dividers between sections
- [ ] Fleet: generous spacing, clean cards with large images
- [ ] Boat cards: no shadow, subtle border, text-link CTA, specs as inline text
- [ ] Features: 3 items only, linear icons, no colored circles
- [ ] Reviews: large "4.8" number, horizontal scroll, clean cards with serif quotes
- [ ] Gift card: navy banner, no gradient, no decorative circles
- [ ] Footer: navy background, 3 columns, monochrome social icons
- [ ] No bounce animations anywhere
- [ ] Consistent pill-shaped buttons throughout
- [ ] All badges are neutral gray pills
- [ ] Mobile responsive: all sections work on small screens

**Step 3: Final commit**
```
git add -A
git commit -m "style: complete editorial nautico premium polish"
```
