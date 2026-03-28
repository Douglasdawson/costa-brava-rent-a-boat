# CRO Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all actionable improvements from the March 2026 CRO audit — fix critical translation bugs, improve price framing, add trust indicators to booking flow, improve mobile UX, reorder home sections, and enhance exit intent modal.

**Architecture:** Changes are primarily in React components (client/src/components/) and i18n translation files (client/src/i18n/*.ts). No backend changes needed. All improvements target conversion rate optimization through better copy, layout, and psychological triggers.

**Tech Stack:** React, TypeScript, TailwindCSS, i18n translation objects, Wouter routing

---

## Task 1: Fix fuel inclusion bug in all non-Spanish translations

**Files:**
- Modify: `client/src/i18n/en.ts:1320`
- Modify: `client/src/i18n/fr.ts:1316`
- Modify: `client/src/i18n/de.ts:1316`
- Modify: `client/src/i18n/nl.ts:1316`
- Modify: `client/src/i18n/it.ts:1316`
- Modify: `client/src/i18n/ca.ts:1316`
- Modify: `client/src/i18n/ru.ts:1316`

**Context:** Licensed boats do NOT include fuel. Spanish (es.ts:1335) correctly says "Gasolina no incluida en el precio". All 7 other languages incorrectly say fuel IS included. This is a factual error that misleads customers.

**Step 1: Fix English**
In `client/src/i18n/en.ts`, change:
```
licenseFeature4: 'Fuel included in the price',
```
to:
```
licenseFeature4: 'Fuel not included in the price',
```

**Step 2: Fix French**
In `client/src/i18n/fr.ts`, change:
```
licenseFeature4: 'Essence incluse dans le prix',
```
to:
```
licenseFeature4: 'Essence non incluse dans le prix',
```

**Step 3: Fix German**
In `client/src/i18n/de.ts`, change:
```
licenseFeature4: 'Benzin im Preis inbegriffen',
```
to:
```
licenseFeature4: 'Benzin nicht im Preis inbegriffen',
```

**Step 4: Fix Dutch**
In `client/src/i18n/nl.ts`, change:
```
licenseFeature4: 'Brandstof inbegrepen in de prijs',
```
to:
```
licenseFeature4: 'Brandstof niet inbegrepen in de prijs',
```

**Step 5: Fix Italian**
In `client/src/i18n/it.ts`, change:
```
licenseFeature4: 'Benzina inclusa nel prezzo',
```
to:
```
licenseFeature4: 'Benzina non inclusa nel prezzo',
```

**Step 6: Fix Catalan**
In `client/src/i18n/ca.ts`, change:
```
licenseFeature4: 'Gasolina inclosa en el preu',
```
to:
```
licenseFeature4: 'Gasolina no inclosa en el preu',
```

**Step 7: Fix Russian**
In `client/src/i18n/ru.ts`, change:
```
licenseFeature4: 'Бензин включен в стоимость',
```
to:
```
licenseFeature4: 'Бензин не включен в стоимость',
```

**Step 8: Verify**
Run: `grep -n "licenseFeature4" client/src/i18n/*.ts`
Expected: ALL languages now say fuel is NOT included.

**Step 9: Commit**
```bash
git add client/src/i18n/*.ts
git commit -m "fix(i18n): correct fuel inclusion for licensed boats in all languages

Licensed boats do NOT include fuel. All non-Spanish translations incorrectly
stated fuel was included. Spanish was the only correct translation."
```

---

## Task 2: Fix hardcoded Spanish strings in Hero component

**Files:**
- Modify: `client/src/components/Hero.tsx:70,79,120`

**Context:** Three strings are hardcoded in Spanish instead of using translation keys: the mobile subtitle (line 70), the price callout (line 79), and the WhatsApp CTA (line 120).

**Step 1: Fix mobile subtitle**
In `client/src/components/Hero.tsx`, change:
```tsx
              <span className="sm:hidden">Calas secretas de la Costa Brava.<br />Sin experiencia necesaria.</span>
```
to:
```tsx
              <span className="sm:hidden">{t.hero.subtitleMobile || `${t.hero.subtitleLine1} ${t.hero.subtitleLine2}`}</span>
```

**Step 2: Fix price callout**
In `client/src/components/Hero.tsx`, change:
```tsx
              Desde 70€/h &middot; Gasolina incluida
```
to:
```tsx
              {t.hero.priceBadge} &middot; {t.hero.fuelBadge}
```

**Step 3: Fix WhatsApp CTA**
In `client/src/components/Hero.tsx`, change:
```tsx
          Preguntanos por WhatsApp
```
to:
```tsx
          {t.hero.whatsappCta || t.hero.askWhatsApp || 'WhatsApp'}
```

**Step 4: Verify translations exist**
Run: `grep -n "priceBadge\|fuelBadge\|whatsappCta\|askWhatsApp" client/src/i18n/en.ts client/src/i18n/es.ts`
Expected: priceBadge and fuelBadge exist in both. If whatsappCta/askWhatsApp don't exist, add them.

**Step 5: Add missing WhatsApp CTA translations if needed**
Check en.ts and es.ts hero section for a whatsapp-related key. If missing, add to each i18n file in the hero section:
- ES: `askWhatsApp: 'Pregúntanos por WhatsApp',`
- EN: `askWhatsApp: 'Ask us on WhatsApp',`
- FR: `askWhatsApp: 'Demandez-nous sur WhatsApp',`
- DE: `askWhatsApp: 'Fragen Sie uns per WhatsApp',`
- NL: `askWhatsApp: 'Vraag ons via WhatsApp',`
- IT: `askWhatsApp: 'Chiedici su WhatsApp',`
- CA: `askWhatsApp: 'Pregunta\'ns per WhatsApp',`
- RU: `askWhatsApp: 'Спросите нас в WhatsApp',`

**Step 6: Commit**
```bash
git add client/src/components/Hero.tsx client/src/i18n/*.ts
git commit -m "fix(i18n): replace hardcoded Spanish strings in Hero with translation keys

Price callout, mobile subtitle, and WhatsApp CTA were hardcoded in Spanish.
Now uses t.hero.priceBadge, t.hero.fuelBadge, and t.hero.askWhatsApp."
```

---

## Task 3: Fix hardcoded Spanish strings in Trust Strip and LicenseComparison

**Files:**
- Modify: `client/src/App.tsx:153-164` (trust strip)
- Modify: `client/src/components/LicenseComparisonSection.tsx:97,102,142,147`

**Context:** The trust strip in App.tsx has hardcoded "5000+ clientes" and "Experiencia increíble, repetiremos seguro". LicenseComparisonSection has hardcoded "Ver barcos" and "Ver todos" buttons.

**Step 1: Fix trust strip in App.tsx**
In `client/src/App.tsx`, the trust strip section (lines 153-164) uses inline hardcoded strings. This section needs to use translations. We need access to `t` in the HomePage component. First check if `useTranslations` is already imported/used in the HomePage function.

Replace the hardcoded trust strip div with a component or inline translations. The trust strip currently reads:
```tsx
            <span>5000+ clientes</span>
            <span className="text-border">|</span>
            <span className="hidden sm:inline">&ldquo;Experiencia increíble, repetiremos seguro&rdquo;</span>
            <span className="sm:hidden">&ldquo;Repetiremos seguro&rdquo;</span>
```

Add `const t = useTranslations();` inside `HomePage()` (if not already present) and replace with:
```tsx
            <span>{t.hero.clients}</span>
            <span className="text-border">|</span>
            <span className="hidden sm:inline">&ldquo;{t.hero.testimonialQuote}&rdquo;</span>
            <span className="sm:hidden">&ldquo;{t.hero.testimonialQuoteShort}&rdquo;</span>
```

**Step 2: Add missing translation keys**
Check if `hero.testimonialQuote` and `hero.testimonialQuoteShort` exist. If not, add to each i18n file:
- ES: `testimonialQuote: 'Experiencia increíble, repetiremos seguro', testimonialQuoteShort: 'Repetiremos seguro',`
- EN: `testimonialQuote: 'Amazing experience, we will definitely come back', testimonialQuoteShort: 'We will be back',`
- FR: `testimonialQuote: 'Expérience incroyable, nous reviendrons', testimonialQuoteShort: 'Nous reviendrons',`
- DE: `testimonialQuote: 'Unglaubliche Erfahrung, wir kommen wieder', testimonialQuoteShort: 'Wir kommen wieder',`
- NL: `testimonialQuote: 'Ongelooflijke ervaring, we komen terug', testimonialQuoteShort: 'We komen terug',`
- IT: `testimonialQuote: 'Esperienza incredibile, torneremo sicuramente', testimonialQuoteShort: 'Torneremo sicuramente',`
- CA: `testimonialQuote: 'Experiència increïble, repetirem segur', testimonialQuoteShort: 'Repetirem segur',`
- RU: `testimonialQuote: 'Невероятный опыт, обязательно вернёмся', testimonialQuoteShort: 'Обязательно вернёмся',`

**Step 3: Fix hardcoded "Ver barcos" / "Ver todos" in LicenseComparisonSection**
In `client/src/components/LicenseComparisonSection.tsx`, lines 97 and 142 have `{'Ver barcos'}` and lines 102, 147 have `{'Ver todos'}`. Replace with:
```tsx
// Line 97 and 142: {'Ver barcos'} → {t.comparison.viewBoats}
// Line 102 and 147: {'Ver todos'} → {t.comparison.viewAll}
```

Add translation keys if missing:
- ES: `viewBoats: 'Ver barcos', viewAll: 'Ver todos',`
- EN: `viewBoats: 'View boats', viewAll: 'View all',`
- FR: `viewBoats: 'Voir les bateaux', viewAll: 'Voir tous',`
- DE: `viewBoats: 'Boote ansehen', viewAll: 'Alle ansehen',`
- NL: `viewBoats: 'Boten bekijken', viewAll: 'Alles bekijken',`
- IT: `viewBoats: 'Vedi barche', viewAll: 'Vedi tutti',`
- CA: `viewBoats: 'Veure vaixells', viewAll: 'Veure tots',`
- RU: `viewBoats: 'Посмотреть лодки', viewAll: 'Посмотреть все',`

**Step 4: Commit**
```bash
git add client/src/App.tsx client/src/components/LicenseComparisonSection.tsx client/src/i18n/*.ts
git commit -m "fix(i18n): replace hardcoded Spanish in trust strip and license comparison

Trust strip testimonial quote and client count now use translation keys.
LicenseComparison 'Ver barcos'/'Ver todos' buttons now translated."
```

---

## Task 4: Hero price reframing — show price per person

**Files:**
- Modify: `client/src/components/Hero.tsx:77-80`
- Modify: `client/src/i18n/es.ts` (hero section)
- Modify: `client/src/i18n/en.ts` (hero section)
- Modify: all other i18n files (hero section)

**Context:** CRO audit #2 — "14€/persona/hora" is dramatically more effective than "70€/hora". The per-person price reduces perceived cost by 80%. Civitatis and GetYourGuide always lead with per-person pricing.

**Step 1: Update Hero price display**
In `client/src/components/Hero.tsx`, replace the price callout (lines 77-80):
```tsx
            {/* Price callout */}
            <p className="font-medium text-white/90 text-sm sm:text-base lg:text-lg mb-0 sm:mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              {t.hero.priceBadge} &middot; {t.hero.fuelBadge}
            </p>
