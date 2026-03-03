# Semana 3 — Growth (Marketing y Visibilidad) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Habilitar atribución UTM, traducir las 3 location pages al idioma del visitante, capturar emails en el footer y enviar thank-you por WhatsApp 24h post-servicio.

**Architecture:** 4 features independientes. UTM usa sessionStorage client-side; location pages extienden el sistema de traducciones existente; newsletter añade tabla nueva + endpoint REST; WhatsApp thank-you extiende el scheduler existente con un campo nuevo en bookings.

**Tech Stack:** React + hooks, TypeScript, Drizzle ORM, Express, node-cron, Twilio, sistema de traducciones propio (`translations.ts`)

---

## Estado Previo (Ya Implementado — No Tocar)

- `robots.txt` y 4 sitemaps con hreflang: **YA EXISTEN**
- GA4/GTM con `trackEvent`, `trackBookingStarted`, `trackBookingCompleted`: **YA EXISTEN** en `client/src/utils/analytics.ts`
- Email reminder pre-viaje y thank-you email: **YA EXISTEN** en `server/services/schedulerService.ts`
- WhatsApp reminder pre-viaje: **YA EXISTE** en `server/services/schedulerService.ts`

---

## Task 1: UTM Attribution Hook

**Problema:** Los parámetros UTM de campañas de Google Ads/Meta Ads se pierden al navegar. No se incluyen en los eventos de GA4.

**Files:**
- Create: `client/src/hooks/useUtmCapture.ts`
- Modify: `client/src/utils/analytics.ts`
- Modify: `client/src/App.tsx` (montar el hook en `Router`)
- Modify: `client/src/components/BookingFormWidget.tsx` (línea 739 — `trackBookingStarted`)

**Step 1: Crear el hook `useUtmCapture.ts`**

Crear `client/src/hooks/useUtmCapture.ts`:

```typescript
import { useEffect } from 'react';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const SESSION_KEY = 'cbrab_utm';

/**
 * On first mount, reads UTM params from URL and stores them in sessionStorage.
 * Subsequent calls are no-ops (don't overwrite on page navigation).
 * Call this once in the Router component.
 */
export function useUtmCapture(): void {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    const keys: (keyof UtmParams)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    for (const key of keys) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }

    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(utm));
    }
  }, []);
}

/** Returns the UTM params captured at session start, or {} if none. */
export function getStoredUtm(): UtmParams {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
```

**Step 2: Actualizar `analytics.ts` para aceptar UTM**

En `client/src/utils/analytics.ts`, importar `UtmParams` y añadir UTM al evento `booking_started`:

```typescript
import type { UtmParams } from '@/hooks/useUtmCapture';

// Cambiar la firma de trackBookingStarted:
export function trackBookingStarted(boatId: string, boatName: string, utm?: UtmParams) {
  trackEvent("booking_started", {
    boat_id: boatId,
    boat_name: boatName,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
}
```

**Step 3: Montar el hook en `App.tsx`**

En `client/src/App.tsx`, en la función `Router` (línea ~322), añadir al principio del cuerpo de la función:

```typescript
import { useUtmCapture } from '@/hooks/useUtmCapture';

function Router() {
  useUtmCapture(); // ← añadir esta línea
  return (
    // ... resto sin cambios
  );
}
```

**Step 4: Pasar UTM a `trackBookingStarted` en `BookingFormWidget.tsx`**

En `client/src/components/BookingFormWidget.tsx`, línea 739:

```typescript
// Añadir import al principio del archivo:
import { getStoredUtm } from '@/hooks/useUtmCapture';

// Cambiar línea 739 de:
trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat);
// a:
trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat, getStoredUtm());
```

**Step 5: Verificar TypeScript**

```bash
npm run check
```

Esperado: sin errores TS.

**Step 6: Commit**

```bash
git add client/src/hooks/useUtmCapture.ts client/src/utils/analytics.ts client/src/App.tsx client/src/components/BookingFormWidget.tsx
git commit -m "feat: capture UTM params in sessionStorage and include in booking_started analytics event"
```

---

## Task 2: Location Pages — Claves de Traducción en `translations.ts`

**Problema:** Las 3 páginas de location (Blanes, Lloret, Tossa) tienen el hero en español hardcodeado aunque el hreflang indica 8 idiomas. Google ignora el hreflang si detecta que el contenido es el mismo idioma en todas las variantes.

**Files:**
- Modify: `client/src/lib/translations.ts`

**Step 1: Añadir la interfaz `locationPages` al tipo `Translations`**

