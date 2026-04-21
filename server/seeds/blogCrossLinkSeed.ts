import type { IStorage } from "../storage";
import type { InsertBlogPost } from "@shared/schema";
import { logger } from "../lib/logger";

interface BlogPostSeed extends InsertBlogPost {
  /** Override publishedAt after creation */
  _publishedAt: Date;
}

const crossLinkPosts: BlogPostSeed[] = [
  // ===== ARTÍCULO A: Qué hacer en Blanes además de alquilar un barco =====
  {
    title: "Que Hacer en Blanes Ademas de Alquilar un Barco: 12 Planes Imprescindibles",
    slug: "que-hacer-en-blanes-ademas-de-alquilar-barco",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/blanes-pueblo.jpg",
    metaDescription: "Descubre 12 planes imprescindibles en Blanes y alrededores: jardines, calas, gastronomia, scooters en Lloret y mucho mas para completar tu escapada.",
    tags: ["que hacer en blanes", "planes blanes costa brava", "blanes actividades", "turismo blanes", "alquiler scooter lloret", "blanes lloret tossa", "escapada costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-04-16T10:00:00Z"),
    excerpt: "Blanes es mucho mas que un puerto. Descubre 12 planes imprescindibles para completar tu escapada: desde jardines botanicos y calas secretas hasta explorar la Costa Brava en scooter desde Lloret de Mar.",
    titleByLang: {
      es: "Que Hacer en Blanes Ademas de Alquilar un Barco: 12 Planes Imprescindibles",
      en: "What to Do in Blanes Besides Renting a Boat: 12 Must-Do Activities",
    },
    excerptByLang: {
      es: "Blanes es mucho mas que un puerto. Descubre 12 planes imprescindibles para completar tu escapada: desde jardines botanicos y calas secretas hasta explorar la Costa Brava en scooter desde Lloret de Mar.",
      en: "Blanes is much more than a port. Discover 12 must-do activities to complete your getaway: from botanical gardens and secret coves to exploring the Costa Brava by scooter from Lloret de Mar.",
    },
    metaDescByLang: {
      es: "Descubre 12 planes imprescindibles en Blanes y alrededores: jardines, calas, gastronomia, scooters en Lloret y mucho mas para completar tu escapada.",
      en: "Discover 12 must-do activities in Blanes and surroundings: gardens, coves, gastronomy, scooters in Lloret and much more to complete your getaway.",
    },
    contentByLang: {
      es: `Blanes es la puerta de la Costa Brava. Cada verano, miles de visitantes descubren sus aguas cristalinas alquilando un barco desde el puerto, pero la experiencia no termina ahi. Si tienes uno o varios dias por la zona, Blanes y sus alrededores esconden planes que convierten una jornada en el mar en una escapada completa e inolvidable.

En esta guia hemos reunido **12 actividades imprescindibles** para antes, despues o en lugar de tu dia de navegacion. Desde jardines que quitan el aliento hasta carreteras de pelicula que puedes recorrer en scooter.

## Planes en Blanes

### 1. Jardin Botanico Marimurtra

Considerado uno de los jardines botanicos mas bonitos del Mediterraneo, Marimurtra esta encaramado sobre los acantilados al sur de Blanes con vistas panoramicas al mar. Mas de 4.000 especies de plantas, un templete romano con la mejor vista de la Costa Brava y senderos que serpentean entre cactus gigantes y flora tropical.

**Horario:** 10:00-18:00 (verano hasta 20:00) | **Precio:** ~7EUR adultos | **Duracion recomendada:** 1,5-2 horas

**Consejo:** Ve a primera hora o ultima hora de la tarde. La luz del atardecer desde el templete es espectacular para fotos.

### 2. Jardin Botanico Pinya de Rosa

Menos conocido que Marimurtra pero igualmente impresionante, este jardin esta especializado en plantas suculentas y cactaceas. Si te gustan las plantas exoticas, aqui encontraras una de las colecciones mas importantes de Europa.

**Duracion recomendada:** 1 hora | **Precio:** ~5EUR

### 3. El Paseo Maritimo y Sa Palomera

La roca de Sa Palomera marca el punto donde oficialmente empieza la Costa Brava. Pasear por el paseo maritimo al atardecer, tomar algo en una terraza frente al mar y ver como el sol se esconde detras de las montanas es un clasico que no falla.

**Consejo:** Los miercoles y sabados hay mercado en el paseo -- perfecto para comprar productos locales.

### 4. Casco Antiguo y Gastronomia Local

El centro historico de Blanes tiene callejuelas con encanto, la iglesia gotica de Santa Maria y restaurantes donde comer pescado fresco del dia. No te pierdas el suquet de peix (guiso de pescado tipico de la zona) ni los arroces marineros.

**Donde comer:** El puerto pesquero tiene varios restaurantes con terraza donde ves los barcos de pesca llegar con la captura del dia.

## Planes en los Alrededores

### 5. Lloret de Mar: Playas y Vida Nocturna

A solo 8 km al norte de Blanes, Lloret combina playas amplias, chiringuitos con ambiente y una vida nocturna que atrae a visitantes de toda Europa. Pero Lloret es mucho mas que fiesta: el Camino de Ronda entre Lloret y Tossa de Mar es una de las rutas de senderismo costeras mas espectaculares de la Costa Brava.

### 6. Explorar la Costa Brava en Scooter desde Lloret

Una de las mejores formas de descubrir la Costa Brava por tierra es sobre dos ruedas. Desde Lloret de Mar (a solo 12 km de Blanes), puedes [alquilar un scooter en Coast Rent](https://coastrent.es) y recorrer carreteras que serpentean entre pinos, acantilados y calas escondidas.

**Rutas recomendadas en scooter:**

- **Lloret - Tossa de Mar** (12 km, 20 min): La carretera GI-682 es una de las mas bonitas de la Costa Brava. Curvas entre pinares con vistas al mar en cada giro. Tossa te recibe con su espectacular Vila Vella amurallada.
- **Lloret - Sant Grau** (8 km, 15 min): Subida al santuario de Sant Grau con vistas panoramicas de toda la costa. Ruta corta pero intensa.
- **Lloret - Girona** (40 km, 50 min): Escapada cultural a la capital de provincia. Casas de colores del Onyar, catedral gotica, barrio judio y la mejor gastronomia de la region.

El [alquiler de motos en Lloret de Mar](https://coastrent.es) es una opcion perfecta para los dias que quieras explorar por tierra despues de una manana en barco. Coast Rent tiene scooters desde 125cc, ideales para recorrer la costa sin necesidad de carnet especial (con carnet de coche es suficiente para motos de 125cc si tienes mas de 3 anos de experiencia con el carnet B).

**Precio orientativo:** Desde 35EUR/dia por un scooter 125cc.

### 7. Tossa de Mar: La Vila Vella

A 25 km de Blanes, Tossa de Mar es uno de los pueblos mas fotografiados de la Costa Brava. Su recinto amurallado medieval (la Vila Vella) es el unico de toda la costa catalana que se conserva intacto. Puedes llegar en barco con nosotros (1h 15min con [barco con licencia](/barcos-con-licencia)), en coche o en scooter por la carretera costera.

### 8. Las Calas Secretas del Camino de Ronda

El Camino de Ronda (GR-92) conecta pueblos y calas a lo largo de toda la Costa Brava. Desde Blanes puedes caminar hacia el norte (direccion Lloret) y descubrir calas como Sa Forcanera, Cala Sant Francesc o Cala Bona, muchas de ellas accesibles a pie o en [barco sin licencia](/barcos-sin-licencia).

**Consejo:** Combina manana en barco + tarde a pie por el Camino de Ronda. Asi descubres las mismas calas desde dos perspectivas completamente distintas.

### 9. Girona: Capital de Provincia

A 60 km de Blanes (45 min en coche), Girona es una joya. Las casas de colores sobre el rio Onyar, la catedral con la nave gotica mas ancha del mundo, el barrio judio (Call) mejor conservado de Espana y restaurantes de nivel Michelin. Si tienes un dia extra, Girona merece la visita.

### 10. Deportes Acuaticos

Ademas del barco, la Costa Brava ofrece paddle surf, kayak, snorkel y buceo. Desde nuestros barcos puedes anadir [paddle surf (25EUR)](/barcos) o [snorkel (7,50EUR)](/barcos) como extras. Para buceo, hay centros de submarinismo en Blanes y Lloret que organizan inmersiones guiadas.

### 11. Concurso Internacional de Fuegos Artificiales

Si visitas Blanes entre el 21 y el 27 de julio, no te puedes perder el concurso internacional de fuegos artificiales. Cada noche, un pais diferente ilumina el cielo sobre la playa de Blanes con espectaculos pirotecnicos que duran 25 minutos. Es el evento mas importante de la Costa Brava sur y atrae a mas de 300.000 espectadores cada edicion.

**Consejo pro:** Alquila un barco para ver los fuegos desde el agua. Es la mejor perspectiva posible y evitas las aglomeraciones de la playa. [Contactanos por WhatsApp](https://wa.me/34611500372) para reservar con antelacion porque estas fechas se llenan rapido.

### 12. Mercados y Ferias Locales

- **Lunes:** Mercado de Blanes (ropa, artesania, productos locales)
- **Miercoles y sabados:** Mercado del paseo maritimo
- **Jueves:** Mercado de Lloret de Mar
- **Temporada alta:** Feria de artesania nocturna en el paseo de Blanes

---

## Como Organizar tu Escapada Perfecta

La combinacion ideal para una escapada de 2-3 dias en la Costa Brava:

**Dia 1 - Mar:** Alquila un [barco sin licencia](/barcos-sin-licencia) por la manana (desde 70EUR/h) y explora las calas entre Blanes y Lloret. Por la tarde, paseo por el casco antiguo y cena de pescado en el puerto.

**Dia 2 - Tierra:** [Alquila un scooter en Coast Rent en Lloret](https://coastrent.es) y recorre la carretera costera hasta Tossa de Mar. Comida en Tossa, paseo por la Vila Vella y vuelta por la carretera interior.

**Dia 3 - Cultura:** Excursion a Girona por la manana. Tarde libre en la playa de Blanes o visita a Marimurtra.

---

## Preguntas Frecuentes

### Es necesario licencia para alquilar un barco en Blanes?

No. Tenemos [barcos sin licencia](/barcos-sin-licencia) para hasta 5 personas con un briefing de seguridad de 10 minutos. No necesitas experiencia previa.

### Cuanto cuesta alquilar un barco en Blanes?

Los [barcos sin licencia](/barcos-sin-licencia) empiezan desde 70EUR/hora en temporada baja. Los [barcos con licencia](/barcos-con-licencia) desde 160EUR por 2 horas. Gasolina incluida en barcos sin licencia.

### Se puede ir de Blanes a Tossa de Mar en barco?

Si, con un [barco con licencia](/barcos-con-licencia). El trayecto es de unos 75 minutos costeando. Es una de las rutas mas bonitas de la Costa Brava.

### Que distancia hay entre Blanes y Lloret de Mar?

Solo 8 km por carretera (12 minutos en coche). En barco, la costa entre Blanes y Lloret es una de las mas espectaculares de la Costa Brava.

### Se puede alquilar un scooter en Lloret de Mar?

Si. [Coast Rent](https://coastrent.es) en Lloret de Mar ofrece alquiler de scooters desde 125cc, perfectos para recorrer la costa. Con carnet de coche (3+ anos) puedes conducir motos de hasta 125cc.

---

Blanes es el punto de partida perfecto para descubrir la Costa Brava por mar y por tierra. [Reserva tu barco](/barcos) para la experiencia maritima y complementa con los planes de esta guia para una escapada redonda. Si necesitas consejo personalizado, [escribenos por WhatsApp](https://wa.me/34611500372) y te ayudamos a planificar tu viaje.`,
      en: `Blanes is the gateway to the Costa Brava. Every summer, thousands of visitors discover its crystal-clear waters by renting a boat from the harbour, but the experience doesn't end there. If you have one or several days in the area, Blanes and its surroundings hide plans that turn a day at sea into a complete, unforgettable getaway.

In this guide we've compiled **12 must-do activities** for before, after, or instead of your sailing day. From jaw-dropping gardens to cinematic coastal roads you can ride on a scooter.

## Activities in Blanes

### 1. Marimurtra Botanical Garden

Considered one of the most beautiful botanical gardens in the Mediterranean, Marimurtra is perched on the cliffs south of Blanes with panoramic sea views. Over 4,000 plant species, a Roman-style temple with the best view on the Costa Brava, and paths winding between giant cacti and tropical flora.

**Hours:** 10:00-18:00 (summer until 20:00) | **Price:** ~7EUR adults | **Recommended time:** 1.5-2 hours

**Tip:** Go first thing in the morning or late afternoon. The sunset light from the temple is spectacular for photos.

### 2. Pinya de Rosa Botanical Garden

Less known than Marimurtra but equally impressive, this garden specialises in succulents and cacti. If you love exotic plants, you'll find one of the most important collections in Europe here.

**Recommended time:** 1 hour | **Price:** ~5EUR

### 3. The Seafront Promenade and Sa Palomera

The Sa Palomera rock marks the official starting point of the Costa Brava. Strolling along the seafront at sunset, having a drink at a terrace facing the sea and watching the sun set behind the mountains is a classic that never disappoints.

**Tip:** On Wednesdays and Saturdays there's a market on the promenade -- perfect for buying local products.

### 4. Old Town and Local Gastronomy

Blanes' historic centre has charming narrow streets, the Gothic church of Santa Maria, and restaurants where you can eat fresh fish caught that same day. Don't miss the suquet de peix (typical local fish stew) or the seafood rice dishes.

**Where to eat:** The fishing harbour has several restaurants with terraces where you can watch the fishing boats arrive with the day's catch.

## Activities in the Surroundings

### 5. Lloret de Mar: Beaches and Nightlife

Just 8 km north of Blanes, Lloret combines wide beaches, lively beach bars and a nightlife that attracts visitors from all over Europe. But Lloret is much more than partying: the Camino de Ronda coastal path between Lloret and Tossa de Mar is one of the most spectacular coastal hiking routes on the Costa Brava.

### 6. Explore the Costa Brava by Scooter from Lloret

One of the best ways to discover the Costa Brava by land is on two wheels. From Lloret de Mar (just 12 km from Blanes), you can [rent a scooter at Coast Rent](https://coastrent.es) and ride roads that wind between pine trees, cliffs, and hidden coves.

**Recommended scooter routes:**

- **Lloret - Tossa de Mar** (12 km, 20 min): The GI-682 road is one of the most beautiful on the Costa Brava. Curves through pine forests with sea views at every turn. Tossa welcomes you with its spectacular walled Vila Vella.
- **Lloret - Sant Grau** (8 km, 15 min): Climb to the Sant Grau sanctuary with panoramic views of the entire coast. Short but intense route.
- **Lloret - Girona** (40 km, 50 min): Cultural getaway to the provincial capital. Colourful houses along the Onyar river, Gothic cathedral, Jewish quarter and the best gastronomy in the region.

[Scooter rental in Lloret de Mar](https://coastrent.es) is a perfect option for the days you want to explore by land after a morning on the boat. Coast Rent has scooters from 125cc, ideal for cruising the coast without needing a special licence (a car driving licence is sufficient for 125cc motorcycles if you've held it for 3+ years).

**Approximate price:** From 35EUR/day for a 125cc scooter.

### 7. Tossa de Mar: The Vila Vella

25 km from Blanes, Tossa de Mar is one of the most photographed towns on the Costa Brava. Its medieval walled enclosure (the Vila Vella) is the only one along the entire Catalan coast that remains intact. You can get there by boat with us (1h 15min with a [licensed boat](/boats-with-license)), by car, or by scooter along the coastal road.

### 8. The Secret Coves of the Camino de Ronda

The Camino de Ronda (GR-92) connects towns and coves along the entire Costa Brava. From Blanes you can walk north (towards Lloret) and discover coves like Sa Forcanera, Cala Sant Francesc, or Cala Bona, many of them accessible on foot or by [boat without licence](/boats-without-license).

**Tip:** Combine a morning by boat + afternoon walking the Camino de Ronda. You'll discover the same coves from two completely different perspectives.

### 9. Girona: Provincial Capital

60 km from Blanes (45 min by car), Girona is a gem. The colourful houses over the Onyar river, the cathedral with the widest Gothic nave in the world, the best-preserved Jewish quarter (Call) in Spain, and Michelin-level restaurants. If you have an extra day, Girona is worth the visit.

### 10. Water Sports

Besides boating, the Costa Brava offers paddle surf, kayaking, snorkelling and diving. From our boats you can add [paddle surf (25EUR)](/boats) or [snorkel gear (7.50EUR)](/boats) as extras. For diving, there are dive centres in Blanes and Lloret that organise guided dives.

### 11. International Fireworks Competition

If you visit Blanes between July 21st and 27th, you can't miss the international fireworks competition. Each night, a different country lights up the sky above Blanes beach with pyrotechnic displays lasting 25 minutes. It's the most important event on the southern Costa Brava and attracts over 300,000 spectators each year.

**Pro tip:** Rent a boat to watch the fireworks from the water. It's the best possible perspective and you avoid the beach crowds. [Contact us on WhatsApp](https://wa.me/34611500372) to book in advance as these dates fill up fast.

### 12. Local Markets and Fairs

- **Monday:** Blanes market (clothing, crafts, local products)
- **Wednesday and Saturday:** Seafront promenade market
- **Thursday:** Lloret de Mar market
- **High season:** Evening craft fair on the Blanes promenade

---

## How to Plan Your Perfect Getaway

The ideal combination for a 2-3 day Costa Brava getaway:

**Day 1 - Sea:** Rent a [boat without licence](/boats-without-license) in the morning (from 70EUR/h) and explore the coves between Blanes and Lloret. In the afternoon, stroll through the old town and have a seafood dinner at the harbour.

**Day 2 - Land:** [Rent a scooter from Coast Rent in Lloret](https://coastrent.es) and ride the coastal road to Tossa de Mar. Lunch in Tossa, walk through the Vila Vella and return via the inland road.

**Day 3 - Culture:** Morning trip to Girona. Free afternoon on Blanes beach or a visit to Marimurtra.

---

## Frequently Asked Questions

### Do I need a licence to rent a boat in Blanes?

No. We have [boats without licence](/boats-without-license) for up to 5 people with a 10-minute safety briefing. No prior experience needed.

### How much does it cost to rent a boat in Blanes?

[Boats without licence](/boats-without-license) start from 70EUR/hour in low season. [Licensed boats](/boats-with-license) from 160EUR for 2 hours. Fuel included on boats without licence.

### Can you go from Blanes to Tossa de Mar by boat?

Yes, with a [licensed boat](/boats-with-license). The journey takes about 75 minutes along the coast. It's one of the most beautiful routes on the Costa Brava.

### What is the distance between Blanes and Lloret de Mar?

Just 8 km by road (12 minutes by car). By boat, the coastline between Blanes and Lloret is one of the most spectacular on the Costa Brava.

### Can you rent a scooter in Lloret de Mar?

Yes. [Coast Rent](https://coastrent.es) in Lloret de Mar offers scooter rental from 125cc, perfect for cruising the coast. With a car licence (3+ years) you can ride motorcycles up to 125cc.

---

Blanes is the perfect starting point to discover the Costa Brava by sea and by land. [Book your boat](/boats) for the maritime experience and complement it with the plans in this guide for a well-rounded getaway. If you need personalised advice, [write to us on WhatsApp](https://wa.me/34611500372) and we'll help you plan your trip.`,
    },
    content: `Blanes es la puerta de la Costa Brava. Cada verano, miles de visitantes descubren sus aguas cristalinas alquilando un barco desde el puerto, pero la experiencia no termina ahi. Si tienes uno o varios dias por la zona, Blanes y sus alrededores esconden planes que convierten una jornada en el mar en una escapada completa e inolvidable.

En esta guia hemos reunido **12 actividades imprescindibles** para antes, despues o en lugar de tu dia de navegacion. Desde jardines que quitan el aliento hasta carreteras de pelicula que puedes recorrer en scooter.

## Planes en Blanes

### 1. Jardin Botanico Marimurtra

Considerado uno de los jardines botanicos mas bonitos del Mediterraneo, Marimurtra esta encaramado sobre los acantilados al sur de Blanes con vistas panoramicas al mar. Mas de 4.000 especies de plantas, un templete romano con la mejor vista de la Costa Brava y senderos que serpentean entre cactus gigantes y flora tropical.

**Horario:** 10:00-18:00 (verano hasta 20:00) | **Precio:** ~7EUR adultos | **Duracion recomendada:** 1,5-2 horas

**Consejo:** Ve a primera hora o ultima hora de la tarde. La luz del atardecer desde el templete es espectacular para fotos.

### 2. Jardin Botanico Pinya de Rosa

Menos conocido que Marimurtra pero igualmente impresionante, este jardin esta especializado en plantas suculentas y cactaceas. Si te gustan las plantas exoticas, aqui encontraras una de las colecciones mas importantes de Europa.

**Duracion recomendada:** 1 hora | **Precio:** ~5EUR

### 3. El Paseo Maritimo y Sa Palomera

La roca de Sa Palomera marca el punto donde oficialmente empieza la Costa Brava. Pasear por el paseo maritimo al atardecer, tomar algo en una terraza frente al mar y ver como el sol se esconde detras de las montanas es un clasico que no falla.

**Consejo:** Los miercoles y sabados hay mercado en el paseo -- perfecto para comprar productos locales.

### 4. Casco Antiguo y Gastronomia Local

El centro historico de Blanes tiene callejuelas con encanto, la iglesia gotica de Santa Maria y restaurantes donde comer pescado fresco del dia. No te pierdas el suquet de peix (guiso de pescado tipico de la zona) ni los arroces marineros.

**Donde comer:** El puerto pesquero tiene varios restaurantes con terraza donde ves los barcos de pesca llegar con la captura del dia.

## Planes en los Alrededores

### 5. Lloret de Mar: Playas y Vida Nocturna

A solo 8 km al norte de Blanes, Lloret combina playas amplias, chiringuitos con ambiente y una vida nocturna que atrae a visitantes de toda Europa. Pero Lloret es mucho mas que fiesta: el Camino de Ronda entre Lloret y Tossa de Mar es una de las rutas de senderismo costeras mas espectaculares de la Costa Brava.

### 6. Explorar la Costa Brava en Scooter desde Lloret

Una de las mejores formas de descubrir la Costa Brava por tierra es sobre dos ruedas. Desde Lloret de Mar (a solo 12 km de Blanes), puedes [alquilar un scooter en Coast Rent](https://coastrent.es) y recorrer carreteras que serpentean entre pinos, acantilados y calas escondidas.

**Rutas recomendadas en scooter:**

- **Lloret - Tossa de Mar** (12 km, 20 min): La carretera GI-682 es una de las mas bonitas de la Costa Brava. Curvas entre pinares con vistas al mar en cada giro. Tossa te recibe con su espectacular Vila Vella amurallada.
- **Lloret - Sant Grau** (8 km, 15 min): Subida al santuario de Sant Grau con vistas panoramicas de toda la costa. Ruta corta pero intensa.
- **Lloret - Girona** (40 km, 50 min): Escapada cultural a la capital de provincia. Casas de colores del Onyar, catedral gotica, barrio judio y la mejor gastronomia de la region.

El [alquiler de motos en Lloret de Mar](https://coastrent.es) es una opcion perfecta para los dias que quieras explorar por tierra despues de una manana en barco. Coast Rent tiene scooters desde 125cc, ideales para recorrer la costa sin necesidad de carnet especial (con carnet de coche es suficiente para motos de 125cc si tienes mas de 3 anos de experiencia con el carnet B).

**Precio orientativo:** Desde 35EUR/dia por un scooter 125cc.

### 7. Tossa de Mar: La Vila Vella

A 25 km de Blanes, Tossa de Mar es uno de los pueblos mas fotografiados de la Costa Brava. Su recinto amurallado medieval (la Vila Vella) es el unico de toda la costa catalana que se conserva intacto. Puedes llegar en barco con nosotros (1h 15min con [barco con licencia](/barcos-con-licencia)), en coche o en scooter por la carretera costera.

### 8. Las Calas Secretas del Camino de Ronda

El Camino de Ronda (GR-92) conecta pueblos y calas a lo largo de toda la Costa Brava. Desde Blanes puedes caminar hacia el norte (direccion Lloret) y descubrir calas como Sa Forcanera, Cala Sant Francesc o Cala Bona, muchas de ellas accesibles a pie o en [barco sin licencia](/barcos-sin-licencia).

**Consejo:** Combina manana en barco + tarde a pie por el Camino de Ronda. Asi descubres las mismas calas desde dos perspectivas completamente distintas.

### 9. Girona: Capital de Provincia

A 60 km de Blanes (45 min en coche), Girona es una joya. Las casas de colores sobre el rio Onyar, la catedral con la nave gotica mas ancha del mundo, el barrio judio (Call) mejor conservado de Espana y restaurantes de nivel Michelin. Si tienes un dia extra, Girona merece la visita.

### 10. Deportes Acuaticos

Ademas del barco, la Costa Brava ofrece paddle surf, kayak, snorkel y buceo. Desde nuestros barcos puedes anadir [paddle surf (25EUR)](/barcos) o [snorkel (7,50EUR)](/barcos) como extras. Para buceo, hay centros de submarinismo en Blanes y Lloret que organizan inmersiones guiadas.

### 11. Concurso Internacional de Fuegos Artificiales

Si visitas Blanes entre el 21 y el 27 de julio, no te puedes perder el concurso internacional de fuegos artificiales. Cada noche, un pais diferente ilumina el cielo sobre la playa de Blanes con espectaculos pirotecnicos que duran 25 minutos. Es el evento mas importante de la Costa Brava sur y atrae a mas de 300.000 espectadores cada edicion.

**Consejo pro:** Alquila un barco para ver los fuegos desde el agua. Es la mejor perspectiva posible y evitas las aglomeraciones de la playa. [Contactanos por WhatsApp](https://wa.me/34611500372) para reservar con antelacion porque estas fechas se llenan rapido.

### 12. Mercados y Ferias Locales

- **Lunes:** Mercado de Blanes (ropa, artesania, productos locales)
- **Miercoles y sabados:** Mercado del paseo maritimo
- **Jueves:** Mercado de Lloret de Mar
- **Temporada alta:** Feria de artesania nocturna en el paseo de Blanes

---

## Como Organizar tu Escapada Perfecta

La combinacion ideal para una escapada de 2-3 dias en la Costa Brava:

**Dia 1 - Mar:** Alquila un [barco sin licencia](/barcos-sin-licencia) por la manana (desde 70EUR/h) y explora las calas entre Blanes y Lloret. Por la tarde, paseo por el casco antiguo y cena de pescado en el puerto.

**Dia 2 - Tierra:** [Alquila un scooter en Coast Rent en Lloret](https://coastrent.es) y recorre la carretera costera hasta Tossa de Mar. Comida en Tossa, paseo por la Vila Vella y vuelta por la carretera interior.

**Dia 3 - Cultura:** Excursion a Girona por la manana. Tarde libre en la playa de Blanes o visita a Marimurtra.

---

## Preguntas Frecuentes

### Es necesario licencia para alquilar un barco en Blanes?

No. Tenemos [barcos sin licencia](/barcos-sin-licencia) para hasta 5 personas con un briefing de seguridad de 10 minutos. No necesitas experiencia previa.

### Cuanto cuesta alquilar un barco en Blanes?

Los [barcos sin licencia](/barcos-sin-licencia) empiezan desde 70EUR/hora en temporada baja. Los [barcos con licencia](/barcos-con-licencia) desde 160EUR por 2 horas. Gasolina incluida en barcos sin licencia.

### Se puede ir de Blanes a Tossa de Mar en barco?

Si, con un [barco con licencia](/barcos-con-licencia). El trayecto es de unos 75 minutos costeando. Es una de las rutas mas bonitas de la Costa Brava.

### Que distancia hay entre Blanes y Lloret de Mar?

Solo 8 km por carretera (12 minutos en coche). En barco, la costa entre Blanes y Lloret es una de las mas espectaculares de la Costa Brava.

### Se puede alquilar un scooter en Lloret de Mar?

Si. [Coast Rent](https://coastrent.es) en Lloret de Mar ofrece alquiler de scooters desde 125cc, perfectos para recorrer la costa. Con carnet de coche (3+ anos) puedes conducir motos de hasta 125cc.

---

Blanes es el punto de partida perfecto para descubrir la Costa Brava por mar y por tierra. [Reserva tu barco](/barcos) para la experiencia maritima y complementa con los planes de esta guia para una escapada redonda. Si necesitas consejo personalizado, [escribenos por WhatsApp](https://wa.me/34611500372) y te ayudamos a planificar tu viaje.`,
  },

  // ===== ARTÍCULO B: Costa Brava por mar y tierra =====
  {
    title: "Costa Brava por Mar y Tierra: La Combinacion Perfecta de Barco y Scooter",
    slug: "costa-brava-mar-y-tierra-barco-scooter",
    category: "Aventuras",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/mar-y-tierra.jpg",
    metaDescription: "Itinerario completo para descubrir la Costa Brava por mar en barco y por tierra en scooter. Rutas, precios, tiempos y consejos practicos.",
    tags: ["costa brava mar y tierra", "barco y scooter costa brava", "itinerario costa brava", "ruta blanes lloret tossa", "alquiler barco blanes", "alquiler scooter lloret", "costa brava experiencia completa"],
    isPublished: true,
    _publishedAt: new Date("2026-04-16T12:00:00Z"),
    excerpt: "La Costa Brava esconde sus mejores secretos entre el mar y la carretera. Descubre el itinerario perfecto combinando barco desde Blanes y scooter desde Lloret: precios, tiempos y consejos practicos.",
    titleByLang: {
      es: "Costa Brava por Mar y Tierra: La Combinacion Perfecta de Barco y Scooter",
      en: "Costa Brava by Sea and Land: The Perfect Boat and Scooter Combination",
    },
    excerptByLang: {
      es: "La Costa Brava esconde sus mejores secretos entre el mar y la carretera. Descubre el itinerario perfecto combinando barco desde Blanes y scooter desde Lloret: precios, tiempos y consejos practicos.",
      en: "The Costa Brava hides its best secrets between the sea and the road. Discover the perfect itinerary combining a boat from Blanes and a scooter from Lloret: prices, times and practical tips.",
    },
    metaDescByLang: {
      es: "Itinerario completo para descubrir la Costa Brava por mar en barco y por tierra en scooter. Rutas, precios, tiempos y consejos practicos.",
      en: "Complete itinerary to discover the Costa Brava by sea on a boat and by land on a scooter. Routes, prices, times and practical tips.",
    },
    contentByLang: {
      es: `Hay dos formas de conocer la Costa Brava: desde el agua y desde la carretera. Cada una revela una cara completamente distinta de este tramo de costa espectacular. Pero la experiencia verdaderamente completa es combinar las dos en un mismo viaje.

En este articulo te proponemos un itinerario probado que une lo mejor de ambos mundos: **manana navegando por las calas entre Blanes y Lloret, tarde recorriendo en scooter la carretera costera entre Lloret y Tossa de Mar**. Dos experiencias que se complementan a la perfeccion y que puedes hacer en un solo dia o repartir en dos.

## Por que funciona esta combinacion

La Costa Brava entre Blanes y Tossa de Mar tiene 25 km de costa con acantilados de hasta 50 metros, calas escondidas, pinos que crecen hasta el borde del agua y pueblos medievales asomados al mar. Pero lo fascinante es que **desde el barco ves cosas que desde la carretera no existen, y viceversa**.

Desde el barco descubres calas sin acceso terrestre, cuevas marinas, fondos de posidonia y la perspectiva unica de ver los acantilados desde abajo. Desde la carretera --especialmente la GI-682 entre Lloret y Tossa-- descubres miradores panoramicos, pinares interminables y curvas que parecen sacadas de un anuncio de coches de los anos 60.

Combinar ambas experiencias es como ver una pelicula en 3D despues de verla en 2D: de repente todo tiene profundidad.

## El Itinerario Completo

### Manana: Blanes en Barco (9:00 - 13:00)

**Punto de partida:** Puerto de Blanes
**Barco recomendado:** [Remus 450](/barco/remus-450) (sin licencia, hasta 5 personas) o [Astec 480 Premium](/barco/astec-480) si quieres musica bluetooth a bordo
**Duracion:** 4 horas
**Precio:** Desde 150EUR (Remus 450, temporada baja) a 270EUR (Astec 480, temporada alta)

#### Ruta marina recomendada (4 horas)

**9:00** - Recogida del barco en el Puerto de Blanes. Briefing de seguridad de 10 minutos donde nuestro equipo te ensena a manejar el barco (es mas facil que conducir un coche).

**9:15** - Salida rumbo norte. Navegas pegado a la costa disfrutando de los acantilados de Blanes. En 5 minutos empiezas a ver las primeras calas.

**9:30** - **Cala Sa Forcanera.** Primera parada. Esta cala solo es accesible por mar y tiene un agua turquesa increible. Fondeas, te banas, haces snorkel en las rocas laterales. Temperatura del agua en verano: 22-24 grados.

**10:15** - Continuas hacia el norte pasando por Cala Sant Francesc (con vistas al Jardin de Marimurtra arriba) y Cala del Senyor Ramon.

**10:45** - **Cala Treumal.** Segunda parada larga. Una cala dividida en dos por rocas, con fondo de arena perfecta. Ideal para relajarse, tomar el sol en la proa del barco y picar algo si has traido snacks.

**11:30** - Navegas un poco mas al norte pasando por la playa de Santa Cristina y Fenals. Desde el barco ves los jardines de Santa Clotilde desde una perspectiva que los de tierra no tienen.

**11:45** - **Cala Boadella.** Ultima parada antes de volver. Una cala rodeada de naturaleza sin edificaciones. Ultimo bano del dia en aguas cristalinas.

**12:15** - Regreso al Puerto de Blanes con calma, disfrutando del sol.

**12:45** - Devolucion del barco. Tiempo para secarte, cambiarte y prepararte para la segunda parte del dia.

#### Que incluye el barco

- Gasolina (incluida en barcos sin licencia)
- Seguro para todos los ocupantes
- Equipo de seguridad
- Briefing personalizado

**Extras recomendados:** Pack Basic (nevera + snorkel, 10EUR) o Pack Premium (nevera + snorkel + paddle surf, 30EUR). [Ver todos los extras](/barcos).

### Transicion: De Blanes a Lloret (13:00 - 14:30)

**Desplazamiento:** Blanes a Lloret de Mar, 12 km, 15 minutos en coche/bus

Aprovecha esta pausa para:

1. **Comer en Lloret.** El paseo maritimo tiene restaurantes de todo tipo. Para algo rapido pero bueno, busca un chiringuito frente a la playa. Para algo mas elaborado, las callejuelas del centro tienen tapas y arroces.

2. **Recoger el scooter.** La [flota de scooters de Coast Rent en Lloret](https://coastrent.es/es/vehiculos?category=scooters) esta en el centro del pueblo, facil de localizar. El proceso de alquiler es rapido: documentacion, casco, breve explicacion y listo.

**Precio del scooter:** Desde 35EUR/dia (125cc). Con carnet de coche de mas de 3 anos puedes conducir scooters de 125cc sin carnet de moto adicional.

### Tarde: Lloret - Tossa en Scooter (14:30 - 19:00)

**Vehiculo:** Scooter 125cc de [Coast Rent](https://coastrent.es)
**Ruta:** GI-682, Lloret de Mar - Tossa de Mar
**Distancia:** 12 km | **Tiempo de conduccion:** 20 minutos (sin paradas)
**Tiempo total recomendado:** 4-5 horas (con paradas)

#### Ruta por carretera paso a paso

**14:30** - Sales de Lloret por la carretera GI-682 direccion Tossa. Los primeros kilometros ya son espectaculares: la carretera sube por encima de los acantilados con curvas cerradas entre pinos mediterraneos.

**14:45** - **Mirador de Cala Canyelles.** Primera parada. Desde aqui ves toda la costa que has recorrido por la manana en barco, pero ahora desde 100 metros de altura. Es un momento especial: reconoces las calas donde has estado nadando hace unas horas.

**15:00** - Continuas por la GI-682. Este tramo es el mas espectacular: la carretera serpentea entre pinares con el mar abajo. Cada curva abre una nueva perspectiva.

**15:20** - **Llegada a Tossa de Mar.** Aparcas el scooter (facil de aparcar en cualquier sitio, esa es la ventaja) y exploras a pie.

**15:30 - 17:30** - **Tossa de Mar a pie.** Sube a la Vila Vella, el unico recinto amurallado medieval de toda la costa catalana. Las vistas desde las murallas son impresionantes. Dentro hay un museo, callejuelas estrechas y un faro. Baja a la Platja Gran (playa principal) para refrescarte los pies.

**17:30** - Helado o cerveza en una terraza de Tossa mirando al mar. Te lo has ganado.

**18:00** - **Regreso a Lloret.** Puedes volver por la misma carretera (igual de bonita en sentido contrario con la luz del atardecer) o por el interior pasando por Vidreres para una experiencia diferente.

**18:30** - Devolucion del scooter en Coast Rent.

---

## Resumen de Presupuesto

Aqui tienes el desglose de costes para una persona (los precios del barco se comparten entre el grupo):

| Concepto | Precio |
|----------|--------|
| Barco 4h sin licencia (5 personas) | 150-270EUR total |
| **Barco por persona (5 personas)** | **30-54EUR** |
| Pack Premium extras (nevera + snorkel + paddle surf) | 30EUR total |
| Comida en Lloret | 12-20EUR |
| Scooter 125cc dia completo | 35-45EUR |
| Gasolina scooter | 5-8EUR |
| Helado en Tossa | 3-4EUR |
| **TOTAL por persona** | **~85-150EUR** |

Por menos de 150EUR por persona tienes un dia completo descubriendo la Costa Brava por mar y por tierra. Es dificil encontrar una experiencia tan completa a ese precio en cualquier otro destino del Mediterraneo.

## Variante: Dos Dias Relajados

Si prefieres no meter todo en un dia, puedes repartirlo:

**Dia 1 - Mar:** Barco de 4 horas por la manana + tarde libre en Blanes (Marimurtra, casco antiguo, playa).

**Dia 2 - Tierra:** [Scooter desde Lloret](https://coastrent.es/es/vehiculos?category=scooters) todo el dia. Manana: ruta a Tossa con parada larga. Tarde: ruta interior a Sant Grau o incluso hasta Girona (40 km, 50 min).

## Variante: Grupo Grande (6-7 personas)

Para grupos mas grandes, recomendamos un [barco con licencia](/barcos-con-licencia) que admite hasta 7 personas:

- **[Trimarchi 57S](/barco/trimarchi-57s):** 7 personas, 110cv, desde 160EUR/2h
- **[Pacific Craft 625](/barco/pacific-craft-625):** 7 personas, 115cv, desde 180EUR/2h
- **[Excursion privada con capitan](/barco/excursion-privada):** 7 personas, desde 240EUR/2h -- el capitan os lleva a las mejores calas y vosotros solo teneis que disfrutar

**Nota:** Los barcos con licencia no incluyen gasolina. Presupuestar unos 40-80EUR adicionales segun la ruta.

## Consejos Practicos

### Para la parte de barco

- **Reserva con antelacion** en temporada alta (julio-agosto). Los barcos se agotan rapido. [Reserva aqui](/barcos) o por [WhatsApp](https://wa.me/34611500372).
- **Llega 15 minutos antes** de tu hora al Puerto de Blanes para el briefing de seguridad.
- **Proteccion solar factor 50+.** En el mar, el sol quema el doble por el reflejo del agua.
- **Agua y snacks.** Lleva al menos 1,5L de agua por persona.
- **Funda impermeable para el movil.** Cuesta 10EUR y puede salvar un telefono de 1.000EUR.

### Para la parte de scooter

- **Casco obligatorio.** Coast Rent te lo proporciona con el alquiler.
- **Carnet de coche** de mas de 3 anos para motos de 125cc (normativa espanola).
- **Conduce con prudencia** en las curvas de la GI-682. La carretera es bonita pero tecnica.
- **Lleva una mochila pequena** para la botella de agua y el movil.
- **Ropa comoda y calzado cerrado.** Las chancletas no son seguras en moto.

### Logistica general

- **Parking en Blanes:** Hay parking junto al puerto (10EUR el dia, tambien disponible como extra en la reserva del barco).
- **Transporte Blanes-Lloret:** Bus cada 30 minutos (~2EUR), taxi (~15EUR), o coche propio.
- **Horario optimo:** Barco a primera hora (9:00-10:00) cuando el mar esta mas calmado. Scooter a partir de las 14:00-15:00 cuando el calor de medioda ya ha pasado.

---

## Preguntas Frecuentes

### Puedo hacer barco y scooter en el mismo dia?

Si, es perfectamente viable. Barco por la manana (4 horas), comida en Lloret y scooter por la tarde (4-5 horas). Te sobra tiempo para todo.

### Necesito experiencia previa para el barco?

No. Nuestros [barcos sin licencia](/barcos-sin-licencia) no requieren ninguna experiencia. Te damos un briefing de 10 minutos y listo. Es mas facil de lo que piensas.

### Necesito carnet de moto para el scooter?

No necesariamente. Con el carnet de coche (permiso B) de mas de 3 anos puedes conducir scooters de hasta 125cc en Espana. Asi funciona con la [flota de scooters de Coast Rent en Lloret](https://coastrent.es/es/vehiculos?category=scooters).

### Cual es la mejor epoca para hacer esta experiencia?

De mayo a octubre. La mejor relacion calidad-precio es en junio y septiembre: buen tiempo, mar calmado, carreteras tranquilas y precios de temporada baja.

### Cuantas personas pueden ir en el scooter?

Los scooters de Coast Rent son para 2 personas (conductor + acompanante). Si vais un grupo grande, cada uno puede alquilar su propio scooter y hacer la ruta juntos.

---

La Costa Brava merece ser descubierta a fondo, y la mejor forma es combinar mar y tierra. [Reserva tu barco](/barcos) en Costa Brava Rent a Boat y completa la experiencia con un [scooter de Coast Rent en Lloret](https://coastrent.es). Dos perspectivas, una costa inolvidable.`,
      en: `There are two ways to experience the Costa Brava: from the water and from the road. Each reveals a completely different side of this spectacular stretch of coastline. But the truly complete experience is combining both in a single trip.

In this article we propose a tried-and-tested itinerary that brings together the best of both worlds: **morning sailing through the coves between Blanes and Lloret, afternoon riding a scooter along the coastal road between Lloret and Tossa de Mar**. Two experiences that complement each other perfectly and that you can do in a single day or spread over two.

## Why This Combination Works

The Costa Brava between Blanes and Tossa de Mar has 25 km of coastline with cliffs up to 50 metres high, hidden coves, pine trees growing to the water's edge, and medieval towns perched above the sea. But the fascinating thing is that **from the boat you see things that don't exist from the road, and vice versa**.

From the boat you discover coves with no land access, sea caves, posidonia seabeds, and the unique perspective of seeing the cliffs from below. From the road --especially the GI-682 between Lloret and Tossa-- you discover panoramic viewpoints, endless pine forests, and curves that look like they're straight out of a 1960s car advert.

Combining both experiences is like watching a film in 3D after seeing it in 2D: suddenly everything has depth.

## The Complete Itinerary

### Morning: Blanes by Boat (9:00 - 13:00)

**Starting point:** Blanes Harbour
**Recommended boat:** [Remus 450](/boat/remus-450) (no licence needed, up to 5 people) or [Astec 480 Premium](/boat/astec-480) if you want Bluetooth music on board
**Duration:** 4 hours
**Price:** From 150EUR (Remus 450, low season) to 270EUR (Astec 480, high season)

#### Recommended sea route (4 hours)

**9:00** - Pick up the boat at Blanes Harbour. A 10-minute safety briefing where our team teaches you how to handle the boat (it's easier than driving a car).

**9:15** - Depart heading north. You sail close to the coast enjoying the Blanes cliffs. Within 5 minutes you start seeing the first coves.

**9:30** - **Cala Sa Forcanera.** First stop. This cove is only accessible by sea and has incredibly turquoise water. Drop anchor, swim, snorkel around the side rocks. Water temperature in summer: 22-24 degrees.

**10:15** - Continue north past Cala Sant Francesc (with views of Marimurtra Garden above) and Cala del Senyor Ramon.

**10:45** - **Cala Treumal.** Second long stop. A cove split in two by rocks, with a perfect sandy bottom. Ideal for relaxing, sunbathing on the boat's bow, and snacking if you've brought food.

**11:30** - Sail a bit further north past Santa Cristina beach and Fenals. From the boat you see the Santa Clotilde gardens from a perspective that those on land don't have.

**11:45** - **Cala Boadella.** Last stop before heading back. A cove surrounded by nature with no buildings. Final swim of the day in crystal-clear waters.

**12:15** - Return to Blanes Harbour at a leisurely pace, enjoying the sun.

**12:45** - Return the boat. Time to dry off, change, and get ready for the second part of the day.

#### What's included with the boat

- Fuel (included on boats without licence)
- Insurance for all passengers
- Safety equipment
- Personalised briefing

**Recommended extras:** Basic Pack (cooler + snorkel, 10EUR) or Premium Pack (cooler + snorkel + paddle surf, 30EUR). [See all extras](/boats).

### Transition: From Blanes to Lloret (13:00 - 14:30)

**Transfer:** Blanes to Lloret de Mar, 12 km, 15 minutes by car/bus

Use this break to:

1. **Eat in Lloret.** The seafront promenade has all kinds of restaurants. For something quick but good, find a beach bar facing the sea. For something more elaborate, the old town streets have tapas and rice dishes.

2. **Pick up the scooter.** The [Coast Rent scooter fleet in Lloret](https://coastrent.es/es/vehiculos?category=scooters) is in the town centre, easy to find. The rental process is quick: documents, helmet, brief explanation, and you're off.

**Scooter price:** From 35EUR/day (125cc). With a car licence held for 3+ years, you can ride 125cc scooters without a motorcycle licence (Spanish regulation).

### Afternoon: Lloret - Tossa by Scooter (14:30 - 19:00)

**Vehicle:** 125cc scooter from [Coast Rent](https://coastrent.es)
**Route:** GI-682, Lloret de Mar - Tossa de Mar
**Distance:** 12 km | **Riding time:** 20 minutes (without stops)
**Total recommended time:** 4-5 hours (with stops)

#### Road route step by step

**14:30** - Leave Lloret via the GI-682 towards Tossa. The first kilometres are already spectacular: the road climbs above the cliffs with sharp curves through Mediterranean pines.

**14:45** - **Cala Canyelles viewpoint.** First stop. From here you can see the entire coast you explored by boat in the morning, but now from 100 metres up. It's a special moment: you recognise the coves where you were swimming just hours ago.

**15:00** - Continue along the GI-682. This stretch is the most spectacular: the road winds through pine forests with the sea below. Every curve opens a new perspective.

**15:20** - **Arrival in Tossa de Mar.** Park the scooter (easy to park anywhere, that's the advantage) and explore on foot.

**15:30 - 17:30** - **Tossa de Mar on foot.** Climb up to the Vila Vella, the only medieval walled enclosure on the entire Catalan coast. The views from the walls are stunning. Inside there's a museum, narrow streets, and a lighthouse. Head down to the Platja Gran (main beach) to cool your feet.

**17:30** - Ice cream or beer on a terrace in Tossa overlooking the sea. You've earned it.

**18:00** - **Return to Lloret.** You can take the same road back (equally beautiful in the opposite direction with the evening light) or go through the interior via Vidreres for a different experience.

**18:30** - Return the scooter at Coast Rent.

---

## Budget Summary

Here's the cost breakdown per person (boat prices are shared among the group):

| Item | Price |
|------|-------|
| 4h boat without licence (5 people) | 150-270EUR total |
| **Boat per person (5 people)** | **30-54EUR** |
| Premium Pack extras (cooler + snorkel + paddle surf) | 30EUR total |
| Lunch in Lloret | 12-20EUR |
| 125cc scooter full day | 35-45EUR |
| Scooter fuel | 5-8EUR |
| Ice cream in Tossa | 3-4EUR |
| **TOTAL per person** | **~85-150EUR** |

For less than 150EUR per person you get a full day discovering the Costa Brava by sea and land. It's hard to find such a complete experience at that price anywhere else in the Mediterranean.

## Variant: Two Relaxed Days

If you prefer not to pack everything into one day, you can spread it out:

**Day 1 - Sea:** 4-hour boat in the morning + free afternoon in Blanes (Marimurtra, old town, beach).

**Day 2 - Land:** [Scooter from Lloret](https://coastrent.es/es/vehiculos?category=scooters) for the full day. Morning: route to Tossa with a long stop. Afternoon: inland route to Sant Grau or even to Girona (40 km, 50 min).

## Variant: Large Group (6-7 people)

For larger groups, we recommend a [licensed boat](/boats-with-license) that takes up to 7 people:

- **[Trimarchi 57S](/boat/trimarchi-57s):** 7 people, 110hp, from 160EUR/2h
- **[Pacific Craft 625](/boat/pacific-craft-625):** 7 people, 115hp, from 180EUR/2h
- **[Private excursion with captain](/boat/excursion-privada):** 7 people, from 240EUR/2h -- the captain takes you to the best coves and all you have to do is enjoy

**Note:** Licensed boats do not include fuel. Budget an additional 40-80EUR depending on the route.

## Practical Tips

### For the boat part

- **Book in advance** during high season (July-August). Boats sell out fast. [Book here](/boats) or via [WhatsApp](https://wa.me/34611500372).
- **Arrive 15 minutes early** to Blanes Harbour for the safety briefing.
- **SPF 50+ sun protection.** At sea, the sun burns twice as much due to water reflection.
- **Water and snacks.** Bring at least 1.5L of water per person.
- **Waterproof phone case.** Costs 10EUR and can save a 1,000EUR phone.

### For the scooter part

- **Helmet mandatory.** Coast Rent provides one with the rental.
- **Car licence** held for 3+ years for 125cc scooters (Spanish regulation).
- **Drive carefully** on the GI-682 curves. The road is beautiful but technical.
- **Bring a small backpack** for your water bottle and phone.
- **Comfortable clothing and closed shoes.** Flip-flops aren't safe on a scooter.

### General logistics

- **Parking in Blanes:** There's parking next to the harbour (10EUR per day, also available as an add-on when booking the boat).
- **Blanes-Lloret transport:** Bus every 30 minutes (~2EUR), taxi (~15EUR), or your own car.
- **Optimal schedule:** Boat early morning (9:00-10:00) when the sea is calmest. Scooter from 14:00-15:00 when the midday heat has passed.

---

## Frequently Asked Questions

### Can I do boat and scooter on the same day?

Yes, it's perfectly doable. Boat in the morning (4 hours), lunch in Lloret, and scooter in the afternoon (4-5 hours). You'll have plenty of time for everything.

### Do I need prior experience for the boat?

No. Our [boats without licence](/boats-without-license) don't require any experience. We give you a 10-minute briefing and you're good to go. It's easier than you think.

### Do I need a motorcycle licence for the scooter?

Not necessarily. With a car licence (B permit) held for 3+ years, you can ride scooters up to 125cc in Spain. That's how it works with the [Coast Rent scooter fleet in Lloret](https://coastrent.es/es/vehiculos?category=scooters).

### What's the best time of year for this experience?

May to October. The best value for money is in June and September: good weather, calm seas, quiet roads, and low-season prices.

### How many people can ride the scooter?

Coast Rent scooters seat 2 people (rider + passenger). If you're a large group, everyone can rent their own scooter and ride the route together.

---

The Costa Brava deserves to be discovered in depth, and the best way is to combine sea and land. [Book your boat](/boats) at Costa Brava Rent a Boat and complete the experience with a [scooter from Coast Rent in Lloret](https://coastrent.es). Two perspectives, one unforgettable coast.`,
    },
    content: `Hay dos formas de conocer la Costa Brava: desde el agua y desde la carretera. Cada una revela una cara completamente distinta de este tramo de costa espectacular. Pero la experiencia verdaderamente completa es combinar las dos en un mismo viaje.

En este articulo te proponemos un itinerario probado que une lo mejor de ambos mundos: **manana navegando por las calas entre Blanes y Lloret, tarde recorriendo en scooter la carretera costera entre Lloret y Tossa de Mar**. Dos experiencias que se complementan a la perfeccion y que puedes hacer en un solo dia o repartir en dos.

## Por que funciona esta combinacion

La Costa Brava entre Blanes y Tossa de Mar tiene 25 km de costa con acantilados de hasta 50 metros, calas escondidas, pinos que crecen hasta el borde del agua y pueblos medievales asomados al mar. Pero lo fascinante es que **desde el barco ves cosas que desde la carretera no existen, y viceversa**.

Desde el barco descubres calas sin acceso terrestre, cuevas marinas, fondos de posidonia y la perspectiva unica de ver los acantilados desde abajo. Desde la carretera --especialmente la GI-682 entre Lloret y Tossa-- descubres miradores panoramicos, pinares interminables y curvas que parecen sacadas de un anuncio de coches de los anos 60.

Combinar ambas experiencias es como ver una pelicula en 3D despues de verla en 2D: de repente todo tiene profundidad.

## El Itinerario Completo

### Manana: Blanes en Barco (9:00 - 13:00)

**Punto de partida:** Puerto de Blanes
**Barco recomendado:** [Remus 450](/barco/remus-450) (sin licencia, hasta 5 personas) o [Astec 480 Premium](/barco/astec-480) si quieres musica bluetooth a bordo
**Duracion:** 4 horas
**Precio:** Desde 150EUR (Remus 450, temporada baja) a 270EUR (Astec 480, temporada alta)

#### Ruta marina recomendada (4 horas)

**9:00** - Recogida del barco en el Puerto de Blanes. Briefing de seguridad de 10 minutos donde nuestro equipo te ensena a manejar el barco (es mas facil que conducir un coche).

**9:15** - Salida rumbo norte. Navegas pegado a la costa disfrutando de los acantilados de Blanes. En 5 minutos empiezas a ver las primeras calas.

**9:30** - **Cala Sa Forcanera.** Primera parada. Esta cala solo es accesible por mar y tiene un agua turquesa increible. Fondeas, te banas, haces snorkel en las rocas laterales. Temperatura del agua en verano: 22-24 grados.

**10:15** - Continuas hacia el norte pasando por Cala Sant Francesc (con vistas al Jardin de Marimurtra arriba) y Cala del Senyor Ramon.

**10:45** - **Cala Treumal.** Segunda parada larga. Una cala dividida en dos por rocas, con fondo de arena perfecta. Ideal para relajarse, tomar el sol en la proa del barco y picar algo si has traido snacks.

**11:30** - Navegas un poco mas al norte pasando por la playa de Santa Cristina y Fenals. Desde el barco ves los jardines de Santa Clotilde desde una perspectiva que los de tierra no tienen.

**11:45** - **Cala Boadella.** Ultima parada antes de volver. Una cala rodeada de naturaleza sin edificaciones. Ultimo bano del dia en aguas cristalinas.

**12:15** - Regreso al Puerto de Blanes con calma, disfrutando del sol.

**12:45** - Devolucion del barco. Tiempo para secarte, cambiarte y prepararte para la segunda parte del dia.

#### Que incluye el barco

- Gasolina (incluida en barcos sin licencia)
- Seguro para todos los ocupantes
- Equipo de seguridad
- Briefing personalizado

**Extras recomendados:** Pack Basic (nevera + snorkel, 10EUR) o Pack Premium (nevera + snorkel + paddle surf, 30EUR). [Ver todos los extras](/barcos).

### Transicion: De Blanes a Lloret (13:00 - 14:30)

**Desplazamiento:** Blanes a Lloret de Mar, 12 km, 15 minutos en coche/bus

Aprovecha esta pausa para:

1. **Comer en Lloret.** El paseo maritimo tiene restaurantes de todo tipo. Para algo rapido pero bueno, busca un chiringuito frente a la playa. Para algo mas elaborado, las callejuelas del centro tienen tapas y arroces.

2. **Recoger el scooter.** La [flota de scooters de Coast Rent en Lloret](https://coastrent.es/es/vehiculos?category=scooters) esta en el centro del pueblo, facil de localizar. El proceso de alquiler es rapido: documentacion, casco, breve explicacion y listo.

**Precio del scooter:** Desde 35EUR/dia (125cc). Con carnet de coche de mas de 3 anos puedes conducir scooters de 125cc sin carnet de moto adicional.

### Tarde: Lloret - Tossa en Scooter (14:30 - 19:00)

**Vehiculo:** Scooter 125cc de [Coast Rent](https://coastrent.es)
**Ruta:** GI-682, Lloret de Mar - Tossa de Mar
**Distancia:** 12 km | **Tiempo de conduccion:** 20 minutos (sin paradas)
**Tiempo total recomendado:** 4-5 horas (con paradas)

#### Ruta por carretera paso a paso

**14:30** - Sales de Lloret por la carretera GI-682 direccion Tossa. Los primeros kilometros ya son espectaculares: la carretera sube por encima de los acantilados con curvas cerradas entre pinos mediterraneos.

**14:45** - **Mirador de Cala Canyelles.** Primera parada. Desde aqui ves toda la costa que has recorrido por la manana en barco, pero ahora desde 100 metros de altura. Es un momento especial: reconoces las calas donde has estado nadando hace unas horas.

**15:00** - Continuas por la GI-682. Este tramo es el mas espectacular: la carretera serpentea entre pinares con el mar abajo. Cada curva abre una nueva perspectiva.

**15:20** - **Llegada a Tossa de Mar.** Aparcas el scooter (facil de aparcar en cualquier sitio, esa es la ventaja) y exploras a pie.

**15:30 - 17:30** - **Tossa de Mar a pie.** Sube a la Vila Vella, el unico recinto amurallado medieval de toda la costa catalana. Las vistas desde las murallas son impresionantes. Dentro hay un museo, callejuelas estrechas y un faro. Baja a la Platja Gran (playa principal) para refrescarte los pies.

**17:30** - Helado o cerveza en una terraza de Tossa mirando al mar. Te lo has ganado.

**18:00** - **Regreso a Lloret.** Puedes volver por la misma carretera (igual de bonita en sentido contrario con la luz del atardecer) o por el interior pasando por Vidreres para una experiencia diferente.

**18:30** - Devolucion del scooter en Coast Rent.

---

## Resumen de Presupuesto

Aqui tienes el desglose de costes para una persona (los precios del barco se comparten entre el grupo):

| Concepto | Precio |
|----------|--------|
| Barco 4h sin licencia (5 personas) | 150-270EUR total |
| **Barco por persona (5 personas)** | **30-54EUR** |
| Pack Premium extras (nevera + snorkel + paddle surf) | 30EUR total |
| Comida en Lloret | 12-20EUR |
| Scooter 125cc dia completo | 35-45EUR |
| Gasolina scooter | 5-8EUR |
| Helado en Tossa | 3-4EUR |
| **TOTAL por persona** | **~85-150EUR** |

Por menos de 150EUR por persona tienes un dia completo descubriendo la Costa Brava por mar y por tierra. Es dificil encontrar una experiencia tan completa a ese precio en cualquier otro destino del Mediterraneo.

## Variante: Dos Dias Relajados

Si prefieres no meter todo en un dia, puedes repartirlo:

**Dia 1 - Mar:** Barco de 4 horas por la manana + tarde libre en Blanes (Marimurtra, casco antiguo, playa).

**Dia 2 - Tierra:** [Scooter desde Lloret](https://coastrent.es/es/vehiculos?category=scooters) todo el dia. Manana: ruta a Tossa con parada larga. Tarde: ruta interior a Sant Grau o incluso hasta Girona (40 km, 50 min).

## Variante: Grupo Grande (6-7 personas)

Para grupos mas grandes, recomendamos un [barco con licencia](/barcos-con-licencia) que admite hasta 7 personas:

- **[Trimarchi 57S](/barco/trimarchi-57s):** 7 personas, 110cv, desde 160EUR/2h
- **[Pacific Craft 625](/barco/pacific-craft-625):** 7 personas, 115cv, desde 180EUR/2h
- **[Excursion privada con capitan](/barco/excursion-privada):** 7 personas, desde 240EUR/2h -- el capitan os lleva a las mejores calas y vosotros solo teneis que disfrutar

**Nota:** Los barcos con licencia no incluyen gasolina. Presupuestar unos 40-80EUR adicionales segun la ruta.

## Consejos Practicos

### Para la parte de barco

- **Reserva con antelacion** en temporada alta (julio-agosto). Los barcos se agotan rapido. [Reserva aqui](/barcos) o por [WhatsApp](https://wa.me/34611500372).
- **Llega 15 minutos antes** de tu hora al Puerto de Blanes para el briefing de seguridad.
- **Proteccion solar factor 50+.** En el mar, el sol quema el doble por el reflejo del agua.
- **Agua y snacks.** Lleva al menos 1,5L de agua por persona.
- **Funda impermeable para el movil.** Cuesta 10EUR y puede salvar un telefono de 1.000EUR.

### Para la parte de scooter

- **Casco obligatorio.** Coast Rent te lo proporciona con el alquiler.
- **Carnet de coche** de mas de 3 anos para motos de 125cc (normativa espanola).
- **Conduce con prudencia** en las curvas de la GI-682. La carretera es bonita pero tecnica.
- **Lleva una mochila pequena** para la botella de agua y el movil.
- **Ropa comoda y calzado cerrado.** Las chancletas no son seguras en moto.

### Logistica general

- **Parking en Blanes:** Hay parking junto al puerto (10EUR el dia, tambien disponible como extra en la reserva del barco).
- **Transporte Blanes-Lloret:** Bus cada 30 minutos (~2EUR), taxi (~15EUR), o coche propio.
- **Horario optimo:** Barco a primera hora (9:00-10:00) cuando el mar esta mas calmado. Scooter a partir de las 14:00-15:00 cuando el calor de medioda ya ha pasado.

---

## Preguntas Frecuentes

### Puedo hacer barco y scooter en el mismo dia?

Si, es perfectamente viable. Barco por la manana (4 horas), comida en Lloret y scooter por la tarde (4-5 horas). Te sobra tiempo para todo.

### Necesito experiencia previa para el barco?

No. Nuestros [barcos sin licencia](/barcos-sin-licencia) no requieren ninguna experiencia. Te damos un briefing de 10 minutos y listo. Es mas facil de lo que piensas.

### Necesito carnet de moto para el scooter?

No necesariamente. Con el carnet de coche (permiso B) de mas de 3 anos puedes conducir scooters de hasta 125cc en Espana. Asi funciona con la [flota de scooters de Coast Rent en Lloret](https://coastrent.es/es/vehiculos?category=scooters).

### Cual es la mejor epoca para hacer esta experiencia?

De mayo a octubre. La mejor relacion calidad-precio es en junio y septiembre: buen tiempo, mar calmado, carreteras tranquilas y precios de temporada baja.

### Cuantas personas pueden ir en el scooter?

Los scooters de Coast Rent son para 2 personas (conductor + acompanante). Si vais un grupo grande, cada uno puede alquilar su propio scooter y hacer la ruta juntos.

---

La Costa Brava merece ser descubierta a fondo, y la mejor forma es combinar mar y tierra. [Reserva tu barco](/barcos) en Costa Brava Rent a Boat y completa la experiencia con un [scooter de Coast Rent en Lloret](https://coastrent.es). Dos perspectivas, una costa inolvidable.`,
  },
];

/**
 * Seeds the database with cross-linking blog posts for coastrent.es SEO strategy.
 * Handles duplicate slugs gracefully by upserting existing posts.
 */
export async function seedCrossLinkPosts(storageInstance: IStorage): Promise<number> {
  let created = 0;
  let updated = 0;

  for (const postData of crossLinkPosts) {
    try {
      const existing = await storageInstance.getBlogPostBySlug(postData.slug);
      if (existing) {
        const { _publishedAt, ...insertData } = postData;
        await storageInstance.updateBlogPost(existing.id, {
          ...insertData,
          publishedAt: _publishedAt,
        } as any);
        updated++;
        continue;
      }

      const { _publishedAt, ...insertData } = postData;
      const post = await storageInstance.createBlogPost(insertData);

      await storageInstance.updateBlogPost(post.id, {
        publishedAt: _publishedAt,
      } as any);

      created++;
      logger.info("Created cross-link blog post", { title: postData.title, slug: postData.slug });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to create cross-link blog post", { slug: postData.slug, error: message });
    }
  }

  logger.info("Cross-link blog seed complete", { created, updated, total: crossLinkPosts.length });
  return created;
}