```
with:
```tsx
            {/* Price callout — per-person framing for higher conversion */}
            <div className="mb-0 sm:mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              <p className="font-semibold text-white text-base sm:text-lg lg:text-xl">
                {t.hero.pricePerPerson} &middot; {t.hero.fuelBadge}
              </p>
              <p className="text-white/75 text-xs sm:text-sm mt-0.5">
                {t.hero.pricePerPersonDetail}
              </p>
            </div>
```

**Step 2: Add translation keys**
Add to each i18n file's hero section:
- ES: `pricePerPerson: 'Desde 14€ por persona/hora', pricePerPersonDetail: 'Barco completo desde 70€/h para hasta 5 personas',`
- EN: `pricePerPerson: 'From €14 per person/hour', pricePerPersonDetail: 'Full boat from €70/h for up to 5 people',`
- FR: `pricePerPerson: 'Dès 14€ par personne/heure', pricePerPersonDetail: 'Bateau complet dès 70€/h pour 5 personnes',`
- DE: `pricePerPerson: 'Ab 14€ pro Person/Stunde', pricePerPersonDetail: 'Ganzes Boot ab 70€/h für bis zu 5 Personen',`
- NL: `pricePerPerson: 'Vanaf €14 per persoon/uur', pricePerPersonDetail: 'Complete boot vanaf €70/u voor max 5 personen',`
- IT: `pricePerPerson: 'Da 14€ a persona/ora', pricePerPersonDetail: 'Barca completa da 70€/h per max 5 persone',`
- CA: `pricePerPerson: 'Des de 14€ per persona/hora', pricePerPersonDetail: 'Vaixell complet des de 70€/h per a 5 persones',`
- RU: `pricePerPerson: 'От 14€ с человека/час', pricePerPersonDetail: 'Полная лодка от 70€/ч на 5 человек',`

**Step 3: Commit**
```bash
git add client/src/components/Hero.tsx client/src/i18n/*.ts
git commit -m "feat(cro): reframe hero price as per-person (14€) instead of per-boat (70€)

Per-person pricing reduces perceived cost by 80%. Shows '14€ per person/hour'
as primary with 'Full boat from 70€/h' as secondary detail line."
```

---

## Task 5: Hero CTA — change to benefit-oriented copy

**Files:**
- Modify: `client/src/i18n/es.ts` (hero section)
- Modify: `client/src/i18n/en.ts` (hero section)
- Modify: all other i18n files (hero section)

**Context:** CRO audit #3 — "Encuentra tu barco" is a process step, not a benefit. "Reservar desde 14€/persona" communicates the benefit directly in the CTA.

**Step 1: Update translation keys for hero CTAs**
Find `findYourBoat` key and update in each i18n file:
- ES: `findYourBoat: 'Reservar desde 14€/persona',`
- EN: `findYourBoat: 'Book from €14/person',`
- FR: `findYourBoat: 'Réserver dès 14€/personne',`
- DE: `findYourBoat: 'Buchen ab 14€/Person',`
- NL: `findYourBoat: 'Boek vanaf €14/persoon',`
- IT: `findYourBoat: 'Prenota da 14€/persona',`
- CA: `findYourBoat: 'Reservar des de 14€/persona',`
- RU: `findYourBoat: 'Бронировать от 14€/чел.',`

Also update `viewFleet`:
- ES: `viewFleet: 'Ver los 9 barcos',`
- EN: `viewFleet: 'See all 9 boats',`
- FR: `viewFleet: 'Voir les 9 bateaux',`
- DE: `viewFleet: 'Alle 9 Boote ansehen',`
- NL: `viewFleet: 'Bekijk alle 9 boten',`
- IT: `viewFleet: 'Vedi tutte le 9 barche',`
- CA: `viewFleet: 'Veure els 9 vaixells',`
- RU: `viewFleet: 'Все 9 лодок',`

**Step 2: Commit**
```bash
git add client/src/i18n/*.ts
git commit -m "feat(cro): change hero CTAs to benefit-oriented copy

'Encuentra tu barco' → 'Reservar desde 14€/persona' (action + benefit).
'Ver flota' → 'Ver los 9 barcos' (specific count reduces ambiguity)."
```

---

## Task 6: Add trust indicators to booking flow

**Files:**
- Modify: `client/src/components/booking-flow/BookingStepExperience.tsx:50`
- Modify: `client/src/components/booking-flow/BookingStepPersonalize.tsx` (top of return)
- Modify: `client/src/components/booking-flow/BookingStepPayment.tsx:48`
- Modify: i18n files (add booking trust keys)

**Context:** CRO audit Part 3.5 — The booking flow has ZERO trust indicators. The user goes from a home page full of trust signals to a booking flow completely devoid of them. This is a critical conversion leak.

**Step 1: Create a shared BookingTrustBanner component**
Create: `client/src/components/booking-flow/BookingTrustBanner.tsx`
```tsx
import { CheckCircle } from "lucide-react";
import type { Translations } from "@/lib/translations";

export function BookingTrustBanner({ t }: { t: Translations }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.freeCancellation || 'Free cancellation 48h'}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.securePayment || 'Secure payment'}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.insuranceIncluded || 'Insurance included'}
      </span>
    </div>
  );
}
```

**Step 2: Add trust banner to BookingStepExperience**
In `client/src/components/booking-flow/BookingStepExperience.tsx`, at the top of the return (line 50), add:
```tsx
    <div className="space-y-4">
      <BookingTrustBanner t={t} />
      {/* Section 1: Date */}