En `client/src/lib/translations.ts`, buscar el final de la interfaz `Translations` (antes del `}` de cierre). Añadir el bloque siguiente (después del último campo de la interfaz):

```typescript
  locationPages: {
    blanes: {
      hero: {
        title: string;
        subtitle: string;
        badgePort: string;
        badgeCapacity: string;
        badgeDuration: string;
      };
    };
    lloret: {
      hero: {
        title: string;
        subtitle: string;
        badgeFrom: string;
        badgeTime: string;
        badgeCapacity: string;
      };
    };
    tossa: {
      hero: {
        title: string;
        subtitle: string;
        badgeFrom: string;
        badgeTime: string;
        badgeCapacity: string;
      };
    };
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      button: string;
      success: string;
      error: string;
    };
  };
```

**Step 2: Añadir traducciones para `es` (español)**

Buscar el objeto `es: {` en translations.ts (es el primero, línea ~640). Al final del objeto `es`, antes de su `}` de cierre, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Alquiler de Barcos en Blanes',
          subtitle: 'Descubre las calas más hermosas de la Costa Brava desde el Puerto de Blanes. Embarcaciones sin licencia y con licencia para toda la familia.',
          badgePort: 'Puerto de Blanes',
          badgeCapacity: '4-7 personas',
          badgeDuration: '1h-8h duración',
        },
      },
      lloret: {
        hero: {
          title: 'Excursiones en Barco a Lloret de Mar',
          subtitle: 'Descubre las famosas playas de Lloret de Mar navegando desde el Puerto de Blanes. 25 minutos de navegación hasta uno de los destinos más populares de la Costa Brava.',
          badgeFrom: 'Desde Puerto de Blanes',
          badgeTime: '25 min navegando',
          badgeCapacity: '4-7 personas',
        },
      },
      tossa: {
        hero: {
          title: 'Excursiones en Barco a Tossa de Mar',
          subtitle: 'Descubre el pueblo medieval más bonito de la Costa Brava navegando desde el Puerto de Blanes. 1 hora de navegación hasta la famosa Vila Vella de Tossa de Mar.',
          badgeFrom: 'Desde Puerto de Blanes',
          badgeTime: '1 hora navegando',
          badgeCapacity: '4-7 personas',
        },
      },
      newsletter: {
        title: 'Recibe ofertas de temporada',
        subtitle: 'Sé el primero en conocer nuestra disponibilidad y ofertas especiales',
        placeholder: 'Tu email',
        button: 'Suscribirse',
        success: '¡Gracias! Te avisaremos con las mejores ofertas.',
        error: 'Error al suscribirse. Inténtalo de nuevo.',
      },
    },
```

**Step 3: Añadir traducciones para `ca` (catalán)**

Buscar `ca: {` en translations.ts. Al final del objeto `ca`, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Lloguer de Barques a Blanes',
          subtitle: 'Descobreix les cales més boniques de la Costa Brava des del Port de Blanes. Embarcacions sense llicència i amb llicència per a tota la família.',
          badgePort: 'Port de Blanes',
          badgeCapacity: '4-7 persones',
          badgeDuration: '1h-8h durada',
        },
      },
      lloret: {
        hero: {
          title: 'Excursions en Barco a Lloret de Mar',
          subtitle: 'Descobreix les famoses platges de Lloret de Mar navegant des del Port de Blanes. 25 minuts de navegació fins a un dels destins més populars de la Costa Brava.',
          badgeFrom: 'Des del Port de Blanes',
          badgeTime: '25 min navegant',
          badgeCapacity: '4-7 persones',
        },
      },
      tossa: {
        hero: {
          title: 'Excursions en Barco a Tossa de Mar',
          subtitle: 'Descobreix el poble medieval més bonic de la Costa Brava navegant des del Port de Blanes. 1 hora de navegació fins a la famosa Vila Vella de Tossa de Mar.',
          badgeFrom: 'Des del Port de Blanes',
          badgeTime: '1 hora navegant',
          badgeCapacity: '4-7 persones',
        },
      },
      newsletter: {
        title: 'Rep ofertes de temporada',
        subtitle: 'Sigues el primer en conèixer la nostra disponibilitat i ofertes especials',
        placeholder: 'El teu email',
        button: 'Subscriu-te',
        success: 'Gràcies! T\'avisarem amb les millors ofertes.',
        error: 'Error en subscriure\'s. Torna-ho a intentar.',
      },
    },
```

**Step 4: Añadir traducciones para `en` (inglés)**

Buscar `en: {` en translations.ts. Al final del objeto `en`, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Boat Rentals in Blanes',
          subtitle: 'Discover the most beautiful coves of the Costa Brava from Blanes Harbour. Boats with and without licence for the whole family.',
          badgePort: 'Blanes Harbour',
          badgeCapacity: '4-7 people',
          badgeDuration: '1h-8h duration',
        },
      },
      lloret: {
        hero: {
          title: 'Boat Trips to Lloret de Mar',
          subtitle: 'Discover the famous beaches of Lloret de Mar sailing from Blanes Harbour. 25 minutes by sea to one of the most popular destinations on the Costa Brava.',
          badgeFrom: 'From Blanes Harbour',
          badgeTime: '25 min sailing',
          badgeCapacity: '4-7 people',
        },
      },
      tossa: {
        hero: {
          title: 'Boat Trips to Tossa de Mar',
          subtitle: 'Discover the most beautiful medieval village on the Costa Brava sailing from Blanes Harbour. 1 hour by sea to the famous Vila Vella of Tossa de Mar.',
          badgeFrom: 'From Blanes Harbour',
          badgeTime: '1 hour sailing',
          badgeCapacity: '4-7 people',
        },
      },
      newsletter: {
        title: 'Get seasonal offers',
        subtitle: 'Be the first to know about our availability and special offers',
        placeholder: 'Your email',
        button: 'Subscribe',
        success: 'Thank you! We\'ll let you know about our best offers.',
        error: 'Subscription failed. Please try again.',
      },
    },
```

**Step 5: Añadir traducciones para `fr` (francés)**

Buscar `fr: {` en translations.ts. Al final, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Location de Bateaux à Blanes',
          subtitle: 'Découvrez les plus belles criques de la Costa Brava depuis le Port de Blanes. Bateaux avec et sans permis pour toute la famille.',
          badgePort: 'Port de Blanes',
          badgeCapacity: '4-7 personnes',
          badgeDuration: '1h-8h durée',
        },
      },
      lloret: {
        hero: {
          title: 'Excursions en Bateau à Lloret de Mar',
          subtitle: "Découvrez les célèbres plages de Lloret de Mar depuis le Port de Blanes. 25 minutes de navigation jusqu'à l'une des destinations les plus populaires de la Costa Brava.",
          badgeFrom: 'Depuis le Port de Blanes',
          badgeTime: '25 min de navigation',
          badgeCapacity: '4-7 personnes',
        },
      },
      tossa: {
        hero: {
          title: 'Excursions en Bateau à Tossa de Mar',
          subtitle: 'Découvrez le plus beau village médiéval de la Costa Brava depuis le Port de Blanes. 1 heure de navigation jusqu\'à la célèbre Vila Vella de Tossa de Mar.',
          badgeFrom: 'Depuis le Port de Blanes',
          badgeTime: '1 heure de navigation',
          badgeCapacity: '4-7 personnes',
        },
      },
      newsletter: {
        title: 'Recevez nos offres de saison',
        subtitle: 'Soyez le premier à connaître nos disponibilités et offres spéciales',
        placeholder: 'Votre email',
        button: "S'abonner",
        success: 'Merci\u00a0! Nous vous informerons de nos meilleures offres.',
        error: 'Erreur d\'abonnement. Veuillez réessayer.',
      },
    },
```

**Step 6: Añadir traducciones para `de` (alemán)**

Buscar `de: {` en translations.ts. Al final, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Bootsverleih in Blanes',
          subtitle: 'Entdecken Sie die schönsten Buchten der Costa Brava vom Hafen Blanes aus. Boote mit und ohne Führerschein für die ganze Familie.',
          badgePort: 'Hafen Blanes',
          badgeCapacity: '4-7 Personen',
          badgeDuration: '1-8 Std.',
        },
      },
      lloret: {
        hero: {
          title: 'Bootsausflüge nach Lloret de Mar',
          subtitle: 'Entdecken Sie die berühmten Strände von Lloret de Mar vom Hafen Blanes aus. 25 Minuten Fahrt zu einem der beliebtesten Reiseziele der Costa Brava.',
          badgeFrom: 'Ab Hafen Blanes',
          badgeTime: '25 Min. Fahrt',
          badgeCapacity: '4-7 Personen',
        },
      },
      tossa: {
        hero: {
          title: 'Bootsausflüge nach Tossa de Mar',
          subtitle: 'Entdecken Sie das schönste Mittelalter-Dorf der Costa Brava vom Hafen Blanes aus. 1 Stunde Fahrt bis zur berühmten Vila Vella von Tossa de Mar.',
          badgeFrom: 'Ab Hafen Blanes',
          badgeTime: '1 Std. Fahrt',
          badgeCapacity: '4-7 Personen',
        },
      },
      newsletter: {
        title: 'Saisonangebote erhalten',
        subtitle: 'Erfahren Sie als Erster von unserer Verfügbarkeit und Sonderangeboten',
        placeholder: 'Ihre E-Mail',
        button: 'Abonnieren',
        success: 'Danke! Wir informieren Sie über unsere besten Angebote.',
        error: 'Fehler beim Abonnieren. Bitte erneut versuchen.',
      },
    },