```
Add import at top: `import { BookingTrustBanner } from "./BookingTrustBanner";`

**Step 3: Add trust banner to BookingStepPersonalize**
At the top of the return JSX, add `<BookingTrustBanner t={t} />` before the first Card.
Add import at top: `import { BookingTrustBanner } from "./BookingTrustBanner";`

**Step 4: Add trust banner to BookingStepPayment**
Before the summary Card (line 40), add `<BookingTrustBanner t={t} />`.
Add import at top: `import { BookingTrustBanner } from "./BookingTrustBanner";`

**Step 5: Add translation keys**
Add `bookingTrust` object to each i18n file:
- ES: `bookingTrust: { freeCancellation: 'Cancelación gratuita 48h', securePayment: 'Pago seguro', insuranceIncluded: 'Seguro incluido' },`
- EN: `bookingTrust: { freeCancellation: 'Free cancellation 48h', securePayment: 'Secure payment', insuranceIncluded: 'Insurance included' },`
- FR: `bookingTrust: { freeCancellation: 'Annulation gratuite 48h', securePayment: 'Paiement sécurisé', insuranceIncluded: 'Assurance incluse' },`
- DE: `bookingTrust: { freeCancellation: 'Kostenlose Stornierung 48h', securePayment: 'Sichere Zahlung', insuranceIncluded: 'Versicherung inklusive' },`
- NL: `bookingTrust: { freeCancellation: 'Gratis annulering 48u', securePayment: 'Veilige betaling', insuranceIncluded: 'Verzekering inbegrepen' },`
- IT: `bookingTrust: { freeCancellation: 'Cancellazione gratuita 48h', securePayment: 'Pagamento sicuro', insuranceIncluded: 'Assicurazione inclusa' },`
- CA: `bookingTrust: { freeCancellation: 'Cancel·lació gratuïta 48h', securePayment: 'Pagament segur', insuranceIncluded: 'Assegurança inclosa' },`
- RU: `bookingTrust: { freeCancellation: 'Бесплатная отмена 48ч', securePayment: 'Безопасная оплата', insuranceIncluded: 'Страховка включена' },`

**Step 6: Verify**
Run: `npm run check`
Expected: No TypeScript errors.

**Step 7: Commit**
```bash
git add client/src/components/booking-flow/BookingTrustBanner.tsx client/src/components/booking-flow/BookingStepExperience.tsx client/src/components/booking-flow/BookingStepPersonalize.tsx client/src/components/booking-flow/BookingStepPayment.tsx client/src/i18n/*.ts
git commit -m "feat(cro): add trust indicators to booking flow

Shows 'Free cancellation 48h · Secure payment · Insurance included' banner
at the top of each booking step. Previously the booking flow had zero trust signals."
```

---

## Task 7: Add "Best for" labels to boat cards

**Files:**
- Modify: `client/src/components/BoatCard.tsx:203-218`
- Modify: `client/src/components/FleetSection.tsx` (pass bestFor prop)
- Modify: i18n files (add bestFor labels)

**Context:** CRO audit #6 — 5 boats without license with nearly identical specs paralyze users. Labels like "Ideal couples", "Best for families" reduce decision fatigue.

**Step 1: Add bestFor prop to BoatCard**
In `client/src/components/BoatCard.tsx`, add to the BoatCardProps interface (line 8):
```tsx
  bestFor?: string;
```

Add to function params (line 150, after `onBooking`):
```tsx
  bestFor,
```

**Step 2: Render bestFor badge**
In `client/src/components/BoatCard.tsx`, after the license badge (line 218), add:
```tsx
          {bestFor && (
            <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full px-3 py-1 self-start">
              {bestFor}
            </span>
          )}
```

**Step 3: Pass bestFor from FleetSection**
In `client/src/components/FleetSection.tsx`, find where BoatCard is rendered and map boat IDs to bestFor labels. Create a mapping object using translations:
```tsx
const bestForLabels: Record<string, string> = {
  'astec-400': t.boats.bestForBudget || '',
  'solar-450': t.boats.bestForSundeck || '',
  'remus-450': t.boats.bestForFamilies || '',
  'remus-450-ii': t.boats.bestForFamilies || '',
  'astec-480': t.boats.bestForPremium || '',
};
```

Pass `bestFor={bestForLabels[boat.id]}` to each BoatCard.

**Step 4: Add translation keys**
Add to boats section of each i18n file:
- ES: `bestForBudget: 'Mejor precio', bestForSundeck: 'Mejor solárium', bestForFamilies: 'Favorito familias', bestForPremium: 'Premium sin licencia',`
- EN: `bestForBudget: 'Best value', bestForSundeck: 'Best sundeck', bestForFamilies: 'Family favourite', bestForPremium: 'Premium no-licence',`
- FR: `bestForBudget: 'Meilleur prix', bestForSundeck: 'Meilleur solarium', bestForFamilies: 'Favori familles', bestForPremium: 'Premium sans permis',`
- DE: `bestForBudget: 'Bester Preis', bestForSundeck: 'Bestes Sonnendeck', bestForFamilies: 'Familien-Favorit', bestForPremium: 'Premium ohne Lizenz',`
- NL: `bestForBudget: 'Beste prijs', bestForSundeck: 'Beste zonnedek', bestForFamilies: 'Favoriet gezinnen', bestForPremium: 'Premium zonder vaarbewijs',`
- IT: `bestForBudget: 'Miglior prezzo', bestForSundeck: 'Miglior solarium', bestForFamilies: 'Preferito famiglie', bestForPremium: 'Premium senza patente',`
- CA: `bestForBudget: 'Millor preu', bestForSundeck: 'Millor solàrium', bestForFamilies: 'Favorit famílies', bestForPremium: 'Premium sense llicència',`
- RU: `bestForBudget: 'Лучшая цена', bestForSundeck: 'Лучшая палуба', bestForFamilies: 'Для семей', bestForPremium: 'Премиум без лицензии',`

**Step 5: Commit**
```bash
git add client/src/components/BoatCard.tsx client/src/components/FleetSection.tsx client/src/i18n/*.ts
git commit -m "feat(cro): add 'Best for' labels to boat cards

Differentiates similar no-license boats: 'Best value' (Astec 400),
'Best sundeck' (Solar 450), 'Family favourite' (Remus 450),
'Premium no-licence' (Astec 480). Reduces choice paralysis."
```

---

## Task 8: Improve exit intent modal copy and trigger

**Files:**
- Modify: `client/src/components/ExitIntentModal.tsx:77-88,189,232`
- Modify: i18n files (exitIntent section)

**Context:** CRO audit #15 — Mobile trigger fires after 50s of inactivity (too aggressive), dismiss copy "No, thanks" misses loss aversion opportunity, title is generic.

**Step 1: Increase mobile timer from 50s to 90s**
In `client/src/components/ExitIntentModal.tsx`, line 81, change:
```tsx
    const timer = setTimeout(() => {
```
The 50000 on line 85 should be changed to 90000:
```tsx
    }, 50000);
```
to:
```tsx
    }, 90000);
```

**Step 2: Update translation keys for better copy**
Update exitIntent section in each i18n file:

- ES: `title: '10% de descuento en tu primera reserva', noThanks: 'Prefiero pagar precio completo',`
- EN: `title: '10% off your first booking', noThanks: 'I prefer to pay full price',`
- FR: `title: '10% de réduction sur votre première réservation', noThanks: 'Je préfère payer le prix complet',`
- DE: `title: '10% Rabatt auf Ihre erste Buchung', noThanks: 'Ich zahle lieber den vollen Preis',`
- NL: `title: '10% korting op je eerste boeking', noThanks: 'Ik betaal liever de volle prijs',`
- IT: `title: '10% di sconto sulla tua prima prenotazione', noThanks: 'Preferisco pagare il prezzo intero',`
- CA: `title: '10% de descompte a la teva primera reserva', noThanks: 'Prefereixo pagar el preu complet',`
- RU: `title: '10% скидка на первое бронирование', noThanks: 'Предпочитаю полную цену',`

**Step 3: Commit**
```bash
git add client/src/components/ExitIntentModal.tsx client/src/i18n/*.ts
git commit -m "feat(cro): improve exit intent modal copy and mobile timing

Mobile timer 50s→90s (less aggressive). Title now leads with benefit.
Dismiss copy uses loss aversion: 'I prefer to pay full price'."
```

---

## Task 9: Reorder home page sections for conversion-optimized flow

**Files:**
- Modify: `client/src/App.tsx:166-192`

**Context:** CRO audit #10 — Current order puts "Never Sailed" (beginner reassurance) AFTER FAQ and License Comparison. It should come right after Trust Strip to eliminate the beginner barrier BEFORE showing the fleet. New order: Hero → Trust → NeverSailed → Fleet → Reviews → LicenseComparison → Features → FAQ → CTA → Contact → GiftCard → Locations.

**Step 1: Reorder sections**
In `client/src/App.tsx`, the sections between the trust strip (line 165) and `</main>` (line 193) should be reordered. Replace lines 166-192 with:

```tsx
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <NeverSailedSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FleetSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <ReviewsSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <LicenseComparisonSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FeaturesSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FAQPreview />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <ContactSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <GiftCardBanner />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <HomepageLocationsSection />
        </Suspense>
```

Logic: Motivate (hero) → Build trust (strip) → Remove fear (never sailed) → Show options (fleet) → Confirm with others (reviews) → Help decide (license comparison) → Add value (features/extras) → Resolve objections (FAQ) → Enable contact → Cross-sell (gift) → SEO (locations).

**Step 2: Verify**
Run: `npm run check`
Expected: No errors (just reordering JSX elements).

**Step 3: Commit**
```bash
git add client/src/App.tsx
git commit -m "feat(cro): reorder home sections for conversion-optimized flow

New order: Hero → Trust → NeverSailed → Fleet → Reviews → LicenseComparison
→ Features → FAQ → Contact → GiftCard → Locations.
Moves beginner reassurance before fleet, reviews right after fleet."
```

---

## Task 10: Move Captain's Tip above comparison columns

**Files:**
- Modify: `client/src/components/LicenseComparisonSection.tsx:155-162`

**Context:** CRO audit #9 — The "Captain's Pro Tip" is gold but hidden at the bottom. Moving it above the comparison cards guides the decision before the user faces the choice.

**Step 1: Move the Captain's Tip block**
In `client/src/components/LicenseComparisonSection.tsx`, cut lines 155-162 (the captain tip div) and paste them between the subtitle paragraph (line 58) and the grid div (line 61). The tip should appear after `mb-10 max-w-2xl mx-auto` paragraph and before `<div className="grid grid-cols-1 md:grid-cols-2 gap-6">`.

**Step 2: Adjust margin**
Change the tip's `className` from `mt-8` to `mb-8` since it's now above the grid instead of below.

**Step 3: Commit**
```bash
git add client/src/components/LicenseComparisonSection.tsx
git commit -m "feat(cro): move Captain's Tip above license comparison columns

Expert advice now guides the user's decision before they see the options,
reducing choice paralysis for first-time visitors."
```

---

## Task 11: Invert price hierarchy in BoatCard — per-person price prominent

**Files:**
- Modify: `client/src/components/BoatCard.tsx:103-127` (BoatCardPricing component)

**Context:** CRO audit #11 — Per-person price already exists but is tiny gray text. It should be the primary number, with total price as secondary.

**Step 1: Invert the price display**
In `client/src/components/BoatCard.tsx`, replace the BoatCardPricing return (lines 103-127) with:
```tsx
  return (
    <div className="text-right flex-shrink-0 space-y-0.5">
      <div className="text-sm text-muted-foreground">{fromLabel}</div>
      <div className="flex items-baseline gap-2 justify-end">
        {showPriceAnchoring && (
          <span className="text-xs text-muted-foreground line-through">
            {Math.ceil((highSeasonPrice || 0) / capacity)}&euro;
          </span>
        )}
        <span className="text-cta font-semibold text-xl">
          {Math.ceil(basePrice / capacity)}&euro;
        </span>
        <span className="text-xs text-muted-foreground">
          /{perPersonLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {showPriceAnchoring && (
          <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
            -{savingsPercent}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {basePrice}&euro; total
        </span>
      </div>
    </div>
  );
```

**Step 2: Commit**
```bash
git add client/src/components/BoatCard.tsx
git commit -m "feat(cro): make per-person price the primary display in boat cards

Inverts price hierarchy: '15€/person' large + '75€ total' small.
Per-person framing reduces perceived cost dramatically."
```

---

## Task 12: Add price per person to booking duration dropdown

**Files:**
- Modify: `client/src/components/booking-flow/BookingStepExperience.tsx:226-229`

**Context:** CRO audit Part 3.8 — Duration dropdown shows "2 horas — 180€" but not per-person price. Adding it reduces price shock.

**Step 1: Update duration display**
In `client/src/components/booking-flow/BookingStepExperience.tsx`, the duration SelectItem (line 226-228):
```tsx
                      <SelectItem key={dur.id} value={dur.id}>
                        {dur.label} — {dur.price}€
                      </SelectItem>
```
Change to include per-person calculation. The selectedBoat's capacity is needed. Get the boat object before the return:
```tsx
  const selectedBoatData = availableBoats.find(b => b.id === selectedBoat);
  const boatCapacity = selectedBoatData?.capacity || parseInt(selectedBoatData?.specifications?.capacity?.split(' ')[0] || '5');
```

Then update the SelectItem:
```tsx
                      <SelectItem key={dur.id} value={dur.id}>
                        {dur.label} — {dur.price}€ ({Math.ceil(dur.price / boatCapacity)}€/{t.boats.perPerson})
                      </SelectItem>
```

**Step 2: Commit**
```bash
git add client/src/components/booking-flow/BookingStepExperience.tsx
git commit -m "feat(cro): show per-person price in booking duration dropdown

Duration options now show '2h — 180€ (26€/pers.)' to reduce price shock."
```

---

## Task 13: Add CTA final section before footer

**Files:**
- Modify: `client/src/App.tsx` (add new section before Contact)
- Modify: i18n files (add finalCta keys)

**Context:** CRO audit — Footer section and Part 1 #12. The home page ends without a final conversion push. Adding a strong CTA section after FAQ applies the peak-end rule.

**Step 1: Add inline CTA section**
In `client/src/App.tsx`, after the FAQPreview Suspense block and before ContactSection, add:

```tsx
        {/* Final CTA — peak-end conversion push */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto text-center bg-foreground text-background rounded-2xl p-8 sm:p-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">
              {t.finalCta?.title || '¿Todavía pensándolo?'}
            </h2>
            <p className="text-background/80 mb-6 text-sm sm:text-base">
              {t.finalCta?.subtitle || 'Reserva ahora y cancela gratis hasta 48h antes'}
            </p>
            <Button
              onClick={() => {
                const fleet = document.getElementById('fleet');
                if (fleet) fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              size="lg"
              className="bg-cta hover:bg-cta/90 text-white px-8 py-3 text-base sm:text-lg rounded-full font-medium"
            >
              {t.finalCta?.cta || 'Reservar sin compromiso'}
            </Button>
            <p className="text-background/60 text-xs mt-4">
              {t.finalCta?.trust || 'Cancelación gratuita · Pago seguro · Seguro incluido'}
            </p>
          </div>
        </section>
```

Add import for `Button` if not already present (it likely isn't in App.tsx — use the existing useTranslations import and add Button from ui).

**Step 2: Add translation keys**
Add `finalCta` object to each i18n file:
- ES: `finalCta: { title: '¿Todavía pensándolo?', subtitle: 'Reserva ahora y cancela gratis hasta 48h antes', cta: 'Reservar sin compromiso', trust: 'Cancelación gratuita · Pago seguro · Seguro incluido' },`
- EN: `finalCta: { title: 'Still thinking about it?', subtitle: 'Book now and cancel free up to 48h before', cta: 'Book with no commitment', trust: 'Free cancellation · Secure payment · Insurance included' },`
- FR: `finalCta: { title: 'Vous hésitez encore ?', subtitle: 'Réservez maintenant, annulation gratuite jusqu\'à 48h avant', cta: 'Réserver sans engagement', trust: 'Annulation gratuite · Paiement sécurisé · Assurance incluse' },`
- DE: `finalCta: { title: 'Noch am Überlegen?', subtitle: 'Jetzt buchen und bis 48h vorher kostenlos stornieren', cta: 'Unverbindlich buchen', trust: 'Kostenlose Stornierung · Sichere Zahlung · Versicherung inklusive' },`
- NL: `finalCta: { title: 'Nog aan het twijfelen?', subtitle: 'Boek nu en annuleer gratis tot 48u van tevoren', cta: 'Boek vrijblijvend', trust: 'Gratis annulering · Veilige betaling · Verzekering inbegrepen' },`
- IT: `finalCta: { title: 'Ci stai ancora pensando?', subtitle: 'Prenota ora e cancella gratis fino a 48h prima', cta: 'Prenota senza impegno', trust: 'Cancellazione gratuita · Pagamento sicuro · Assicurazione inclusa' },`
- CA: `finalCta: { title: 'Encara hi estàs pensant?', subtitle: 'Reserva ara i cancel·la gratis fins a 48h abans', cta: 'Reservar sense compromís', trust: 'Cancel·lació gratuïta · Pagament segur · Assegurança inclosa' },`
- RU: `finalCta: { title: 'Всё ещё думаете?', subtitle: 'Бронируйте сейчас — бесплатная отмена за 48ч', cta: 'Забронировать без обязательств', trust: 'Бесплатная отмена · Безопасная оплата · Страховка включена' },`

**Step 3: Commit**
```bash
git add client/src/App.tsx client/src/i18n/*.ts
git commit -m "feat(cro): add final CTA section before contact for peak-end conversion

Dark card with 'Still thinking? Book now, cancel free 48h before' + trust line.
Applies peak-end rule — the home experience ends on a conversion high."
```

---

## Verification

After all tasks are complete:

1. **TypeScript check:** `npm run check`
2. **Lint:** `npm run lint`
3. **Tests:** `npm test`
4. **Visual verification:** `npm run dev` — check:
   - `/es` — home page section order, hero price, CTAs, boat card labels
   - `/en` — all strings translated (no Spanish), fuel NOT included for licensed boats
   - `/fr`, `/de` — spot check translations
   - `/es/booking` — trust banner visible on all 3 steps
   - Mobile (375px) — hero, fleet cards, booking flow
5. **Grep sanity checks:**
   - `grep "licenseFeature4" client/src/i18n/*.ts` — all say NOT included
   - `grep "Preguntanos\|Ver barcos\|5000+ clientes" client/src/components/` — should return 0 hardcoded results