```

**Step 7: Añadir traducciones para `nl` (neerlandés)**

Buscar `nl: {` en translations.ts. Al final, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Bootsverhuur in Blanes',
          subtitle: 'Ontdek de mooiste kreken van de Costa Brava vanuit de haven van Blanes. Boten met en zonder rijbewijs voor het hele gezin.',
          badgePort: 'Haven van Blanes',
          badgeCapacity: '4-7 personen',
          badgeDuration: '1u-8u',
        },
      },
      lloret: {
        hero: {
          title: 'Boottochten naar Lloret de Mar',
          subtitle: 'Ontdek de beroemde stranden van Lloret de Mar vanuit de haven van Blanes. 25 minuten varen naar een van de populairste bestemmingen van de Costa Brava.',
          badgeFrom: 'Vanuit haven Blanes',
          badgeTime: '25 min varen',
          badgeCapacity: '4-7 personen',
        },
      },
      tossa: {
        hero: {
          title: 'Boottochten naar Tossa de Mar',
          subtitle: 'Ontdek het mooiste middeleeuwse dorp van de Costa Brava vanuit de haven van Blanes. 1 uur varen naar de beroemde Vila Vella van Tossa de Mar.',
          badgeFrom: 'Vanuit haven Blanes',
          badgeTime: '1 uur varen',
          badgeCapacity: '4-7 personen',
        },
      },
      newsletter: {
        title: 'Ontvang seizoensaanbiedingen',
        subtitle: 'Wees de eerste die onze beschikbaarheid en speciale aanbiedingen kent',
        placeholder: 'Uw e-mail',
        button: 'Abonneren',
        success: 'Bedankt! We laten u weten over onze beste aanbiedingen.',
        error: 'Abonneren mislukt. Probeer opnieuw.',
      },
    },
```

**Step 8: Añadir traducciones para `it` (italiano)**

Buscar `it: {` en translations.ts. Al final, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Noleggio Barche a Blanes',
          subtitle: 'Scopri le insenature più belle della Costa Brava dal Porto di Blanes. Barche con e senza patente per tutta la famiglia.',
          badgePort: 'Porto di Blanes',
          badgeCapacity: '4-7 persone',
          badgeDuration: '1h-8h',
        },
      },
      lloret: {
        hero: {
          title: 'Escursioni in Barca a Lloret de Mar',
          subtitle: 'Scopri le famose spiagge di Lloret de Mar navigando dal Porto di Blanes. 25 minuti di navigazione verso una delle destinazioni più popolari della Costa Brava.',
          badgeFrom: 'Dal Porto di Blanes',
          badgeTime: '25 min di navigazione',
          badgeCapacity: '4-7 persone',
        },
      },
      tossa: {
        hero: {
          title: 'Escursioni in Barca a Tossa de Mar',
          subtitle: 'Scopri il più bello villaggio medievale della Costa Brava navigando dal Porto di Blanes. 1 ora di navigazione fino alla famosa Vila Vella di Tossa de Mar.',
          badgeFrom: 'Dal Porto di Blanes',
          badgeTime: '1 ora di navigazione',
          badgeCapacity: '4-7 persone',
        },
      },
      newsletter: {
        title: 'Ricevi offerte stagionali',
        subtitle: 'Sii il primo a conoscere la nostra disponibilità e offerte speciali',
        placeholder: 'La tua email',
        button: 'Iscriviti',
        success: 'Grazie! Ti avviseremo delle nostre migliori offerte.',
        error: 'Errore di iscrizione. Riprova.',
      },
    },
```

**Step 9: Añadir traducciones para `ru` (ruso)**

Buscar `ru: {` en translations.ts. Al final, añadir:

```typescript
    locationPages: {
      blanes: {
        hero: {
          title: 'Аренда лодок в Бланесе',
          subtitle: 'Откройте для себя самые красивые бухты Коста-Бравы из порта Бланес. Лодки с правами и без для всей семьи.',
          badgePort: 'Порт Бланес',
          badgeCapacity: '4-7 человек',
          badgeDuration: '1-8 ч',
        },
      },
      lloret: {
        hero: {
          title: 'Морские прогулки в Льорет-де-Мар',
          subtitle: 'Откройте для себя знаменитые пляжи Льорет-де-Мар с отплытием из порта Бланес. 25 минут морского пути до одного из самых популярных курортов Коста-Бравы.',
          badgeFrom: 'Из порта Бланес',
          badgeTime: '25 мин плавания',
          badgeCapacity: '4-7 человек',
        },
      },
      tossa: {
        hero: {
          title: 'Морские прогулки в Тосса-де-Мар',
          subtitle: 'Откройте для себя красивейший средневековый город Коста-Бравы с отплытием из порта Бланес. 1 час морского пути до знаменитой Вила Велья в Тосса-де-Мар.',
          badgeFrom: 'Из порта Бланес',
          badgeTime: '1 час плавания',
          badgeCapacity: '4-7 человек',
        },
      },
      newsletter: {
        title: 'Получайте сезонные предложения',
        subtitle: 'Первыми узнавайте о нашей доступности и специальных предложениях',
        placeholder: 'Ваш email',
        button: 'Подписаться',
        success: 'Спасибо! Мы сообщим вам о лучших предложениях.',
        error: 'Ошибка подписки. Попробуйте ещё раз.',
      },
    },
```

**Step 10: Verificar TypeScript**

```bash
npm run check
```

Esperado: sin errores TS. Si hay "Property 'locationPages' is missing in type", significa que falta añadir el bloque en algún idioma.

**Step 11: Commit**

```bash
git add client/src/lib/translations.ts
git commit -m "feat: add locationPages and newsletter translation keys for all 8 languages"
```

---

## Task 3: Location Pages — Reemplazar Hero Hardcodeado

**Files:**
- Modify: `client/src/pages/location-blanes.tsx` (líneas 111-133)
- Modify: `client/src/pages/location-lloret-de-mar.tsx` (líneas 120-141)
- Modify: `client/src/pages/location-tossa-de-mar.tsx` (líneas 120-141)

**Step 1: Actualizar `location-blanes.tsx`**

Localizar el bloque del hero (líneas ~111-133). Reemplazar el bloque completo:

```tsx
// ANTES:
<div className="flex items-center justify-center mb-6">
  <MapPin className="w-8 h-8 text-primary mr-4" />
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
    Alquiler de Barcos en Blanes
  </h1>
</div>
<p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
  Descubre las calas más hermosas de la Costa Brava desde el Puerto de Blanes.
  Embarcaciones sin licencia y con licencia para toda la familia.
</p>
<div className="flex flex-wrap gap-3 justify-center">
  <Badge variant="outline" className="text-primary border-primary">
    <Anchor className="w-4 h-4 mr-2" />
    Puerto de Blanes
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Users className="w-4 h-4 mr-2" />
    4-7 personas
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Clock className="w-4 h-4 mr-2" />
    1h-8h duración
  </Badge>
</div>
```

```tsx
// DESPUÉS:
<div className="flex items-center justify-center mb-6">
  <MapPin className="w-8 h-8 text-primary mr-4" />
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
    {t.locationPages.blanes.hero.title}
  </h1>
</div>
<p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
  {t.locationPages.blanes.hero.subtitle}
</p>
<div className="flex flex-wrap gap-3 justify-center">
  <Badge variant="outline" className="text-primary border-primary">
    <Anchor className="w-4 h-4 mr-2" />
    {t.locationPages.blanes.hero.badgePort}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Users className="w-4 h-4 mr-2" />
    {t.locationPages.blanes.hero.badgeCapacity}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Clock className="w-4 h-4 mr-2" />
    {t.locationPages.blanes.hero.badgeDuration}
  </Badge>
</div>
```

**Step 2: Actualizar `location-lloret-de-mar.tsx`**

Mismo patrón (líneas ~120-141):

```tsx
// DESPUÉS:
<div className="flex items-center justify-center mb-6">
  <MapPin className="w-8 h-8 text-primary mr-4" />
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
    {t.locationPages.lloret.hero.title}
  </h1>
</div>
<p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
  {t.locationPages.lloret.hero.subtitle}
</p>
<div className="flex flex-wrap gap-3 justify-center">
  <Badge variant="outline" className="text-primary border-primary">
    <Anchor className="w-4 h-4 mr-2" />
    {t.locationPages.lloret.hero.badgeFrom}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Clock className="w-4 h-4 mr-2" />
    {t.locationPages.lloret.hero.badgeTime}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Users className="w-4 h-4 mr-2" />
    {t.locationPages.lloret.hero.badgeCapacity}
  </Badge>
</div>
```

**Step 3: Actualizar `location-tossa-de-mar.tsx`**

Mismo patrón (líneas ~120-141):

```tsx
// DESPUÉS:
<div className="flex items-center justify-center mb-6">
  <Castle className="w-8 h-8 text-primary mr-4" />
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
    {t.locationPages.tossa.hero.title}
  </h1>
</div>
<p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
  {t.locationPages.tossa.hero.subtitle}
</p>
<div className="flex flex-wrap gap-3 justify-center">
  <Badge variant="outline" className="text-primary border-primary">
    <Anchor className="w-4 h-4 mr-2" />
    {t.locationPages.tossa.hero.badgeFrom}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Clock className="w-4 h-4 mr-2" />
    {t.locationPages.tossa.hero.badgeTime}
  </Badge>
  <Badge variant="outline" className="text-primary border-primary">
    <Users className="w-4 h-4 mr-2" />
    {t.locationPages.tossa.hero.badgeCapacity}
  </Badge>
</div>
```

**Step 4: Verificar TypeScript**

```bash
npm run check
```

**Step 5: Commit**

```bash
git add client/src/pages/location-blanes.tsx client/src/pages/location-lloret-de-mar.tsx client/src/pages/location-tossa-de-mar.tsx
git commit -m "feat: translate location pages hero sections using i18n system (8 languages)"
```

---

## Task 4: Newsletter — Schema + Storage + Endpoint

**Files:**
- Modify: `shared/schema.ts` (añadir tabla + exportar tipos)
- Modify: `server/storage.ts` (añadir método a IStorage + implementación)
- Create: `server/routes/newsletter.ts`
- Modify: `server/routes/index.ts` (registrar rutas)

**Step 1: Añadir tabla en `shared/schema.ts`**

Al final de `shared/schema.ts` (antes del EOF), añadir:

```typescript
// Newsletter subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  language: text("language").default("es"),
  source: text("source").default("footer"), // 'footer' | 'popup'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
```

**Step 2: Migrar la base de datos**

```bash
npm run db:push
```

Esperado: tabla `newsletter_subscribers` creada.

**Step 3: Añadir a `IStorage` en `server/storage.ts`**

En la interfaz `IStorage` (buscar `export interface IStorage`), añadir al final:

```typescript
  createNewsletterSubscriber(email: string, language: string, source: string): Promise<NewsletterSubscriber>;
```

**Step 4: Añadir import en `server/storage.ts`**

En los imports de `server/storage.ts` (línea ~1-36), añadir al import de schema:

```typescript
  newsletterSubscribers,
  type NewsletterSubscriber,
```

**Step 5: Implementar en `DatabaseStorage` en `server/storage.ts`**

En la clase `DatabaseStorage` (la que implementa `IStorage`), añadir el método al final:

```typescript
  async createNewsletterSubscriber(email: string, language: string, source: string): Promise<NewsletterSubscriber> {
    const [subscriber] = await db
      .insert(newsletterSubscribers)
      .values({ email: email.toLowerCase().trim(), language, source })
      .returning();
    return subscriber;
  }
```

**Step 6: Crear `server/routes/newsletter.ts`**

```typescript
import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";

const subscribeSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  language: z.string().min(2).max(5).default("es"),
  source: z.string().max(32).default("footer"),
});

export function registerNewsletterRoutes(app: Express) {
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const parsed = subscribeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email inválido" });
      }

      const { email, language, source } = parsed.data;
      const subscriber = await storage.createNewsletterSubscriber(email, language, source);
      res.status(201).json({ success: true, id: subscriber.id });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // Unique constraint violation — already subscribed
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
        return res.status(409).json({ message: "Este email ya está suscrito" });
      }
      console.error("[Newsletter] Error subscribing:", msg);
      res.status(500).json({ message: "Error al procesar la suscripción" });
    }
  });
}
```

**Step 7: Registrar rutas en `server/routes/index.ts`**

```typescript
// Añadir import:
import { registerNewsletterRoutes } from "./newsletter";

// Añadir en registerRoutes, junto a las demás rutas:
registerNewsletterRoutes(app);
```

**Step 8: Verificar TypeScript**

```bash
npm run check
```

**Step 9: Commit**

```bash
git add shared/schema.ts server/storage.ts server/routes/newsletter.ts server/routes/index.ts
git commit -m "feat: add newsletter_subscribers table, storage method, and POST /api/newsletter/subscribe endpoint"
```

---

## Task 5: Newsletter — Formulario en Footer

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Step 1: Añadir el formulario de newsletter en `Footer.tsx`**

En `client/src/components/Footer.tsx`, el formulario se añade en la sección "Services" (4ª columna del grid). Añadir los siguientes imports al principio del archivo:

```typescript
import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
```

> Nota: `useTranslations` ya está importado. `useLanguage` puede ya estar importado también — verificar antes de añadirlo de nuevo.

**Step 2: Añadir estado del formulario**

Dentro de la función `Footer()`, después de `const currentYear = new Date().getFullYear();`, añadir:

```typescript
  const { language } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim(), language, source: 'footer' }),
      });
      if (res.ok || res.status === 409) {
        setNewsletterState('success'); // 409 = ya suscrito, también mostramos éxito
      } else {
        setNewsletterState('error');
      }
    } catch {
      setNewsletterState('error');
    }
  };
```

**Step 3: Añadir el bloque JSX del formulario**

En el JSX del Footer, localizar la 4ª columna `{/* Services */}`. **Antes** del cierre `</div>` de esa columna (después de la lista `</ul>`), añadir:

```tsx
            {/* Newsletter */}
            <div className="mt-6">
              <h3 className="font-semibold text-white mb-2 text-sm">{t.locationPages.newsletter.title}</h3>
              <p className="text-xs text-gray-400 mb-3">{t.locationPages.newsletter.subtitle}</p>
              {newsletterState === 'success' ? (
                <p className="text-xs text-green-400">{t.locationPages.newsletter.success}</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={t.locationPages.newsletter.placeholder}
                    required
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={newsletterState === 'loading'}
                    className="bg-primary hover:bg-primary/90 text-white text-xs font-medium py-2 px-3 rounded transition-colors disabled:opacity-50"
                  >
                    {newsletterState === 'loading' ? '...' : t.locationPages.newsletter.button}
                  </button>
                  {newsletterState === 'error' && (
                    <p className="text-xs text-red-400">{t.locationPages.newsletter.error}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    <a href="/privacy-policy" className="underline hover:text-gray-400">{t.footer.privacy}</a>
                  </p>
                </form>
              )}
            </div>
```

**Step 4: Verificar TypeScript**

```bash
npm run check
```

**Step 5: Commit**

```bash
git add client/src/components/Footer.tsx
git commit -m "feat: add newsletter signup form in footer with success/error states"
```

---

## Task 6: WhatsApp Post-Trip Thank-You

**Problema:** El scheduler envía email de thank-you 24h post-viaje pero no envía WhatsApp. Hay que añadir el mensaje por WhatsApp en el mismo job.

**Files:**
- Modify: `shared/schema.ts` (nuevo campo en bookings)
- Modify: `server/storage.ts` (nuevo método + import)
- Modify: `server/services/schedulerService.ts` (nueva función + llamada desde `processThankYou`)

**Step 1: Añadir `whatsappThankYouSent` a la tabla `bookings` en `shared/schema.ts`**

En `shared/schema.ts`, localizar la tabla `bookings` (línea ~298). Buscar el campo `emailThankYouSent`:

```typescript
  emailThankYouSent: boolean("email_thank_you_sent").notNull().default(false),
```

Añadir **justo debajo**:

```typescript
  whatsappThankYouSent: boolean("whatsapp_thank_you_sent").notNull().default(false),
```

**Step 2: Migrar la base de datos**

```bash
npm run db:push
```

Esperado: columna `whatsapp_thank_you_sent` añadida a la tabla `bookings`.

**Step 3: Añadir método en `IStorage` en `server/storage.ts`**

En la interfaz `IStorage`, añadir:

```typescript
  updateBookingWhatsAppThankYouStatus(id: string, sent: boolean): Promise<void>;
```

**Step 4: Implementar en `DatabaseStorage` en `server/storage.ts`**

```typescript
  async updateBookingWhatsAppThankYouStatus(id: string, sent: boolean): Promise<void> {
    await db
      .update(bookings)
      .set({ whatsappThankYouSent: sent })
      .where(eq(bookings.id, id));
  }
```

**Step 5: Añadir `trySendWhatsAppThankYou` en `schedulerService.ts`**

En `server/services/schedulerService.ts`, después de la función `trySendWhatsAppReminder` (línea ~64), añadir:

```typescript
/**
 * Try to send a WhatsApp thank-you message 24h after the trip.
 * Returns true if sent, false if Twilio is not configured or if sending fails. Never throws.
 */
async function trySendWhatsAppThankYou(booking: Booking): Promise<boolean> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");

    if (!isTwilioConfigured()) {
      console.log("[Scheduler] Twilio not configured, skipping WhatsApp thank-you");
      return false;
    }

    if (!booking.customerPhone) {
      console.log(`[Scheduler] No phone number for booking ${booking.id}, skipping WhatsApp thank-you`);
      return false;
    }

    const message = [
      `Hola ${booking.customerName}!`,
      ``,
      `Esperamos que tu salida de ayer haya sido increible.`,
      ``,
      `Si lo disfrutaste, te agradeceriamos mucho que nos dejaras una resena en Google:`,
      `https://g.page/r/costabravarentaboat/review`,
      ``,
      `Como cliente especial, tienes un descuento exclusivo para tu proxima reserva. Solo preguntanos!`,
      ``,
      `Un abrazo, Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Scheduler] WhatsApp thank-you error for booking ${booking.id}:`, message);
    return false;
  }
}
```

**Step 6: Llamar `trySendWhatsAppThankYou` desde `processThankYou`**

En `server/services/schedulerService.ts`, en la función `processThankYou` (línea ~135), localizar el bloque que envía el email:

```typescript
        // Mark as sent regardless to prevent retries
        await storage.updateBookingEmailStatus(booking.id, undefined, true);

        console.log(
          `[Scheduler] Thank-you processed for booking ${booking.id}: email=${emailResult.success}`
        );
```

Reemplazarlo por:

```typescript
        // Send WhatsApp thank-you (fire-and-forget, doesn't block email success)
        let whatsappThankYouSent = false;
        if (!booking.whatsappThankYouSent) {
          whatsappThankYouSent = await trySendWhatsAppThankYou(booking);
          if (whatsappThankYouSent) {
            await storage.updateBookingWhatsAppThankYouStatus(booking.id, true);
          }
        }

        // Mark email as sent regardless to prevent retries
        await storage.updateBookingEmailStatus(booking.id, undefined, true);

        console.log(
          `[Scheduler] Thank-you processed for booking ${booking.id}: email=${emailResult.success}, whatsapp=${whatsappThankYouSent}`
        );
```

**Step 7: Verificar TypeScript**

```bash
npm run check
```

**Step 8: Commit**

```bash
git add shared/schema.ts server/storage.ts server/services/schedulerService.ts
git commit -m "feat: send WhatsApp thank-you with Google review link 24h after trip ends"
```

---

## Verificación Final

```bash
npm run check
```

Esperado: 0 errores TypeScript.

Rutas a verificar manualmente en el navegador:
- `/alquiler-barcos-blanes` con idioma francés → hero en francés
- `/alquiler-barcos-lloret-de-mar` con idioma alemán → hero en alemán
- `/alquiler-barcos-tossa-de-mar` con idioma inglés → hero en inglés
- Footer en cualquier página → formulario de newsletter visible
- Abrir DevTools → `?utm_source=google&utm_medium=cpc` en URL → `sessionStorage.getItem('cbrab_utm')` devuelve el objeto

---

## Notas para el Implementador

1. **`translations.ts` tiene 5312 líneas** — usar búsqueda exacta `es: {`, `ca: {`, `en: {`, etc. para localizar cada objeto de idioma. Cada objeto está bien delimitado.

2. **No hay testing setup** — verificar con `npm run check` (TypeScript) y pruebas manuales en el navegador.

3. **`npm run db:push`** aplica los cambios de schema directamente sin migración explícita. Ejecutarlo dos veces en el Task 4 y Task 6.

4. **El campo `whatsappThankYouSent`** sólo lo necesita el scheduler. El tipo `Booking` en `@shared/schema` se regenera automáticamente al añadir el campo.

5. **El formulario de newsletter** usa `t.locationPages.newsletter.*` — esas claves se añaden en Task 2, así que Task 5 depende de que Task 2 esté completo primero.

6. **Google Review URL** en el mensaje de WhatsApp: `https://g.page/r/costabravarentaboat/review` — verificar con el propietario que esta URL sea la correcta antes de hacer deploy.
