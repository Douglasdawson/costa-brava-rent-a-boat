import type { IStorage } from "../storage";
import type { InsertBlogPost } from "@shared/schema";
import { logger } from "../lib/logger";

interface BlogPostSeed extends InsertBlogPost {
  /** Override publishedAt after creation */
  _publishedAt: Date;
}

const blogPostsData: BlogPostSeed[] = [
  // ===== POST 1: Mejores Calas =====
  {
    title: "Las 15 Mejores Calas de la Costa Brava que Solo Puedes Descubrir en Barco",
    slug: "mejores-calas-costa-brava-en-barco",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/calas-costa-brava.jpg",
    metaDescription: "Descubre las 15 mejores calas de la Costa Brava accesibles solo en barco. Mapa con coordenadas GPS, fotos y consejos para llegar desde Blanes.",
    tags: ["mejores calas costa brava", "calas costa brava en barco", "calas secretas costa brava", "calas blanes", "costa brava en barco", "coordenadas GPS calas", "calas accesibles barco"],
    isPublished: true,
    _publishedAt: new Date("2026-03-16T10:00:00Z"),
    excerpt: "Descubre las 15 calas más espectaculares entre Blanes y Tossa de Mar con coordenadas GPS exactas. Calas secretas accesibles solo en barco, consejos prácticos y rutas desde el Puerto de Blanes.",
    titleByLang: {
      es: "Las 15 Mejores Calas de la Costa Brava que Solo Puedes Descubrir en Barco",
      en: "The 15 Best Costa Brava Coves You Can Only Discover by Boat",
    },
    excerptByLang: {
      es: "Descubre las 15 calas más espectaculares entre Blanes y Tossa de Mar con coordenadas GPS exactas. Calas secretas accesibles solo en barco, consejos prácticos y rutas desde el Puerto de Blanes.",
      en: "Discover the 15 most spectacular coves between Blanes and Tossa de Mar with exact GPS coordinates. Secret coves accessible only by boat, practical tips and routes from Puerto de Blanes.",
    },
    metaDescByLang: {
      es: "Descubre las 15 mejores calas de la Costa Brava accesibles solo en barco. Mapa con coordenadas GPS, fotos y consejos para llegar desde Blanes.",
      en: "Discover the 15 best Costa Brava coves accessible only by boat. GPS coordinates map, photos and tips for getting there from Blanes.",
    },
    content: `La Costa Brava esconde algunos de los rincones más espectaculares del Mediterráneo occidental, pero muchos de ellos tienen un secreto: solo se puede llegar por mar. Acantilados de 50 metros, pinos que crecen hasta el borde del agua y aguas tan transparentes que ves el fondo a 8 metros de profundidad. Todo esto está al alcance de cualquier persona con un barco, incluso sin licencia de navegación.

En este artículo hemos recopilado las **15 calas más impresionantes entre Blanes y Tossa de Mar** — la zona sur de la Costa Brava — con coordenadas GPS exactas, nivel de dificultad, y consejos prácticos para que planifiques tu ruta desde el Puerto de Blanes.

## Zona Blanes - Lloret de Mar

### 1. Cala Sa Forcanera (Blanes)

**Coordenadas GPS:** 41.6728°N, 2.7918°E
**Acceso:** Solo por mar | **Dificultad:** Baja | **Tiempo desde Blanes:** 10 min

Probablemente la cala más recóndita de toda la Costa Brava. Con más de 15 hectáreas de extensión, Sa Forcanera está protegida por acantilados de más de 40 metros y no tiene ningún acceso terrestre práctico. El agua es de un azul turquesa que rivaliza con cualquier playa del Caribe.

**Consejo:** Llega antes de las 11:00 en temporada alta. El fondeo es fácil sobre arena a 3-4 metros de profundidad. Lleva snorkel: la vida marina en las rocas laterales es espectacular.

**Barco recomendado:** Cualquiera de nuestros [barcos sin licencia](/barcos) es perfecto para esta escapada rápida.

### 2. Cala Sant Francesc (Blanes)

**Coordenadas GPS:** 41.6741°N, 2.7882°E
**Acceso:** Mar y tierra (difícil) | **Dificultad:** Baja | **Tiempo desde Blanes:** 8 min

Aunque técnicamente se puede llegar andando por un sendero desde el Jardín Botánico de Marimurtra, la forma más cómoda es sin duda en barco. Rodeada de vegetación mediterránea y con arena fina, es una de las favoritas de los locales.

**Consejo:** Cuidado con las boyas de balizamiento en verano. Fondea en la parte derecha de la cala donde hay menos corriente.

### 3. Cala del Senyor Ramón (Blanes-Lloret)

**Coordenadas GPS:** 41.6890°N, 2.8185°E
**Acceso:** Mar y tierra (difícil) | **Dificultad:** Baja | **Tiempo desde Blanes:** 15 min

Una cala pequeña pero muy bonita, con un islote rocoso que la protege del oleaje. Fondo arenoso ideal para niños. Desde aquí se ven los jardines de Santa Clotilde arriba.

**Barco recomendado:** El [Astec 400](/barco/astec-400) es ideal para parejas que buscan intimidad.

### 4. Cala Treumal (Lloret de Mar)

**Coordenadas GPS:** 41.6960°N, 2.8312°E
**Acceso:** Mar y tierra | **Dificultad:** Baja | **Tiempo desde Blanes:** 18 min

Dividida en dos por una formación rocosa, Treumal combina arena y roca con un agua excepcionalmente limpia. La parte sur es más tranquila y perfecta para anclar.

**Barco recomendado:** El [Astec 480](/barco/astec-480) con su equipo de música bluetooth es genial para pasar una mañana relajada aquí.

### 5. Cala Boadella (Lloret de Mar)

**Coordenadas GPS:** 41.6985°N, 2.8359°E
**Acceso:** Mar y tierra | **Dificultad:** Baja | **Tiempo desde Blanes:** 20 min

Escondida entre los jardines de Santa Clotilde y la Punta des Cards, Boadella es una media luna perfecta de arena dorada. La parte norte tiene zona nudista. Es una de las playas más fotogénicas de toda la costa.

**Consejo:** El fondeo es excelente sobre arena a 3-5 metros. Idónea para familias por su agua tranquila y protegida del viento de tramontana.

### 6. Cala Banys (Lloret de Mar)

**Coordenadas GPS:** 41.7005°N, 2.8410°E
**Acceso:** Mar y tierra (sendero) | **Dificultad:** Media | **Tiempo desde Blanes:** 22 min

Cala diminuta pero con un encanto especial: las ruinas de unos antiguos baños romanos se asoman sobre las rocas. El fondo es de roca y posidonia, ideal para snorkel. Aguas cristalinas incluso en pleno agosto.

## Zona Lloret de Mar - Tossa de Mar

### 7. Cala de los Frares (Lloret de Mar)

**Coordenadas GPS:** 41.7123°N, 2.8585°E
**Acceso:** Solo por mar | **Dificultad:** Baja | **Tiempo desde Blanes:** 30 min

Al pie del castillo de Sant Joan, esta cala minúscula es una joya escondida. El agua es tan transparente que parece que los barcos flotan en el aire. Fondo de arena y roca a poca profundidad.

### 8. Punta des Cards (Lloret de Mar)

**Coordenadas GPS:** 41.7010°N, 2.8440°E
**Acceso:** Solo por mar | **Dificultad:** Media | **Tiempo desde Blanes:** 25 min

No es una cala en sí sino una punta rocosa con pequeñas piscinas naturales y un fondeo espectacular. El snorkel aquí es de los mejores de la zona: meros, sargos y pulpos entre las rocas.

### 9. Cala d'en Carlos (Lloret - Tossa)

**Coordenadas GPS:** 41.7155°N, 2.8780°E
**Acceso:** Solo por mar | **Dificultad:** Media | **Tiempo desde Blanes:** 35 min

Minúscula cala entre acantilados que pasa desapercibida incluso para los navegantes habituales. Perfecta para un baño en total soledad.

### 10. Cala Futadera (Tossa de Mar)

**Coordenadas GPS:** 41.7218°N, 2.9025°E
**Acceso:** Mar (preferible) y tierra (muy difícil) | **Dificultad:** Media | **Tiempo desde Blanes:** 40 min

Una de las calas más salvajes y vírgenes de la Costa Brava. Rodeada de bosque denso y acantilados, el acceso terrestre requiere una caminata empinada de 30 minutos. En barco, llegas directamente a su orilla de cantos rodados con agua color esmeralda.

**Consejo:** Mar expuesta al sur. Consulta la previsión antes de ir. Si hay oleaje, es mejor evitarla.

**Barco recomendado:** Para llegar cómodamente, te recomendamos el [Pacific Craft 625](/barco/pacific-craft-625) o la [Mingolla Brava 19](/barco/mingolla-brava-19) si tienes licencia.

### 11. Cala Canyet (Tossa de Mar)

**Coordenadas GPS:** 41.7245°N, 2.9060°E
**Acceso:** Mar y tierra (muy difícil) | **Dificultad:** Media | **Tiempo desde Blanes:** 42 min

Encajonada entre paredes verticales cubiertas de pinos, Canyet es una de las calas más fotógenas de toda la Costa Brava. La luz de la mañana crea un efecto turquesa sobre el agua que es simplemente mágico.

### 12. Cala Giverola (Tossa de Mar)

**Coordenadas GPS:** 41.7325°N, 2.9107°E
**Acceso:** Mar y tierra (por camping) | **Dificultad:** Baja | **Tiempo desde Blanes:** 45 min

Cala amplia con arena gruesa rodeada de pinos. Tiene un camping adyacente pero desde el mar se disfruta sin aglomeraciones. El fondo es ideal para snorkel con posidonia y peces de roca abundantes.

### 13. Cala Pola (Tossa de Mar)

**Coordenadas GPS:** 41.7360°N, 2.9155°E
**Acceso:** Mar y tierra (sendero) | **Dificultad:** Baja | **Tiempo desde Blanes:** 48 min

Pequeña cala de arena y grava flanqueada por rocas. El agua tiene ese color turquesa tan característico de la zona. Relativamente poco frecuentada incluso en agosto si llegas por la mañana.

### 14. Cala Llevadó (Tossa de Mar)

**Coordenadas GPS:** 41.7395°N, 2.9198°E
**Acceso:** Mar y tierra | **Dificultad:** Baja | **Tiempo desde Blanes:** 50 min

Amplia cala con servicios básicos en verano (chiringuito, hamacas). Perfecta si quieres combinar la aventura náutica con algo de comodidad. Fondeo fácil sobre arena.

## Las Joyas Escondidas

### 15. Cala Morisca (Tossa de Mar)

**Coordenadas GPS:** 41.7178°N, 2.9342°E
**Acceso:** Solo por mar | **Dificultad:** Media | **Tiempo desde Blanes:** 55 min

Completamente salvaje y sin ningún tipo de servicio ni acceso terrestre practicable. Agua cristalina sobre fondo de roca. Es la definición de "cala secreta". Solo la encontrarás si vienes en barco.

---

## Consejos para visitar las calas en barco

- **Llega temprano:** Las calas más populares se llenan a partir de las 11:00 en verano.
- **Lleva snorkel:** Muchas de estas calas tienen fondos marinos espectaculares. Puedes [alquilar equipo de snorkel](/barcos) con nosotros.
- **Guarda las coordenadas GPS:** Descarga un mapa offline en tu móvil antes de salir. Te servirán para encontrar las calas más escondidas.
- **Respeta el entorno:** No tires basura al mar y respeta las zonas de fondeo marcadas.
- **Consulta el tiempo:** Antes de planificar tu ruta, consulta la previsión meteorológica. Nosotros te asesoraremos en el briefing de seguridad.
- **Combina calas:** Con 4 horas puedes visitar 3-4 calas cómodamente. Con 8 horas, puedes llegar hasta Tossa de Mar.

## Cómo llegar a estas calas: Navegación sin licencia desde Blanes

Todas las calas de este artículo son accesibles desde el Puerto de Blanes con los barcos de alquiler sin licencia de Costa Brava Rent a Boat. Nuestros barcos alcanzan una velocidad de crucero que te permite llegar a las calas más cercanas (Sa Forcanera, Sant Francesc) en menos de 10 minutos, y a las más lejanas (Tossa de Mar) en aproximadamente una hora.

No necesitas ninguna titulación náutica. Antes de salir te damos una **formación práctica de 15 minutos** sobre el manejo del barco, las normas básicas de navegación y te indicamos las mejores calas según las condiciones del día. Todos nuestros precios incluyen gasolina, así que no tendrás sorpresas.

| | Precio desde | Capacidad |
|---|---|---|
| [Astec 400](/barco/astec-400) | 70 EUR/hora | 4 personas |
| [Solar 450](/barco/solar-450) | 75 EUR/hora | 5 personas |
| [Remus 450](/barco/remus-450) | 75 EUR/hora | 5 personas |
| [Astec 480](/barco/astec-480) | 80 EUR/hora | 5 personas |

## Reserva tu barco y descubre estas calas

Con más de **307 reseñas en Google y una puntuación de 4,8 estrellas**, en Costa Brava Rent a Boat nos apasiona ayudarte a descubrir los mejores rincones de la costa. [Reserva tu barco ahora](/barcos) y vive una experiencia inolvidable este verano en la Costa Brava.`,
  },

  // ===== POST 2: Alquiler sin licencia =====
  {
    title: "Guía Completa: Alquiler de Barcos sin Licencia en Blanes 2026",
    slug: "alquiler-barco-sin-licencia-blanes-guia",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Todo lo que necesitas saber para alquilar un barco sin licencia en Blanes. Requisitos, precios, qué incluye y consejos prácticos.",
    tags: ["alquiler barco sin licencia", "barco sin licencia blanes", "alquilar barco costa brava", "barco sin carnet blanes", "alquiler embarcacion blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-03-23T10:00:00Z"),
    excerpt: "Todo lo que necesitas saber para alquilar un barco sin licencia en Blanes: requisitos, precios desde 70EUR/hora, qué incluye el alquiler y consejos para tu primera experiencia náutica.",
    content: `Alquilar un barco sin licencia es una de las mejores experiencias que puedes vivir en la Costa Brava. No necesitas experiencia previa, ni título náutico, ni conocimientos especiales. En esta guía completa te explicamos absolutamente todo lo que necesitas saber para alquilar un barco sin licencia en Blanes durante la temporada 2026.

## Qué significa "barco sin licencia"

En España, la legislación náutica permite pilotar embarcaciones de recreo sin necesidad de título náutico siempre que cumplan estas condiciones:

- **Motor de hasta 15 CV** (caballos de vapor)
- **Eslora máxima de 5 metros**
- **Navegación en zona diurna** (de sol a sol)
- **Distancia máxima de la costa:** 2 millas náuticas (aproximadamente 3,7 km)

Estas limitaciones están pensadas para garantizar la seguridad. Los barcos sin licencia son embarcaciones estables, sencillas de manejar y diseñadas para que cualquier persona mayor de edad pueda disfrutar del mar de forma segura.

## Quién puede alquilar un barco sin licencia

Los requisitos para alquilar son muy sencillos:

- **Edad mínima:** 18 años (el patrón debe ser mayor de edad)
- **Documento de identidad:** DNI, pasaporte o documento equivalente
- **Depósito de fianza:** Entre 200EUR y 300EUR según el barco (se devuelve al finalizar)
- **No se requiere:** Licencia, título, carnet, ni experiencia previa

Los menores pueden ir como pasajeros sin problema, siempre acompañados de un adulto responsable.

## Nuestra flota sin licencia

En Costa Brava Rent a Boat disponemos de **5 barcos sin licencia** adaptados a diferentes necesidades:

### [Astec 400](/barco/astec-400) - Ideal para parejas
- Capacidad: 4 personas
- Motor: Suzuki 15hp
- Lo mejor: Compacto y fácil de manejar, perfecto para parejas
- **Desde 70EUR/hora** en temporada baja

### [Solar 450](/barco/solar-450) - El más popular
- Capacidad: 5 personas
- Motor: Mercury 15cv
- Lo mejor: Gran solarium, escalera de baño, muy estable
- **Desde 75EUR/hora** en temporada baja

### [Remus 450](/barco/remus-450) y [Remus 450 II](/barco/remus-450-ii) - Familiares
- Capacidad: 5 personas
- Motor: Suzuki 15cv
- Lo mejor: Toldo Bi Mini amplio, perfectos para familias
- **Desde 75EUR/hora** en temporada baja

### [Astec 480](/barco/astec-480) - El más espacioso
- Capacidad: 5 personas
- Motor: Parsun 40/15cv
- Lo mejor: Equipo de música bluetooth, más espacio a bordo
- **Desde 80EUR/hora** en temporada baja

## Qué incluye el alquiler

Todos nuestros barcos sin licencia incluyen:

- **Gasolina:** El combustible está incluido en el precio. No pagas ni un euro más por el consumo de gasolina.
- **IVA:** El precio que ves es el precio final con impuestos incluidos.
- **Seguro:** Seguro de embarcación y de todos los ocupantes.
- **Amarre:** El uso del amarre en el puerto de Blanes.
- **Limpieza:** No tienes que preocuparte de lavar el barco al volver.
- **Equipo de seguridad:** Chalecos salvavidas, extintor y todo el equipo reglamentario.
- **Briefing de seguridad:** Una explicación completa antes de salir.

## Precios temporada 2026

Los precios varían según la temporada:

### Temporada baja (abril - junio, septiembre - cierre)
| Duración | Astec 400 | Solar 450 / Remus 450 | Astec 480 |
|----------|-----------|------------------------|-----------|
| 1 hora   | 70EUR       | 75EUR                    | 80EUR       |
| 2 horas  | 105EUR      | 115EUR                   | 130EUR      |
| 4 horas  | 135EUR      | 150EUR                   | 180EUR      |
| 8 horas  | 200EUR      | 220EUR                   | 270EUR      |

### Temporada media (julio)
Los precios aumentan entre un 10% y un 20% respecto a temporada baja.

### Temporada alta (agosto)
Los precios aumentan entre un 20% y un 30% respecto a temporada baja.

Consulta los precios actualizados de cada barco en nuestra [página de barcos](/barcos).

## El briefing de seguridad

Antes de zarpar, nuestro equipo te da una **explicación práctica de 10-15 minutos** que cubre:

1. **Cómo arrancar y apagar el motor**
2. **Acelerador y dirección:** Cómo girar, acelerar y frenar
3. **Normas básicas de navegación:** Por dónde ir, preferencias de paso
4. **Zonas de fondeo:** Dónde puedes y no puedes anclar
5. **Uso del ancla:** Cómo fondear correctamente en una cala
6. **Equipo de seguridad:** Dónde están los chalecos y cómo usarlos
7. **Qué hacer en caso de emergencia:** Números de teléfono y protocolo
8. **Límites de navegación:** Hasta dónde puedes ir y zonas a evitar

No te preocupes si no recuerdas todo: estaremos disponibles por teléfono durante toda tu navegación.

## Qué llevar a bordo

Te recomendamos llevar:

- **Protección solar:** Crema solar alta (factor 50+), gafas de sol y gorra
- **Agua:** Aunque puedes alquilar nuestra nevera (5EUR) y comprar bebidas
- **Toallas:** Para secarte después de los baños
- **Biquini/bañador:** Obvio, pero es fácil olvidar cambiarse antes
- **Calzado acuático:** Recomendable para entrar y salir del barco
- **Funda impermeable para el móvil:** Tu teléfono te lo agradecerá

## Mejor momento para navegar

- **Horario ideal:** De 10:00 a 14:00 el mar suele estar más calmado
- **Mejor día:** Entre semana hay menos tráfico marítimo que los fines de semana
- **Mejor mes:** Junio y septiembre ofrecen buen tiempo con precios de temporada baja y menos gente

## Cómo reservar

Reservar es muy sencillo:

1. **Elige tu barco** en nuestra [página de barcos](/barcos)
2. **Selecciona fecha y hora** en el calendario
3. **Añade extras** si quieres (snorkel, paddle surf, seascooter, nevera...)
4. **Completa el pago** online de forma segura con tarjeta
5. **Recibe confirmación** por email y WhatsApp
6. **Preséntate en el puerto** 15 minutos antes de la hora reservada

## Por qué elegirnos

Con más de **307 reseñas en Google y una puntuación media de 4,8 estrellas**, nuestros clientes valoran especialmente:

- La simpatía y profesionalidad del equipo
- La claridad del briefing de seguridad
- El estado impecable de los barcos
- Que la gasolina está incluida (sin sorpresas)
- La flexibilidad y atención personalizada

[Reserva tu barco sin licencia](/barcos) y descubre por qué somos la empresa de alquiler de barcos mejor valorada de Blanes.`,
  },

  // ===== POST 3: Que hacer en Blanes =====
  {
    title: "Qué Hacer en Blanes: 15 Planes Imprescindibles para el Verano 2026",
    slug: "que-hacer-en-blanes-verano",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/puerto-barcos.jpg",
    metaDescription: "Los 15 mejores planes en Blanes para el verano 2026. Desde alquilar un barco hasta visitar jardines botánicos y calas secretas.",
    tags: ["que hacer en blanes", "planes blanes verano", "actividades blanes", "turismo blanes", "blanes costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-03-30T10:00:00Z"),
    excerpt: "Descubre los 15 mejores planes para disfrutar de Blanes en verano 2026: navegación, calas, jardines botánicos, gastronomía y mucho más.",
    content: `Blanes es mucho más que el "portal de la Costa Brava". Este pueblo marinero de la provincia de Girona combina playas espectaculares, patrimonio histórico, gastronomía mediterránea y una oferta de actividades acuáticas que lo convierten en uno de los mejores destinos del verano. Aquí tienes **15 planes imprescindibles para disfrutar de Blanes en 2026**.

## 1. Alquilar un barco y explorar la costa

Sin duda, la mejor forma de conocer la Costa Brava es desde el mar. Desde el puerto de Blanes puedes [alquilar un barco sin licencia](/barcos) y navegar hasta calas escondidas, cuevas y playas inaccesibles por tierra. Es una experiencia que transforma completamente tu forma de ver la costa.

**Nuestro consejo:** El [Astec 480](/barco/astec-480) con equipo de música bluetooth es perfecto para pasar una mañana inolvidable. Y si es tu primera vez, no te preocupes: te explicamos todo en un briefing de seguridad antes de salir. Lee nuestra [guía de alquiler sin licencia](/blog/alquiler-barco-sin-licencia-blanes-guia) para más detalles.

## 2. Visitar el Jardí Botànic Marimurtra

El jardín botánico Marimurtra es uno de los más importantes del Mediterráneo. Situado sobre un acantilado con vistas espectaculares al mar, alberga más de 4.000 especies de plantas de los cinco continentes. El paseo entre cactus gigantes, plantas tropicales y miradores al mar es absolutamente mágico.

**Horario:** De 9:00 a 18:00 (verano hasta 20:00) | **Precio:** ~8EUR adultos

## 3. Subir al Castillo de San Juan

Las ruinas del Castillo de San Juan, en lo alto del cerro que separa las dos playas de Blanes, ofrecen las mejores vistas panorámicas del pueblo y la costa. La subida es corta pero empinada, y la recompensa al llegar arriba es una panorámica de 360 grados que abarca desde los Pirineos hasta Barcelona en días claros.

**Consejo:** Sube al atardecer para una experiencia inolvidable.

## 4. Contemplar Sa Palomera

La roca de Sa Palomera es el símbolo de Blanes y el punto donde oficialmente comienza la Costa Brava. Puedes caminar hasta su cima por un sendero fácil y disfrutar de vistas únicas de ambas playas. Desde julio, es también el punto de lanzamiento del famoso concurso internacional de fuegos artificiales.

## 5. Disfrutar de la Playa de Blanes

La playa principal de Blanes (Platja de Blanes) es una amplia franja de arena dorada con todos los servicios: chiringuitos, socorristas, duchas y alquiler de hamacas. El paseo marítimo que la bordea está lleno de restaurantes y heladerías.

## 6. Hacer snorkel en las calas

Las calas entre Blanes y Lloret tienen fondos marinos espectaculares. Cala Sant Francesc y Cala Bona son dos de los mejores puntos para hacer snorkel en la zona. Puedes [alquilar equipo de snorkel](/barcos) con nosotros por 7,50EUR cuando reserves tu barco.

Para conocer las mejores calas, lee nuestro artículo sobre las [10 mejores calas de la Costa Brava en barco](/blog/mejores-calas-costa-brava-en-barco).

## 7. Probar el paddle surf

El paddle surf se ha convertido en una de las actividades estrella del verano en Blanes. Las aguas tranquilas de las primeras horas de la mañana son ideales para practicarlo. Puedes [añadirlo como extra](/barcos) al alquilar tu barco por 25EUR y hacer paddle surf en una cala desierta.

## 8. Recorrer el camino de ronda

El Camí de Ronda es un sendero costero que conecta playas y calas a lo largo de toda la Costa Brava. El tramo de Blanes a Lloret (unos 6 km) pasa por acantilados, bosques de pinos y miradores impresionantes. Ideal para caminar por la mañana antes de que apriete el calor.

## 9. Degustar la gastronomía local

Blanes es un pueblo pesquero con una tradición gastronómica excepcional. No te pierdas:

- **El suquet de peix:** Guiso marinero tradicional
- **La gamba de Blanes:** Una de las mejores gambas del Mediterráneo
- **Arroz a la cazuela:** Con mariscos frescos del día
- **Helados artesanales:** En las heladerías del paseo marítimo

**Restaurantes recomendados:** Los restaurantes del puerto y del paseo marítimo ofrecen pescado fresco del día a precios razonables.

## 10. Excursión a Lloret de Mar

Lloret de Mar está a solo 10 minutos en coche (o 15 minutos en barco) desde Blanes. Puedes visitar los Jardines de Santa Clotilde, el Castillo de Sa Caleta y la famosa escultura de la Doña Marinera. Si vas en barco, las vistas de la costa de Lloret desde el mar son espectaculares.

## 11. Visitar el casco antiguo de Tossa de Mar

Tossa de Mar, a unos 30 minutos en coche, tiene uno de los cascos históricos más bonitos de la Costa Brava: la Vila Vella, una ciudadela medieval amurallada con torres y callejuelas empedradas. Es una excursión de medio día perfecta. Y si tienes licencia de navegación, puedes [llegar en barco](/blog/rutas-barco-desde-blanes) para una experiencia todavía más especial.

## 12. Disfrutar de un atardecer en barco

Hay pocas experiencias más románticas que ver el atardecer desde el mar en la Costa Brava. Reserva tu barco para las últimas horas de la tarde y disfruta de los colores del cielo reflejándose en el agua mientras navegas por la costa. Nuestra [excursión privada con capitán](/barco/excursion-privada) es perfecta para ocasiones especiales.

## 13. Probar el seascooter

El seascooter es una moto acuática submarina que te permite explorar bajo el agua sin esfuerzo. Es una actividad emocionante y diferente que puedes [añadir a tu alquiler de barco](/barcos) por 50EUR. Ideal para los más aventureros del grupo.

## 14. Ver el concurso de fuegos artificiales

Cada verano, desde finales de julio, Blanes acoge el **Concurso Internacional de Fuegos Artificiales**. Durante varias noches, las mejores pirotecnias del mundo lanzan sus espectáculos desde la roca de Sa Palomera. Ver los fuegos artificiales desde un barco, con el reflejo en el agua, es una experiencia absolutamente única.

## 15. Pasear por el Paseo Marítimo al anochecer

Para terminar el día, nada mejor que un paseo por el Paseo Marítimo de Blanes. Con la brisa del mar, las terrazas iluminadas y el sonido de las olas, es el broche perfecto para un día de verano en la Costa Brava.

---

## Planifica tu verano en Blanes

Blanes tiene actividades para todos los gustos: aventura, cultura, gastronomía y relax. Si tuvieras que elegir una sola experiencia, te recomendamos sin duda [alquilar un barco](/barcos) y descubrir la costa desde el mar. Con más de **307 reseñas en Google y 4,8 estrellas**, estamos preparados para hacerte vivir un día inolvidable.

Contáctanos por [WhatsApp](https://wa.me/34611500372) o reserva directamente en nuestra web.`,
  },

  // ===== POST 4: English Guide =====
  {
    title: "Boat Rental in Costa Brava: Your Complete English Guide",
    slug: "boat-rental-costa-brava-english-guide",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Complete English guide to renting a boat in Costa Brava, Spain. No license needed, prices from 70EUR/h, beautiful coves near Blanes.",
    tags: ["boat rental costa brava", "rent boat blanes", "costa brava boat hire", "no license boat spain", "boat rental spain"],
    isPublished: true,
    _publishedAt: new Date("2026-04-06T10:00:00Z"),
    excerpt: "Everything English-speaking visitors need to know about renting a boat in Costa Brava. No license required, prices from 70EUR per hour, and stunning Mediterranean coves.",
    content: `Planning a trip to Costa Brava and dreaming of exploring the coastline from the water? Renting a boat is one of the best experiences you can have in this stunning part of Spain. This complete guide covers everything English-speaking visitors need to know about boat rental in Blanes, the gateway to Costa Brava.

## Getting to Blanes

Blanes is located on the southern end of Costa Brava, about 70 km north of Barcelona. Here is how to get there:

- **From Barcelona Airport (BCN):** 1 hour by car, or take the bus to Barcelona Nord station and then a direct bus to Blanes (approximately 1.5 hours total)
- **By train:** RENFE Rodalies line R1 runs directly from Barcelona Sants/Passeig de Gracia to Blanes station (1 hour 20 minutes)
- **By car:** Take the AP-7 motorway north from Barcelona, exit at Blanes

Once in Blanes, our base is at the **Port of Blanes**, easily accessible on foot from the town center.

## Do You Need a Boat License?

**Good news: No!** In Spain, you can rent and operate a boat without any license as long as the boat meets these requirements:

- Engine power up to 15 HP (horsepower)
- Maximum length of 5 meters
- Daytime navigation only
- Stay within 2 nautical miles of the coast (approximately 3.7 km)

This means you can rent one of our no-license boats and start exploring right away, even if you have never driven a boat before. We provide a thorough safety briefing before you set off.

If you **do** have a Spanish or international boating license, you can rent our larger, more powerful boats for longer trips along the coast.

## Our Fleet

### No-License Boats (No Experience Required)

| Boat | Capacity | Best For | Price From |
|------|----------|----------|------------|
| [Astec 400](/barco/astec-400) | 4 people | Couples | 70EUR/hour |
| [Solar 450](/barco/solar-450) | 5 people | Families | 75EUR/hour |
| [Remus 450](/barco/remus-450) | 5 people | Families | 75EUR/hour |
| [Remus 450 II](/barco/remus-450-ii) | 5 people | Groups | 75EUR/hour |
| [Astec 480](/barco/astec-480) | 5 people | Groups (Bluetooth) | 80EUR/hour |

**All no-license boats include:** Fuel, insurance, mooring, cleaning, safety equipment, and a personal safety briefing.

### Licensed Boats (Boating License Required)

| Boat | Capacity | Engine | Price From |
|------|----------|--------|------------|
| [Mingolla Brava 19](/barco/mingolla-brava-19) | 6 people | Mercury 80hp | 160EUR/2h |
| [Trimarchi 57S](/barco/trimarchi-57s) | 7 people | Selva 110hp | 160EUR/2h |
| [Pacific Craft 625](/barco/pacific-craft-625) | 7 people | Yamaha 115hp | 180EUR/2h |

**Licensed boats include:** Insurance, mooring, cleaning, and safety equipment. **Fuel is NOT included** for licensed boats.

### Private Excursion with Captain

Do not have a license but want a bigger boat? Our [Private Excursion with Captain](/barco/excursion-privada) includes a professional skipper who takes you to the best coves and hidden spots along the coast. Perfect for special occasions, groups up to 7 people, from 240EUR for 2 hours.

## What to Expect on Your Day

### Before You Go

1. **Book online** through our [boats page](/barcos) -- select your date, time, and duration
2. **Receive confirmation** via email and WhatsApp
3. **Arrive 15 minutes early** at the Port of Blanes

### The Safety Briefing

Our team will give you a hands-on briefing (10-15 minutes) covering:

- How to start and stop the engine
- Steering, accelerating, and braking
- Basic navigation rules
- How to anchor in a cove
- Safety equipment location
- What to do in case of emergency
- Recommended routes based on conditions

The briefing is available in **English, Spanish, French, and German**.

### On the Water

Once you are out on the water, the Costa Brava coastline unfolds before you. Depending on your rental duration, here is what you can explore:

- **1-2 hours:** Visit Cala Sant Francesc and Cala Bona, the closest beautiful coves
- **3-4 hours:** Explore the coast towards Lloret de Mar, including Santa Cristina beach and Fenals
- **6-8 hours:** Full day trip reaching Tossa de Mar and its medieval walled town

Read our detailed [routes from Blanes](/blog/rutas-barco-desde-blanes) for inspiration.

## Best Routes from Blanes

### Short Trip (1 hour)
Head south along the coast to **Sa Palomera rock** and **Cala Sant Francesc**. You will see the iconic rock formation that marks the beginning of Costa Brava and swim in crystal-clear waters just minutes from the port.

### Half Day (3-4 hours)
Navigate to **Lloret de Mar coastline**, stopping at Cala Treumal, Santa Cristina beach, and Fenals. The cliffs and pine forests along the way are breathtaking.

### Full Day (6-8 hours)
The ultimate Costa Brava experience: sail all the way to **Tossa de Mar**, stopping at hidden coves along the way. Tossa's medieval walled town (Vila Vella) is one of the most photographed spots on the coast. This trip requires a licensed boat or our private excursion with captain.

## Pricing Guide

Prices vary by season:

- **Low Season (April-June, September-October):** Best prices, fewer crowds, great weather
- **Mid Season (July):** 10-20% higher than low season
- **High Season (August):** 20-30% higher than low season

**Tip:** June and September offer the best value -- warm weather, calm seas, and low-season prices.

## Optional Extras

Enhance your trip with these add-ons:

- **Snorkeling gear:** 7.50EUR per set
- **Paddle board (SUP):** 25EUR
- **Seascooter (underwater scooter):** 50EUR
- **Cooler box:** 5EUR
- **Drinks:** 2.50EUR each
- **Parking:** 10EUR

## Frequently Asked Questions

**Can I bring children?**
Yes, children of all ages are welcome as passengers. We provide appropriately sized life jackets for children.

**What if the weather is bad?**
If conditions are unsafe, we will help you reschedule free of charge. We check conditions on the day and will advise you.

**Do I need to bring anything?**
Sunscreen (high SPF), sunglasses, a hat, towels, water, and a waterproof phone case. Wear comfortable clothes and aquatic shoes.

**Can I cancel my booking?**
Yes. See our cancellation policy on the booking page for details.

**What currency do you accept?**
Prices are in Euros. We accept all major credit and debit cards for online booking.

## Book Your Costa Brava Boat Adventure

With over **307 Google reviews and a 4.8-star rating**, we are the top-rated boat rental company in Blanes. Our team speaks English, Spanish, French, and Catalan, so language is never a barrier.

[Book your boat now](/barcos) or contact us on [WhatsApp](https://wa.me/34611500372) for any questions. We look forward to helping you discover the magic of Costa Brava from the sea.`,
  },

  // ===== POST 5: Rutas en barco =====
  {
    title: "Rutas en Barco desde Blanes: De Calas Secretas a Pueblos Medievales",
    slug: "rutas-barco-desde-blanes",
    category: "Rutas",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/ruta-costera.jpg",
    metaDescription: "5 rutas en barco desde Blanes: desde escapadas de 1 hora hasta la ruta completa a Tossa de Mar. Distancias, duración y barcos recomendados.",
    tags: ["rutas barco blanes", "excursion barco costa brava", "ruta costera blanes tossa", "navegacion costa brava", "rutas maritimas blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-04-13T10:00:00Z"),
    excerpt: "5 rutas detalladas en barco desde el puerto de Blanes: desde una escapada rápida de 1 hora hasta la ruta completa a Tossa de Mar pasando por calas secretas y pueblos medievales.",
    content: `El puerto de Blanes es el punto de partida perfecto para explorar la Costa Brava por mar. Desde aquí, la costa se despliega hacia el norte con un rosario de calas, acantilados, cuevas marinas y pueblos con encanto que merecen ser descubiertos desde el agua. Te presentamos **5 rutas en barco**, desde una escapada rápida de 1 hora hasta una aventura de día completo.

## Ruta 1: Blanes - Sa Palomera - Cala Sant Francesc (1 hora)

**Dificultad:** Principiante | **Distancia:** 3 km (ida y vuelta) | **Duración:** 1 hora

Esta es la ruta perfecta para quien alquila un barco por primera vez o tiene poco tiempo. Es corta, segura y espectacular.

### Itinerario

1. **Salida del puerto de Blanes** - Navega hacia el sur siguiendo la costa
2. **Sa Palomera** (2 min) - Rodea la icónica roca que marca el inicio de la Costa Brava. Desde el agua, apreciarás su tamaño y la forma en que divide las dos playas de Blanes
3. **Cala Sant Francesc** (5 min) - Continúa hacia el sur hasta esta cala de aguas turquesas. Fondea el barco y disfruta de un baño en aguas cristalinas
4. **Regreso al puerto** - Vuelve con calma disfrutando de las vistas

### Qué verás
- La roca de Sa Palomera desde todos los ángulos
- Los acantilados cubiertos de pinos entre Blanes y la cala
- Aguas turquesas y fondo marino visible desde la superficie
- Posiblemente peces y medusas (inofensivas) nadando bajo el barco

### Barco recomendado
Cualquier [barco sin licencia](/barcos). El [Astec 400](/barco/astec-400) es ideal para parejas, y el [Solar 450](/barco/solar-450) para familias.

---

## Ruta 2: Blanes - Cala Sant Francesc - Cala Bona (2 horas)

**Dificultad:** Principiante | **Distancia:** 5 km (ida y vuelta) | **Duración:** 2 horas

Con una hora más, puedes explorar dos de las mejores calas de Blanes y disfrutar de tiempo suficiente para bañarte y hacer snorkel.

### Itinerario

1. **Salida del puerto de Blanes**
2. **Sa Palomera** - Breve parada fotográfica desde el agua
3. **Cala Sant Francesc** (10 min desde puerto) - Primera parada de baño. Fondea durante 20-30 minutos
4. **Cala Bona** (2 min más al sur) - Segunda parada. Esta cala más pequeña y recogida es perfecta para snorkel
5. **Regreso al puerto** - Navega de vuelta por la misma ruta costera

### Qué verás
- Dos de las calas más bonitas de la Costa Brava sur
- Fondos rocosos ideales para snorkel (si alquilaste el equipo)
- Flora y fauna marina variada en las zonas rocosas entre calas

### Barco recomendado
[Solar 450](/barco/solar-450) o [Remus 450](/barco/remus-450). Ambos tienen escalera de baño que facilita entrar y salir del agua. No olvides añadir **snorkel** (7,50EUR) al reservar.

---

## Ruta 3: Blanes - Costa de Lloret (3-4 horas)

**Dificultad:** Intermedio | **Distancia:** 14 km (ida y vuelta) | **Duración:** 3-4 horas

Esta ruta te lleva más allá de Blanes, recorriendo la impresionante costa hasta Lloret de Mar. Es ideal para medio día y permite descubrir playas y calas variadas.

### Itinerario

1. **Salida del puerto de Blanes**
2. **Calas de Blanes** - Breve paso por Cala Sant Francesc y Cala Bona
3. **Cala Treumal** (15 min) - En la frontera entre Blanes y Lloret. Aguas calmadas, chiringuito en la playa
4. **Santa Cristina** (18 min) - Una de las playas más bonitas de la costa. La ermita en el acantilado es preciosa desde el mar
5. **Fenals** (22 min) - Playa familiar con aguas protegidas. Buen sitio para parar a comer si has traído picnic
6. **Vista de Lloret** (25 min) - Desde el mar, contempla la playa de Lloret, el Castillo de Sa Caleta y la Doña Marinera
7. **Regreso** - Vuelta por la misma ruta, parando donde más te haya gustado

### Qué verás
- La transición del paisaje entre Blanes y Lloret
- El Castillo de Sa Caleta sobre los acantilados
- La escultura de la Doña Marinera en el extremo de Lloret
- Acantilados cubiertos de vegetación mediterránea

### Barco recomendado
El [Astec 480](/barco/astec-480) con su mayor autonomía y equipo bluetooth para poner música durante la travesía. Si tienes licencia, la [Mingolla Brava 19](/barco/mingolla-brava-19) te permite cubrir la distancia más rápidamente.

---

## Ruta 4: Blanes - Tossa de Mar (6-8 horas)

**Dificultad:** Avanzado | **Distancia:** 30 km (ida y vuelta) | **Duración:** 6-8 horas

La ruta estrella. Navegar de Blanes a Tossa de Mar es una experiencia que recordarás siempre. La costa entre ambos pueblos es salvaje, espectacular y llena de sorpresas.

**Importante:** Esta ruta requiere un barco con licencia o nuestra excursión con capitán, ya que la distancia y duración exceden lo recomendable para barcos sin licencia.

### Itinerario

1. **Salida del puerto de Blanes** (8:30-9:00)
2. **Costa de Blanes** - Paso rápido por las calas conocidas
3. **Lloret de Mar** (30 min) - Vista panorámica desde el mar
4. **Cala Canyelles** (40 min) - Parada técnica y primer baño del día
5. **Cala Giverola** (55 min) - Una de las calas más espectaculares, rodeada de acantilados y pinos
6. **Costa salvaje** - Tramo de costa virgen con cuevas y formaciones rocosas
7. **Tossa de Mar** (1h 15min) - Llegada a Tossa. Vista de la Vila Vella (ciudad medieval amurallada) desde el mar. Fondeo en la playa principal o en la Platja del Reig
8. **Tiempo en Tossa** (2-3 horas) - Baño, paseo por la Vila Vella, comida en un restaurante del pueblo
9. **Regreso a Blanes** - Vuelta con paradas opcionales en calas que te hayan gustado durante la ida

### Qué verás
- La Vila Vella de Tossa desde el mar (una de las postales más icónicas del Mediterráneo)
- Tramos de costa completamente virgen e inaccesible por tierra
- Cuevas marinas que solo se ven desde el agua
- Posiblemente delfines en el tramo más abierto
- Fondos marinos espectaculares en Cala Giverola

### Barco recomendado
[Pacific Craft 625](/barco/pacific-craft-625) para la máxima comodidad, o la [Trimarchi 57S](/barco/trimarchi-57s) para una experiencia más deportiva. La opción más cómoda es contratar nuestra [excursión privada con capitán](/barco/excursion-privada): el capitán conoce la costa a la perfección y te llevará a los mejores rincones según las condiciones del día.

---

## Ruta 5: Tour Completo Costa Brava Sur (día completo con licencia)

**Dificultad:** Experto | **Distancia:** 40+ km | **Duración:** 8+ horas

Para navegantes experimentados con licencia que quieren exprimir al máximo un día en la Costa Brava.

### Itinerario

1. **Blanes** (salida temprana 8:00) - Rumbo sur hacia Cala Sant Francesc
2. **Calas de Blanes** - Breve parada en Cala Bona para primer baño
3. **Costa de Lloret** - Navegación continua pasando Santa Cristina, Fenals
4. **Canyelles** - Parada para repostar (si necesario) en el club náutico
5. **Cala Giverola** - Baño y snorkel en aguas esmeralda
6. **Tossa de Mar** - Comida y visita a la Vila Vella
7. **Explorar más allá de Tossa** - Si el tiempo lo permite, continúa hacia el norte descubriendo calas aún más remotas
8. **Regreso** - Navegación de vuelta con el sol de la tarde

### Barco recomendado
Exclusivamente [Pacific Craft 625](/barco/pacific-craft-625) por su autonomía, potencia y comodidad. Con tanque de 127 litros y motor Yamaha de 115cv, tienes capacidad de sobra para un día completo.

---

## Consejos generales para todas las rutas

- **Consulta el parte meteorológico** antes de salir. Nuestro equipo te informará de las condiciones del día.
- **Lleva protección solar** abundante. En el mar, el sol refleja en el agua y quema más rápido.
- **Agua y comida:** Para rutas de más de 2 horas, lleva agua suficiente y algo para picar.
- **Respeta las zonas de baño:** Reduce la velocidad cerca de las playas y mantente alejado de los bañistas.
- **Fondea en arena:** Siempre que sea posible, ancla sobre fondo de arena para no dañar la posidonia.

## Reserva tu ruta

Elige la ruta que más te inspire y [reserva tu barco](/barcos). Si no estás seguro de qué ruta elegir, [contáctanos por WhatsApp](https://wa.me/34611500372) y te asesoraremos encantados según la duración que quieras, el tipo de barco y las condiciones del día.`,
  },

  // ===== POST 6: Consejos primera vez =====
  {
    title: "Consejos para tu Primera Vez Alquilando un Barco (Sin Experiencia)",
    slug: "consejos-primera-vez-alquilar-barco",
    category: "Consejos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Consejos prácticos para alquilar un barco por primera vez sin experiencia. Qué llevar, cómo conducir, fondear y disfrutar con seguridad.",
    tags: ["primera vez barco", "consejos alquilar barco", "barco sin experiencia", "tips navegacion principiante", "alquilar barco primera vez"],
    isPublished: true,
    _publishedAt: new Date("2026-04-20T10:00:00Z"),
    excerpt: "Todos los consejos que necesitas para tu primera experiencia alquilando un barco: desde qué esperar en el briefing hasta cómo fondear, nadar y gestionar el combustible.",
    content: `Alquilar un barco por primera vez puede generar una mezcla de emoción y nervios. Es completamente normal. Pero te aseguramos que es mucho más sencillo de lo que parece. En Costa Brava Rent a Boat recibimos cada temporada a cientos de personas que nunca habían pisado un barco y todas terminan con una sonrisa enorme. Aquí van nuestros **mejores consejos para que tu primera experiencia sea perfecta**.

## Antes de llegar: la preparación

### Elige bien la duración

Si es tu primera vez, te recomendamos empezar con **2 o 3 horas**. Es tiempo suficiente para navegar hasta alguna cala cercana, bañarte, hacer snorkel y volver sin prisas. Si te queda corto, la próxima vez puedes reservar más tiempo con la confianza de saber cómo funciona.

### Qué llevar a bordo

Prepara una bolsa con:

- **Protección solar factor 50+** -- El sol en el mar es mucho más intenso de lo que piensas. El reflejo del agua multiplica los rayos UV. Aplica crema antes de subir al barco y reaplica cada 2 horas.
- **Gafas de sol con cordón** -- El viento puede llevarse las gafas. Un cordón barato puede salvarte unas gafas caras.
- **Gorra o sombrero** -- La insolación en el mar es un riesgo real. Protege tu cabeza.
- **Agua abundante** -- Mínimo 1,5 litros por persona. La deshidratación llega rápido con el sol y el viento.
- **Snacks** -- Fruta, frutos secos, bocadillos. Navegar abre el apetito.
- **Toallas** -- Al menos una por persona para secarse después de los baños.
- **Ropa de baño** -- Llévala puesta directamente para no perder tiempo cambiándote.
- **Camiseta de manga larga** -- Para cuando el sol apriete demasiado o para el viaje de vuelta.
- **Calzado acuático** -- Las chanclas pueden resbalar. El calzado acuático con suela de goma se agarra bien al barco y te protege los pies en las rocas.
- **Funda impermeable para el móvil** -- Cuesta menos de 10EUR y puede salvar un teléfono de 1.000EUR. El agua salada es el peor enemigo de la electrónica.

### Qué NO llevar

- Objetos de valor que no quieras mojar
- Bolsos grandes o maletas (el espacio a bordo es limitado)
- Zapatos con suela negra que pueda marcar la cubierta

## El briefing de seguridad: no es solo un trámite

Cuando llegues al puerto (recuerda: **15 minutos antes de tu hora**), nuestro equipo te dará un briefing de seguridad personalizado. Préstale toda tu atención porque es la clave para que disfrutes con tranquilidad.

### Qué aprenderás

**Arranque del motor:** Girar la llave, tirar del estrangulador y soltar. Es como arrancar una moto. En 30 segundos lo tendrás dominado.

**Aceleración y dirección:** El acelerador está en el mango del timón. Giras el mango para acelerar y mueves la barra del timón para girar. Es más intuitivo que conducir un coche porque el barco responde más despacio y tienes tiempo de corregir.

**Regla de oro de la dirección:** El barco gira al revés que un coche. Si mueves la barra del timón a la derecha, la proa (parte delantera) va a la izquierda, y viceversa. Parece confuso, pero en 5 minutos lo tendrás automatizado.

**La marcha atrás:** Para frenar el barco no hay frenos. Reduces velocidad y, si necesitas detenerte rápidamente, pones marcha atrás brevemente. Nuestro equipo te enseñará cómo hacerlo de forma segura.

## Tus primeros minutos navegando

### Sal despacio

Al salir del puerto, navega despacio. Es zona de velocidad reducida y además te permite ir cogiéndole el truco al barco sin presión. No tengas prisa.

### Mantén distancia

Deja siempre distancia con otros barcos, boyas, rocas y bañistas. Los barcos no frenan como los coches: necesitan distancia para detenerse.

### Navega pegado a la costa

No tienes que alejarte mucho de la costa para disfrutar. Las mejores calas están a pocos minutos del puerto. Además, navegando cerca de la costa el mar suele estar más calmado y las vistas son mejores.

### Relaja los brazos

Un error común de los principiantes es agarrar el timón con demasiada fuerza y hacer correcciones bruscas. El barco se mueve con suavidad. Relájate, haz movimientos suaves y deja que el barco fluya.

## Cómo fondear en una cala

Fondear (anclar) es el momento en que detienes el barco en una cala para bañarte. Es más sencillo de lo que parece:

1. **Acércate despacio** a la cala. Reduce la velocidad a mínima desde que entres en la zona de baño.
2. **Elige un punto** con fondo de arena (se ve claro desde el barco). Evita fondear sobre rocas o posidonia.
3. **Apaga el motor** cuando estés en posición.
4. **Lanza el ancla** por la proa (parte delantera). Déjala caer suavemente hasta el fondo.
5. **Suelta cadena** suficiente. La regla general es 3 veces la profundidad del agua. Si hay 3 metros de profundidad, suelta unos 9 metros de cadena.
6. **Comprueba que agarra** tirando suavemente de la cadena. Si el barco se mantiene en su sitio, perfecto.
7. **Pon una referencia visual** -- fíjate en un punto de la costa para detectar si el barco se mueve.

Para levar anclas (recogerla), simplemente recoge la cadena poco a poco hasta que el ancla salga del fondo.

## Nadar desde el barco

Una de las mejores partes de ir en barco es poder bañarte en calas de aguas cristalinas. Algunos consejos:

- **Usa la escalera de baño** para entrar y salir del agua. Todos nuestros barcos la tienen.
- **Comprueba que el motor está apagado** antes de que nadie se meta al agua. Esto es fundamental.
- **No te alejes demasiado** del barco. Las corrientes pueden ser engañosas.
- **Lleva snorkel** -- el fondo marino de las calas de la Costa Brava es espectacular. Puedes [alquilarlo](/barcos) por solo 7,50EUR.
- **Sube por la popa** (parte trasera) usando la escalera, nunca por los laterales.

## Gestión del combustible

En nuestros barcos sin licencia, **la gasolina está incluida** en el precio. Esto significa que no tienes que preocuparte de quedarte sin combustible ni de calcular el consumo. El tanque está lleno cuando sales y es más que suficiente para el tiempo que has reservado.

Aun así, algún consejo práctico:

- **Navega a velocidad moderada** -- Además de consumir menos, disfrutarás más del paisaje y el viaje será más cómodo.
- **No dejes el motor al ralentí mucho tiempo** -- Si vas a estar parado en una cala, apaga el motor en lugar de dejarlo encendido.

## El tiempo y el mar

### Antes de salir

Nosotros revisamos las condiciones meteorológicas cada mañana. Si hay alerta de viento fuerte o mala mar, te contactaremos para reagendar. Tu seguridad es lo primero.

### Señales de que debes volver

- El viento aumenta notablemente y el mar se pica con olas crecientes
- Se acercan nubes oscuras desde el horizonte
- Sientes que las condiciones han cambiado mucho respecto a cuando saliste

Si tienes cualquier duda, **llámanos**. Nuestro teléfono está operativo durante toda tu navegación y te orientaremos.

## El teléfono: tu mejor aliado

- **Guarda nuestro número** antes de salir: [+34 611 500 372](tel:+34611500372)
- **Lleva el móvil en funda impermeable** dentro de un bolsillo accesible
- **Usa el GPS del móvil** si quieres ubicar las calas (Google Maps funciona perfecto en el mar)
- **Haz fotos y vídeos** -- Vas a querer recordar esta experiencia

## Emergencias: qué hacer

Las emergencias son extremadamente raras, pero es bueno saber qué hacer:

- **Motor que no arranca:** Comprueba que la llave de seguridad está puesta. Si sigue sin arrancar, llámanos.
- **Te pierdes:** No pasa nada. Usa el GPS del móvil o simplemente navega hacia la costa y sigue la línea de costa de vuelta al puerto.
- **Alguien se marea:** Mira al horizonte, bebe agua y reduce la velocidad. El mareo suele pasar rápidamente.
- **Emergencia real:** Llama al 112 (emergencias) o al canal 16 de VHF si el barco tiene radio.

## Después de la experiencia

Al volver al puerto:

1. **Acércate despacio** al amarre
2. **Nuestro equipo te ayudará** a amarrar el barco
3. **Recoge tus pertenencias** y comprueba que no dejas nada
4. **Se devuelve la fianza** una vez comprobado que todo está correcto

---

## Tu primera vez será inolvidable

En Costa Brava Rent a Boat llevamos años haciendo que la primera experiencia náutica de nuestros clientes sea segura, fácil y espectacular. Con **307 reseñas en Google y 4,8 estrellas**, nuestros clientes confirman que es una de las mejores actividades que pueden hacer en la Costa Brava.

No hace falta experiencia. No hace falta licencia. Solo hace falta ganas de pasar un día increíble en el mar.

[Reserva tu barco ahora](/barcos) o pregúntanos por [WhatsApp](https://wa.me/34611500372). Estamos deseando recibirte en el puerto de Blanes.`,
  },
  // ===== POST 7: Navegar con Niños =====
  {
    title: "Navegar con Niños en la Costa Brava: Guía para Familias",
    slug: "navegar-con-ninos-costa-brava-guia-familias",
    category: "Familia",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/familias-barco.jpg",
    metaDescription: "Guía completa para navegar con niños en la Costa Brava. Consejos de seguridad, mejores calas para familias y barcos recomendados.",
    tags: ["navegar con niños", "costa brava familias", "barco con niños", "actividades familiares blanes", "calas para niños", "vacaciones familia costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-03-18T10:00:00Z"),
    excerpt: "Navegar con niños en la Costa Brava es una experiencia inolvidable. Te contamos todo lo que necesitas saber: seguridad, calas ideales para familias y qué barcos elegir.",
    content: `Alquilar un barco con niños puede parecer una aventura complicada, pero en realidad es una de las mejores experiencias que puedes regalarle a tu familia. En la Costa Brava, con aguas tranquilas, calas de arena poco profundas y barcos seguros y fáciles de manejar, navegar con los más pequeños es mucho más sencillo de lo que imaginas.

En esta guía te contamos todo lo que necesitas saber para que tu día de navegación en familia sea perfecto: desde qué barco elegir hasta qué calas visitar y qué llevar a bordo.

## Por qué la Costa Brava es ideal para navegar con niños

La Costa Brava, y en particular la zona entre Blanes y Tossa de Mar, ofrece condiciones perfectas para la navegación familiar:

- **Mar Mediterráneo tranquilo:** A diferencia del Atlántico, el Mediterráneo tiene olas suaves y corrientes moderadas, especialmente en verano.
- **Calas protegidas del viento:** Muchas calas están resguardadas por acantilados que actúan como barrera natural contra el viento.
- **Aguas poco profundas:** En la mayoría de calas puedes fondear en 2-4 metros de profundidad, con fondo de arena visible.
- **Distancias cortas:** Las mejores calas están a solo 5-15 minutos en barco desde el puerto de Blanes. Si un niño se cansa o se marea, vuelves enseguida.
- **Temperatura del agua agradable:** De junio a septiembre, el agua oscila entre 22 y 26 grados, perfecta para que los niños se bañen sin pasar frío.

## Qué barcos son mejores para familias con niños

No todos los barcos son iguales cuando navegas con niños. Lo más importante es la **estabilidad**, el **espacio** y la **facilidad de acceso al agua**.

### Astec 480 -- Nuestra recomendación para familias

El [Astec 480](/barco/astec-480) es, sin duda, el barco más familiar de nuestra flota. Con **4,80 metros de eslora**, ofrece espacio de sobra para una familia de 4-5 personas. Su casco ancho proporciona una estabilidad excelente, lo que reduce el balanceo y hace que los niños se sientan más seguros.

**Por qué es ideal para niños:**
- Casco amplio y estable que minimiza el balanceo
- Escalera de baño cómoda para que los niños entren y salgan del agua fácilmente
- Espacio suficiente para moverse sin riesgo
- Motor fiable y fácil de manejar
- Toldo de sol disponible como extra para proteger del sol

### Solar 450 -- La opción cómoda

El [Solar 450](/barco/solar-450) es otra opción excelente para familias. Con su diseño moderno y cómodo, ofrece una experiencia de navegación suave. Cuenta con asientos amplios donde los niños pueden ir sentados cómodamente durante la navegación.

**Ventajas para familias:**
- Asientos ergonómicos y cómodos
- Buena estabilidad en el agua
- Fácil de maniobrar incluso para principiantes
- Escalera de baño integrada

### Otros barcos de la flota

El [Remus 450](/barco/remus-450) y el [Astec 400](/barco/astec-400) también son aptos para familias, aunque son algo más compactos. El [Remus 450 II](/barco/remus-450-ii) es perfecto para parejas con un solo niño.

Consulta todos nuestros [barcos disponibles](/barcos) y elige el que mejor se adapte a tu familia.

## Seguridad al navegar con niños: lo esencial

La seguridad es lo primero cuando navegas con niños. Aquí van las reglas fundamentales:

### Chalecos salvavidas siempre

**Todos los niños deben llevar chaleco salvavidas durante toda la navegación.** No solo cuando el barco está en movimiento, sino también cuando están a bordo parados. En Costa Brava Rent a Boat proporcionamos chalecos salvavidas infantiles de todas las tallas, homologados y en perfecto estado. Asegúrate de que el chaleco quede bien ajustado: debe quedar ceñido pero sin apretar.

### Motor apagado para bañarse

Antes de que nadie se meta al agua, **el motor debe estar completamente apagado** y la llave de seguridad retirada. Esta es una regla inquebrantable.

### Protección solar

En el mar, la radiación solar se intensifica por el reflejo del agua. Los niños son especialmente vulnerables:

- **Crema solar SPF 50+** resistente al agua, aplicada 30 minutos antes de embarcar
- **Reaplicar cada 2 horas** y después de cada baño
- **Gorra con visera** y **camiseta UV** para la navegación
- Contratar el **toldo de sol** como extra al reservar (muy recomendable en verano)

### Hidratación y alimentación

- Lleva **agua de sobra** -- en el mar se bebe más de lo habitual
- **Fruta fresca** y snacks ligeros (evita comidas pesadas antes de navegar)
- Una pequeña **nevera portátil** con bebidas frías y comida

### Mareo en niños

El mareo es poco frecuente en nuestros barcos porque la navegación es suave y las distancias cortas, pero por si acaso:

- Evita que los niños lean o miren pantallas durante la navegación
- Que miren al horizonte
- Navega a velocidad moderada y constante
- Si un niño empieza a marearse, para el barco y deja que respire aire fresco

## Las mejores calas para familias con niños

### Cala Sant Francesc (5 minutos desde el puerto)

La reina de las calas familiares. Aguas poco profundas y cristalinas, fondo de arena y un entorno protegido del viento. Los niños pueden bañarse con seguridad mientras los padres disfrutan del paisaje. El snorkel aquí es fantástico incluso para los más pequeños.

### Cala Bona (7 minutos desde el puerto)

Más pequeña y tranquila que Sant Francesc, es perfecta para familias que buscan intimidad. El agua es muy clara y el fondo de arena permite que los niños hagan pie cerca de la orilla.

### Playa de Santa Cristina (10 minutos desde el puerto)

Una playa de arena fina con aguas tranquilas, ideal para niños pequeños. Desde el barco podéis fondear frente a la playa y disfrutar de un entorno paradisíaco. Hay servicio de chiringuito en la playa por si queréis bajar a comer algo.

### Cala Treumal (12 minutos desde el puerto)

Dividida entre Blanes y Lloret, esta cala combina arena y rocas con zonas perfectas para que los niños exploren pozas de marea. El agua es tranquila y el entorno es precioso.

## Qué llevar a bordo cuando navegas con niños

### Imprescindibles
- Crema solar SPF 50+ resistente al agua
- Gorras y camisetas UV
- Toallas (una extra siempre viene bien)
- Agua abundante y snacks
- Bolsa impermeable para el móvil
- Ropa de cambio para los niños

### Muy recomendables
- Gafas de snorkel para niños (puedes [alquilarlas con nosotros](/barcos) por 7,50 EUR)
- Juguetes de agua: cubos, palas, flotadores pequeños
- Cámara acuática o funda impermeable para el móvil
- Un pequeño botiquín: tiritas, after sun, ibuprofeno infantil

### Lo que NO debes llevar
- Objetos de cristal (solo plástico a bordo)
- Dispositivos electrónicos no protegidos contra el agua
- Comida que se estropee fácilmente con el calor

## Planifica tu día de navegación en familia

### Horario recomendado

La mejor franja horaria para navegar con niños es **por la mañana, de 10:00 a 14:00**. El mar suele estar más calmado, hace menos calor que a mediodía y los niños están más descansados y receptivos.

Si prefieres la tarde, la franja de **16:00 a 19:30** también es excelente: el sol ya no pega tan fuerte y la luz del atardecer es preciosa.

### Duración recomendada

Para familias con niños pequeños (3-6 años), recomendamos **medio día (4 horas)**. Es tiempo suficiente para visitar 2-3 calas, bañarse y disfrutar sin que los niños se agoten.

Para niños más mayores (7-12 años), un **día completo (8 horas)** permite explorar más calas y vivir una aventura más completa.

### Ruta familiar recomendada

1. **Salida del puerto de Blanes** -- Navegación tranquila hacia el norte
2. **Primera parada: Cala Sant Francesc** (5 min) -- Baño y snorkel
3. **Segunda parada: Cala Bona** (2 min más al norte) -- Descanso y picnic a bordo
4. **Tercera parada: Santa Cristina** (5 min más) -- Último baño del día
5. **Regreso al puerto** -- Navegación relajada de vuelta

## Precios y cómo reservar

Alquilar un barco para un día en familia tiene un coste desde **130 EUR en temporada baja** hasta **295 EUR en agosto** para un día completo, dependiendo del barco elegido. La gasolina está incluida en todos los precios, así como los chalecos salvavidas para adultos y niños.

Extras recomendados para familias:
- **Toldo de sol:** imprescindible en verano
- **Kit de snorkel:** 7,50 EUR por persona
- **Altavoz Bluetooth:** para poner música durante la navegación

Consulta los [precios actualizados de todos nuestros barcos](/barcos) y reserva directamente online.

## Consejos finales de padres que ya han navegado con nosotros

Después de cientos de familias que han navegado con nosotros, estos son los consejos que más se repiten:

- **"No tengáis miedo."** Los barcos son muy estables y seguros. El equipo os dará una explicación completa antes de salir.
- **"Llevad más agua de la que creáis necesaria."** En el mar siempre se bebe más.
- **"Reservad el toldo."** En julio y agosto el sol es intenso, y el toldo marca la diferencia.
- **"Id por la mañana."** El mar está más calmado y las calas más vacías.
- **"Dejad que los niños participen."** Que lleven el timón (con supervisión), que ayuden con el ancla, que elijan la cala. Es parte de la aventura.

---

Navegar con niños en la Costa Brava es una de esas experiencias que se quedan grabadas para siempre. En Costa Brava Rent a Boat nos encanta recibir familias y hacemos todo lo posible para que vuestra experiencia sea segura, fácil y memorable.

[Reserva tu barco familiar ahora](/barcos) o escríbenos por [WhatsApp](https://wa.me/34611500372) para que te aconsejemos el barco perfecto para tu familia.`,
  },
  // ===== POST 8: Seguridad en el Mar =====
  {
    title: "Seguridad en el Mar: Todo lo que Necesitas Saber Antes de Navegar",
    slug: "seguridad-navegacion-mar-guia",
    category: "Seguridad",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/seguridad-barco.jpg",
    metaDescription: "Guía de seguridad para navegar sin licencia en la Costa Brava. Equipamiento, meteorología, emergencias y normativa.",
    tags: ["seguridad navegacion", "normas barco sin licencia", "seguridad maritima", "navegar seguro", "normativa barcos", "emergencias mar"],
    isPublished: true,
    _publishedAt: new Date("2026-03-20T10:00:00Z"),
    excerpt: "Antes de salir a navegar, conoce las normas de seguridad esenciales: equipamiento obligatorio, cómo consultar el tiempo, qué hacer en emergencias y la normativa de barcos sin licencia.",
    content: `La seguridad en el mar es la base de cualquier experiencia náutica. Tanto si es tu primera vez navegando como si ya tienes experiencia, conocer las normas básicas de seguridad te permitirá disfrutar del mar con total tranquilidad. En esta guía te explicamos todo lo que necesitas saber antes de subir a bordo.

## Normativa de barcos sin licencia en España

En España, puedes alquilar y pilotar un barco sin licencia siempre que cumpla estas características:

- **Eslora máxima de 5 metros** (todos nuestros barcos cumplen esta normativa)
- **Potencia máxima de 15 CV** (11,03 kW)
- **Navegación diurna exclusivamente** (desde el amanecer hasta el anochecer)
- **Distancia máxima de la costa: 2 millas náuticas** (unos 3,7 km)
- **No se requiere ningún título náutico** ni experiencia previa

Esto significa que cualquier persona mayor de 18 años puede pilotar nuestros barcos. Es completamente legal y seguro. La normativa española está diseñada para que estos barcos sean accesibles a todo el mundo.

### Edad mínima y responsabilidad

- El **patrón** (la persona que conduce) debe tener al menos **18 años**
- Los **pasajeros** pueden ser de cualquier edad, incluidos bebés (con las precauciones adecuadas)
- La persona que alquila el barco es responsable de todos los pasajeros

## Equipamiento de seguridad obligatorio

Todos nuestros barcos llevan el equipamiento de seguridad obligatorio según la normativa española vigente. Antes de zarpar, nuestro equipo te mostrará dónde está cada elemento y cómo usarlo:

### Chalecos salvavidas

Cada barco lleva **chalecos salvavidas para todos los pasajeros**, incluidas tallas infantiles. Son chalecos homologados CE y en perfecto estado de mantenimiento.

**Reglas de uso:**
- **Niños menores de 12 años:** deben llevar el chaleco puesto en todo momento mientras estén a bordo
- **Adultos:** recomendamos llevarlo puesto durante la navegación, especialmente si no sabes nadar
- **Obligatorio para todos** si las condiciones meteorológicas empeoran

### Llave de seguridad del motor (kill switch)

Todos nuestros barcos tienen un **cordón de seguridad** que se conecta entre el motor y el piloto. Si el piloto se cae del barco, el cordón se suelta y el motor se apaga automáticamente.

**Es fundamental llevar este cordón conectado a la muñeca o al chaleco durante toda la navegación.** Es tu seguro de vida.

### Otros elementos de seguridad a bordo

- **Achicador** o bomba de achique para extraer agua del casco
- **Remos** como medio de propulsión alternativo
- **Cabo de amarre** para fondear y atracar
- **Ancla** con cadena suficiente

## Cómo comprobar las condiciones meteorológicas

El estado del mar es el factor más importante para una navegación segura. En Costa Brava Rent a Boat, **revisamos las condiciones meteorológicas cada mañana** y te contactaremos si las condiciones no son adecuadas para navegar.

### Aplicaciones y webs recomendadas

- **Windy.com** -- La más completa. Muestra viento, olas, corrientes y previsión horaria. Puedes ver el pronóstico para el puerto de Blanes en tiempo real.
- **Windguru.cz** -- Excelente para previsiones detalladas de viento y olas en puntos costeros específicos.
- **AEMET** (aemet.es) -- La agencia meteorológica oficial de España. Consulta la previsión marítima para la costa catalana.
- **Puertos del Estado** (puertos.es) -- Datos en tiempo real de boyas oceanográficas, incluyendo altura de ola y temperatura del agua.

### Condiciones ideales para navegar sin licencia

| Parámetro | Ideal | Aceptable | No recomendable |
|-----------|-------|-----------|-----------------|
| Viento | 0-10 km/h | 10-20 km/h | Más de 20 km/h |
| Olas | 0-0,3 m | 0,3-0,5 m | Más de 0,5 m |
| Visibilidad | Buena | Moderada | Mala/niebla |
| Previsión | Estable | Viento en aumento | Tormenta prevista |

### Señales de alerta antes de salir

**No salgas a navegar si:**
- La previsión anuncia viento superior a 20 km/h (fuerza 4 o superior)
- Hay aviso amarillo, naranja o rojo de la AEMET para tu zona
- Hay previsión de tormentas en las próximas horas
- La visibilidad es reducida por niebla
- El mar está visiblemente agitado con olas rompiendo en la bocana del puerto

Si tienes dudas, **pregúntanos**. Preferimos que aplaces la salida a que tengas una experiencia incómoda o insegura.

## Normas de navegación básicas

### Velocidad

- **Dentro del puerto:** velocidad mínima, sin crear oleaje
- **Zona de bañistas (primeros 200 metros desde la playa):** velocidad mínima, máxima precaución
- **En navegación:** velocidad prudente adaptada a las condiciones del mar y la visibilidad

### Prioridad de paso

- **Barcos de vela** tienen prioridad sobre barcos de motor
- **Barcos que vienen por estribor** (derecha) tienen prioridad
- **Barcos pesqueros faenando** tienen prioridad
- **Embarcaciones de emergencias y Salvamento Marítimo** tienen prioridad absoluta

### Distancias de seguridad

- **200 metros de las playas:** zona reservada para bañistas. No entres con el motor encendido en esta zona.
- **50 metros de otros barcos fondeados:** mantén distancia al pasar cerca
- **25 metros de bañistas en el agua:** máxima precaución y velocidad mínima
- **Boyas de balizamiento:** respeta siempre las zonas marcadas

## Fondear con seguridad

Fondear (anclar el barco) es una maniobra sencilla pero que requiere atención:

1. **Acércate a la cala a velocidad mínima.** Observa si hay bañistas, otros barcos fondeados o boyas.
2. **Elige un punto con fondo de arena** (se ve claro y luminoso desde el barco). Evita fondear sobre posidonia o rocas.
3. **Comprueba la profundidad.** Lo ideal es entre 2 y 5 metros.
4. **Apaga el motor** antes de soltar el ancla.
5. **Suelta el ancla desde la proa** (parte delantera) dejándola caer suavemente.
6. **Da cadena suficiente:** la regla es 3 veces la profundidad. Si hay 3 metros, da 9 metros de cadena.
7. **Comprueba que agarra** tirando suavemente. Fíjate en un punto de referencia en la costa para confirmar que el barco no se mueve.

### Errores comunes al fondear

- **Fondear demasiado cerca de otros barcos:** Deja margen. Los barcos giran con el viento y la corriente.
- **No dar suficiente cadena:** El ancla no agarra bien y el barco deriva.
- **Fondear sobre posidonia:** Además de ser una práctica que daña el ecosistema, el ancla no agarra bien en posidonia. Busca siempre arena.
- **No vigilar el barco:** Aunque estés bañándote, echa un vistazo periódico para comprobar que el barco sigue en su sitio.

## Qué hacer en caso de emergencia

Las emergencias en el mar son muy poco frecuentes, especialmente en barcos sin licencia que navegan cerca de la costa. Pero es importante saber qué hacer:

### Persona al agua

1. **Grita "hombre al agua"** para alertar a todos a bordo
2. **No pierdas de vista** a la persona en el agua
3. **Lanza un chaleco o flotador** si lo tienes a mano
4. **Acércate lentamente** con el barco, siempre con la persona por la banda de barlovento (lado del viento)
5. **Apaga el motor** antes de que la persona esté cerca de la popa

### Motor que no arranca

1. Comprueba que la **llave de seguridad** está conectada correctamente
2. Verifica que el motor está en **punto muerto** (no en marcha)
3. Comprueba el **nivel de combustible** (indicador en el panel)
4. Intenta arrancar de nuevo después de 30 segundos
5. Si no arranca, **llámanos inmediatamente**: [+34 611 500 372](tel:+34611500372)

### El barco hace agua

1. Mantén la calma. Los barcos de fibra de vidrio son muy resistentes.
2. Localiza la entrada de agua.
3. Usa el **achicador** para extraer el agua.
4. Llámanos inmediatamente.
5. Si la situación es grave, llama al **112** o al **900 202 202** (Salvamento Marítimo).

### Números de emergencia

| Servicio | Número |
|----------|--------|
| Emergencias generales | **112** |
| Salvamento Marítimo | **900 202 202** |
| Costa Brava Rent a Boat | **+34 611 500 372** |

**Guarda estos números en tu móvil antes de salir.** Nuestro teléfono está operativo durante todo el horario de navegación.

## Protección del medio ambiente marino

Navegar de forma segura también significa navegar de forma responsable con el medio ambiente:

- **No tires nada al mar.** Ni colillas, ni plásticos, ni restos de comida. Todo lo que llevas a bordo vuelve contigo a puerto.
- **No fondees sobre posidonia.** Las praderas de posidonia oceánica son ecosistemas protegidos fundamentales para la vida marina.
- **Respeta la fauna marina.** Si ves delfines, tortugas u otros animales, no los persigas ni te acerques a menos de 60 metros.
- **Usa crema solar biodegradable.** Las cremas convencionales contaminan el agua y dañan los corales y la fauna.
- **No arranques plantas marinas ni cojas estrellas de mar o erizos.**

## Nuestra política de seguridad

En Costa Brava Rent a Boat, la seguridad es nuestra prioridad absoluta:

- **Briefing completo:** Antes de cada salida, nuestro equipo te da una explicación práctica de 15 minutos sobre el barco, la seguridad y la zona de navegación.
- **Revisión diaria:** Todos los barcos se revisan cada mañana antes de la primera salida.
- **Monitorización meteorológica:** Consultamos las previsiones cada día y cancelamos salidas si las condiciones no son adecuadas.
- **Teléfono operativo:** Estamos disponibles durante toda tu navegación para cualquier duda o incidencia.
- **Mantenimiento preventivo:** Los barcos pasan revisiones mecánicas periódicas y todos los elementos de seguridad se verifican regularmente.

---

La seguridad en el mar es cuestión de sentido común, preparación y prudencia. Con las indicaciones de esta guía y el briefing que te daremos antes de salir, estarás perfectamente preparado para disfrutar de una navegación segura y relajada por la Costa Brava.

[Reserva tu barco](/barcos) con total confianza o contacta con nosotros por [WhatsApp](https://wa.me/34611500372) si tienes cualquier duda sobre seguridad.`,
  },
  // ===== POST 9: Gastronomía Marinera =====
  {
    title: "Gastronomía Marinera en Blanes: Qué Comer Después de Navegar",
    slug: "gastronomia-marinera-blanes",
    category: "Gastronomía",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/gastronomia-marina.jpg",
    metaDescription: "Descubre los mejores restaurantes de pescado y marisco en Blanes. Gastronomía marinera cerca del puerto tras un día de navegación.",
    tags: ["gastronomia blanes", "restaurantes blanes", "pescado fresco blanes", "chiringuitos costa brava", "comer en blanes", "marisco blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-03-22T10:00:00Z"),
    excerpt: "Después de un día navegando por la Costa Brava, nada mejor que disfrutar de la gastronomía marinera de Blanes. Te recomendamos los mejores restaurantes de pescado y marisco cerca del puerto.",
    content: `Blanes es mucho más que un punto de partida para explorar la Costa Brava en barco. Esta villa marinera con siglos de tradición pesquera ofrece una gastronomía que merece un viaje por sí sola. Después de un día navegando por calas de aguas cristalinas, sentarte a disfrutar de un pescado fresco con vistas al mar es el broche perfecto.

En esta guía te llevamos por los mejores rincones gastronómicos de Blanes, desde restaurantes con solera hasta chiringuitos con los pies en la arena.

## La tradición pesquera de Blanes

Blanes es uno de los puertos pesqueros más activos de la Costa Brava. Cada tarde, la **subasta de pescado en la lonja** es un espectáculo que pocos turistas conocen. Los barcos de arrastre y las barcas de trasmallo regresan al puerto con su captura del día, que se subasta y va directamente a los restaurantes locales.

Esta tradición pesquera viva significa que el pescado que comes en Blanes es, literalmente, **el más fresco que puedes encontrar**. Muchos restaurantes compran directamente en la lonja cada tarde, y al día siguiente ese pescado está en tu plato.

### Platos típicos de la cocina marinera de Blanes

Antes de recomendarte restaurantes, es útil conocer los platos emblemáticos que encontrarás en las cartas:

- **Suquet de peix:** El guiso marinero por excelencia de la Costa Brava. Pescado de roca cocinado con patatas, tomate, ajo y un sofrito de ñora. Cada restaurante tiene su receta, pero todos son memorables.
- **Arroz a la cazuela (arròs caldós):** Arroz caldoso con gambas, cigalas, mejillones y caldo de pescado. El plato perfecto después de un día en el mar.
- **Fideuà:** Similar a la paella pero con fideos finos. Se sirve con alioli casero y es espectacular.
- **Gamba de Blanes:** La joya de la corona. La gamba roja de Blanes tiene denominación propia y se considera una de las mejores del Mediterráneo. Se sirve a la plancha con un toque de sal gorda.
- **Sepia a la plancha:** Sencilla, tierna y con un sabor a mar increíble. Se acompaña con alioli.
- **Anchoas de l'Escala:** Aunque no son de Blanes sino del vecino pueblo de l'Escala, son un aperitivo obligado en cualquier comida marinera en la Costa Brava.
- **Pescado a la brasa:** Lubina, dorada o llobarros (lubina salvaje) a la brasa con aceite de oliva y limón. La sencillez al servicio del producto.

## Restaurantes recomendados cerca del puerto

### Zona del puerto y paseo marítimo

**El Ventall**
Situado en primera línea del paseo marítimo, El Ventall es uno de los restaurantes más emblemáticos de Blanes. Su especialidad son los arroces y el pescado fresco. El suquet de peix es excepcional, y las vistas al mar desde la terraza hacen que la experiencia sea completa.

- **Precio medio:** 30-45 EUR por persona
- **Especialidad:** Arroces y suquet de peix
- **Distancia del puerto:** 5 minutos andando
- **Recomendación:** Reserva mesa en la terraza para cenar con vistas al atardecer

**Can Ton**
Un clásico de Blanes con décadas de historia. Can Ton es el típico restaurante familiar catalán donde el pescado es siempre fresco y la relación calidad-precio es excelente. Su parrillada de pescado y marisco es famosa en toda la comarca.

- **Precio medio:** 25-35 EUR por persona
- **Especialidad:** Parrillada de pescado, gamba de Blanes
- **Distancia del puerto:** 7 minutos andando

**Sa Gambina**
Restaurante especializado en arroces con una ubicación privilegiada junto a la playa de Blanes. Su arroz negro con sepia y su fideuà son de los mejores de la zona. Ambiente informal y acogedor.

- **Precio medio:** 25-40 EUR por persona
- **Especialidad:** Arroces (negro, a banda, caldoso)
- **Distancia del puerto:** 10 minutos andando

### Zona del casco antiguo

**Cal Hermenegildo**
Un pequeño restaurante en el casco antiguo de Blanes que ha ganado reputación por su cocina creativa con base marinera. Aquí encontrarás platos tradicionales con toques modernos. El tartar de gamba roja de Blanes es espectacular.

- **Precio medio:** 35-50 EUR por persona
- **Especialidad:** Cocina creativa marinera
- **Distancia del puerto:** 8 minutos andando
- **Recomendación:** Imprescindible reservar, tiene pocas mesas

### Chiringuitos con los pies en la arena

**Chiringuito Sa Palomera**
Justo al lado de la icónica roca de Sa Palomera, este chiringuito ofrece la experiencia más casual y mediterránea posible. Pide unas patatas bravas, unos calamares a la romana y una cerveza fría mientras contemplas el puerto desde la arena.

- **Precio medio:** 15-25 EUR por persona
- **Ideal para:** Comer algo rápido e informal después de navegar
- **Distancia del puerto:** 3 minutos andando

**Chiringuito Santa Cristina**
Si tu ruta en barco incluye la playa de Santa Cristina (una de las más bonitas de Blanes), puedes fondear frente a la playa y acercarte nadando al chiringuito. Comida sencilla, buenas bebidas y un ambiente relajado con los pies en la arena.

## Mercados y compras gastronómicas

### Mercado Municipal de Blanes

Si prefieres preparar tu propia comida o llevar un picnic al barco, el **Mercado Municipal de Blanes** es tu sitio. Abierto por las mañanas, encontrarás:

- **Pescado fresco** del día directamente de la lonja
- **Frutas y verduras** de temporada de productores locales
- **Embutidos y quesos** catalanes artesanales
- **Pan de pueblo** recién horneado

**Horario:** Lunes a sábado, de 8:00 a 14:00
**Ubicación:** A 10 minutos andando del puerto

### Preparar un picnic para el barco

Una opción fantástica es comprar en el mercado y comer a bordo del barco, fondeados en una cala. Te recomendamos:

- Pan con tomate (pa amb tomàquet) con jamón
- Queso manchego o de cabra catalán
- Aceitunas y frutos secos
- Fruta fresca de temporada
- Agua y cerveza fría en una nevera portátil

Es una experiencia gastronómica sencilla pero que, rodeado del paisaje de la Costa Brava, se convierte en algo extraordinario.

## Vinos de la zona

La Costa Brava tiene una tradición vinícola notable. Si te gusta el vino, estos son los que mejor maridan con la cocina marinera local:

- **DO Empordà:** Vinos blancos frescos y afrutados, perfectos para pescado. Busca Garnacha blanca o Macabeo.
- **Cava:** Un cava catalán bien frío es perfecto como aperitivo antes de la comida.
- **Vinos rosados:** Los rosados del Empordà son frescos, ligeros y combinan con todo.

## Nuestra recomendación: el plan perfecto

Si quieres combinar navegación y gastronomía en un día perfecto en Blanes, te proponemos este plan:

1. **9:30** -- Paseo por el mercado municipal. Compra algo de fruta y agua para el barco.
2. **10:00** -- Recoge tu [barco en el puerto](/barcos). Nuestro equipo te hará el briefing de seguridad.
3. **10:30-13:30** -- Navega hacia Cala Sant Francesc, Cala Bona y Santa Cristina. Baño y snorkel.
4. **13:30** -- Picnic a bordo fondeado en una cala o parada en el chiringuito de Santa Cristina.
5. **14:00-17:00** -- Sigue explorando calas hacia Lloret o descansa fondeado en tu cala favorita.
6. **17:00** -- Regreso al puerto de Blanes.
7. **17:30** -- Ducha y paseo por el paseo marítimo.
8. **20:30** -- Cena en alguno de los restaurantes recomendados. Un suquet de peix con vistas al mar.

Es un plan que combina lo mejor del mar y la mesa, y que te dejará recuerdos imborrables de Blanes.

---

Blanes es un destino donde la navegación y la gastronomía se complementan de forma natural. Después de descubrir las calas más bonitas de la Costa Brava desde tu [barco de alquiler](/barcos), la mesa te espera con los sabores más auténticos del Mediterráneo.

[Reserva tu barco](/barcos) y prepárate para un día redondo: mar, sol y buena mesa.`,
  },
  // ===== POST 10: Fauna Marina =====
  {
    title: "Fauna Marina de la Costa Brava: Qué Verás Desde tu Barco",
    slug: "fauna-marina-costa-brava-barco",
    category: "Naturaleza",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/snorkel-mar.jpg",
    metaDescription: "Descubre la fauna marina de la Costa Brava: peces, delfines, praderas de posidonia y los mejores puntos para snorkel desde el barco.",
    tags: ["fauna marina costa brava", "delfines costa brava", "snorkel costa brava", "posidonia mediterraneo", "vida marina blanes", "peces mediterraneo"],
    isPublished: true,
    _publishedAt: new Date("2026-03-25T10:00:00Z"),
    excerpt: "La Costa Brava esconde un mundo submarino fascinante. Descubre qué especies marinas verás desde tu barco y cuáles son los mejores puntos de snorkel entre Blanes y Tossa de Mar.",
    content: `El Mediterráneo puede parecer un mar tranquilo y discreto, pero bajo su superficie se esconde un ecosistema extraordinariamente rico. La Costa Brava, gracias a sus fondos rocosos, sus praderas de posidonia y sus aguas limpias, es uno de los mejores tramos del litoral español para observar fauna marina. Y lo mejor: gran parte de esta biodiversidad es visible desde un barco o con unas simples gafas de snorkel.

En esta guía te contamos qué especies puedes encontrar navegando entre Blanes y Tossa de Mar, dónde buscarlas y cómo disfrutar del mundo submarino de forma responsable.

## Las praderas de posidonia: el bosque del Mediterráneo

Antes de hablar de animales, hay que hablar de la **posidonia oceánica**. Estas praderas submarinas de color verde intenso no son algas, sino plantas marinas con raíces, tallo y hojas. Son el equivalente submarino de un bosque, y desempeñan un papel fundamental:

- **Producen oxígeno:** Un metro cuadrado de posidonia genera más oxígeno que la misma superficie de selva amazónica.
- **Son guardería de peces:** Cientos de especies depositan sus huevos y crían entre las hojas de posidonia.
- **Protegen la costa:** Las praderas frenan el oleaje y evitan la erosión de las playas.
- **Fijan CO2:** Son sumideros de carbono que combaten el cambio climático.

Entre Blanes y Lloret encontrarás extensas praderas de posidonia, especialmente frente a Cala Bona, Cala Sant Francesc y la playa de Santa Cristina. Desde el barco, las verás como manchas oscuras en el fondo marino. Son zonas donde la vida bulle.

**Importante:** Nunca fondees sobre posidonia. Busca siempre fondos de arena para anclar tu barco. Las anclas arrancan las plantas y el daño tarda décadas en recuperarse.

## Peces que verás haciendo snorkel

### Especies comunes (las verás casi seguro)

**Sargos (Diplodus sargus)**
Los sargos son probablemente los peces que más verás en las calas de la Costa Brava. Son plateados con rayas negras verticales y nadan en bancos cerca de las rocas. Son curiosos y a menudo se acercan a los nadadores.

**Doncellas (Coris julis)**
Pequeñas y con colores vivos, las doncellas son como las joyas del Mediterráneo. Los machos tienen una franja naranja-roja por el costado, mientras que las hembras son más discretas en tonos marrones. Las encontrarás nadando entre las rocas y la posidonia.

**Castañuelas (Chromis chromis)**
Estos pequeños peces de color marrón oscuro forman grandes bancos en aguas superficiales cerca de las rocas. Son las primeras que verás al meter la cabeza en el agua, flotando en nubes de decenas de individuos.

**Salpas (Sarpa salpa)**
Peces plateados con rayas doradas que nadan en bancos compactos. Se alimentan de algas y posidonia, así que los encontrarás cerca de las praderas. Son muy fáciles de observar porque nadan de forma relajada.

**Fredis o Serranitos (Serranus cabrilla)**
Pequeños pero llamativos, con un patrón de rayas rojas y naranjas. Son depredadores de fondo que encontrarás posados sobre las rocas, esperando a que pase alguna presa.

### Especies menos comunes (con algo de suerte)

**Meros (Epinephelus marginatus)**
El mero es el rey de los fondos rocosos del Mediterráneo. Puede alcanzar más de un metro y 40 kilos de peso. Son tímidos pero muy curiosos. Si haces snorkel en zonas rocosas con cierta profundidad (3-5 metros), es posible que veas alguno asomándose desde su cueva. En los últimos años, la protección ha hecho que su población se recupere en la Costa Brava.

**Pulpos (Octopus vulgaris)**
Maestros del camuflaje, los pulpos se mimetizan con las rocas y son difíciles de detectar. Busca en fondos rocosos con grietas y cuevas pequeñas. Si ves un montoncito de conchas de mejillón frente a una grieta, ahí vive un pulpo.

**Morenas (Muraena helena)**
Las morenas son impresionantes: cuerpos largos y serpenteantes con un patrón moteado de marrón y amarillo. Viven en cuevas y grietas y asoman la cabeza mostrando su boca abierta (no es agresividad, es cómo respiran). Son inofensivas si no las molestas.

**Estrellas de mar (Echinaster sepositus)**
De un rojo intenso, las estrellas de mar del Mediterráneo son preciosas. Las encontrarás sobre las rocas en zonas con algo de profundidad. Obsérvalas pero no las toques ni las saques del agua.

## Delfines en la Costa Brava

Los **delfines mulares (Tursiops truncatus)** y los **delfines listados (Stenella coeruleoalba)** habitan las aguas de la Costa Brava. No es una observación garantizada, pero tampoco es rara: muchos de nuestros clientes nos envían fotos de delfines saltando junto a su barco.

### Dónde es más probable verlos

- **En aguas abiertas** entre Blanes y Lloret, especialmente si te alejas un poco de la costa (dentro del límite de 2 millas)
- **Por la mañana temprano** es cuando son más activos
- **En zonas con bancos de peces** (las gaviotas en la superficie suelen indicar peces debajo)

### Qué hacer si ves delfines

- **Reduce la velocidad** y mantén un rumbo constante
- **No los persigas** ni cambies bruscamente de dirección hacia ellos
- **Mantén al menos 60 metros de distancia**
- **Apaga el motor** si se acercan voluntariamente a tu barco (a veces lo hacen para surfear la ola de proa)
- Disfruta del momento y haz fotos, pero respeta su espacio

## Aves marinas

Desde el barco también observarás una variedad de aves marinas:

- **Gaviotas patiamarillas:** Las más comunes. Las verás en los acantilados, el puerto y siguiendo a los barcos pesqueros.
- **Cormoranes:** De color negro, se posan en las rocas costeras con las alas abiertas para secarse. Son excelentes buceadores.
- **Pardelas:** Aves pelágicas que vuelan rasando el agua con un planeo elegante. Son más comunes en aguas abiertas.
- **Charranes:** Similares a las gaviotas pero más estilizados, se lanzan en picado al agua para pescar. Es espectacular verlos en acción.

## Los mejores puntos de snorkel entre Blanes y Tossa de Mar

### Cala Sant Francesc (5 minutos desde el puerto)

El mejor punto de snorkel accesible para principiantes. Fondos rocosos a poca profundidad (1-3 metros) con mucha vida. Verás sargos, doncellas, castañuelas y, si tienes suerte, algún pulpo. El agua es cristalina y la visibilidad suele ser excelente.

**Nivel:** Principiante
**Profundidad:** 1-4 metros
**Lo que verás:** Sargos, doncellas, castañuelas, estrellas de mar

### Cala Bona (7 minutos desde el puerto)

Junto a Sant Francesc pero con un fondo más variado. Hay zonas de roca, arena y posidonia que crean diferentes hábitats. Es un punto excelente para ver salpas en las praderas y fredis entre las rocas.

**Nivel:** Principiante-Intermedio
**Profundidad:** 2-5 metros
**Lo que verás:** Salpas, sargos, fredis, posidonia abundante

### Rocas de Santa Anna (15 minutos desde el puerto)

Entre Blanes y Lloret, esta zona de fondos rocosos con grandes bloques sumergidos es uno de los mejores puntos de snorkel de la zona. La vida marina es muy abundante y la profundidad permite ver peces de mayor tamaño.

**Nivel:** Intermedio
**Profundidad:** 3-7 metros
**Lo que verás:** Meros (con suerte), morenas, bancos de sargos, nudibranquios

### Cala Canyelles (25 minutos desde el puerto)

Si reservas un día completo y navegas con el [Astec 480](/barco/astec-480) o el [Remus 450](/barco/remus-450) hasta Canyelles, encontrarás uno de los fondos marinos más espectaculares de la zona. Grandes rocas sumergidas cubiertas de esponjas y gorgonias, con una biodiversidad impresionante.

**Nivel:** Intermedio-Avanzado
**Profundidad:** 3-10 metros
**Lo que verás:** Gran diversidad de especies, gorgonias, posibles meros

## Consejos para disfrutar del snorkel desde el barco

### Equipo necesario

- **Gafas de snorkel y tubo:** Puedes [alquilar un kit de snorkel con nosotros](/barcos) por solo 7,50 EUR. También puedes traer el tuyo.
- **Aletas:** No son imprescindibles pero ayudan mucho para desplazarte sin esfuerzo.
- **Camiseta de neopreno o lycra UV:** Protege del sol y del frío en inmersiones largas.
- **Crema solar biodegradable:** Aplícala 30 minutos antes de meterte al agua.

### Antes de meterte al agua

1. **Asegúrate de que el motor está apagado** y la llave de seguridad retirada
2. **Comprueba que el ancla agarra bien** y el barco está fijo
3. **Entra al agua por la escalera de popa** (parte trasera)
4. **No te alejes demasiado del barco** -- las corrientes pueden ser engañosas
5. **Nada siempre en pareja** si es posible

### Para mejorar tu experiencia

- **Muévete despacio y sin hacer ruido.** Los peces huyen de los movimientos bruscos.
- **Flota en la superficie y observa.** No necesitas bucear para ver la mayoría de especies.
- **Busca en las grietas y bajo las rocas.** Ahí se esconden morenas, pulpos y cangrejos.
- **Mira en las praderas de posidonia.** Están llenas de vida.
- **Las primeras horas de la mañana** son las mejores para snorkel: mar calmado, luz clara y los peces están más activos.

## Proteger lo que amamos

La riqueza marina de la Costa Brava es un tesoro frágil. Como navegantes y amantes del mar, tenemos la responsabilidad de protegerla:

- **No toques ni cojas nada** del fondo marino
- **No persigas a los animales** marinos
- **No alimentes a los peces** (altera su comportamiento natural)
- **Usa crema solar biodegradable** (las cremas químicas matan corales y dañan la fauna)
- **No fondees sobre posidonia** -- busca siempre arena
- **Recoge cualquier basura** que encuentres flotando

---

La Costa Brava es un paraíso para los amantes de la naturaleza marina. Desde la cubierta de tu barco o con las gafas de snorkel puestas, descubrirás un mundo de colores, formas y vida que te dejará sin palabras.

[Alquila tu barco](/barcos) y ven a explorar el Mediterráneo más vivo. No olvides pedir tu kit de snorkel al hacer la reserva.`,
  },
  // ===== POST 11: Historia Marítima de Blanes =====
  {
    title: "Historia Marítima de Blanes: De Puerto Pesquero a Destino Náutico",
    slug: "historia-maritima-blanes",
    category: "Cultura",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/puerto-barcos.jpg",
    metaDescription: "Descubre la historia marítima de Blanes: su puerto pesquero, el faro, el jardín botánico y la evolución a destino náutico.",
    tags: ["historia blanes", "puerto pesquero blanes", "faro blanes", "jardin botanico blanes", "cultura costa brava", "turismo blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-03-27T10:00:00Z"),
    excerpt: "Blanes es mucho más que playas y calas. Su historia marítima de siglos, su puerto pesquero vivo, su faro y su jardín botánico cuentan la historia de un pueblo unido al mar.",
    content: `Blanes es conocida como la **puerta de la Costa Brava**, el punto donde comienza oficialmente uno de los litorales más bellos de Europa. Pero detrás de sus playas turquesas y sus calas escondidas hay una historia marítima de siglos que merece ser contada. Una historia de pescadores, comerciantes, botánicos y navegantes que han dado forma al Blanes que conocemos hoy.

En esta guía te invitamos a descubrir el patrimonio marítimo de Blanes, un complemento cultural perfecto para tu día de navegación por la Costa Brava.

## Los orígenes: Blanda y el comercio antiguo

El asentamiento humano en Blanes se remonta a los íberos y los romanos. La antigua **Blanda** ya era un punto de comercio marítimo en el siglo II a.C. Se han encontrado restos de ánforas romanas en los fondos marinos frente a Blanes, evidencia de un tráfico comercial activo entre la península ibérica, Roma y el norte de África.

La ubicación de Blanes, protegida del viento de tramontana por las montañas y con una bahía natural, la convirtió en un puerto seguro para las embarcaciones antiguas. Desde aquellos tiempos remotos, la vida de Blanes ha estado ligada al mar.

### El castillo de Sant Joan

Dominando Blanes desde lo alto de una colina, las ruinas del **Castillo de Sant Joan** (siglo XIII) son testimonio de la importancia estratégica del puerto. Esta fortaleza medieval servía como punto de vigía contra piratas y como defensa del litoral.

Desde el castillo, las vistas de la costa son espectaculares. Es posible ver desde el cabo de Tossa de Mar hasta el golfo de Roses en días claros. Si navegas con alguno de nuestros [barcos](/barcos), verás el castillo desde el mar, una perspectiva que pocos turistas conocen.

## El puerto pesquero: corazón vivo de Blanes

### La pesca como forma de vida

Durante siglos, la pesca fue la principal actividad económica de Blanes. Las familias de pescadores transmitían el oficio de generación en generación, y el ritmo de la villa se marcaba por las mareas y las capturas.

Hoy, Blanes sigue siendo uno de los **puertos pesqueros más activos de la Costa Brava**. La flota pesquera de Blanes incluye:

- **Barcas de arrastre:** Salen de madrugada y regresan por la tarde. Pescan en fondos arenosos y fangosos a cierta profundidad.
- **Barcas de trasmallo:** Usan redes fijas que se calan y se recogen. Es la pesca más artesanal y tradicional.
- **Barcas de cerco:** Pescan sardinas y anchoas de noche, utilizando luces para atraer a los bancos de peces.

### La lonja de pescado

Cada tarde, sobre las 17:00, la **lonja de Blanes** cobra vida. Los barcos descargan su captura y se celebra la subasta, donde los restaurantes locales y los mayoristas pujan por el mejor pescado. Es un espectáculo fascinante y abierto al público que pocos turistas conocen.

Si tu [día de navegación](/barcos) termina por la tarde, acércate a la lonja antes de ir a cenar. Verás cómo se subasta el mismo pescado que posiblemente comerás en el restaurante esa noche.

### La gamba de Blanes

La **gamba roja de Blanes** merece mención especial. Capturada en aguas profundas (400-600 metros) frente a la costa de Blanes, esta gamba es famosa por su sabor dulce e intenso. Los mejores restaurantes de la zona la sirven a la plancha, simplemente con sal gorda.

La gamba de Blanes tiene reconocimiento gastronómico en toda Cataluña y España. Es uno de los productos del mar más valorados del Mediterráneo occidental.

## El Faro de Blanes (Far de sa Palomera)

El **faro de Blanes** se ubica junto a la roca de Sa Palomera, el icónico peñasco que divide las dos playas principales de Blanes y que marca simbólicamente el inicio de la Costa Brava.

Desde el mar, cuando regresas al puerto después de un día navegando, el faro es una referencia visual inconfundible. Sa Palomera, con su silueta característica, ha sido punto de referencia para los pescadores de Blanes durante generaciones.

### La roca de Sa Palomera

Sa Palomera no es solo un símbolo: marca la frontera oficial entre la **Costa del Maresme** (al sur) y la **Costa Brava** (al norte). Puedes caminar hasta lo alto de la roca por una pasarela y disfrutar de vistas panorámicas del puerto y la costa. Desde el barco, la perspectiva de Sa Palomera es igualmente impresionante.

## El Jardín Botánico Marimurtra

Uno de los tesoros culturales de Blanes es el **Jardín Botánico Marimurtra**, fundado en 1921 por el botánico alemán **Karl Faust**. Situado en los acantilados de Cala Sant Francesc, este jardín alberga más de 4.000 especies de plantas de todo el mundo.

Marimurtra está considerado uno de los **jardines botánicos más importantes del Mediterráneo**. Sus terrazas con vistas al mar son de una belleza sobrecogedora. Desde el barco, cuando navegas frente a Cala Sant Francesc, puedes ver los jardines en la ladera del acantilado.

### Visita recomendada

Si combinas un día de navegación con una visita a Marimurtra, tendrás una experiencia completa de Blanes. El jardín abre de 10:00 a 18:00 (horario variable según temporada) y la entrada cuesta aproximadamente 8 EUR para adultos.

**Plan sugerido:** Visita Marimurtra por la mañana (1-2 horas) y después recoge tu [barco de alquiler](/barcos) para explorar las calas de la zona por la tarde.

## El Jardín Botánico Pinya de Rosa

Menos conocido que Marimurtra pero igualmente fascinante, **Pinya de Rosa** fue fundado por Ferran Rivière de Caralt y está especializado en plantas suculentas y cactáceas. Alberga una de las colecciones de cactus más importantes de Europa.

## La evolución: de pueblo pesquero a destino turístico

### Los años 60: el boom del turismo

Como toda la Costa Brava, Blanes experimentó una transformación radical en los años 60 con la llegada del turismo de masas. Los hoteles empezaron a construirse junto a las playas y el pueblo pasó de vivir exclusivamente de la pesca a incorporar el turismo como motor económico principal.

A diferencia de otros municipios de la Costa Brava que se urbanizaron de forma descontrolada, Blanes ha mantenido un equilibrio notable entre turismo y autenticidad. Su casco antiguo conserva la esencia marinera, el puerto pesquero sigue activo y las tradiciones se mantienen vivas.

### Blanes hoy: el turismo náutico

En las últimas décadas, Blanes ha apostado por un turismo de calidad orientado a la naturaleza y la experiencia. El **turismo náutico** se ha convertido en uno de los pilares de esta nueva etapa:

- **Alquiler de barcos sin licencia:** Empresas como Costa Brava Rent a Boat permiten que cualquier persona disfrute de la navegación sin necesidad de titulación.
- **Excursiones en barco:** Rutas organizadas por la costa con guías locales.
- **Vela y kayak:** Actividades náuticas para todos los niveles.
- **Snorkel y buceo:** Aprovechando la riqueza de los fondos marinos.

Este enfoque permite disfrutar de la Costa Brava de una forma más auténtica y respetuosa con el entorno, lejos de las aglomeraciones de las playas más masificadas.

## Festivales y tradiciones marineras

### La Fiesta de Santa Anna (26 de julio)

La festividad de Santa Anna, patrona de Blanes, culmina con un espectacular **concurso internacional de fuegos artificiales** que se celebra durante los últimos 5 días de julio. Las empresas pirotécnicas compiten lanzando sus creaciones desde la roca de Sa Palomera sobre el mar.

Ver los fuegos artificiales desde un barco en la bahía de Blanes es una experiencia absolutamente mágica. El reflejo de los colores en el agua y la proximidad al punto de lanzamiento hacen que sea infinitamente superior a verlos desde tierra.

### La procesión marinera

Durante las fiestas patronales, la imagen de la Virgen del Carmen (patrona de los marineros) se lleva en procesión por el mar. Los barcos pesqueros se engalanan y acompañan a la barca que porta la imagen en una tradición centenaria cargada de emoción.

### El Festival de la Gamba

Cada año, Blanes celebra un festival gastronómico dedicado a su producto estrella: la gamba roja. Los restaurantes participantes ofrecen menús especiales y se celebran catas, demostraciones de cocina y actividades en torno al puerto.

## Un paseo histórico por Blanes

Si quieres complementar tu día de navegación con un recorrido cultural por Blanes, esta es nuestra ruta recomendada:

1. **Puerto pesquero** -- Observa los barcos de pesca y la lonja
2. **Paseo marítimo** -- Desde el puerto hasta Sa Palomera
3. **Roca de Sa Palomera** -- Sube a lo alto para las vistas panorámicas
4. **Casco antiguo** -- Callejuelas medievales con encanto
5. **Iglesia de Santa María** -- Templo gótico del siglo XIV
6. **Fuente gótica** -- Monumento histórico en el centro
7. **Subida al Castillo de Sant Joan** -- Las mejores vistas de Blanes
8. **Jardín Botánico Marimurtra** -- Naturaleza y vistas al mar

Este recorrido se puede hacer en 3-4 horas a pie, y es un complemento perfecto para una mañana de navegación.

---

Blanes no es solo un sitio bonito donde alquilar un barco. Es una villa con alma marinera, con siglos de historia escrita por el mar. Cuando navegas desde su puerto, formas parte de una tradición que se remonta a los romanos, que pasa por pescadores y botánicos, y que hoy se reinventa con el turismo náutico.

[Descubre Blanes desde el mar](/barcos) y vive una experiencia que conecta pasado y presente. Te esperamos en el puerto.`,
  },
  // ===== POST 12: Snorkel y Buceo =====
  {
    title: "Snorkel y Buceo desde el Barco: Las Mejores Zonas en la Costa Brava",
    slug: "snorkel-buceo-costa-brava-barco",
    category: "Aventuras",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/snorkel-mar.jpg",
    metaDescription: "Las mejores zonas de snorkel y buceo en la Costa Brava accesibles en barco desde Blanes. Cuevas submarinas, fondos marinos y consejos.",
    tags: ["snorkel costa brava", "buceo costa brava", "cuevas submarinas", "snorkel blanes", "fondos marinos costa brava", "actividades acuaticas blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-03-30T10:00:00Z"),
    excerpt: "La Costa Brava es un paraíso para el snorkel y el buceo. Descubre las mejores zonas accesibles en barco desde Blanes: cuevas submarinas, fondos de roca y aguas cristalinas.",
    content: `La Costa Brava alberga algunos de los fondos marinos más espectaculares del Mediterráneo occidental. Acantilados que se hunden en el mar creando paredes rocosas, cuevas submarinas, praderas de posidonia y una biodiversidad asombrosa. Y la mejor forma de acceder a los puntos de snorkel y buceo más exclusivos es, sin duda, en barco.

Desde el puerto de Blanes, en pocos minutos llegas a zonas de inmersión que desde tierra son inaccesibles o requieren largas caminatas. En esta guía te contamos cuáles son los mejores puntos y cómo aprovecharlos al máximo.

## Por qué la Costa Brava es tan buena para el snorkel

La Costa Brava reúne condiciones excepcionales para la observación submarina:

- **Aguas cristalinas:** La visibilidad en muchas calas supera los 10-15 metros, especialmente en los meses de junio, septiembre y octubre.
- **Fondos variados:** La combinación de roca, arena y posidonia crea hábitats diversos con gran variedad de vida marina.
- **Costa accidentada:** Los acantilados y las rocas crean grietas, cuevas y repisas donde se refugia la fauna.
- **Temperatura agradable:** De junio a octubre, el agua oscila entre 20 y 26 grados. En julio y agosto supera los 24 grados.
- **Protección medioambiental:** Varias zonas de la Costa Brava están protegidas, lo que ha permitido la recuperación de la fauna marina.

## Los mejores puntos de snorkel desde Blanes

### 1. Cala Sant Francesc -- El clásico imprescindible

**Distancia desde el puerto:** 1,5 km (5 minutos en barco)
**Nivel:** Principiante
**Profundidad:** 1-5 metros

Cala Sant Francesc es el punto de snorkel más accesible y gratificante cerca de Blanes. Sus aguas cristalinas y sus fondos rocosos a poca profundidad la convierten en el lugar perfecto para una primera experiencia de snorkel o para familias con niños.

**Qué verás:**
- Bancos de sargos y castañuelas en las rocas del lateral izquierdo
- Doncellas de colores entre las grietas
- Estrellas de mar rojas en los fondos rocosos
- Posidonia abundante en la zona central de la cala

**Consejo:** Explora los laterales rocosos de la cala, donde la vida marina se concentra. El centro de la cala tiene fondo de arena con menos fauna.

### 2. Cala Bona -- Praderas submarinas

**Distancia desde el puerto:** 2 km (7 minutos en barco)
**Nivel:** Principiante-Intermedio
**Profundidad:** 2-6 metros

Junto a Sant Francesc, Cala Bona ofrece un paisaje submarino diferente. Las extensas praderas de posidonia que rodean la cala son el hogar de salpas, sepias y numerosas especies de peces.

**Qué verás:**
- Praderas de posidonia con salpas pastando
- Fredis y serranitos en las rocas del borde
- Posibles sepias camufladas en el fondo arenoso
- Nudibranquios en las rocas (busca bien, son pequeños pero muy coloridos)

**Consejo:** La mejor zona para snorkel está en el extremo sur de la cala, donde las rocas bajan en escalones hacia aguas más profundas.

### 3. Punta de Santa Anna -- Paredes rocosas

**Distancia desde el puerto:** 3,5 km (12 minutos en barco)
**Nivel:** Intermedio
**Profundidad:** 3-10 metros

Entre Blanes y Lloret, la Punta de Santa Anna ofrece fondos más profundos y espectaculares. Grandes bloques de roca sumergidos crean un paisaje submarino de cañones y pasadizos donde la vida marina es abundante.

**Qué verás:**
- Meros asomando desde sus cuevas (especialmente en verano)
- Morenas en las grietas de las rocas
- Bancos de sargos de gran tamaño
- Gorgonias rojas en las paredes verticales (a partir de 5-6 metros)

**Consejo:** Fondea el barco sobre arena cerca de las rocas. El [Astec 480](/barco/astec-480) tiene capacidad y estabilidad de sobra para una jornada de snorkel con todo el equipo.

### 4. Sa Caleta -- La joya escondida

**Distancia desde el puerto:** 5 km (18 minutos en barco)
**Nivel:** Intermedio
**Profundidad:** 2-8 metros

Sa Caleta es una pequeña calita rocosa entre Blanes y Lloret que la mayoría de bañistas no conoce porque el acceso por tierra es complicado. En barco, llegas en minutos y tienes el lugar prácticamente para ti solo.

**Qué verás:**
- Aguas de una claridad excepcional (a menudo la mejor visibilidad de la zona)
- Fondos rocosos con cuevas y grietas llenas de vida
- Pulpos (busca los montoncitos de conchas frente a las grietas)
- Erizos de mar en las rocas superficiales

**Consejo:** Llega temprano por la mañana para tener la cala para ti. Fondea con cuidado: hay rocas sumergidas.

### 5. Cala Canyelles -- La expedición

**Distancia desde el puerto:** 8 km (25 minutos en barco)
**Nivel:** Intermedio-Avanzado
**Profundidad:** 3-12 metros

Canyelles es el punto de snorkel más lejano accesible cómodamente desde Blanes en un día completo de navegación. Los fondos aquí son de los más ricos de la zona, con grandes formaciones rocosas cubiertas de vida.

**Qué verás:**
- Gorgonias rojas y amarillas en las paredes
- Langostas en las cuevas (con suerte)
- Meros y dentones de buen tamaño
- Bancos de barracudas mediterráneas (inofensivas)
- El fondo marino más diverso de la zona

**Consejo:** Reserva un día completo (8 horas) con el [Remus 450](/barco/remus-450) o el [Astec 480](/barco/astec-480) para llegar hasta Canyelles con tiempo de sobra para disfrutar.

### 6. Ses Torretes (Lloret de Mar) -- Cuevas y arcos

**Distancia desde el puerto:** 7 km (22 minutos en barco)
**Nivel:** Intermedio
**Profundidad:** 2-8 metros

Cerca de la playa de Fenals en Lloret, la zona de Ses Torretes ofrece formaciones rocosas espectaculares con arcos y pequeñas cuevas accesibles haciendo snorkel.

**Qué verás:**
- Arcos rocosos submarinos que puedes atravesar nadando
- Cuevas pequeñas con luz filtrada (espectacular para fotos)
- Bancos de castañuelas formando nubes oscuras
- Estrellas y erizos de mar en abundancia

## Cuevas submarinas accesibles desde el barco

La costa entre Blanes y Tossa de Mar tiene varias cuevas submarinas que son accesibles haciendo snorkel desde el barco:

### Cueva de Cala Bona

Una pequeña cueva en la pared rocosa del lateral sur de Cala Bona. Se puede entrar nadando en la superficie. El interior tiene una pequeña playa de cantos rodados y la luz que entra por la boca crea reflejos azulados en las paredes.

### Cuevas de la Punta de Santa Anna

Varias grietas y cavidades en la base de los acantilados. No son cuevas profundas pero sí lo suficiente para sentir la emoción de explorar el interior. La fauna marina se concentra en las entradas.

### Cueva de la Virgen (cerca de Lloret)

La más conocida de la zona. Una cueva de buen tamaño accesible nadando. En su interior, la luz filtrada crea un ambiente mágico. Es una parada obligada si navegas hasta Lloret.

## Equipamiento recomendado

### Para snorkel básico

- **Gafas de snorkel + tubo:** Disponibles para [alquilar con nosotros](/barcos) por 7,50 EUR. Si prefieres traer las tuyas, asegúrate de que las gafas sean de cristal templado y que el tubo tenga válvula de purga.
- **Aletas cortas:** No son imprescindibles pero marcan una gran diferencia. Te permiten desplazarte sin esfuerzo y explorar zonas más amplias.
- **Camiseta UV o de neopreno fino:** Protege del sol, del frío y de posibles rozaduras con las rocas.

### Para snorkel avanzado

- **Gafas de buceo de volumen bajo:** Permiten compensar mejor si haces apnea.
- **Aletas largas de pala flexible:** Para apneístas que quieran bajar a fondos más profundos.
- **Boya de señalización:** Obligatoria si te alejas del barco. Señala tu posición a otras embarcaciones.
- **Cámara acuática:** Las GoPro o similares son perfectas para documentar tus inmersiones.

## Buceo con botella desde el barco

Aunque nuestros barcos están diseñados para navegación recreativa, si eres buceador titulado puedes llevar tu propio equipo de buceo a bordo. Algunos puntos accesibles desde Blanes son excepcionales para el buceo:

- **Punta de Santa Anna:** Paredes verticales hasta 20 metros con gorgonias y meros.
- **Cala Canyelles:** Fondos variados hasta 25 metros con gran biodiversidad.
- **Lloret Norte:** Bloques rocosos con cuevas y túneles.

**Importante:** Si planeas bucear desde el barco, infórmanos al hacer la reserva. Te daremos indicaciones específicas sobre dónde fondear y las particularidades de cada zona. Recuerda que el buceo con botella requiere titulación y no está incluido en nuestros servicios.

## Ruta de snorkel recomendada (día completo)

Si reservas un día completo y quieres maximizar tu experiencia de snorkel, te proponemos esta ruta:

1. **10:00** -- Salida del puerto de Blanes con el [Astec 480](/barco/astec-480) o el [Solar 450](/barco/solar-450)
2. **10:10** -- Primera parada: **Cala Sant Francesc**. Snorkel suave para calentar (45 min)
3. **11:15** -- Segunda parada: **Punta de Santa Anna**. Fondos más profundos y espectaculares (1 hora)
4. **12:30** -- Descanso y picnic a bordo fondeados en una cala tranquila
5. **13:30** -- Tercera parada: **Sa Caleta**. La joya escondida (45 min)
6. **14:45** -- Navegación hacia **Cala Canyelles** (si el tiempo lo permite)
7. **15:00** -- Cuarta parada: **Canyelles**. El mejor snorkel de la zona (1 hora)
8. **16:30** -- Regreso al puerto de Blanes con paradas opcionales
9. **17:30** -- Llegada al puerto

Esta ruta cubre unos 16 km de costa y ofrece una variedad increíble de paisajes submarinos.

## Consejos de seguridad para snorkel

- **Nunca hagas snorkel solo.** Siempre con al menos una persona más.
- **No te alejes demasiado del barco.** Las corrientes pueden sorprenderte.
- **Motor apagado y llave retirada** antes de que nadie entre al agua. Regla inquebrantable.
- **Vigila la fatiga.** El snorkel prolongado cansa más de lo que parece. Descansa entre sesiones.
- **Cuidado con las medusas.** Si ves medusas en el agua, no te metas. Pregúntanos antes de salir sobre la presencia de medusas en la zona.
- **Hidratación.** Bebe agua entre inmersiones. El sol y el ejercicio deshidratan rápidamente.

---

La Costa Brava bajo el agua es tan espectacular como sobre ella. Con un barco de alquiler y unas gafas de snorkel, tienes acceso a un mundo submarino que la mayoría de turistas nunca ve.

[Reserva tu barco de snorkel](/barcos) y no olvides pedir tu kit de snorkel al hacer la reserva. Las calas más bonitas y los fondos más ricos te esperan.`,
  },
  // ===== POST 13: Cuánto Cuesta Alquilar un Barco =====
  {
    title: "Cuánto Cuesta Alquilar un Barco en Blanes: Guía de Precios 2026",
    slug: "cuanto-cuesta-alquilar-barco-blanes-precios",
    category: "Consejos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Precios actualizados para alquilar barcos sin licencia en Blanes en 2026. Compara temporadas, barcos y qué incluye cada precio.",
    tags: ["precios alquiler barco", "barco sin licencia precio", "alquilar barco blanes", "cuanto cuesta barco", "tarifas barco costa brava", "precios barco 2026"],
    isPublished: true,
    _publishedAt: new Date("2026-04-01T10:00:00Z"),
    excerpt: "Te explicamos cuánto cuesta alquilar un barco sin licencia en Blanes en 2026. Precios por temporada, qué incluye y consejos para ahorrar en tu experiencia náutica.",
    content: `Una de las preguntas más frecuentes que recibimos es: **"Cuánto cuesta alquilar un barco en Blanes?"** La respuesta depende de varios factores: la temporada, el barco que elijas y la duración del alquiler. En esta guía te damos toda la información de precios para 2026 para que puedas planificar tu día de navegación sin sorpresas.

## Temporadas y precios: cómo funciona

En Costa Brava Rent a Boat trabajamos con **tres temporadas** que determinan los precios:

### Temporada baja (abril, mayo y octubre)

La temporada más económica. El tiempo ya es bueno para navegar, el mar está tranquilo y las calas están prácticamente vacías. Es la temporada favorita de muchos de nuestros clientes habituales.

**Ventajas:**
- Precios más bajos del año
- Calas sin masificación
- Temperaturas agradables (18-22 grados aire, 16-19 grados agua)
- Mayor disponibilidad de barcos

### Temporada media (junio y septiembre)

El equilibrio perfecto entre precio y condiciones. El agua ya está caliente para bañarse, los días son largos y los precios son razonables.

**Ventajas:**
- Buena relación calidad-precio
- Agua a 21-24 grados, perfecta para nadar
- Menos gente que en julio-agosto
- Días largos con más horas de luz

### Temporada alta (julio y agosto)

Los meses de mayor demanda. El agua está en su mejor temperatura (24-26 grados), los días son largos y el ambiente estival es inmejorable. Los precios son más altos y la disponibilidad es limitada, por lo que recomendamos reservar con antelación.

**Ventajas:**
- Agua a temperatura perfecta
- Días muy largos (hasta las 21:00 con luz)
- Ambiente festivo en la costa

## Precios por barco y temporada (2026)

A continuación te mostramos los precios orientativos para cada barco de nuestra flota. Todos los precios incluyen **gasolina, chalecos salvavidas, seguro y briefing de seguridad**.

### Alquiler de medio día (4 horas)

| Barco | Personas | T. Baja | T. Media | T. Alta |
|-------|----------|---------|----------|---------|
| [Astec 400](/barco/astec-400) | Hasta 4 | Desde 90 EUR | Desde 120 EUR | Desde 160 EUR |
| [Solar 450](/barco/solar-450) | Hasta 5 | Desde 100 EUR | Desde 140 EUR | Desde 180 EUR |
| [Remus 450](/barco/remus-450) | Hasta 5 | Desde 100 EUR | Desde 140 EUR | Desde 180 EUR |
| [Astec 480](/barco/astec-480) | Hasta 6 | Desde 110 EUR | Desde 150 EUR | Desde 200 EUR |
| [Remus 450 II](/barco/remus-450-ii) | Hasta 5 | Desde 120 EUR | Desde 160 EUR | Desde 210 EUR |

### Alquiler de día completo (8 horas)

| Barco | Personas | T. Baja | T. Media | T. Alta |
|-------|----------|---------|----------|---------|
| [Astec 400](/barco/astec-400) | Hasta 4 | Desde 130 EUR | Desde 180 EUR | Desde 250 EUR |
| [Solar 450](/barco/solar-450) | Hasta 5 | Desde 150 EUR | Desde 200 EUR | Desde 270 EUR |
| [Remus 450](/barco/remus-450) | Hasta 5 | Desde 150 EUR | Desde 200 EUR | Desde 270 EUR |
| [Astec 480](/barco/astec-480) | Hasta 6 | Desde 170 EUR | Desde 220 EUR | Desde 295 EUR |
| [Remus 450 II](/barco/remus-450-ii) | Hasta 5 | Desde 180 EUR | Desde 230 EUR | Desde 300 EUR |

**Nota:** Los precios son orientativos y pueden variar. Consulta los [precios exactos y disponibilidad en tiempo real](/barcos) en nuestra web.

## Qué incluye el precio

Todos nuestros alquileres incluyen, sin coste adicional:

- **Gasolina:** El depósito va lleno y no tienes que preocuparte del combustible. Está incluido en el precio.
- **Chalecos salvavidas:** Para todos los pasajeros, incluidos niños. Homologados y en perfecto estado.
- **Seguro de responsabilidad civil:** Cobertura obligatoria para la navegación.
- **Briefing de seguridad:** Antes de salir, nuestro equipo te explica el manejo del barco, la seguridad y la zona de navegación. Dura unos 15 minutos.
- **Ancla y equipo de fondeo:** Para que puedas anclar en las calas.
- **Escalera de baño:** Para entrar y salir del agua cómodamente.
- **Soporte para teléfono:** Disponible en el puesto de mando.

### Extras opcionales

Además del alquiler básico, puedes contratar extras para mejorar tu experiencia:

- **Kit de snorkel** (gafas + tubo): 7,50 EUR por persona
- **Altavoz Bluetooth resistente al agua:** Para poner música a bordo
- **Toldo de sol:** Muy recomendable en julio y agosto para protegerse del sol
- **Nevera portátil:** Para llevar bebidas y comida fría

Los extras se seleccionan durante el proceso de reserva online.

## Fianza

Al recoger el barco, se requiere una **fianza** que se devuelve íntegramente al finalizar el alquiler, siempre que el barco se devuelva en las mismas condiciones. La fianza se puede pagar en efectivo o con tarjeta.

La fianza cubre posibles daños al barco o pérdida del equipamiento. En la gran mayoría de los casos, se devuelve completa al regresar al puerto.

## Cómo ahorrar en tu alquiler de barco

### 1. Ven en temporada baja o media

La diferencia de precio entre temporada baja y alta puede ser de un **40-50%**. Si tus fechas son flexibles, abril, mayo, junio, septiembre y octubre ofrecen precios significativamente más bajos con excelentes condiciones de navegación.

### 2. Reserva con antelación

Reservar con varias semanas de antelación te asegura la disponibilidad del barco que prefieres y en el horario que más te conviene. En temporada alta, los barcos se agotan con rapidez, especialmente los fines de semana.

### 3. Aprovecha el medio día

Si es tu primera vez o no estás seguro de cuántas horas quieres navegar, el alquiler de medio día (4 horas) es una opción excelente. Te da tiempo suficiente para visitar 2-3 calas, bañarte y disfrutar de la experiencia a un precio más ajustado.

### 4. Divide el coste entre el grupo

El precio del barco es por embarcación, no por persona. Un barco como el [Astec 480](/barco/astec-480) para 5 personas en temporada baja puede salir a menos de **22 EUR por persona** para un día completo. Difícilmente encontrarás una actividad con mejor relación calidad-precio en la Costa Brava.

### 5. Elige el barco adecuado

No necesitas el barco más grande o más caro si sois pocos. Para una pareja, el [Astec 400](/barco/astec-400) es perfecto y es la opción más económica. Para un grupo de 4-5 personas, el [Astec 480](/barco/astec-480) ofrece la mejor relación espacio-precio.

## Comparativa: alquiler de barco vs. otras actividades

Para poner los precios en perspectiva, compara el coste de alquilar un barco con otras actividades turísticas en la Costa Brava:

| Actividad | Precio aprox. por persona | Duración |
|-----------|--------------------------|----------|
| **Alquiler barco sin licencia** (6 pers.) | **Desde 22 EUR** | 4-8 horas |
| Excursión en barco turístico | 25-40 EUR | 1-2 horas |
| Kayak guiado | 30-50 EUR | 2-3 horas |
| Paddle surf alquiler | 15-25 EUR | 1 hora |
| Parasailing | 40-60 EUR | 15 minutos |
| Jet ski | 80-120 EUR | 30 minutos |

Como ves, el alquiler de barco sin licencia es una de las actividades con mejor relación calidad-precio de la Costa Brava, especialmente cuando se divide entre varias personas.

## Proceso de reserva y pago

### Cómo reservar

1. **Entra en nuestra web** y selecciona tu [barco preferido](/barcos)
2. **Elige la fecha y el horario** (mañana, tarde o día completo)
3. **Selecciona los extras** que quieras (snorkel, toldo, altavoz...)
4. **Completa la reserva** con pago online seguro

El pago se realiza de forma segura mediante Stripe. Aceptamos todas las tarjetas de crédito y débito.

### Política de cancelación

Entendemos que los planes pueden cambiar. Nuestra política de cancelación es flexible:

- **Cancelación por mal tiempo:** Si las condiciones meteorológicas no permiten navegar, te ofrecemos cambio de fecha sin coste o reembolso completo.
- **Cancelación con antelación:** Consulta las condiciones específicas al hacer la reserva.

### El día del alquiler

1. **Llega al puerto de Blanes** 15 minutos antes de tu hora reservada
2. **Nuestro equipo te recibirá** y te dará el briefing de seguridad
3. **Paga la fianza** (se devuelve al final)
4. **Navega y disfruta** durante las horas contratadas
5. **Regresa al puerto** a la hora acordada
6. **Se devuelve la fianza** tras comprobar el estado del barco

## Preguntas frecuentes sobre precios

**¿La gasolina está incluida?**
Sí, siempre. El depósito va lleno y no pagas nada extra por combustible.

**¿Hay costes ocultos?**
No. El precio que ves en la web es lo que pagas, más la fianza (que se devuelve) y los extras que elijas.

**¿Puedo pagar en efectivo?**
La reserva se paga online con tarjeta. La fianza se puede pagar en efectivo o con tarjeta.

**¿Hay descuento para residentes?**
Consulta con nosotros directamente. Ofrecemos condiciones especiales para clientes habituales y residentes de la zona.

---

Alquilar un barco sin licencia en Blanes es más asequible de lo que imaginas. Desde 90 EUR para un grupo, tienes acceso a las calas más bonitas de la Costa Brava, con gasolina y seguridad incluidas.

[Consulta precios y disponibilidad](/barcos) en tiempo real y reserva tu día perfecto en el mar.`,
  },
  // ===== POST 14: Comparativa de Barcos =====
  {
    title: "Comparativa de Barcos sin Licencia en Blanes: Cuál Elegir",
    slug: "comparativa-barcos-sin-licencia-blanes",
    category: "Consejos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Compara todos los barcos sin licencia disponibles en Blanes. Astec 400, Astec 480, Remus 450, Solar 450 y Remus 450 II frente a frente.",
    tags: ["barcos sin licencia blanes", "comparativa barcos", "mejor barco alquiler", "astec 480", "remus 450", "solar 450", "remus 450 ii"],
    isPublished: true,
    _publishedAt: new Date("2026-04-04T10:00:00Z"),
    excerpt: "No sabes qué barco elegir? Comparamos todos los barcos sin licencia de nuestra flota en Blanes: Astec 400, Astec 480, Remus 450, Solar 450 y Remus 450 II. Encuentra el tuyo.",
    content: `Elegir el barco adecuado puede marcar la diferencia entre un buen día y un día perfecto en el mar. En Costa Brava Rent a Boat disponemos de 5 modelos de barcos sin licencia, cada uno con características distintas pensadas para diferentes tipos de navegantes y grupos.

En esta guía comparamos todos nuestros barcos para que elijas el que mejor se adapta a tus necesidades: ya seas una pareja buscando intimidad, una familia con niños o un grupo de amigos que quiere vivir una aventura.

## Tabla comparativa general

| Característica | [Astec 400](/barco/astec-400) | [Astec 480](/barco/astec-480) | [Remus 450](/barco/remus-450) | [Solar 450](/barco/solar-450) | [Remus 450 II](/barco/remus-450-ii) |
|---------------|------------|------------|-------------|-------------|-----------|
| **Eslora** | 4,00 m | 4,80 m | 4,50 m | 4,50 m | 4,25 m |
| **Capacidad** | 4 personas | 5 personas | 5 personas | 5 personas | 5 personas |
| **Motor** | 15 CV | 15 CV | 15 CV | 15 CV | 15 CV |
| **Ideal para** | Parejas | Familias/Grupos | Grupos medianos | Confort | Aventureros |
| **Estabilidad** | Buena | Excelente | Muy buena | Muy buena | Buena |
| **Espacio** | Compacto | Amplio | Medio | Medio | Medio |

## Astec 400: El compacto para parejas

El [Astec 400](/barco/astec-400) es nuestra embarcación más compacta y la opción más económica de la flota. Con sus 4 metros de eslora, es ágil, fácil de manejar y perfecto para quienes buscan una experiencia íntima en el mar.

### Puntos fuertes

- **El más económico:** Los precios más bajos de toda nuestra flota, ideal para presupuestos ajustados.
- **Muy maniobrable:** Su tamaño compacto lo hace extremadamente fácil de manejar, perfecto para principiantes absolutos.
- **Ideal para calas pequeñas:** Puede acceder a rincones donde embarcaciones más grandes no caben.
- **Consumo reducido:** Al ser más ligero, el consumo de combustible es menor.

### Para quién es

- **Parejas** que buscan un día romántico en el mar
- **Principiantes absolutos** que quieren un barco sencillo y sin complicaciones
- **Presupuesto ajustado** sin renunciar a la experiencia completa

### Limitaciones

- Capacidad máxima de 4 personas (3 es lo ideal para comodidad)
- Menos espacio para almacenar bolsas, neveras y equipo
- Puede resultar justo para familias con niños

## Astec 480: El favorito de las familias

El [Astec 480](/barco/astec-480) es, con diferencia, nuestro barco más demandado. Con 4,80 metros es la embarcación más grande de la flota, y su eslora extra se nota en estabilidad, espacio y confort.

### Puntos fuertes

- **El más estable:** Su casco ancho y su eslora de 4,80 metros le dan una estabilidad excelente, incluso con algo de oleaje. Los pasajeros se sienten seguros.
- **Mayor capacidad:** Hasta 5 personas pueden navegar cómodamente. Es el barco sin licencia más espacioso de la flota.
- **Espacio de sobra:** Hay sitio para mochilas, nevera, equipo de snorkel y todo lo que necesites.
- **Escalera de baño amplia:** Entrar y salir del agua es cómodo incluso para niños.

### Para quién es

- **Familias con niños:** La estabilidad y el espacio lo hacen ideal para navegar con los más pequeños
- **Grupos de 4-5 personas:** El barco sin licencia donde 5 personas van realmente cómodas
- **Día completo de navegación:** Su espacio permite pasar 8 horas a bordo sin agobios

### Limitaciones

- Al ser más grande, es ligeramente menos ágil en maniobras que los modelos más pequeños
- Mayor demanda, especialmente en temporada alta. Conviene reservar con antelación

## Remus 450: El polivalente

El [Remus 450](/barco/remus-450) es un barco equilibrado que ofrece un buen compromiso entre espacio, maniobrabilidad y precio. Es la opción polivalente por excelencia.

### Puntos fuertes

- **Equilibrio perfecto:** 4,50 metros de eslora ofrecen un buen espacio sin perder agilidad.
- **Diseño funcional:** La distribución del espacio a bordo está bien pensada para aprovecharlo al máximo.
- **Buena estabilidad:** El casco ofrece una navegación suave y estable.
- **Precio intermedio:** Se sitúa en la franja media de precios con una excelente relación calidad-precio.

### Para quién es

- **Grupos de 3-4 personas** que quieren comodidad sin pagar por un barco grande
- **Familias con 1-2 niños** que buscan un buen espacio a precio razonable
- **Navegantes que buscan el mejor equilibrio** entre todas las características

### Limitaciones

- Con 5 personas al máximo de capacidad, el espacio es justo
- No tiene la amplitud del Astec 480 para grupos grandes

## Solar 450: El cómodo

El [Solar 450](/barco/solar-450) destaca por su diseño orientado al confort. Es un barco pensado para quienes valoran la comodidad y la experiencia de navegación por encima de todo.

### Puntos fuertes

- **Asientos ergonómicos:** La posición de los asientos está pensada para largas horas de navegación sin cansancio.
- **Diseño moderno:** Líneas modernas y estilizadas que lo hacen visualmente atractivo.
- **Navegación suave:** Su diseño de casco proporciona una navegación cómoda incluso con algo de oleaje.
- **Equipamiento completo:** Bien equipado de serie con todo lo necesario.

### Para quién es

- **Parejas y grupos pequeños** que priorizan el confort
- **Navegantes que valoran el diseño** y la experiencia a bordo
- **Jornadas largas** donde la comodidad de los asientos importa

### Limitaciones

- Similar en dimensiones al Remus 450, no ofrece más espacio
- Precio ligeramente superior al Remus por su mayor equipamiento

## Remus 450 II: El deportivo

El [Remus 450 II](/barco/remus-450-ii) es el barco con carácter más deportivo de nuestra flota. Su diseño ofrece sensaciones de navegación más dinámicas.

### Puntos fuertes

- **Sensación deportiva:** Su diseño de casco transmite mayor dinamismo en la navegación.
- **Aspecto atractivo:** Líneas estilizadas y un look moderno que destaca en las calas.
- **Buenas prestaciones:** Respuesta ágil a la caña del timón.
- **Bien equipado:** Incluye todo el equipamiento necesario para una jornada completa.

### Para quién es

- **Grupos de amigos** que buscan una experiencia más dinámica
- **Jóvenes y parejas** que valoran el diseño deportivo
- **Quienes ya tienen experiencia** y buscan sensaciones diferentes

### Limitaciones

- Puede ser algo menos estable que el Astec 480 en mar con oleaje
- No es la mejor opción para familias con niños pequeños que priorizan estabilidad

## Guía rápida: qué barco elegir según tu situación

### Sois una pareja
**Recomendación:** [Astec 400](/barco/astec-400)
Es el más económico y su tamaño compacto es perfecto para dos personas. Tendréis intimidad y espacio de sobra. Si queréis más confort, el [Solar 450](/barco/solar-450) es un paso arriba.

### Sois una familia con niños pequeños (3-8 años)
**Recomendación:** [Astec 480](/barco/astec-480)
Sin duda. Su estabilidad y espacio son ideales para navegar con niños. Los pequeños pueden moverse a bordo con seguridad y hay sitio para todo el equipamiento familiar.

### Sois una familia con niños mayores (9-16 años)
**Recomendación:** [Astec 480](/barco/astec-480) o [Remus 450](/barco/remus-450)
Depende del número de personas. Si sois 5-6, el Astec 480 es la opción. Si sois 4, el Remus 450 ofrece un buen espacio a mejor precio.

### Sois un grupo de amigos (3-4 personas)
**Recomendación:** [Remus 450 II](/barco/remus-450-ii) o [Solar 450](/barco/solar-450)
El Remus 450 II para quienes buscan dinamismo, el Solar 450 para quienes priorizan comodidad.

### Sois un grupo grande (4-5 personas)
**Recomendación:** [Astec 480](/barco/astec-480)
Es el barco sin licencia más espacioso, con capacidad para 5 personas. Para 4 personas con mucho equipaje, también es la mejor opción.

### Es tu primera vez en un barco
**Recomendación:** [Astec 400](/barco/astec-400) o [Astec 480](/barco/astec-480)
El Astec 400 por su sencillez y maniobrabilidad. El Astec 480 por su estabilidad que transmite seguridad. Ambos son perfectos para principiantes.

### Quieres el mejor barco posible (sin importar precio)
**Recomendación:** [Astec 480](/barco/astec-480)
El más grande, el más estable, el más espacioso. Es nuestro barco insignia por algo.

## Extras disponibles para todos los barcos

Independientemente del barco que elijas, puedes contratar los mismos extras:

- **Kit de snorkel** (gafas + tubo): 7,50 EUR/persona
- **Altavoz Bluetooth resistente al agua**
- **Toldo de sol** (muy recomendable en julio-agosto)
- **Nevera portátil**

Los extras se seleccionan durante el proceso de reserva.

## Disponibilidad y reservas

Todos nuestros barcos están disponibles de **abril a octubre**. En temporada alta (julio-agosto), los barcos se agotan con rapidez, especialmente los fines de semana. Recomendamos reservar con la mayor antelación posible.

Consulta la [disponibilidad en tiempo real de todos nuestros barcos](/barcos) y reserva directamente online.

---

Cada barco de nuestra flota tiene su personalidad y sus puntos fuertes. Lo importante es elegir el que se adapte a tu grupo, tu experiencia y tus expectativas. Y si tienes dudas, escríbenos por [WhatsApp](https://wa.me/34611500372) y te ayudaremos a decidir.

[Ver todos los barcos](/barcos) y reservar online.`,
  },
  // ===== POST 15: Costa Brava en Septiembre =====
  {
    title: "Costa Brava en Septiembre: Por Qué Es el Mejor Mes para Navegar",
    slug: "costa-brava-septiembre-mejor-mes-navegar",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/calas-costa-brava.jpg",
    metaDescription: "Septiembre es el mejor mes para navegar en la Costa Brava. Menos gente, agua caliente, precios bajos y luz perfecta. Te contamos por qué.",
    tags: ["costa brava septiembre", "navegar septiembre", "mejor epoca costa brava", "temporada baja costa brava", "vacaciones septiembre", "barco septiembre"],
    isPublished: true,
    _publishedAt: new Date("2026-04-07T10:00:00Z"),
    excerpt: "Septiembre es, para muchos, el mejor mes para navegar en la Costa Brava. Agua caliente, calas vacías, precios de temporada media y una luz perfecta. Te contamos por qué.",
    content: `Si pudiéramos elegir un solo mes para navegar en la Costa Brava, elegiríamos septiembre sin dudarlo. Y no somos los únicos: muchos de nuestros clientes habituales reservan año tras año sus escapadas en barco en septiembre, cuando el Mediterráneo ofrece las mejores condiciones del año y las multitudes de agosto han desaparecido.

En esta guía te explicamos por qué septiembre es el mes dorado de la navegación en la Costa Brava y cómo aprovechar al máximo tu experiencia.

## La temperatura del agua: el gran secreto de septiembre

Este es el dato que sorprende a la mayoría de visitantes: **el agua en septiembre está más caliente que en julio**. Parece contradictorio, pero tiene una explicación sencilla.

El mar Mediterráneo acumula calor durante todo el verano. Julio empieza con aguas a unos 21-22 grados, agosto las sube a 24-25 grados, y septiembre las mantiene entre **23 y 25 grados**, a veces incluso más. El mar tarda mucho más en enfriarse que el aire, así que cuando llega septiembre, la costa lleva acumulando calor cuatro meses.

**Resultado:** En septiembre te bañas en agua tibia, cálida y absolutamente deliciosa. Sin el shock de frío que a veces se siente a principios de verano.

### Temperatura media por mes

| Mes | Agua (media) | Aire (media) | Horas de sol/día |
|-----|-------------|-------------|-----------------|
| Junio | 21-23 C | 24-27 C | 14-15 h |
| Julio | 23-25 C | 27-30 C | 14-15 h |
| Agosto | 24-26 C | 27-30 C | 13-14 h |
| **Septiembre** | **23-25 C** | **24-27 C** | **12-13 h** |
| Octubre | 20-22 C | 20-23 C | 10-11 h |

## Calas vacías: el lujo de la tranquilidad

La diferencia entre agosto y septiembre en las calas de la Costa Brava es espectacular. En agosto, las calas más populares como Cala Sant Francesc pueden tener decenas de barcos fondeados. En septiembre, muchas veces estarás solo o con un par de barcos más.

### La experiencia cambia radicalmente

- **Fondeado en solitario:** En septiembre es habitual llegar a calas como Cala Bona o Sa Caleta y no encontrar a nadie. La cala es toda tuya.
- **Snorkel sin aglomeraciones:** La fauna marina está más tranquila cuando hay menos gente. Los peces se acercan más y la visibilidad del agua es mejor.
- **Silencio y naturaleza:** Sin el ruido de motores y música que caracteriza agosto, escuchas el mar, las gaviotas y el viento en los pinos.
- **Más espacio para fondear:** Puedes elegir el mejor punto de fondeo sin tener que competir con otros barcos.

### Ventaja extra: mejores fotos

La luz de septiembre es especial. El sol está más bajo que en pleno verano, creando una luz más cálida y dorada. Las fotos que hagas en septiembre desde el barco serán, casi con seguridad, las más bonitas de todo el año.

## Precios de temporada media

Septiembre es **temporada media** en Costa Brava Rent a Boat, lo que significa precios significativamente más bajos que en julio y agosto:

- Un día completo en el [Astec 480](/barco/astec-480) que en agosto cuesta desde 295 EUR, en septiembre baja a desde 220 EUR
- Un medio día en el [Astec 400](/barco/astec-400) pasa de 160 EUR en temporada alta a 120 EUR en septiembre
- Los extras mantienen el mismo precio todo el año

**Ahorro aproximado: un 25-30% respecto a temporada alta.**

Y no solo ahorras en el barco. Los hoteles, restaurantes y otras actividades en la Costa Brava también bajan precios en septiembre, haciendo que toda la escapada sea más económica.

## Condiciones de navegación en septiembre

### El mar Mediterráneo en otoño

El Mediterráneo en septiembre suele estar tranquilo y agradable. Los episodios de tramontana (viento del norte) son menos frecuentes que en invierno y la mar de fondo es rara. Sin embargo, septiembre puede traer algún episodio de **gota fría** o lluvias tormentosas, especialmente en la segunda quincena.

**Nuestra recomendación:** La **primera quincena de septiembre** es la más estable meteorológicamente. La segunda quincena sigue siendo excelente, pero conviene estar atento a las previsiones.

### Horarios de luz

En septiembre los días son más cortos que en julio, pero siguen siendo largos:

- **1 de septiembre:** Amanecer 7:15 / Anochecer 20:30 (13 horas de luz)
- **15 de septiembre:** Amanecer 7:30 / Anochecer 20:00 (12,5 horas de luz)
- **30 de septiembre:** Amanecer 7:45 / Anochecer 19:30 (11,75 horas de luz)

Tienes de sobra para un día completo de navegación de 8 horas con luz natural abundante.

## Rutas recomendadas para septiembre

### Ruta 1: Las calas secretas (medio día)

Aprovechando que las calas están vacías, esta ruta te lleva a los rincones más tranquilos:

1. **Puerto de Blanes** -- Salida
2. **Cala Bona** (7 min) -- Primera parada. En septiembre suele estar desierta.
3. **Sa Caleta** (15 min más) -- La joya escondida entre Blanes y Lloret. Aguas cristalinas.
4. **Rocas de Santa Anna** (5 min) -- Snorkel espectacular en los bloques sumergidos.
5. **Regreso al puerto**

**Duración:** 4 horas
**Barco recomendado:** [Remus 450](/barco/remus-450) o [Solar 450](/barco/solar-450)

### Ruta 2: La gran travesía hasta Tossa (día completo)

En septiembre, con el mar calmado, es el momento perfecto para la ruta larga hasta Tossa de Mar:

1. **Puerto de Blanes** -- Salida
2. **Cala Sant Francesc** (5 min) -- Primer baño para empezar el día
3. **Fenals** (20 min) -- Parada rápida frente a la playa de Fenals en Lloret
4. **Cala Canyelles** (10 min más) -- Snorkel en uno de los mejores fondos de la zona
5. **Cala Giverola** (15 min más) -- La cala más bonita de la ruta, rodeada de pinos
6. **Regreso con paradas libres**

**Duración:** 8 horas
**Barco recomendado:** [Astec 480](/barco/astec-480)

### Ruta 3: Atardecer en el mar (tarde)

La luz de septiembre por la tarde es mágica. Una salida de 16:00 a 20:00 te permite navegar con la luz dorada del atardecer:

1. **Puerto de Blanes** -- Salida a las 16:00
2. **Navegación tranquila hacia el norte**
3. **Fondeo en Cala Sant Francesc** -- Baño con la luz de la tarde
4. **Navegación frente a los acantilados** -- Disfrutar del atardecer desde el mar
5. **Regreso al puerto** con el sol cayendo sobre Blanes

**Duración:** 4 horas
**Barco recomendado:** Cualquier barco de la [flota](/barcos)

## Septiembre para familias

Septiembre es particularmente bueno para familias con niños por varias razones:

- **Agua caliente y segura:** Los niños se bañan sin tiritar
- **Menos barcos:** Menor riesgo de aglomeraciones y más tranquilidad para navegar con pequeños
- **Precios más bajos:** Más asequible para presupuestos familiares
- **Temperaturas agradables:** Ni el calor extremo de agosto ni las quemaduras solares tan intensas
- **Primer fin de semana de septiembre:** Muchas familias aprovechan el último finde antes de la vuelta al cole

## Actividades complementarias en septiembre

Septiembre en la Costa Brava no es solo navegar. Es un mes perfecto para combinar el barco con otras actividades:

- **Senderismo por el Camí de Ronda:** Las temperaturas moderadas de septiembre hacen que caminar por la costa sea un placer. El tramo Blanes-Lloret es espectacular.
- **Visita al Jardín Botánico Marimurtra:** Menos turistas y una luz preciosa entre las plantas.
- **Gastronomía:** Los restaurantes de Blanes están menos abarrotados y puedes conseguir mesa sin reservar con tanta antelación.
- **Festival de la Gamba de Blanes:** Algunos años coincide con septiembre. Consulta las fechas.

## Qué llevar para navegar en septiembre

El equipamiento es similar al de verano, pero con algunos matices:

- **Ropa de baño y toallas:** El agua está caliente, bañarse es obligatorio
- **Camiseta ligera o cortavientos fino:** La brisa de la tarde puede ser fresca
- **Crema solar:** El sol de septiembre engaña. Sigue siendo fuerte.
- **Gorra:** Imprescindible
- **Una capa extra:** Para el regreso al atardecer, la temperatura baja rápido

## Disponibilidad en septiembre

La buena noticia es que en septiembre la disponibilidad de barcos es mucho mayor que en temporada alta. Aun así, los fines de semana se llenan con rapidez, especialmente el primer y segundo fin de semana del mes.

**Nuestra recomendación:** Si puedes, ven entre semana. Tendrás la costa prácticamente para ti solo, con total disponibilidad de barcos y los precios más bajos.

---

Septiembre es el secreto mejor guardado de la Costa Brava. Agua caliente, calas vacías, precios moderados y una luz que convierte cada momento en una postal. Si buscas la experiencia de navegación perfecta, septiembre es tu mes.

[Reserva tu barco para septiembre](/barcos) antes de que los mejores días se llenen. Tu futuro yo te lo agradecerá.`,
  },
  // ===== POST 16: Preguntas Frecuentes =====
  {
    title: "10 Preguntas Frecuentes sobre Alquilar un Barco sin Licencia",
    slug: "preguntas-frecuentes-alquiler-barco-sin-licencia",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Resolvemos las 10 preguntas más frecuentes sobre alquilar un barco sin licencia en Blanes. Todo lo que necesitas saber antes de reservar.",
    tags: ["preguntas frecuentes barco", "barco sin licencia FAQ", "alquilar barco dudas", "primera vez barco", "barco sin experiencia", "barco sin carnet"],
    isPublished: true,
    _publishedAt: new Date("2026-04-10T10:00:00Z"),
    excerpt: "Resolvemos las dudas más comunes sobre alquilar un barco sin licencia en Blanes: experiencia necesaria, precios, seguridad, capacidad y todo lo que necesitas saber.",
    content: `Alquilar un barco sin licencia es una experiencia cada vez más popular en la Costa Brava, pero es normal tener dudas antes de la primera vez. En este artículo respondemos las 10 preguntas que más nos hacen nuestros clientes para que reserves con total tranquilidad.

## ¿Necesito licencia o carnet de navegación para alquilar un barco?

**No, no necesitas ninguna licencia ni titulación náutica.** En España, la normativa permite pilotar embarcaciones de hasta 5 metros de eslora y 15 CV de potencia sin necesidad de ningún título. Todos nuestros barcos cumplen estas características.

Lo único que necesitas es:
- Ser **mayor de 18 años** para ser el patrón (quien conduce el barco)
- Un **documento de identidad** válido (DNI, pasaporte o documento europeo)
- Ganas de disfrutar del mar

No importa si nunca has estado en un barco. Antes de cada salida, nuestro equipo te da un **briefing completo de 15 minutos** donde te explican el manejo del barco, las normas de seguridad y la zona de navegación. Cuando termines el briefing, estarás perfectamente preparado para navegar.

## ¿Necesito experiencia previa para manejar el barco?

**No, no necesitas ninguna experiencia previa.** La gran mayoría de nuestros clientes son personas que nunca han pilotado un barco. Nuestros barcos están diseñados específicamente para ser **fáciles e intuitivos**: tienen un timón tipo caña que funciona como el manillar de una moto, un acelerador sencillo y marcha adelante y atrás.

El briefing que te damos antes de salir cubre todo lo que necesitas saber:

- **Arrancar y apagar el motor:** Tan sencillo como girar una llave
- **Acelerar y frenar:** Un solo mando con posiciones claras
- **Girar:** Mueves la caña del timón a izquierda o derecha
- **Fondear (anclar):** Te enseñamos paso a paso cómo soltar y recoger el ancla
- **Normas de seguridad:** Distancias, velocidades y qué hacer en caso de cualquier incidencia

Después de las primeras 5 minutos navegando, la inmensa mayoría de nuestros clientes se sienten completamente cómodos y seguros. Es mucho más fácil de lo que parece.

## ¿Cuántas personas caben en un barco?

La capacidad depende del modelo de barco que elijas:

| Barco | Capacidad máxima | Ideal para |
|-------|-----------------|------------|
| [Astec 400](/barco/astec-400) | 4 personas | Parejas o grupos pequeños |
| [Solar 450](/barco/solar-450) | 5 personas | Familias o grupos medianos |
| [Remus 450](/barco/remus-450) | 5 personas | Familias o grupos medianos |
| [Remus 450 II](/barco/remus-450-ii) | 5 personas | Grupos de amigos |
| [Astec 480](/barco/astec-480) | 5 personas | Familias o grupos |

La capacidad máxima incluye adultos y niños, incluidos bebés. Nuestra recomendación es que, para mayor comodidad, navegues con **una persona menos** de la capacidad máxima. Por ejemplo, en un barco de 5 plazas, 4 personas irán muy cómodas.

Para grupos mayores de 5 personas, la opción es alquilar dos barcos y navegar juntos. Es una experiencia muy divertida y permite mantener contacto visual entre los dos barcos.

## ¿Qué incluye el precio del alquiler?

Nuestros precios incluyen **todo lo necesario** para navegar:

- **Gasolina:** El depósito va lleno. No pagas nada extra por combustible, da igual cuánto navegues.
- **Chalecos salvavidas:** Para todos los pasajeros, incluidas tallas infantiles. Homologados y en perfecto estado.
- **Seguro de responsabilidad civil:** La cobertura obligatoria para navegar.
- **Briefing de seguridad:** Explicación práctica de 15 minutos antes de la salida.
- **Equipo de fondeo:** Ancla con cadena suficiente para fondear en cualquier cala.
- **Escalera de baño:** Para entrar y salir del agua con comodidad.
- **Soporte para teléfono:** En el puesto de mando, para usar el GPS.

**No hay costes ocultos.** El precio que ves en la web es lo que pagas, más la fianza (que se devuelve) y los extras opcionales que decidas contratar.

### Extras opcionales

- **Kit de snorkel** (gafas + tubo): 7,50 EUR por persona
- **Altavoz Bluetooth** resistente al agua
- **Toldo de sol:** Muy recomendable en verano
- **Nevera portátil**

## ¿Es seguro? ¿Qué pasa si hay una emergencia?

**Es completamente seguro.** Nuestros barcos están diseñados para la navegación recreativa cerca de la costa, con todas las medidas de seguridad obligatorias:

- **Chalecos salvavidas** para todos los pasajeros
- **Llave de seguridad (kill switch)** que apaga el motor automáticamente si el piloto se cae
- **Revisión diaria** de todos los barcos antes de la primera salida
- **Monitorización meteorológica** cada mañana. Si las condiciones no son adecuadas, te avisamos y se aplaza la salida.

Además, nuestro **teléfono está operativo durante toda tu navegación** ([+34 611 500 372](tel:+34611500372)). Si tienes cualquier duda o incidencia, nos llamas y te ayudamos al momento.

En caso de emergencia real, llama al **112** (emergencias generales) o al **900 202 202** (Salvamento Marítimo).

Las emergencias son extremadamente raras. En nuestra experiencia, la incidencia más habitual es un motor que no arranca (normalmente porque la llave de seguridad no está bien conectada) y se resuelve por teléfono en segundos.

## ¿Hasta dónde puedo navegar?

Con un barco sin licencia puedes navegar hasta **2 millas náuticas de la costa** (unos 3,7 km). En la práctica, no necesitas alejarte tanto: las mejores calas y zonas de baño están a pocos cientos de metros de la costa.

Desde el puerto de Blanes puedes navegar hacia el norte (dirección Lloret de Mar y Tossa de Mar) o hacia el sur (dirección Malgrat de Mar). La zona norte es la más espectacular, con acantilados, calas escondidas y fondos marinos impresionantes.

### Distancias y tiempos desde el puerto de Blanes

| Destino | Distancia | Tiempo aprox. |
|---------|-----------|--------------|
| Cala Sant Francesc | 1,5 km | 5 minutos |
| Cala Bona | 2 km | 7 minutos |
| Playa Santa Cristina | 3 km | 10 minutos |
| Sa Caleta | 5 km | 18 minutos |
| Playa Fenals (Lloret) | 6 km | 20 minutos |
| Cala Canyelles | 8 km | 25 minutos |
| Tossa de Mar | 15 km | 45 minutos |

Con un alquiler de medio día (4 horas) puedes visitar 2-3 calas cómodamente. Con un día completo (8 horas), puedes llegar hasta Canyelles o incluso Tossa de Mar si las condiciones son buenas.

## ¿Qué pasa si hace mal tiempo?

Tu seguridad es nuestra prioridad. **Revisamos las previsiones meteorológicas cada mañana** y si las condiciones no son adecuadas para navegar (viento fuerte, oleaje, tormentas), te contactaremos para ofrecer estas opciones:

- **Cambio de fecha** sin coste adicional (sujeto a disponibilidad)
- **Reembolso completo** si no es posible encontrar otra fecha

No saldrás a navegar si no es seguro. Preferimos que aplaces a que tengas una experiencia incómoda o arriesgada.

Si durante la navegación las condiciones empeoran inesperadamente, **llámanos**. Te orientaremos sobre la mejor opción: buscar una cala protegida, regresar al puerto o esperar a que pase.

## ¿Puedo llevar comida y bebida al barco?

**Por supuesto.** De hecho, te lo recomendamos. Hacer un picnic a bordo fondeado en una cala de aguas cristalinas es una de las mejores experiencias del día.

### Qué llevar

- **Agua abundante:** En el mar siempre se bebe más de lo esperado. Mínimo 1,5 litros por persona.
- **Fruta fresca:** Sandía, melocotones, uvas... Perfectas para el calor.
- **Bocadillos o sándwiches:** Fáciles de comer a bordo.
- **Snacks:** Frutos secos, patatas fritas, galletas.
- **Cerveza o vino:** Con moderación. Recuerda que alguien tiene que conducir el barco de vuelta.

### Qué NO llevar

- **Cristal:** Nada de botellas ni vasos de cristal. Solo plástico o aluminio. Un cristal roto en un barco es peligroso.
- **Comida que se estropee con el calor:** Mayonesa, lácteos sin refrigerar, etc.
- **Exceso de alcohol:** El patrón debe mantener la capacidad de manejar el barco con seguridad en todo momento.

**Consejo:** Si contratas la **nevera portátil** como extra, podrás mantener las bebidas y la comida frías durante todo el día.

## ¿Necesito reservar con antelación?

**Muy recomendable, especialmente en temporada alta.** En julio y agosto los barcos se agotan con rapidez, sobre todo los fines de semana. Reservar con 1-2 semanas de antelación te asegura la disponibilidad del barco y el horario que prefieres.

### Nuestra recomendación según temporada

| Temporada | Antelación recomendada |
|-----------|----------------------|
| Julio-Agosto (fines de semana) | 2-3 semanas |
| Julio-Agosto (entre semana) | 1-2 semanas |
| Junio y Septiembre | 1 semana |
| Abril, Mayo, Octubre | 2-3 días |

La reserva se hace **100% online** a través de nuestra [web](/barcos). El proceso es rápido: eliges barco, fecha, horario y extras, y pagas de forma segura con tarjeta.

## ¿Puedo llevar a mi perro en el barco?

**Sí, puedes llevar a tu mascota a bordo.** Muchos de nuestros clientes vienen con sus perros y disfrutan juntos del día en el mar.

### Consejos para navegar con perros

- **Chaleco salvavidas canino:** Si tu perro no es un gran nadador, te recomendamos llevar un chaleco flotador para perros (no lo proporcionamos, tráelo tú).
- **Agua dulce:** Lleva agua potable para tu perro. El agua de mar les deshidrata.
- **Sombra:** Asegúrate de que tu perro tenga un espacio con sombra. El toldo es muy recomendable.
- **Escalera de baño:** La mayoría de perros pueden subir y bajar por la escalera de popa con algo de ayuda.
- **Toalla extra:** Para secar a tu mascota.

Avísanos al hacer la reserva si llevarás mascota para que podamos aconsejarte sobre el mejor barco.

---

Esperamos haber resuelto tus dudas. Si tienes alguna pregunta que no hemos cubierto, estamos a un mensaje de distancia. Escríbenos por [WhatsApp](https://wa.me/34611500372) o llámanos al [+34 611 500 372](tel:+34611500372).

[Reserva tu barco](/barcos) y vive la experiencia de navegar por la Costa Brava sin licencia, sin experiencia y sin preocupaciones.`,
  },
  // ===== POST 17: Excursiones para Grupos =====
  {
    title: "Excursiones en Barco para Grupos: Despedidas, Cumpleaños y Eventos",
    slug: "excursiones-barco-grupos-eventos-blanes",
    category: "Familia",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/grupos-barco.jpg",
    metaDescription: "Organiza despedidas de soltera, cumpleaños o eventos en barco en Blanes. Consejos, barcos recomendados y cómo planificar tu excursión.",
    tags: ["excursion barco grupo", "despedida soltera barco", "cumpleaños barco", "eventos barco blanes", "grupo amigos barco", "celebracion barco"],
    isPublished: true,
    _publishedAt: new Date("2026-04-13T10:00:00Z"),
    excerpt: "Organiza una excursión en barco para tu grupo en Blanes: despedidas de soltera, cumpleaños, reuniones de empresa o simplemente un día con amigos en el mar.",
    content: `Un día en barco por la Costa Brava es una experiencia memorable para cualquiera, pero cuando lo compartes con tu grupo de amigos, familia o compañeros de trabajo, se convierte en algo verdaderamente especial. Ya sea para celebrar un cumpleaños, organizar una despedida de soltera o simplemente pasar un día diferente con tu grupo, alquilar barcos en Blanes es una de las mejores opciones.

En esta guía te contamos cómo organizar la excursión perfecta para tu grupo, qué barcos elegir y qué tener en cuenta para que todo salga redondo.

## Por qué un barco es perfecto para grupos

### Una experiencia que une

Hay algo mágico en compartir un barco con tus personas favoritas. Estar en medio del mar, lejos del ruido y las distracciones, crea un ambiente de intimidad y conexión que es difícil de conseguir en otros planes. No hay móviles sonando, no hay camareros interrumpiendo, no hay mesas de al lado. Solo tu grupo, el mar y las calas más bonitas de la Costa Brava.

### Aventura accesible

No hace falta experiencia ni licencia para pilotar nuestros barcos. Cualquier miembro del grupo mayor de 18 años puede ser el patrón. Es una aventura real, con la emoción de pilotar un barco y descubrir calas, pero sin la complejidad de la navegación profesional.

### Fotos y recuerdos inolvidables

Las fotos que harás desde un barco en las calas de la Costa Brava serán las protagonistas de tu Instagram durante semanas. Aguas turquesas, acantilados cubiertos de pinos, saltos al agua desde el barco... El contenido se crea solo.

## Tipos de eventos que puedes celebrar en barco

### Despedidas de soltera/soltero

Las despedidas de soltera o soltero en barco son, de lejos, el evento más popular que recibimos. Y con razón: es un plan original, divertido y que se adapta a todos los gustos.

**Cómo organizar una despedida en barco:**

1. **Elige la fecha:** Preferiblemente entre semana para mejor disponibilidad y precio
2. **Cuenta el grupo:** Si sois más de 6, necesitaréis 2 barcos (lo cual es todavía más divertido)
3. **Reserva con antelación:** Las despedidas suelen ser en fin de semana de temporada alta. Reserva con 2-3 semanas mínimo.
4. **Planifica el catering:** Prepara un picnic con champán, fruta y aperitivos
5. **Decoración:** Puedes decorar el barco con globos, banderines o lo que quieras (siempre que no se vuele al mar)

**Tips para la despedida perfecta:**
- Contrata el **altavoz Bluetooth** para poner música
- Lleva un **inflable** pequeño para atar al barco (un flamenco, una dona...) -- consúltanos antes
- Fondea en una cala tranquila y haz una **sesión de fotos** en el agua
- Reserva para comer en un restaurante del puerto al volver

### Cumpleaños

Un cumpleaños en barco es un regalo que no se olvida. Ya sea para el cumpleañero o como sorpresa organizada por amigos o familia.

**Ideas para un cumpleaños en barco:**
- **Tarta a bordo:** Lleva una tarta en una caja rígida (no cristal). El momento de cantarle el cumpleaños feliz en medio de una cala es mágico.
- **Baño de cumpleaños:** La tradición de lanzar al cumpleañero al agua desde el barco es un clásico.
- **Picnic especial:** Prepara la comida favorita del homenajeado.
- **Día completo:** Reserva un día completo para no tener prisa y disfrutar al máximo.

### Reuniones de empresa y team building

Un día de navegación es una actividad de team building excepcional. Fuera de la oficina, en un entorno relajado y divertido, los equipos se conectan de una forma diferente.

**Formato recomendado para empresas:**
- **2-3 barcos** navegando juntos (hasta 15-18 personas)
- **Ruta coordinada** con paradas en las mismas calas
- **Actividad de snorkel** como elemento de equipo
- **Comida de grupo** en un restaurante del puerto al volver

### Reuniones familiares

Abuelos, padres, hijos, primos... Una excursión familiar en barco es una forma maravillosa de juntar a toda la familia en un plan que gusta a todas las edades.

## Qué barcos elegir para grupos

### Grupos de 2-4 personas

Un solo barco es suficiente. El [Astec 400](/barco/astec-400) para parejas o el [Remus 450](/barco/remus-450) para 3-4 personas.

### Grupos de 4-5 personas

El [Astec 480](/barco/astec-480) con capacidad para 5 personas es la opción ideal. Es el barco sin licencia más espacioso y estable, perfecto para que el grupo vaya cómodo.

### Grupos de 7-12 personas

**Dos barcos** navegando juntos. La configuración más popular:
- 2 x [Astec 480](/barco/astec-480) para hasta 12 personas
- 1 x [Astec 480](/barco/astec-480) + 1 x [Solar 450](/barco/solar-450) para hasta 11 personas

Navegar en dos barcos es en realidad más divertido que ir todos juntos: puedes hacer carreras suaves hasta las calas, reuniros al fondear y disfrutar de más espacio.

### Grupos de más de 12 personas

Para grupos grandes, la opción es **3 o más barcos**. Contáctanos directamente por [WhatsApp](https://wa.me/34611500372) para coordinar reservas de varios barcos y te ayudaremos a organizar la logística.

## Cómo planificar la excursión perfecta para tu grupo

### Paso 1: Define el grupo

- **Cuántas personas:** Determina el número exacto para saber cuántos barcos necesitas
- **Edades:** Si hay niños pequeños o personas mayores, prioriza barcos estables como el [Astec 480](/barco/astec-480)
- **Nivel de aventura:** No todos los grupos buscan lo mismo. Algunos quieren navegar y explorar, otros prefieren fondear en una cala y pasar el día tranquilamente

### Paso 2: Elige fecha y horario

- **Mañana (10:00-14:00):** Mar más calmado, ideal para grupos con niños
- **Tarde (14:00-18:00 o 16:00-20:00):** Sol menos intenso, luz de atardecer preciosa
- **Día completo (10:00-18:00):** La opción completa para disfrutar sin prisa

### Paso 3: Organiza la comida y bebida

Para grupos, un picnic a bordo es casi obligatorio. Coordinad la comida entre todos:

- **Asigna responsabilidades:** Uno trae la bebida, otro los bocadillos, otro la fruta...
- **Compra en el mercado de Blanes:** Abre por la mañana y tiene productos frescos excelentes
- **No olvides:** Bolsas de basura, servilletas, vasos de plástico
- **Hielo:** Compra bolsas de hielo en cualquier supermercado y mételas en la nevera portátil

### Paso 4: Coordina la logística

- **Punto de encuentro:** Puerto de Blanes, 15 minutos antes de la hora reservada
- **Aparcamiento:** Hay parking público cerca del puerto
- **Briefing conjunto:** Si son varios barcos, haremos el briefing de seguridad a todos a la vez
- **Patrones designados:** Cada barco necesita un patrón (mayor de 18 años). Decidid antes quién conducirá cada barco.

## Ruta recomendada para grupos

### Ruta "El clásico" (medio día - 4 horas)

1. **10:00** -- Salida del puerto. Los barcos navegan juntos.
2. **10:15** -- Llegada a **Cala Sant Francesc**. Todos fondean en la misma zona. Primer baño.
3. **11:30** -- Navegación a **Cala Bona**. Picnic a bordo o snorkel.
4. **12:45** -- Última parada en **Santa Cristina** o navegación libre.
5. **13:45** -- Regreso al puerto.
6. **14:00** -- Llegada y devolución de barcos.

### Ruta "La aventura" (día completo - 8 horas)

1. **10:00** -- Salida del puerto
2. **10:15** -- **Cala Sant Francesc** -- Primer baño y calentamiento
3. **11:30** -- **Punta Santa Anna** -- Snorkel en fondos rocosos espectaculares
4. **13:00** -- **Sa Caleta** -- Picnic a bordo en una cala desierta
5. **14:30** -- **Cala Canyelles** -- La joya del día, el mejor snorkel de la zona
6. **16:00** -- Navegación libre y baños en calas a elección
7. **17:30** -- Regreso tranquilo al puerto
8. **18:00** -- Llegada al puerto. Opción de ir a cenar juntos.

## Qué llevar para una excursión de grupo

### Esencial
- Bañador y toalla (una por persona)
- Crema solar SPF 50+ resistente al agua
- Gorra
- Agua abundante (mínimo 1,5 litros por persona)
- Comida y snacks
- Bolsas de basura

### Recomendable
- Nevera portátil con hielo
- Camiseta de recambio
- Gafas de sol con cinta (para que no se caigan al agua)
- Cámara acuática o funda impermeable
- Altavoz Bluetooth (o contrata el nuestro)

### Para despedidas y celebraciones
- Decoración ligera (nada que pueda volar al mar)
- Globos (atados con cuerda, nunca sueltos)
- Champán o cava en lata o plástico (no cristal)
- Tarta en caja rígida
- Disfraces o accesorios temáticos

## Presupuesto para grupos

La ventaja del alquiler de barco para grupos es que **el coste se divide entre todos**. Algunos ejemplos:

### Despedida de 8 personas (2 barcos, medio día, temporada media)

- 2 x [Solar 450](/barco/solar-450) medio día: aprox. 280 EUR total
- Kit snorkel x 8: 60 EUR
- Altavoz Bluetooth x 2: incluido como extra
- **Total por persona: aprox. 42 EUR**

### Cumpleaños de 5 personas (1 barco, día completo, temporada media)

- 1 x [Astec 480](/barco/astec-480) día completo: aprox. 220 EUR
- Kit snorkel x 6: 45 EUR
- **Total por persona: aprox. 44 EUR**

### Team building de 12 personas (2 barcos, día completo, temporada media)

- 2 x [Astec 480](/barco/astec-480) día completo: aprox. 440 EUR
- Kit snorkel x 12: 90 EUR
- **Total por persona: aprox. 44 EUR**

Difícilmente encontrarás una actividad de grupo tan memorable por menos de 45 EUR por persona.

---

Un día en barco con tu grupo es una experiencia que no se compara con nada. El mar, las calas, la libertad de navegar a vuestro aire y la complicidad de compartir aventuras crean recuerdos que duran para siempre.

[Reserva tus barcos](/barcos) y empieza a planificar la excursión perfecta. Si necesitas ayuda para coordinar varios barcos o tienes dudas, escríbenos por [WhatsApp](https://wa.me/34611500372) y te asesoraremos encantados.`,
  },
  // ===== POST 18: Atardeceres desde el Mar =====
  {
    title: "Atardeceres desde el Mar: Las Mejores Rutas al Sunset en la Costa Brava",
    slug: "atardeceres-mar-rutas-sunset-costa-brava",
    category: "Naturaleza",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/atardecer-mar.jpg",
    metaDescription: "Las mejores rutas en barco para ver atardeceres en la Costa Brava. Horarios, puntos clave y consejos de fotografía desde el mar.",
    tags: ["atardecer costa brava", "sunset barco", "rutas atardecer blanes", "puesta de sol mar", "fotografia atardecer", "navegacion tarde costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-04-15T10:00:00Z"),
    excerpt: "Ver el atardecer desde un barco en la Costa Brava es una experiencia mágica. Te contamos las mejores rutas, los puntos clave y cuándo ir para disfrutar del mejor sunset.",
    content: `Hay pocas cosas en la vida que se comparen con ver cómo el sol se hunde en el horizonte mientras estás en un barco, rodeado de agua, con los acantilados de la Costa Brava como telón de fondo. Es uno de esos momentos que se quedan grabados para siempre.

En la Costa Brava, gracias a su orientación y su paisaje, los atardeceres desde el mar son espectaculares. En esta guía te contamos cuáles son los mejores puntos para ver el sunset desde tu barco, cuándo ir y cómo sacar las mejores fotos.

## Por qué los atardeceres desde el barco son diferentes

Ver el atardecer desde la playa es bonito. Verlo desde un barco es otra cosa completamente distinta. Estas son las razones:

### Horizonte despejado

Desde un barco, no hay edificios, árboles ni obstáculos. El horizonte es una línea continua entre el cielo y el mar. Ves el sol completo, desde que empieza a descender hasta que desaparece.

### Reflejo en el agua

El sol al caer crea un camino de luz dorada sobre el agua que parece dirigirse directamente hacia tu barco. Este reflejo es imposible de apreciar desde tierra con la misma intensidad.

### Cambio de colores

En el mar, los colores del atardecer se multiplican. El cielo pasa del azul al dorado, al naranja, al rosa y al púrpura, y cada tono se refleja en el agua creando un espectáculo de 360 grados.

### Silencio

Sin el ruido de la costa, el atardecer desde un barco se vive en silencio. Solo el sonido del agua contra el casco. Es un momento de paz absoluta.

## Cuándo ver los mejores atardeceres

### Horarios de puesta de sol por mes

| Mes | Puesta de sol (aprox.) | Mejor hora para salir |
|-----|----------------------|---------------------|
| Abril | 20:15-20:30 | 17:00-17:30 |
| Mayo | 20:45-21:00 | 17:30-18:00 |
| Junio | 21:15-21:30 | 18:00-18:30 |
| Julio | 21:15-21:30 | 18:00-18:30 |
| Agosto | 20:45-21:00 | 17:30-18:00 |
| Septiembre | 20:00-20:15 | 16:30-17:00 |
| Octubre | 19:00-19:15 | 15:30-16:00 |

**Nota:** Los horarios son aproximados y varían ligeramente dentro de cada mes. Consulta la hora exacta de puesta de sol para tu fecha en cualquier app meteorológica.

### La "hora dorada"

La hora dorada (golden hour) es el período de aproximadamente una hora antes de la puesta de sol, cuando la luz tiene un tono cálido, dorado y suave que es ideal para fotografía y para disfrutar del paisaje. Es en esta franja cuando debes estar ya posicionado en tu punto de observación.

### Los mejores meses para atardeceres

- **Junio y julio:** Los atardeceres más tardíos. Puedes salir a navegar por la tarde y disfrutar de horas de luz dorada.
- **Septiembre:** La luz de septiembre es especialmente cálida y los cielos suelen ser más limpios que en pleno verano.
- **Octubre:** Los atardeceres de octubre son cortos pero intensos, con cielos dramáticos y colores profundos.

## Las mejores rutas de atardecer desde Blanes

### Ruta 1: El clásico frente a Sa Palomera

**Duración:** 2-3 horas
**Dificultad:** Fácil
**Mejor barco:** Cualquiera de la [flota](/barcos)

La ruta más sencilla y una de las más gratificantes. Sales del puerto, navegas suavemente hacia el sur y te posicionas frente a la roca de Sa Palomera para ver cómo el sol se pone sobre Blanes.

**La ruta:**
1. Salida del puerto de Blanes 2 horas antes del sunset
2. Navegación tranquila hacia Cala Sant Francesc -- baño rápido con la luz de la tarde
3. Regreso lento bordeando la costa hacia el sur
4. Fondeo frente a Sa Palomera o en la bahía de Blanes
5. Disfrutar del atardecer con el pueblo de Blanes como fondo

**Por qué funciona:** Sa Palomera y el paseo marítimo de Blanes se iluminan con la luz del atardecer creando una postal perfecta. Los edificios del casco antiguo adquieren tonos dorados y el faro se recorta contra el cielo naranja.

### Ruta 2: Acantilados de Santa Anna

**Duración:** 3-4 horas
**Dificultad:** Media
**Mejor barco:** [Astec 480](/barco/astec-480) o [Remus 450](/barco/remus-450)

Los acantilados entre Blanes y Lloret son espectaculares al atardecer. Las paredes de roca se tiñen de dorado y naranja, y los pinos que crecen en lo alto crean siluetas dramáticas.

**La ruta:**
1. Salida del puerto 3 horas antes del sunset
2. Navegación hacia el norte bordeando los acantilados
3. Parada en Cala Bona para un baño con la luz de la tarde
4. Navegación lenta frente a los acantilados de Santa Anna
5. Fondeo en una pequeña cala protegida
6. Contemplar el atardecer con los acantilados como marco

**Por qué funciona:** La luz del atardecer golpea los acantilados de frente, creando un espectáculo de luces y sombras sobre la roca. Es la ruta más fotogénica.

### Ruta 3: El faro de Tossa al sunset (solo día completo)

**Duración:** 6-8 horas (ruta completa)
**Dificultad:** Avanzada (por distancia)
**Mejor barco:** [Astec 480](/barco/astec-480)

Para los más aventureros, navegar hasta Tossa de Mar y ver el atardecer con el faro y las murallas medievales como fondo es la experiencia definitiva.

**La ruta:**
1. Salida del puerto por la mañana
2. Navegación con paradas en calas durante el día
3. Llegada a Tossa de Mar por la tarde
4. Fondeo frente a la playa grande de Tossa
5. Atardecer con vistas a la Vila Vella (casco antiguo amurallado) y el faro
6. Regreso al puerto de Blanes al anochecer

**Por qué funciona:** Tossa de Mar es uno de los pueblos más fotogénicos de la Costa Brava. Sus murallas medievales y su faro se iluminan con los últimos rayos del sol de una forma que quita el aliento.

**Nota importante:** Esta ruta requiere un día completo de alquiler y buenas condiciones meteorológicas. La distancia Blanes-Tossa es de unos 15 km. Consulta con nosotros antes de planificar esta ruta.

### Ruta 4: Bahía de Blanes -- Fondeo romántico

**Duración:** 2 horas
**Dificultad:** Muy fácil
**Mejor barco:** [Astec 400](/barco/astec-400) (perfecto para parejas)

La ruta más sencilla y romántica. No necesitas ir lejos. Simplemente sal del puerto, fondea en la bahía de Blanes a unos 200 metros de la playa y disfruta del atardecer con una botella de cava y tu mejor compañía.

**La ruta:**
1. Salida del puerto 1,5 horas antes del sunset
2. Navegación suave por la bahía
3. Fondeo en un punto con buenas vistas al horizonte occidental
4. Motor apagado, silencio, cava y atardecer
5. Regreso tranquilo al puerto con las últimas luces del día

**Por qué funciona:** A veces lo mejor es lo más simple. Un barco, una persona especial y un atardecer. No necesitas más.

## Consejos de fotografía desde el barco

### Equipo recomendado

- **Smartphone:** Los smartphones modernos hacen fotos excelentes de atardeceres. El modo nocturno automático ayuda en condiciones de poca luz.
- **Funda impermeable:** Obligatoria. Una caída al agua y pierdes el teléfono y todas las fotos del día.
- **GoPro o cámara de acción:** Para fotos y vídeos con gran angular que capturen toda la escena.

### Técnicas para mejores fotos de atardecer

- **No uses el flash.** Nunca. El flash arruina las fotos de atardecer.
- **Toca la zona más brillante de la pantalla** para que la cámara exponga para el cielo (esto oscurece el primer plano pero hace que los colores del cielo sean más intensos).
- **Incluye siluetas.** Una persona recortada contra el atardecer, la proa del barco, un acantilado... Las siluetas dan profundidad y drama a la foto.
- **Usa la regla de los tercios.** No pongas el horizonte en el centro. Si el cielo es espectacular, deja 2/3 de cielo y 1/3 de mar. Si el reflejo en el agua es bonito, invierte la proporción.
- **Haz fotos durante toda la hora dorada.** No esperes al último momento. Los mejores colores a menudo aparecen 20-30 minutos antes de que el sol toque el horizonte.
- **Graba vídeo en timelapse.** Un timelapse de 30 minutos comprimido en 15 segundos es impresionante.
- **Mira hacia atrás.** A veces los mejores colores del atardecer no están donde se pone el sol, sino en el cielo opuesto, donde las nubes se tiñen de rosa y púrpura.

### Los errores más comunes

- **No proteger el teléfono:** Usa funda impermeable siempre.
- **Dejar de mirar por hacer fotos:** Haz unas cuantas fotos buenas y luego guarda el móvil. Vive el momento.
- **Fotos solo del sol:** El atardecer es mucho más que el sol. Fotografía el reflejo en el agua, las siluetas de los acantilados, las caras iluminadas de tus acompañantes.

## Plan romántico de atardecer para parejas

Si quieres organizar una experiencia romántica para tu pareja, aquí tienes nuestro plan estrella:

### La cita perfecta en el mar

**Antes de salir:**
- Compra una botella de cava o champán (en lata o plástico, nada de cristal)
- Prepara unos aperitivos: queso, embutido, fruta, frutos secos
- Lleva una manta ligera para la brisa del anochecer

**La experiencia:**
1. **17:30** -- Recogéis el barco ([Astec 400](/barco/astec-400) es perfecto para dos)
2. **17:45** -- Navegación hasta Cala Sant Francesc. Último baño del día con la luz dorada.
3. **18:45** -- Regreso lento bordeando la costa. Paráis el motor y os dejáis mecer por el mar.
4. **19:15** -- Fondeo en la bahía de Blanes. Aperitivos y cava con vistas al atardecer.
5. **20:00** -- El sol se pone (en verano más tarde). Silencio. Colores. Magia.
6. **20:30** -- Regreso al puerto con las últimas luces.
7. **21:00** -- Cena en uno de los restaurantes del paseo marítimo.

Es una experiencia que cuesta menos de lo que imaginas y que deja un recuerdo imborrable.

## Qué llevar para una salida de atardecer

- **Ropa de baño y toalla** (para el baño previo al sunset)
- **Capa ligera o sudadera:** La temperatura baja cuando cae el sol. En el mar se nota más.
- **Comida y bebida:** Aperitivos, cava, agua
- **Funda impermeable** para el teléfono
- **Crema solar:** Aunque sea la tarde, el sol sigue siendo fuerte hasta la hora dorada

## Consideraciones de seguridad

- **Regresa antes del anochecer.** Los barcos sin licencia solo pueden navegar de día. Calcula tu regreso para llegar al puerto con luz suficiente.
- **Lleva linterna o usa la del móvil** por si acaso la luz baja más rápido de lo esperado.
- **Nuestro horario de atención** cubre toda la franja horaria de navegación. Si tienes cualquier duda, llámanos.

---

Un atardecer desde el mar es uno de esos regalos que la Costa Brava te hace sin pedir nada a cambio. Solo necesitas un barco, el horizonte y las ganas de detenerte un momento a contemplar algo extraordinario.

[Reserva tu barco de atardecer](/barcos) y descubre por qué nuestros clientes repiten año tras año. El Mediterráneo al sunset te espera.`,
  },

  // ===== POST 19: Excursión Barco Tossa de Mar =====
  {
    title: "Excursión en Barco a Tossa de Mar desde Blanes: Guía Completa con Precios",
    slug: "excursion-barco-tossa-de-mar-desde-blanes",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/ruta-costera.jpg",
    metaDescription: "Guía completa para ir en barco de Blanes a Tossa de Mar. Precios desde 160 EUR, rutas, calas, Vila Vella y consejos. Todo lo que necesitas saber.",
    tags: ["excursion barco tossa de mar", "alquiler barco tossa de mar", "tossa de mar en barco", "vila vella tossa barco", "cuanto cuesta barco tossa", "blanes a tossa en barco"],
    isPublished: true,
    _publishedAt: new Date("2026-03-18T10:00:00Z"),
    excerpt: "Todo lo que necesitas saber para navegar de Blanes a Tossa de Mar: precios, barcos recomendados, ruta paso a paso, calas imprescindibles y la mejor época para ir.",
    content: `Tossa de Mar es, sin exageración, uno de los pueblos más bonitos del Mediterráneo. Su Vila Vella (ciudad vieja amurallada del siglo XII) asomando sobre los acantilados es una imagen que no se olvida. Y verla desde el mar, llegando en barco, es una experiencia completamente distinta a llegar por carretera.

En esta guía te contamos **todo lo que necesitas saber** para hacer la excursión en barco desde el Puerto de Blanes hasta Tossa de Mar: precios, barcos, ruta, calas por el camino y consejos prácticos.

## Datos rápidos

| Concepto | Detalle |
|----------|---------|
| **Distancia** | ~15 km por mar desde Puerto de Blanes |
| **Tiempo** | 45 min - 1 hora (según barco y mar) |
| **Precio desde** | 160 EUR / 2 horas (barco con licencia) |
| **Licencia necesaria** | Sí (PER/PNB) o excursión con patrón |
| **Mejor época** | Junio y septiembre |
| **Dificultad** | Fácil con licencia, no apto sin licencia |

## ¿Necesito licencia para ir a Tossa de Mar en barco?

**Sí.** Tossa de Mar está más allá del límite de 2 millas náuticas que permite la navegación sin licencia en España. Para llegar necesitas:

1. **Un barco con licencia** (PER o PNB) — Traes tu propia titulación y alquilas uno de nuestros barcos: [Mingolla Brava 19](/barco/mingolla-brava-19) (80 CV), [Trimarchi 57S](/barco/trimarchi-57s) (110 CV) o [Pacific Craft 625](/barco/pacific-craft-625) (115 CV).
2. **Excursión privada con patrón** — Nuestro capitán profesional te lleva. Tú solo disfrutas. Ideal para quien no tiene licencia pero quiere vivir la experiencia.

## Precios para ir en barco a Tossa de Mar

Para una excursión a Tossa recomendamos **mínimo 4 horas** (ida + exploración + vuelta). Estos son los precios en temporada baja (abril-junio, septiembre-octubre):

| Barco | Capacidad | Precio 4h | Precio 8h |
|-------|-----------|-----------|-----------|
| Mingolla Brava 19 (80 CV) | 6 personas | 230 EUR | 280 EUR |
| Trimarchi 57S (110 CV) | 7 personas | 240 EUR | 290 EUR |
| Pacific Craft 625 (115 CV) | 7 personas | 250 EUR | 300 EUR |
| Excursión con patrón | 7 personas | 380 EUR (4h) | — |

**Nota:** Los barcos con licencia NO incluyen combustible. Calcula unos 40-60 EUR adicionales de gasolina para la ida y vuelta a Tossa.

En temporada alta (agosto), los precios suben un 15-25%. Consulta nuestra [página de precios](/precios) para las tarifas actualizadas.

## La ruta: de Blanes a Tossa paso a paso

### Salida: Puerto de Blanes (km 0)

Zarpa desde nuestro muelle en el Puerto de Blanes. Te recomendamos salir **antes de las 10:00** para aprovechar el mar en calma de la mañana. Dirección norte, siguiendo la costa.

### Parada 1: Cala Sant Francesc (km 1,5 — 5 min)

La primera cala que encontrarás. Aguas turquesas, pinos hasta la orilla. Si tienes tiempo, merece un baño rápido. Si no, disfruta las vistas desde el barco.

### Parada 2: Zona de Lloret de Mar (km 6 — 20 min)

Pasarás por Santa Cristina, Fenals y la playa principal de Lloret. Desde el mar verás la famosa escultura de La Mujer Marinera y el skyline de Lloret. No hace falta parar, pero si buscas un buen punto para comer, los chiringuitos de Lloret están a tiro de ancla.

### Parada 3: Cala Canyelles (km 9 — 30 min)

Entre Lloret y Tossa. Cala más salvaje, rocas, buena para snorkel. Buen punto intermedio para descansar.

### Parada 4: Cala Pola (km 12 — 40 min)

Una de las calas más bonitas de toda la Costa Brava. Pequeña, rodeada de acantilados, aguas cristalinas. **Solo accesible cómodamente por mar.** Imprescindible si tienes tiempo.

### Llegada: Tossa de Mar (km 15 — 50-60 min)

La silueta de la Vila Vella creciendo en el horizonte es el momento mágico de la excursión. Las torres medievales y las murallas del siglo XII cayendo sobre el mar forman una imagen que parece sacada de una película.

Puedes fondear frente a la **Playa Grande** (Platja Gran), justo debajo de las murallas. Hay zona de fondeo habilitada para embarcaciones recreativas.

## Qué ver en Tossa de Mar desde el barco

- **Vila Vella**: El recinto amurallado medieval es Monumento Histórico-Artístico Nacional. Vista espectacular desde el mar.
- **Torre del Far**: El faro de Tossa en lo alto de las murallas.
- **Platja Gran**: Playa principal de arena dorada protegida por las murallas.
- **Cala Es Codolar**: Pequeña cala de guijarros junto a las murallas, solo accesible por mar o por un sendero estrecho.
- **Acantilados entre Lloret y Tossa**: Algunos de los acantilados más dramáticos de la Costa Brava.

## ¿Cuál es la mejor época para ir?

| Mes | Valoración | Por qué |
|-----|-----------|---------|
| Abril-Mayo | Buena | Pocos turistas, precios bajos. Agua fresca (16-19°C) |
| **Junio** | **Excelente** | Buen tiempo, mar en calma, precios bajos, menos gente |
| Julio | Muy buena | Calor, agua templada. Precios medios |
| Agosto | Buena con reserva | Máxima afluencia. Reserva con 1 semana. Precios altos |
| **Septiembre** | **Excelente** | Agua más caliente del año (23-25°C), pocos turistas, precios bajos |
| Octubre | Aceptable | Últimas semanas de temporada. Mar puede estar más movido |

## Consejos prácticos

1. **Sal temprano.** A las 9:00-10:00 el mar suele estar más tranquilo. Por la tarde se levanta el viento de Garbí (suroeste).
2. **Lleva combustible de más.** Los barcos con licencia no incluyen gasolina. Mejor repostar de más que quedarse corto.
3. **Planifica el regreso.** Calcula 1 hora de vuelta + tiempo para devolver el barco. No apures.
4. **Lleva comida y agua.** En Tossa puedes bajar a comer, pero tener provisiones a bordo da más libertad.
5. **Consulta el tiempo.** Si el parte anuncia viento norte (Tramontana) o marejada, es mejor posponer. Te ofrecemos cambio de fecha gratuito.

## ¿Vienes desde Malgrat de Mar, Santa Susanna o Calella?

Si estás alojado en alguno de estos pueblos de la costa del Maresme, puedes llegar fácilmente al Puerto de Blanes:

- [Malgrat de Mar](/alquiler-barcos-malgrat-de-mar): 10 minutos en coche
- [Santa Susanna](/alquiler-barcos-santa-susanna): 15 minutos en coche
- [Calella](/alquiler-barcos-calella): 20 minutos en coche

Hay parking gratuito junto al puerto. También puedes venir en tren RENFE (línea R1).

---

La excursión en barco a Tossa de Mar es una de las experiencias más memorables que puedes vivir en la Costa Brava. La combinación de navegación costera, calas vírgenes y la llegada a un pueblo medieval desde el mar es sencillamente inigualable.

[Consulta disponibilidad y reserva tu barco](/barcos) o escríbenos por [WhatsApp](https://wa.me/34611500372) para que te ayudemos a planificar tu excursión perfecta a Tossa.`,
  },

  // ===== POST: Barco sin licencia vs con licencia =====
  {
    title: "Barco sin licencia vs con licencia: Guia completa para elegir",
    slug: "barco-sin-licencia-vs-con-licencia-guia",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/barco-mar.jpg",
    metaDescription: "Barco sin licencia vs con licencia: comparativa completa con precios, distancias, capacidad y actividades para ayudarte a elegir el barco perfecto en Blanes.",
    tags: ["barco sin licencia", "barco con licencia", "comparativa barcos", "licencia nautica", "que barco elegir"],
    isPublished: true,
    _publishedAt: new Date("2026-03-25T10:00:00Z"),
    excerpt: "No sabes si necesitas un barco con o sin licencia para tu dia en la Costa Brava? Te explicamos todas las diferencias, precios y ventajas de cada opcion para que elijas con confianza.",
    content: `Una de las preguntas mas frecuentes que recibimos en Costa Brava Rent a Boat es: "Necesito licencia para alquilar un barco?" La respuesta corta es que no siempre. En Espana puedes disfrutar de un dia de navegacion sin tener ningun titulo nautico. Pero tener licencia te abre mas opciones. En esta guia te explicamos todas las diferencias para que elijas la opcion perfecta para ti.

## Que es un barco sin licencia

Un barco sin licencia es una embarcacion de hasta 5 metros de eslora y un motor de hasta 15 CV que, segun la legislacion espanola, cualquier persona mayor de 18 anos puede pilotar sin necesitar titulo nautico. Solo necesitas tu DNI o pasaporte y prestar atencion al briefing de seguridad que te damos antes de salir.

En [Costa Brava Rent a Boat](/barcos-sin-licencia) disponemos de varios modelos sin licencia: el [Solar 450](/barco/solar-450), el [Astec 480](/barco/astec-480), el [Astec 400](/barco/astec-400) y el [Remus 450](/barco/remus-450). Todos incluyen combustible, equipo de seguridad y un briefing completo.

## Que es un barco con licencia

Un barco con licencia requiere que el patron (la persona que conduce) tenga una titulacion nautica oficial, como el PER (Patron de Embarcaciones de Recreo) o superior. Estos barcos son mas grandes, mas potentes y te permiten navegar a mayor distancia de la costa.

Nuestros [barcos con licencia](/barcos-con-licencia) incluyen el [Pacific Craft 625](/barco/pacific-craft-625) y la [Mingolla Brava 19](/barco/mingolla-brava-19). Tambien ofrecemos la [excursion privada con capitan](/barco/excursion-privada) para quienes quieran un barco grande sin tener licencia.

## Tabla comparativa: sin licencia vs con licencia

| Caracteristica | Sin licencia | Con licencia |
|---|---|---|
| **Titulo necesario** | Ninguno | PER o superior |
| **Eslora maxima** | 5 metros | 6-7+ metros |
| **Potencia motor** | Hasta 15 CV | 100-150 CV |
| **Velocidad maxima** | 5-6 nudos (~10 km/h) | 20-30 nudos (~45 km/h) |
| **Distancia de costa** | 2 millas nauticas | Sin limite practico |
| **Capacidad** | 4-5 personas | 6-8 personas |
| **Combustible incluido** | Si | No (se paga aparte) |
| **Precio desde** | 70 EUR/hora | 150 EUR/hora |
| **Ideal para** | Familias, principiantes, calas cercanas | Grupos grandes, rutas largas, experiencias deportivas |

## Quien deberia elegir un barco sin licencia

El barco sin licencia es perfecto si:

- **Nunca has navegado antes.** No necesitas experiencia previa. Te ensenamos todo en un briefing de 10 minutos.
- **Vienes con familia.** Los barcos son estables, seguros y faciles de manejar. Los ninos disfrutan muchisimo.
- **Quieres visitar calas cercanas.** Desde el puerto de Blanes, tienes [Cala Sant Francesc](/rutas), Cala Bona, Cala Treumal y la playa de Santa Cristina a menos de 15 minutos.
- **Buscas la opcion mas economica.** Desde 70 EUR la hora con combustible incluido, es la forma mas accesible de disfrutar del mar.
- **Prefieres tranquilidad.** Navegar a ritmo lento, fondear en una cala, banarte y hacer snorkel sin prisas.

### Barcos sin licencia recomendados

- [Solar 450](/barco/solar-450): Compacto y agil, ideal para parejas.
- [Astec 480](/barco/astec-480): El mas espacioso sin licencia, perfecto para familias de 4-5 personas.
- [Astec 400](/barco/astec-400): Maniobrable y comodo, buena relacion calidad-precio.
- [Remus 450](/barco/remus-450): Robusto y estable, ideal para principiantes.

## Quien deberia elegir un barco con licencia

El barco con licencia es la mejor opcion si:

- **Tienes experiencia nautica.** Ya sabes navegar y quieres un barco con mas prestaciones.
- **Quieres llegar mas lejos.** Puedes hacer la [ruta Blanes - Tossa de Mar](/rutas) ida y vuelta en un solo dia con tiempo de sobra.
- **Venís en un grupo grande.** Capacidad para 6-8 personas con espacio para moverse comodamente.
- **Buscas velocidad.** Los barcos con licencia alcanzan 20-30 nudos, lo que te permite cubrir mas terreno y visitar mas calas.
- **Quieres pescar o hacer deportes nauticos.** La potencia extra permite actividades que no son posibles con barcos mas pequenos.

### Barcos con licencia recomendados

- [Pacific Craft 625](/barco/pacific-craft-625): 150 CV, hasta 8 personas, ideal para rutas largas hasta Tossa de Mar.
- [Mingolla Brava 19](/barco/mingolla-brava-19): 100 CV, versatil y comoda, perfecta para grupos de 6 personas.

## Y si quiero un barco grande pero no tengo licencia?

Tenemos la solucion perfecta: nuestra [excursion privada con capitan](/barco/excursion-privada). Un patron profesional te lleva en un barco de 19 pies por las mejores calas y rutas de la Costa Brava. Tu solo te preocupas de disfrutar.

Esta opcion es ideal para celebraciones, despedidas, aniversarios o simplemente para quienes quieren la experiencia de un barco grande sin necesitar licencia.

## Precios y duraciones

Tanto los barcos sin licencia como con licencia se pueden alquilar por horas. Las duraciones mas populares son 2 horas y 4 horas. Consulta todos los [precios actualizados en nuestra web](/precios).

En temporada alta (julio-agosto), recomendamos reservar con al menos una semana de antelacion, especialmente para fines de semana.

---

Elegir entre barco sin licencia o con licencia depende de tu experiencia, el tamano de tu grupo y lo lejos que quieras llegar. En cualquier caso, la Costa Brava te ofrece una experiencia de navegacion inolvidable.

[Explora todos nuestros barcos](/barcos) y reserva online en menos de 2 minutos. Si tienes dudas, escribenos por [WhatsApp](https://wa.me/34611500372) y te asesoramos encantados.`,
  },

  // ===== POST: Que llevar en un barco de alquiler =====
  {
    title: "Que llevar en un barco de alquiler: checklist completo",
    slug: "que-llevar-barco-alquiler-checklist",
    category: "Consejos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/seguridad-barco.jpg",
    metaDescription: "Checklist completo de que llevar en un barco de alquiler: proteccion solar, comida, entretenimiento y todo lo esencial para un dia perfecto en el mar.",
    tags: ["que llevar barco", "checklist barco", "preparar excursion barco", "consejos nauticos", "dia en barco"],
    isPublished: true,
    _publishedAt: new Date("2026-03-28T10:00:00Z"),
    excerpt: "Preparar bien tu dia en barco marca la diferencia entre una buena experiencia y una experiencia inolvidable. Aqui tienes el checklist definitivo con todo lo que necesitas llevar.",
    content: `Tienes tu reserva confirmada, el dia esta soleado y las ganas son enormes. Pero, que necesitas llevar para un dia perfecto en el mar? En Costa Brava Rent a Boat hemos visto miles de salidas y sabemos exactamente que marca la diferencia entre un buen dia y un dia inolvidable. Aqui tienes nuestro checklist completo organizado por categorias.

## Lo que ya incluye tu alquiler

Antes de preparar tu mochila, ten en cuenta que cuando [alquilas un barco con nosotros](/barcos) ya te proporcionamos:

- **Equipo de seguridad completo:** chalecos salvavidas para todos los pasajeros (incluidos ninos), bengalas, extintor y botiquin basico.
- **Combustible incluido** en todos los [barcos sin licencia](/barcos-sin-licencia) (los barcos con licencia no incluyen combustible).
- **Briefing de seguridad y navegacion:** te explicamos como manejar el barco, las zonas recomendadas y consejos practicos.
- **Mapa de rutas y calas:** para que sepas exactamente donde ir.
- **Ancla y cabo de fondeo:** para que puedas parar en cualquier cala.

Tambien puedes anadir extras opcionales como **equipo de snorkel** (7,50 EUR) y **paddle board** (20 EUR) directamente en tu reserva.

## Proteccion solar (imprescindible)

El sol en el mar es mucho mas intenso de lo que parece. El reflejo del agua multiplica la radiacion UV y es muy facil quemarse sin darse cuenta.

- **Crema solar SPF 50+:** Aplicala 30 minutos antes de embarcar y reaplica cada 2 horas. Usa crema biodegradable para proteger el ecosistema marino.
- **Gafas de sol polarizadas:** Las polarizadas reducen el reflejo del agua y te permiten ver el fondo marino. Usa una cinta para no perderlas.
- **Gorra o sombrero:** Esencial. En el barco no hay sombra y la insolacion puede arruinarte el dia.
- **Camiseta UV o rash guard:** Especialmente para ninos, es la mejor proteccion contra el sol durante las horas centrales.

### Consejo extra

Si vienes con ninos menores de 6 anos, la crema sola no es suficiente. Combina crema + camiseta UV + gorra y manten al nino hidratado.

## Ropa y calzado

- **Banador:** Parece obvio pero mas de uno se ha presentado sin el.
- **Toalla:** Una por persona. Las de microfibra ocupan menos y secan mas rapido.
- **Ropa de cambio:** Al final del dia agradeceras tener ropa seca para volver a casa.
- **Calzado de agua o sandalias con suela:** El suelo del barco puede estar mojado y resbaladizo. Las chancletas de dedo no son ideales, mejor zapatos de agua con suela de goma.
- **Sudadera ligera o cortavientos:** Aunque haga calor en tierra, la brisa marina puede refrescar bastante, especialmente al navegar.

## Comida y bebida

No hay chiringuito en medio del mar, asi que planifica bien:

- **Agua abundante:** Minimo 1,5 litros por persona. La deshidratacion es el error numero uno en el mar.
- **Snacks energeticos:** Fruta, frutos secos, barritas de cereales. Evita cosas que se derritan con el calor.
- **Bocadillos o sandwiches:** Preparalos en casa y llevalos en una nevera portatil.
- **Nevera portatil con hielo:** Fundamental para mantener la comida y bebida frescas.
- **Bebidas:** Zumos, refrescos o lo que prefieras. Si llevas alcohol, hazlo con moderacion: el sol y el mar potencian sus efectos.

### Para familias con ninos

Lleva mas agua de la que crees necesaria. Los ninos se deshidratan rapido, especialmente cuando estan excitados y activos. Las bolsas de snacks tipo galletitas saladas funcionan muy bien.

## Entretenimiento y actividades

- **Equipo de snorkel:** Si no lo has anadido como extra en tu reserva, puedes traer el tuyo. Las calas cerca de [Blanes](/alquiler-barcos-blanes) tienen fondos marinos espectaculares.
- **Camara acuatica o funda sumergible para el movil:** Las fotos desde el agua y bajo el agua son las mejores del viaje.
- **Altavoz bluetooth portatil:** Musica suave mientras fondeas en una cala. Nuestros barcos [Astec 480](/barco/astec-480) ya incluyen altavoz bluetooth.
- **Juegos de agua:** Para los ninos: pistolas de agua, hinchables pequenos.
- **Libro o revista:** Para los ratos de fondeo mientras los demas se banan.

## Objetos practicos

- **Bolsa estanca o bolsa de plastico con cierre:** Para proteger el movil, llaves y cartera del agua.
- **Medicacion personal:** Si tomas alguna medicacion diaria o para el mareo (biodramina).
- **Pastillas para el mareo:** Si es tu primera vez en barco, tomalas 30 minutos antes de embarcar por precaucion.
- **Efectivo y documentacion:** Lleva tu DNI o pasaporte (obligatorio para alquilar). Guarda todo en la bolsa estanca.

## Lo que NO debes llevar

- **Objetos de valor innecesarios:** Joyas, relojes caros o electronica delicada. El agua salada y los golpes no perdonan.
- **Bolsas o mochilas grandes:** El espacio en el barco es limitado. Optimiza y lleva solo lo esencial.
- **Zapatos de suela dura:** Pueden danar el suelo del barco.
- **Cristal:** Por seguridad, evita llevar botellas o vasos de cristal al barco.

## Checklist rapido para imprimir

- [ ] Crema solar SPF 50+ biodegradable
- [ ] Gafas de sol polarizadas con cinta
- [ ] Gorra o sombrero
- [ ] Banador
- [ ] Toalla (microfibra)
- [ ] Calzado de agua
- [ ] Ropa de cambio
- [ ] Sudadera ligera
- [ ] Agua (1,5L por persona)
- [ ] Snacks y bocadillos
- [ ] Nevera portatil con hielo
- [ ] Bolsa estanca para movil/llaves
- [ ] Crema after-sun
- [ ] DNI o pasaporte
- [ ] Camara o funda sumergible
- [ ] Medicacion personal

---

Un dia en el mar es una de las mejores experiencias que puedes vivir en la Costa Brava. Con esta checklist, solo te queda elegir tu barco y disfrutar.

[Reserva tu barco ahora](/barcos) y empieza a preparar tu aventura. Consulta nuestros [precios](/precios) o escribenos por [WhatsApp](https://wa.me/34611500372) si tienes cualquier duda.`,
  },

  // ===== POST: Alquiler barco familias Costa Brava =====
  {
    title: "Alquiler de barco para familias en Costa Brava: la experiencia perfecta",
    slug: "alquiler-barco-familias-costa-brava",
    category: "Experiencias",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/familias-barco.jpg",
    metaDescription: "Alquiler de barcos para familias en la Costa Brava: barcos sin licencia seguros, calas poco profundas, snorkel y la experiencia perfecta desde Blanes.",
    tags: ["barco familias", "excursion familiar barco", "costa brava niños", "actividades acuaticas familias", "barco con niños"],
    isPublished: true,
    _publishedAt: new Date("2026-04-01T10:00:00Z"),
    excerpt: "Descubre por que alquilar un barco sin licencia en Blanes es la actividad perfecta para familias con ninos: seguro, facil, asequible y con calas espectaculares a pocos minutos.",
    content: `Si hay una actividad que transforma unas vacaciones familiares en la Costa Brava en algo verdaderamente especial, es alquilar un barco. No hace falta tener experiencia, ni licencia, ni ser un lobo de mar. Solo hacen falta ganas de vivir una aventura juntos en el Mediterraneo.

En [Costa Brava Rent a Boat](/alquiler-barcos-blanes) llevamos anos ayudando a familias a crear recuerdos inolvidables en el mar. En esta guia te contamos todo lo que necesitas saber para planificar la excursion familiar perfecta.

## Por que un barco es la actividad ideal para familias

Alquilar un barco ofrece algo que pocas actividades pueden igualar: combina aventura, naturaleza, deporte y relajacion en una sola experiencia. Para los ninos, pilotar un barco (con papa o mama al mando) es una aventura que recordaran siempre. Para los padres, es la oportunidad de desconectar del ruido y disfrutar de calas que desde tierra son inaccesibles o estan masificadas.

### Ventajas frente a otras actividades

- **Exclusividad:** Tienes tu propio barco, tu propio ritmo, tu propia cala. Sin multitudes.
- **Flexibilidad:** Paras donde quieres, el tiempo que quieres. Si los ninos se cansan, volvemos al puerto.
- **Educativo:** Los ninos aprenden sobre navegacion, el mar, la fauna marina y la costa.
- **Actividades multiples:** Navegacion + snorkel + bano + picnic, todo en una sola salida.
- **Para todas las edades:** Desde bebes (con precauciones) hasta abuelos. No hay limites de edad.

## Barcos sin licencia: seguros y faciles para familias

Todos nuestros [barcos sin licencia](/barcos-sin-licencia) estan pensados para que cualquier persona pueda pilotarlos con seguridad, incluso sin experiencia previa. Antes de salir, te damos un briefing completo de 10-15 minutos donde te explicamos:

- Como arrancar, acelerar y frenar el motor.
- Como maniobrar y fondear (anclar) en una cala.
- Normas de seguridad y navegacion.
- Las mejores calas y rutas segun el dia y las condiciones.
- Que hacer en caso de cualquier incidencia (siempre estamos a una llamada de distancia).

### Seguridad para los ninos

La seguridad de los mas pequenos es nuestra prioridad:

- **Chalecos salvavidas infantiles:** Disponemos de chalecos para todas las tallas, incluidos bebes. Todos los menores deben llevar chaleco puesto durante la navegacion.
- **Barcos estables:** Nuestros barcos sin licencia son embarcaciones anchas y estables, disenadas para no volcar y soportar oleaje moderado.
- **Velocidad controlada:** Con un maximo de 5-6 nudos (unos 10 km/h), la navegacion es tranquila y segura.
- **Zonas protegidas:** Las calas cercanas a Blanes estan protegidas del oleaje y tienen aguas poco profundas, ideales para ninos.
- **Contacto permanente:** Tienes nuestro numero de telefono y estamos siempre pendientes por si necesitas asistencia.

## Que barco elegir para tu familia

### Familias de 3-4 personas

El [Astec 480](/barco/astec-480) es nuestro barco estrella para familias. Con casi 5 metros de eslora, ofrece el maximo espacio posible sin necesitar licencia. Tiene espacio para moverse comodamente, guardar mochilas y nevera, y cuenta con altavoz bluetooth integrado. Capacidad maxima: 5 personas.

### Parejas con 1-2 ninos

El [Solar 450](/barco/solar-450) es compacto, agil y muy facil de manejar. Perfecto si sois 3-4 personas y buscais una experiencia mas deportiva. Es el barco ideal para primera vez.

### Familias grandes (6+ personas)

Si sois mas de 5, necesitareis un [barco con licencia](/barcos-con-licencia) como el [Pacific Craft 625](/barco/pacific-craft-625) (hasta 8 personas) o contratar nuestra [excursion privada con capitan](/barco/excursion-privada), donde un patron profesional os lleva por las mejores calas sin que necesiteis ningun titulo.

## Itinerario familiar recomendado: 2 horas

Este es nuestro itinerario mas popular para familias con ninos:

**10:00** - Llegada al puerto de Blanes. Briefing de seguridad y embarque.

**10:15** - Salida del puerto. Navegacion rumbo sur bordeando la costa.

**10:25** - Llegada a Cala Sant Francesc. Fondeo y bano. Si habeis alquilado equipo de snorkel, este es el mejor sitio. El agua es poco profunda y transparente, perfecta para que los ninos vean peces sin miedo.

**11:00** - Navegacion a Cala Bona (5 minutos). Mas tranquila y recogida, ideal para el picnic. Los ninos pueden jugar en el agua con seguridad.

**11:30** - Regreso al puerto con parada en Sa Palomera para fotos desde el mar.

**11:50** - Llegada al puerto. Fin de la experiencia.

## Itinerario familiar extendido: 4 horas

Si teneis toda la manana, el alquiler de 4 horas os permite llegar mas lejos:

**10:00** - Salida del puerto de Blanes.

**10:15** - Primera parada en Cala Sant Francesc. Bano y snorkel.

**10:45** - Navegacion hasta Cala Treumal (10 min). Esta cala tiene un chiringuito donde podeis acercaros nadando a tomar algo.

**11:30** - Continuacion hasta la playa de Santa Cristina (5 min). Paisaje de postal para fotos familiares.

**12:15** - Regreso lento bordeando la costa, con parada libre en Cala Bona o donde mas os apetezca.

**13:30** - Llegada al puerto.

## Precios para familias

Los [precios](/precios) de nuestros barcos sin licencia empiezan desde 70 EUR la hora, con combustible incluido. Las duraciones mas populares para familias son:

- **2 horas:** Suficiente para visitar 2-3 calas cercanas. Ideal con ninos pequenos.
- **4 horas:** La experiencia completa. Tiempo para explorar, nadar, hacer snorkel y comer a bordo.

Reservar online tiene un **5% de descuento**. Puedes hacerlo directamente desde nuestra web.

### Extras recomendados para familias

- **Equipo de snorkel** (7,50 EUR): Incluye mascara y tubo. Los ninos flipan viendo peces, erizos y estrellas de mar.
- **Paddle board** (20 EUR): Los adolescentes lo adoran. Incluye remo y chaleco.

## Consejos practicos para familias

1. **Reserva por la manana.** Las calas estan mas vacias y el mar mas tranquilo.
2. **Lleva mucha agua.** Minimo 1,5 litros por persona. Los ninos se deshidratan rapido.
3. **Crema solar SPF 50+** biodegradable. Aplica 30 minutos antes y reaplica cada 2 horas.
4. **Camisetas UV para los ninos.** Mejor que solo crema, especialmente en las horas centrales.
5. **Snacks y picnic.** Bocadillos, fruta, galletas. Lleva nevera con hielo.
6. **Bolsa estanca** para moviles y llaves. El agua salada no perdona.
7. **Pastillas para el mareo** si es la primera vez. Biodramina infantil existe y funciona.
8. **Calzado de agua.** El suelo del barco puede estar mojado.

---

Alquilar un barco en familia es una de esas experiencias que los ninos recordaran para siempre. La combinacion de aventura, naturaleza y tiempo juntos en un entorno tan espectacular como la Costa Brava es dificil de superar.

[Reserva ahora tu barco familiar](/barcos) y crea recuerdos que duraran toda la vida. Si tienes dudas, escribenos por [WhatsApp](https://wa.me/34611500372) y te ayudamos a planificar vuestra excursion perfecta.`,
  },

  // ===== POST: Las 10 mejores calas de Blanes accesibles en barco =====
  {
    title: "Las 10 mejores calas de Blanes accesibles solo en barco",
    slug: "mejores-calas-blanes-accesibles-en-barco",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/calas-costa-brava.jpg",
    metaDescription: "Las 10 mejores calas de Blanes y alrededores accesibles en barco: calas secretas, snorkel, aguas cristalinas a menos de 30 minutos del puerto.",
    tags: ["calas blanes", "calas secretas blanes", "calas barco blanes", "playas escondidas blanes", "snorkel blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-04-04T10:00:00Z"),
    excerpt: "Descubre las 10 mejores calas cerca de Blanes que puedes visitar en barco: desde Cala Sant Francesc hasta rincones secretos a menos de 30 minutos del puerto.",
    content: `Blanes es el punto de partida perfecto para explorar algunas de las calas mas bonitas del Mediterraneo. Mientras que nuestra guia de [las mejores calas de la Costa Brava](/blog/mejores-calas-costa-brava-en-barco) cubre toda la costa desde Blanes hasta Tossa de Mar, en este articulo nos centramos exclusivamente en las calas cercanas al puerto de Blanes, esas que puedes visitar incluso con un alquiler de solo 2 horas en un [barco sin licencia](/barcos-sin-licencia).

## 1. Cala Sant Francesc

**Tiempo desde el puerto:** 5 minutos | **Distancia:** 1,5 km | **Snorkel:** Excelente

La joya de Blanes. Declarada una de las mejores playas de Espana, Cala Sant Francesc esta rodeada de pinos centenarios y acantilados. Sus aguas turquesas y poco profundas son perfectas para el snorkel: posidonias, sargos, doncellas y, con suerte, algun pulpo entre las rocas.

Aunque tiene acceso a pie por un camino empinado, llegar en barco te permite evitar la caminata y fondear directamente frente a la playa. Por la manana temprano, antes de las 11:00, puedes tener la cala casi para ti solo.

**Lo que la hace especial:** El fondo marino es uno de los mejores de toda la zona para snorkel. Las praderas de posidonia estan sanas y albergan una biodiversidad impresionante.

## 2. Cala Bona

**Tiempo desde el puerto:** 7 minutos | **Distancia:** 2 km | **Snorkel:** Muy bueno

Justo al lado de Cala Sant Francesc pero mucho mas pequena y escondida. Cala Bona es una miniatura de playa encajada entre rocas, con arena gruesa y agua cristalina. Su reducido tamano hace que pocos turistas lleguen hasta aqui, incluso en pleno agosto.

Es la cala perfecta para fondear el barco, lanzarse al agua y disfrutar de la tranquilidad absoluta. Las paredes rocosas que la enmarcan crean un paisaje muy fotogenico.

**Lo que la hace especial:** Es una de las calas menos masificadas de Blanes precisamente por su dificil acceso a pie. En barco, es trivial llegar.

## 3. Punta de Santa Anna

**Tiempo desde el puerto:** 4 minutos | **Distancia:** 1 km | **Snorkel:** Excelente

No es una playa sino un tramo de costa rocosa al pie del promontorio de Santa Anna, donde se encuentran los restos del antiguo castillo. Aqui no vas a tomar el sol sino a hacer snorkel de primer nivel. Las formaciones rocosas submarinas crean cuevas, grietas y tuneles donde se esconde una fauna marina increible.

**Lo que la hace especial:** Es uno de los puntos de snorkel mas subestimados de toda la Costa Brava. Pocos turistas saben que existe porque no aparece en las guias convencionales.

## 4. Racó de Sa Palomera

**Tiempo desde el puerto:** 2 minutos | **Distancia:** 300 m | **Snorkel:** Bueno

La mayoria de visitantes conocen Sa Palomera como la roca iconica que divide las dos playas de Blanes. Pero lo que pocos saben es que en su cara norte, mirando hacia el puerto, hay un pequeno rincón rocoso protegido del oleaje donde el agua es extraordinariamente clara.

Desde el barco, puedes fondear a pocos metros y bajar nadando para explorar las rocas. Es una parada rapida perfecta para empezar o terminar tu ruta.

**Lo que la hace especial:** Ver Sa Palomera desde el nivel del agua, con los acantilados alzandose sobre ti, es una perspectiva que muy poca gente conoce.

## 5. Platja de S'Abanell (zona norte)

**Tiempo desde el puerto:** 5 minutos | **Distancia:** 1,5 km (rumbo norte) | **Snorkel:** Basico

S'Abanell es la playa mas larga de Blanes (mas de 2 km), pero la zona norte, cerca de la desembocadura del Tordera, tiene un caracter completamente distinto. Aqui la playa es ancha, la arena fina y la afluencia mucho menor que en el centro.

Desde el barco, la perspectiva de toda la bahia de Blanes con el Jardi Botanic Marimurtra al fondo es espectacular. Es un buen sitio para fondear si quieres arena y agua poco profunda sin las aglomeraciones del centro.

**Lo que la hace especial:** Las vistas panoramicas de la bahia de Blanes completa, con el pueblo, los jardines y las montanas de fondo.

## 6. Cala Treumal

**Tiempo desde el puerto:** 10 minutos | **Distancia:** 3 km | **Snorkel:** Bueno

Cala Treumal marca la frontera entre Blanes y [Lloret de Mar](/alquiler-barcos-lloret-de-mar). Es una playa rodeada de vegetacion subtropical gracias al cercano Jardin Botanico Pinya de Rosa. Las aguas son tranquilas y poco profundas, ideales para familias con ninos pequenos.

Tiene un chiringuito al que puedes acercarte nadando desde el barco fondeado. La combinacion de bano, snorkel y vermut es dificil de superar.

**Lo que la hace especial:** La vegetacion exotica que llega hasta la arena le da un aire tropical unico en la Costa Brava.

## 7. Playa de Santa Cristina

**Tiempo desde el puerto:** 12 minutos | **Distancia:** 3,5 km | **Snorkel:** Bueno

Santa Cristina es una playa de postal. Arena dorada, pinos maritimos que llegan hasta la orilla y la ermita de Santa Cristina en lo alto del acantilado. Es una de las playas mas fotografiadas de la Costa Brava y verla desde el mar es aun mejor que desde tierra.

El fondeo aqui es comodo y el agua tiene un color azul intenso que no encontraras en muchas otras playas de la zona.

**Lo que la hace especial:** La ermita romanica del siglo XIV coronando el acantilado crea un paisaje que parece sacado de otra epoca.

## 8. Roca de Ses Torretes

**Tiempo desde el puerto:** 8 minutos | **Distancia:** 2,5 km | **Snorkel:** Excelente

Entre Cala Bona y Cala Treumal hay un tramo de costa rocosa salvaje conocido como Ses Torretes. Aqui no hay playa, pero las formaciones rocosas crean pozas naturales y repisas donde puedes fondear el barco y bajar a explorar.

El snorkel es de nivel avanzado: las paredes rocosas caen verticalmente y estan cubiertas de gorgonias, esponjas y erizos. Es comun ver morenas, meros juveniles y bancos de castanuelas.

**Lo que la hace especial:** Es snorkel de verdad salvaje, sin ningun tipo de infraestructura humana a la vista. Te sientes como un explorador.

## 9. Cala dels Frares

**Tiempo desde el puerto:** 3 minutos | **Distancia:** 800 m | **Snorkel:** Muy bueno

Debajo del Jardin Botanico Marimurtra, en la punta del promontorio que separa Blanes del norte, hay una pequena ensenada rocosa conocida como Cala dels Frares. Desde tierra se ve pero no se puede bajar facilmente. En barco, puedes fondear y disfrutar de uno de los rincones mas tranquilos y bellos de Blanes.

Las aguas son profundas (4-6 metros junto a la costa) y muy claras. El fondo es de roca y posidonia, ideal para snorkel.

**Lo que la hace especial:** Las vistas del Jardin Botanico desde el nivel del agua, con las terrazas escalonadas y la vegetacion colgando sobre los acantilados, son magicas.

## 10. Cala de Sant Francesc Nord (la cala secreta)

**Tiempo desde el puerto:** 6 minutos | **Distancia:** 1,8 km | **Snorkel:** Excelente

Al norte de Cala Sant Francesc, separada por un pequeno promontorio rocoso, hay una mini-cala sin nombre oficial que los locales llaman "la cala secreta". No tiene mas de 15 metros de ancho, con cantos rodados y agua cristalina de color esmeralda.

No tiene acceso a pie (los acantilados la rodean por completo) y solo se puede llegar nadando desde Sant Francesc o directamente en barco. Incluso en pleno agosto, es raro encontrar mas de un par de barcos fondeados.

**Lo que la hace especial:** Es literalmente inaccesible sin barco. Si buscas exclusividad y soledad en el Mediterraneo en pleno verano, este es tu sitio.

---

## Que barco elegir para explorar las calas de Blanes

Todas estas calas estan a menos de 15 minutos del puerto, lo que las hace perfectas para un alquiler corto de 2 horas en un [barco sin licencia](/barcos-sin-licencia):

- [Astec 480](/barco/astec-480): El mas espacioso. Ideal para familias que quieren visitar 3-4 calas comodamente.
- [Solar 450](/barco/solar-450): Agil y maniobrable. Perfecto para parejas que quieren explorar los rincones mas estrechos.
- [Remus 450](/barco/remus-450): Estable y robusto. La mejor opcion para principiantes absolutos.

Si tienes licencia y quieres combinar calas cercanas con una escapada mas lejana a [Tossa de Mar](/alquiler-barcos-tossa-de-mar), el [Pacific Craft 625](/barco/pacific-craft-625) te permite hacerlo comodamente en una jornada de 4 horas.

## Consejos para visitar estas calas

- **Llega antes de las 11:00.** Las calas mas populares (Sant Francesc, Treumal) se llenan rapido en verano.
- **Lleva equipo de snorkel.** Puedes [anadirlo a tu reserva](/barcos) por solo 7,50 EUR.
- **Respeta el fondeo.** Evita anclar sobre praderas de posidonia. Busca fondos de arena para soltar el ancla.
- **Consulta nuestras [rutas recomendadas](/rutas)** para optimizar tu recorrido segun la duracion del alquiler.

[Reserva tu barco ahora](/barcos) y descubre estas calas por ti mismo. El Mediterraneo te espera a solo 5 minutos del puerto de Blanes.`,
  },

  // ===== POST: Sunset boat trip in Blanes =====
  {
    title: "Sunset boat trip in Blanes: the perfect evening experience",
    slug: "sunset-boat-trip-blanes-costa-brava",
    category: "Experiences",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/atardecer-mar.jpg",
    metaDescription: "Experience a magical sunset boat trip in Blanes, Costa Brava. No license needed, stunning coastal views, hidden coves and golden hour photography tips.",
    tags: ["sunset boat trip", "blanes sunset", "evening boat ride costa brava", "romantic boat trip", "atardecer barco blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-04-07T10:00:00Z"),
    excerpt: "Imagine gliding across the Mediterranean as the sun paints the sky in shades of gold and pink over the Costa Brava. A sunset boat trip from Blanes is the most magical way to end a summer day.",
    content: `There are few experiences on the Costa Brava that rival the magic of watching the sun set from the water. As the sky shifts from blue to gold to pink, and the cliffs of the coastline glow in warm amber light, you realize this is what Mediterranean summers are all about. A sunset boat trip from Blanes is, without exaggeration, one of the most beautiful experiences you can have on the Spanish coast.

## Why Blanes is perfect for sunset boat trips

Blanes sits at the southernmost tip of the Costa Brava, facing southwest across the Mediterranean. This orientation means that during summer evenings, the sun sets directly over the coastline, creating a spectacular backdrop of golden light reflecting off the water and illuminating the cliffs, coves, and pine forests along the shore.

From the port of Blanes, you are just minutes away from some of the most beautiful coastal scenery in Catalonia. The combination of dramatic cliffs, hidden coves, and crystal-clear water makes every sunset trip unique.

## No license needed

One of the best things about renting a boat in Blanes is that you do not need a boating license. Spanish law allows anyone over 18 to pilot boats under 5 meters with engines up to 15 HP. Our [boats without license](/barcos-sin-licencia) are easy to drive and we give you a full safety briefing before departure. Even if you have never been on a boat before, you will feel confident within minutes.

If you prefer to sit back and enjoy without worrying about navigation, our [private excursion with a captain](/barco/excursion-privada) is the perfect option. A professional skipper takes you on a curated route while you relax with drinks and watch the show.

## Best time of year for sunset trips

Sunset boat trips are available throughout our season from April to October. Here is what to expect each month:

### April - May
Sunset around 20:30-21:00. The sea is calm, the temperatures are pleasant (18-22C), and the coast is uncrowded. This is the most peaceful time for a sunset experience, though the water may be a bit cool for swimming.

### June
Sunset around 21:15-21:30. The longest days of the year mean extended golden hours. The water temperature is comfortable for swimming (around 22C). June offers the perfect balance between warm weather and fewer crowds.

### July - August
Sunset around 21:00-21:15. Peak summer with warm waters (24-26C) and long evenings. The light is intense and the sunsets are often the most dramatic, with vivid colors reflecting off the calm sea. Book well in advance as these are our most popular months.

### September - October
Sunset around 19:30-20:30. The angle of the sun creates particularly warm, golden light. September is arguably the best month for sunset photography, with slightly hazy skies that diffuse the light beautifully. Water is still warm (22-24C in September).

## Recommended duration: 2 hours

For a sunset boat trip, we recommend booking a **2-hour slot** that starts approximately 90 minutes before sunset. This gives you time to:

1. **Navigate to your chosen spot** (15-20 minutes)
2. **Swim and snorkel** in a hidden cove while the light is still good (30-40 minutes)
3. **Position your boat for the sunset** and enjoy the golden hour (30 minutes)
4. **Return to port** as twilight settles over the coast (15-20 minutes)

Check sunset times for your travel dates and book your time slot accordingly. You can make your reservation directly on our [boats page](/barcos).

## The best sunset routes from Blanes

### Route 1: Cala Sant Francesc (for couples)

Head south from the port to Cala Sant Francesc, just 5 minutes away. This stunning cove surrounded by pine-covered cliffs catches the last light of the day beautifully. Drop anchor, swim in the turquoise water, and watch the sun dip below the horizon from the most beautiful cove in [Blanes](/alquiler-barcos-blanes).

**Best boat:** [Solar 450](/barco/solar-450) or [Astec 400](/barco/astec-400) for an intimate experience.

### Route 2: Coastal cruise to Santa Cristina (for groups)

Navigate south past Cala Sant Francesc, Cala Bona, and Cala Treumal to reach the beach of Santa Cristina. The hermitage perched on the cliff above the beach is breathtaking in the sunset light. On the way back, hug the coastline and watch the cliffs change color as the light fades.

**Best boat:** [Astec 480](/barco/astec-480) for families, or [Pacific Craft 625](/barco/pacific-craft-625) for larger groups with a license.

### Route 3: Sa Palomera panoramic (quick and stunning)

If you want something shorter, simply cruise out to sea in front of Sa Palomera rock and the Blanes waterfront. From the water, you get a panoramic view of the entire town with the mountains behind. When the sun sets, the whole scene turns golden. This is the classic Blanes sunset shot.

## What to bring on your sunset trip

- **A light jacket or sweater.** The temperature drops noticeably once the sun goes down and the sea breeze picks up.
- **Drinks and snacks.** A bottle of cava, some cheese and olives, or whatever you enjoy. There is nothing quite like toasting the sunset from your own boat on the Mediterranean.
- **A camera.** Obviously. But more importantly, a dry bag or waterproof case for your phone. The best photos happen when you are also swimming.
- **Sunglasses.** Polarized lenses are essential on the water, especially when the sun is low.
- **Towels and a change of clothes.** If you plan to swim before sunset (you should), you will want to be dry and comfortable for the viewing.
- **Snorkel gear.** You can add it to your booking for just 7.50 EUR. The underwater light during golden hour is extraordinary.

## Photography tips for sunset boat trips

The light on the Costa Brava during golden hour is extraordinary. Here are some tips to capture it:

- **Shoot during the golden hour**, which starts about 1 hour before sunset. The light is warm, soft, and flattering.
- **Use the water as a mirror.** The reflection of the sunset on calm water doubles the drama.
- **Include the coastline.** The cliffs and pine trees silhouetted against the colored sky add depth and context.
- **Shoot from water level.** Lean close to the surface for dramatic perspective shots.
- **Face away from the sun sometimes.** The warm light illuminating the cliffs creates gorgeous landscapes.
- **Use portrait mode** on your phone for stunning photos of your travel companions with the sunset behind them.
- **Take video.** The gentle rocking of the boat, the sound of the water, and the changing light make for incredible short videos.

## Romantic sunset experience

A sunset boat trip is one of the most romantic activities on the Costa Brava. Imagine drifting in a hidden cove with your partner, a bottle of cava, and the sky exploding in color around you. No crowds, no noise, just the two of you and the Mediterranean.

For the ultimate romantic experience, we recommend:

- The [Solar 450](/barco/solar-450) for its intimate size and easy handling.
- A 2-hour booking starting 90 minutes before sunset.
- Cala Sant Francesc as your destination.
- A bottle of something sparkling and some local cheese and fuet.
- Snorkel gear for a swim together before the sun goes down.

## Pricing

Our [boats without license](/barcos-sin-licencia) start from 70 EUR per hour, with fuel included. A 2-hour sunset trip for two to four people is one of the best value experiences on the Costa Brava. Check our current [prices](/precios) for all options and seasonal rates.

---

A sunset boat trip in Blanes is more than just an activity. It is one of those rare moments where everything comes together: the light, the water, the coastline, and the feeling of complete freedom on the Mediterranean. It is the kind of experience you will remember long after your holiday is over.

[Book your sunset boat trip now](/barcos) and discover why the Costa Brava earned its name. If you have questions or want help choosing the perfect time slot, message us on [WhatsApp](https://wa.me/34611500372) and we will help you plan the perfect evening on the water.`,
  },

  // ===== POST: Alquiler barco Lloret de Mar precios guia =====
  {
    title: "Alquiler de Barco en Lloret de Mar: Precios, Opciones y Como Llegar desde Blanes",
    slug: "alquiler-barco-lloret-de-mar-precios-guia",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/ruta-costera.jpg",
    metaDescription: "Alquiler de barco en Lloret de Mar: precios desde 70 EUR/hora, como llegar desde Blanes, calas disponibles y barcos sin licencia y con licencia.",
    tags: ["alquiler barco lloret de mar", "barco lloret precio", "lloret de mar en barco", "lloret blanes barco"],
    isPublished: true,
    _publishedAt: new Date("2026-03-28T10:00:00Z"),
    excerpt: "Lloret de Mar no tiene puerto de alquiler propio, pero desde el Puerto de Blanes estas a solo 25 minutos en barco. Te explicamos precios, opciones sin licencia y con licencia, y las calas que puedes descubrir por el camino.",
    titleByLang: {
      es: "Alquiler de Barco en Lloret de Mar: Precios, Opciones y Como Llegar desde Blanes",
      en: "Boat Rental in Lloret de Mar: Prices, Options and How to Get There from Blanes",
    },
    excerptByLang: {
      es: "Lloret de Mar no tiene puerto de alquiler propio, pero desde el Puerto de Blanes estas a solo 25 minutos en barco. Te explicamos precios, opciones sin licencia y con licencia, y las calas que puedes descubrir por el camino.",
      en: "Lloret de Mar does not have its own rental port, but from Puerto de Blanes you are just 25 minutes away by boat. We explain prices, license-free and licensed options, and the coves you can discover along the way.",
    },
    content: `Si estas buscando alquilar un barco en Lloret de Mar, hay algo importante que debes saber: **Lloret no tiene un puerto de alquiler de embarcaciones de recreo**. La playa principal de Lloret es una bahia abierta sin instalaciones portuarias para alquiler turistico. Pero eso no significa que no puedas disfrutar de Lloret desde el mar. Todo lo contrario.

El **Puerto de Blanes** esta a solo 10 minutos en coche o 15 minutos en autobus desde Lloret de Mar, y desde ahi puedes navegar hacia las calas mas bonitas de la costa, incluyendo las que estan frente a Lloret. En esta guia te explicamos todas las opciones, precios y lo que puedes ver por el camino.

## Como llegar desde Lloret de Mar al Puerto de Blanes

El Puerto de Blanes se encuentra en la parte sur del paseo maritimo de Blanes. Llegar desde Lloret es muy sencillo:

- **En coche:** 10 minutos por la GI-682. Hay parking disponible junto al puerto (10 EUR/dia).
- **En autobus:** La linea conecta Lloret con Blanes cada 15-20 minutos. El trayecto dura unos 15 minutos y el billete cuesta menos de 3 EUR.
- **En taxi:** Unos 15-20 EUR desde el centro de Lloret.

Una vez en el puerto, nos encontraras en el pantalon principal. Te recomendamos llegar **15 minutos antes** de la hora reservada para el briefing de seguridad.

## Precios de alquiler de barco para ir a Lloret

### Barcos sin licencia (desde 70 EUR/hora)

No necesitas ningun titulo nautico. Te ensenamos a manejar el barco en un briefing de 10-15 minutos. **Gasolina, seguro y equipo de seguridad incluidos.**

| Barco | Capacidad | Precio desde (temporada baja) | Ideal para |
|-------|-----------|-------------------------------|------------|
| [Astec 400](/barco/astec-400) | 4 personas | 70 EUR/hora | Parejas, mejor precio |
| [Solar 450](/barco/solar-450) | 5 personas | 75 EUR/hora | Tomar el sol, solarium amplio |
| [Remus 450](/barco/remus-450) | 5 personas | 75 EUR/hora | Familias con ninos, estabilidad |
| [Astec 480](/barco/astec-480) | 5 personas | 80 EUR/hora | Premium, musica bluetooth |

**Importante:** Los barcos sin licencia pueden navegar hasta **2 millas nauticas** de la costa (unos 3,7 km). Esto significa que desde Blanes puedes llegar comodamente hasta la **playa de Fenals**, que esta a unos 5 km del puerto. Fenals es la segunda playa de Lloret, mas tranquila y familiar que la playa principal.

Sin embargo, **para llegar a la playa principal de Lloret de Mar** (que esta a unos 6 km del puerto de Blanes), la ruta costera supera el limite de 2 millas en algunos tramos. Para esa ruta necesitas un barco con licencia o nuestra excursion con capitan.

### Barcos con licencia (desde 160 EUR/2 horas)

Requieren titulacion nautica PER o PNB. **El combustible NO esta incluido** (se paga aparte al repostar).

| Barco | Capacidad | Precio desde (temporada baja) | Motor |
|-------|-----------|-------------------------------|-------|
| [Mingolla Brava 19](/barco/mingolla-brava-19) | 6 personas | 160 EUR/2h | Mercury 80cv |
| [Trimarchi 57S](/barco/trimarchi-57s) | 7 personas | 160 EUR/2h | Selva 110cv |
| [Pacific Craft 625](/barco/pacific-craft-625) | 7 personas | 180 EUR/2h | Yamaha 115cv |

Con un barco con licencia llegas a la playa de Lloret en **15 minutos** y puedes continuar hasta Tossa de Mar si quieres.

### Excursion privada con capitan (desde 240 EUR/2 horas)

Si no tienes licencia pero quieres un barco grande y llegar hasta Lloret o mas alla, nuestra [excursion privada con capitan](/barco/excursion-privada) es la solucion perfecta. Un patron profesional te lleva en el Pacific Craft 625 por las mejores calas. Tu solo te preocupas de disfrutar.

## Que puedes ver en barco de Blanes a Lloret

La ruta costera de Blanes hacia Lloret es una de las mas bonitas de la Costa Brava. Estas son las paradas que puedes hacer:

### 1. Cala Sant Francesc (5 min desde el puerto)

La primera parada y una de las mas impresionantes. Aguas turquesas, pinos hasta la orilla y un fondo marino espectacular para snorkel. Accesible con cualquier barco sin licencia.

### 2. Cala Bona (7 min desde el puerto)

Justo al lado de Sant Francesc, mas pequena y tranquila. Ideal para fondear en soledad, especialmente entre semana o a primera hora de la manana.

### 3. Cala Brava (10 min desde el puerto)

Una cala rocosa y salvaje con aguas cristalinas. Menos conocida que las anteriores, lo que la hace perfecta para quienes buscan tranquilidad absoluta. Excelente para snorkel.

### 4. Cala Treumal (10 min desde el puerto)

En el limite entre Blanes y Lloret, rodeada de vegetacion exuberante. Tiene un chiringuito con encanto accesible nadando desde el barco.

### 5. Playa de Santa Cristina (12 min desde el puerto)

Una playa de postal con la ermita de Santa Cristina en lo alto del acantilado. Arena dorada, pinos y aguas de un azul intenso. Uno de los paisajes mas fotografiados de la costa.

### 6. Playa de Fenals (15 min desde el puerto)

La playa familiar de Lloret. Mas tranquila que la playa principal, con aguas poco profundas y protegidas. **Este es el punto mas lejano al que puedes llegar comodamente con barco sin licencia.**

### 7. Playa de Lloret (20-25 min desde el puerto)

La gran playa de Lloret de Mar con el Castillo de Sa Caleta y la escultura de la Dona Marinera. Solo accesible con barco con licencia o excursion con capitan.

## Tabla comparativa: sin licencia vs con licencia para ir a Lloret

| | Sin licencia | Con licencia | Excursion con capitan |
|---|---|---|---|
| **Precio desde** | 70 EUR/h | 150 EUR/2h | 240 EUR/2h |
| **Llegas a Fenals** | Si | Si | Si |
| **Llegas a Lloret playa** | No | Si | Si |
| **Combustible incluido** | Si | No | No |
| **Necesitas titulo** | No | PER/PNB | No |
| **Duracion recomendada** | 3-4 horas | 4-6 horas | 2-4 horas |
| **Capacidad maxima** | 5 personas | 7 personas | 7 personas |

## Duracion recomendada para una excursion a Lloret

Si tu objetivo es **llegar hasta la zona de Lloret y disfrutar de las calas**, te recomendamos:

- **Con barco sin licencia:** Minimo **3 horas**, idealmente **4 horas**. Esto te da tiempo para navegar hasta Fenals (15 min), fondear y banarte (1-1,5h), explorar alguna cala intermedia (30 min) y volver al puerto con calma.
- **Con barco con licencia:** Minimo **4 horas** para llegar a Lloret playa, fondear, banarte y volver. Si quieres explorar varias calas, reserva **6-8 horas**.
- **Excursion con capitan:** Con **2 horas** ya puedes hacer una ruta espectacular. El capitan conoce los mejores rincones y optimiza el tiempo.

## Temporada y consejos meteorologicos

- **Mejor epoca:** De junio a septiembre. El mar esta mas calmado y la temperatura del agua es perfecta para banarse.
- **Mejor momento del dia:** Por la manana temprano (10:00-12:00) el mar suele estar como un plato. A partir de mediodia puede levantarse brisa de mar.
- **Dias ideales:** Entre semana encontraras menos trafico maritimo y las calas mas vacias.
- **Viento:** Si el parte anuncia tramontana (viento del norte), la ruta hacia Lloret estara mas protegida que la ruta norte hacia Tossa. Si hay levante (viento del este), mejor quedarse en las calas cercanas a Blanes.

## Extras que puedes anadir

Complementa tu experiencia con nuestros extras:

- **Nevera con hielo:** 5 EUR (imprescindible en verano)
- **Equipo de snorkel:** 7,50 EUR (las calas entre Blanes y Lloret tienen un fondo marino increible)
- **Paddle surf:** 25 EUR (perfecto para explorar cuevas y rincones)
- **Seascooter:** 50 EUR (propulsion submarina para snorkel avanzado)
- **Parking junto al barco:** 10 EUR/dia

## Como reservar

1. **Elige tu barco** en nuestra [pagina de barcos](/barcos)
2. **Selecciona fecha, hora y duracion** en el calendario
3. **Anade extras** si quieres
4. **Paga online** de forma segura con tarjeta
5. **Recibe confirmacion** por email y WhatsApp
6. **Ven al Puerto de Blanes** 15 minutos antes

---

Aunque Lloret de Mar no tiene puerto de alquiler propio, el Puerto de Blanes es tu puerta de entrada perfecta a toda la costa. Con barcos desde 70 EUR la hora y la posibilidad de llegar a Fenals sin licencia, no hay excusa para no descubrir Lloret desde el mar.

[Reserva tu barco ahora](/barcos) o escribenos por [WhatsApp](https://wa.me/34611500372) si tienes dudas sobre que barco elegir para tu excursion a Lloret.`,
  },

  // ===== POST: Barco Tossa de Mar desde Blanes =====
  {
    title: "Tossa de Mar en Barco desde Blanes: Vila Vella, Calas Virgenes y Precios",
    slug: "barco-tossa-de-mar-desde-blanes",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/ruta-costera.jpg",
    metaDescription: "Llega a Tossa de Mar en barco desde Blanes: Vila Vella desde el mar, calas virgenes, precios desde 160 EUR y excursion con capitan desde 240 EUR.",
    tags: ["tossa de mar barco", "barco blanes tossa", "vila vella barco", "excursion tossa de mar"],
    isPublished: true,
    _publishedAt: new Date("2026-03-30T10:00:00Z"),
    excerpt: "La ruta de Blanes a Tossa de Mar en barco es una de las experiencias mas impresionantes de la Costa Brava. Vila Vella desde el mar, calas inaccesibles y aguas cristalinas. Te contamos todo: precios, barcos, ruta y consejos.",
    titleByLang: {
      es: "Tossa de Mar en Barco desde Blanes: Vila Vella, Calas Virgenes y Precios",
      en: "Tossa de Mar by Boat from Blanes: Vila Vella, Hidden Coves and Prices",
    },
    excerptByLang: {
      es: "La ruta de Blanes a Tossa de Mar en barco es una de las experiencias mas impresionantes de la Costa Brava. Vila Vella desde el mar, calas inaccesibles y aguas cristalinas.",
      en: "The route from Blanes to Tossa de Mar by boat is one of the most impressive experiences on the Costa Brava. Vila Vella from the sea, hidden coves and crystal-clear waters.",
    },
    content: `Tossa de Mar es, probablemente, el pueblo mas bonito de la Costa Brava. Su recinto amurallado medieval, la Vila Vella, se levanta sobre un promontorio rocoso que se adentra en el mar, y la vista desde un barco es absolutamente espectacular. Si estas planeando visitar Tossa de Mar en barco desde Blanes, esta guia te explica todo lo que necesitas saber.

## Puedo llegar a Tossa de Mar con un barco sin licencia?

**La respuesta corta es no.** Tossa de Mar esta a unos 12 km del Puerto de Blanes siguiendo la costa. Los barcos sin licencia tienen un limite de navegacion de 2 millas nauticas (3,7 km) desde la costa, pero eso no es el problema principal. El problema es la **distancia y el tiempo**: con un motor de 15 CV, tardarias mas de 45 minutos en cada sentido navegando a velocidad maxima, lo que haria inviable una excursion de ida y vuelta en un alquiler de pocas horas.

Para llegar a Tossa necesitas un **barco con licencia** (PER o PNB) o nuestra **excursion privada con capitan**.

## Tiempo de navegacion Blanes - Tossa de Mar

| Barco | Motor | Tiempo aprox. |
|-------|-------|---------------|
| [Mingolla Brava 19](/barco/mingolla-brava-19) | Mercury 80cv | 25-30 min |
| [Trimarchi 57S](/barco/trimarchi-57s) | Selva 110cv | 20-25 min |
| [Pacific Craft 625](/barco/pacific-craft-625) | Yamaha 115cv | 20-25 min |
| [Excursion con capitan](/barco/excursion-privada) | Yamaha 115cv | 20-25 min |

Con un barco con licencia, la travesia es rapida y comoda. En 25 minutos estas fondeando frente a las murallas de la Vila Vella, una imagen que no olvidaras.

## Precios para ir a Tossa de Mar en barco

### Barcos con licencia

Requieren titulacion nautica PER o PNB. **El combustible NO esta incluido** y se paga aparte al repostar (calcula unos 30-50 EUR de gasolina para la ida y vuelta a Tossa, dependiendo del barco y la velocidad).

| Barco | Capacidad | Precio desde (temporada baja) | Duracion recomendada |
|-------|-----------|-------------------------------|----------------------|
| [Mingolla Brava 19](/barco/mingolla-brava-19) | 6 personas | 160 EUR/2h | 6-8 horas |
| [Trimarchi 57S](/barco/trimarchi-57s) | 7 personas | 160 EUR/2h | 6-8 horas |
| [Pacific Craft 625](/barco/pacific-craft-625) | 7 personas | 180 EUR/2h | 6-8 horas |

**Nuestra recomendacion:** Para una excursion a Tossa en condiciones, reserva **minimo 6 horas**, idealmente **8 horas** (dia completo). Dos horas son insuficientes: solo tendrias tiempo para ir y volver sin parar. Con 6-8 horas puedes navegar con calma, parar en varias calas por el camino, fondear frente a Tossa, banarte, comer a bordo y volver disfrutando de cada rincon.

### Excursion privada con capitan

Si no tienes licencia, nuestra [excursion privada con capitan](/barco/excursion-privada) es la mejor forma de llegar a Tossa. El capitan conoce cada cala, cada cueva y cada rincon secreto de la ruta.

| Duracion | Precio desde (temporada baja) |
|----------|-------------------------------|
| 2 horas | 240 EUR |
| 3 horas | 320 EUR |
| 4 horas | 380 EUR |

**Nota:** Con la excursion de 2 horas, el capitan adaptara la ruta para mostrarte lo maximo posible, pero probablemente no llegara hasta Tossa. Para llegar a Tossa y disfrutar de fondeo y bano, recomendamos **3-4 horas minimo**.

## La ruta: que ver de Blanes a Tossa de Mar

La navegacion de Blanes a Tossa es una sucesion de calas, acantilados y paisajes espectaculares. Estas son las paradas recomendadas:

### Salida del Puerto de Blanes

Desde el pantalon del puerto sales al mar abierto y pones rumbo norte. A tu izquierda, los acantilados del Jardi Botanic Marimurtra y las ultimas casas de Blanes.

### Parada 1: Cala Sant Francesc (5 min)

La primera cala importante. Aguas turquesas y un fondo marino perfecto para snorkel. Si llevas equipo, merece una parada rapida de 15-20 minutos.

### Parada 2: Santa Cristina y Fenals (10-15 min)

La playa de Santa Cristina con su ermita es preciosa desde el mar. Fenals es mas amplia y con aguas poco profundas. Buen punto para un primer bano.

### Parada 3: Lloret de Mar (20 min)

Pasas frente a la playa principal de Lloret. Desde el barco veras el Castillo de Sa Caleta en el extremo sur y la escultura de la Dona Marinera. No es necesario parar aqui si tu destino es Tossa, pero las vistas merecen la pena.

### Parada 4: Cala Canyelles (25 min)

La ultima cala importante antes de Tossa. Tiene un pequeno puerto deportivo y aguas muy limpias. Buena opcion para una parada si necesitas estirar las piernas.

### Parada 5: Cala Pola (30-35 min)

Una cala espectacular entre Lloret y Tossa, rodeada de acantilados cubiertos de pinos. Aguas increiblemente transparentes. Muchos dias la tendras casi para ti solo si llegas en barco.

### Parada 6: Cala Giverola (35 min)

Un anfiteatro natural de rocas y vegetacion con una playa de arena gruesa. El snorkel aqui es de los mejores de toda la costa. Cerca hay pequenas cuevas explorables en paddle surf o nadando.

### Llegada: Tossa de Mar (40-45 min con paradas)

Y por fin, Tossa. La vision de las **murallas de la Vila Vella** emergiendo del promontorio rocoso es una de las imagenes mas iconicas del Mediterraneo. Puedes fondear frente a la **Platja Gran** (la playa principal) o en la **Platja de Es Codolar**, una playa mas pequena justo al pie de las murallas.

## Vila Vella desde el mar

La Vila Vella de Tossa de Mar es el unico ejemplo de pueblo medieval fortificado que queda en la costa catalana. Desde el barco, la perspectiva es completamente diferente a la que se tiene desde tierra:

- Las **murallas del siglo XII** se elevan directamente sobre las rocas del acantilado
- Las **tres torres cilindricas** (Torre de les Hores, Torre d'en Jonama y Torre de Sa Guineu) se recortan contra el cielo
- En la base, las rocas forman pequenas calas y cuevas solo accesibles desde el mar
- Al atardecer, las murallas se tinen de un tono dorado espectacular

Es, sin duda, uno de los momentos mas memorables de cualquier vacacion en la Costa Brava.

## Donde fondear en Tossa de Mar

Hay varias opciones para fondear frente a Tossa:

- **Platja Gran:** La playa principal. Fondea a unos 50-100 metros de la orilla sobre arena. En verano puede haber bastantes barcos.
- **Es Codolar:** Playa pequena al pie de la Vila Vella. Mas protegida y con menos barcos. El lugar mas fotografiado.
- **Bahia norte:** Pasada la Vila Vella hacia el norte, hay varias calas rocosas tranquilas para fondear en soledad.

**Consejo:** Llega antes de las 12:00 para conseguir buen sitio. En agosto, la zona de fondeo frente a Platja Gran se llena.

## Consejos practicos para la ruta a Tossa

### Combustible

Recuerda que **el combustible NO esta incluido** en los barcos con licencia. Para la ruta ida y vuelta Blanes - Tossa:

- **Mingolla Brava 19** (80cv): Calcula unos 30-40 EUR de gasolina
- **Trimarchi 57S** (110cv): Calcula unos 40-50 EUR
- **Pacific Craft 625** (115cv): Calcula unos 40-50 EUR

El consumo varia segun la velocidad. Navegar a velocidad de crucero (no a maxima) reduce el consumo significativamente.

### Que llevar

- **Snorkel:** Las calas entre Blanes y Tossa tienen un fondo marino espectacular. Puedes alquilar equipo con nosotros (7,50 EUR)
- **Comida y bebida:** Si reservas un dia completo, lleva comida para un picnic a bordo. Alquila nuestra nevera (5 EUR) para mantener las bebidas frias
- **Proteccion solar:** Factor 50+ imprescindible. En el mar, la radiacion es mas intensa
- **Toallas y ropa de recambio:** Despues de un dia en el agua, agradeceras ropa seca para la vuelta
- **Calzado acuatico:** Para subir y bajar del barco comodamente

### Meteorologia

- **Comprueba el parte antes de salir.** La ruta a Tossa es mas expuesta que las calas cercanas a Blanes
- **Si hay tramontana** (viento norte) fuerte, la ruta puede estar movida. Consulta con nosotros antes de salir
- **El mar suele estar mas calmado** por la manana. Sal temprano y vuelve a primera hora de la tarde
- **Olas de levante:** Si el parte anuncia olas del este superiores a 1 metro, mejor postponer la ruta a Tossa y quedarse en calas protegidas cerca de Blanes

## Comparativa: barco propio vs excursion con capitan para ir a Tossa

| | Barco con licencia | Excursion con capitan |
|---|---|---|
| **Precio desde** | 150 EUR/2h + combustible | 240 EUR/2h (combustible no incluido) |
| **Necesitas licencia** | Si (PER/PNB) | No |
| **Libertad de ruta** | Total | El capitan adapta a tus preferencias |
| **Conocimiento local** | Depende de ti | El capitan conoce cada rincon |
| **Ideal para** | Navegantes experimentados | Familias, celebraciones, primera vez |

---

La ruta de Blanes a Tossa de Mar en barco es una de las experiencias imprescindibles de la Costa Brava. Las murallas medievales de la Vila Vella vistas desde el mar, las calas virgenes por el camino y la libertad de fondear donde quieras hacen de esta excursion algo unico.

[Reserva tu barco con licencia](/barcos-con-licencia) o nuestra [excursion privada con capitan](/barco/excursion-privada) y descubre Tossa de Mar como nunca antes la habias visto. Si tienes dudas sobre la ruta o las condiciones del mar, escribenos por [WhatsApp](https://wa.me/34611500372).`,
  },

  // ===== POST: Playas solo accesibles en barco Costa Brava =====
  {
    title: "7 Playas de la Costa Brava Solo Accesibles en Barco (Desde Blanes)",
    slug: "playas-solo-accesibles-barco-costa-brava",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/calas-costa-brava.jpg",
    metaDescription: "Descubre 7 playas y calas de la Costa Brava que solo puedes visitar en barco desde Blanes. Calas secretas, aguas cristalinas y snorkel increible.",
    tags: ["playas accesibles barco costa brava", "calas secretas costa brava", "playas escondidas barco", "calas costa brava barco"],
    isPublished: true,
    _publishedAt: new Date("2026-04-01T10:00:00Z"),
    excerpt: "Hay playas en la Costa Brava que solo puedes visitar si llegas en barco. Cuevas escondidas, calas sin nombre y rincones de agua cristalina entre Blanes y Tossa de Mar. Estas son las 7 mejores.",
    titleByLang: {
      es: "7 Playas de la Costa Brava Solo Accesibles en Barco (Desde Blanes)",
      en: "7 Beaches on the Costa Brava Only Accessible by Boat (From Blanes)",
    },
    excerptByLang: {
      es: "Hay playas en la Costa Brava que solo puedes visitar si llegas en barco. Cuevas escondidas, calas sin nombre y rincones de agua cristalina entre Blanes y Tossa de Mar.",
      en: "There are beaches on the Costa Brava that you can only visit by boat. Hidden caves, unnamed coves and crystal-clear spots between Blanes and Tossa de Mar.",
    },
    content: `La Costa Brava no seria la Costa Brava sin sus calas escondidas. Pero muchas de las mejores no tienen acceso por tierra, o el camino es tan complicado que casi nadie llega. La unica forma real de disfrutarlas es desde el mar. Y desde el Puerto de Blanes tienes acceso directo a todas ellas.

En esta guia te presentamos **7 playas y calas entre Blanes y Tossa de Mar que solo puedes visitar comodamente en barco**. Para cada una te explicamos como llegar, que barco necesitas y si merece la pena llevar equipo de snorkel.

## 1. Cala Brava

**Distancia desde el Puerto de Blanes:** 2 km (8 minutos en barco)
**Barco necesario:** Cualquier barco sin licencia
**Snorkel:** 9/10
**Mejor hora:** 10:00 - 13:00 (el sol ilumina el fondo marino)

Cala Brava es una de las joyas mas desconocidas de Blanes. Se encuentra entre Cala Sant Francesc y Cala Treumal, en un tramo de acantilados rocosos sin caminos de acceso facil. Existe un sendero desde la urbanizacion de arriba, pero es empinado, esta mal senalizado y en verano el calor lo hace poco recomendable.

Desde el barco, simplemente fondeas sobre la arena y te tiras al agua. El fondo marino aqui es excepcional: posidonia oceanica, bancos de sargos y obladas, y rocas cubiertas de gorgonias a poca profundidad. Si solo puedes hacer snorkel en un sitio de toda la Costa Brava, que sea aqui.

**Barco recomendado:** El [Astec 400](/barco/astec-400) (desde 70 EUR/hora) es perfecto para parejas que quieran esta cala en exclusiva. Si vais 4-5 personas, el [Remus 450](/barco/remus-450) o el [Solar 450](/barco/solar-450) (desde 75 EUR/hora) os daran mas espacio.

## 2. Las cuevas entre Cala Sant Francesc y Santa Cristina

**Distancia desde el Puerto de Blanes:** 2,5 km (10 minutos en barco)
**Barco necesario:** Barco sin licencia (mejor uno pequeno para acercarse a las rocas)
**Snorkel:** 8/10
**Mejor hora:** Por la manana, con el sol rasante sobre el agua

Entre Cala Sant Francesc y la playa de Santa Cristina hay un tramo de costa de unos 800 metros que la mayoria de barcas pasan de largo. Pero si reduces velocidad y te acercas a los acantilados, descubriras una serie de **pequenas cuevas y recovecos rocosos** donde el agua tiene un color turquesa increible.

No son playas propiamente dichas: son formaciones rocosas con pequenas piscinas naturales donde puedes fondear a pocos metros y nadar entre las rocas. Algunas cuevas tienen profundidad suficiente para entrar nadando o en paddle surf.

**Lo que hace este sitio especial** es que incluso en pleno agosto, cuando todas las calas conocidas estan llenas, estos rincones suelen estar vacios. La mayoria de barcos van directos a Cala Sant Francesc o Santa Cristina y se saltan este tramo.

**Consejo:** Alquila un paddle surf (25 EUR) con nosotros. Es la mejor forma de explorar las cuevas desde dentro, ya que el barco no puede entrar.

## 3. La cara oculta de Cala Boadella

**Distancia desde el Puerto de Blanes:** 4 km (12 minutos en barco)
**Barco necesario:** Barco sin licencia
**Snorkel:** 7/10
**Mejor hora:** Manana para snorkel, tarde para sol

Cala Boadella es una playa conocida de Lloret de Mar con acceso por tierra, pero tiene un secreto: su **extremo norte** (el mas cercano a Blanes) tiene una seccion rocosa separada del resto de la playa por grandes bloques de piedra. Desde tierra es practicamente inaccesible, ya que hay que trepar por rocas resbaladizas.

Desde el barco, simplemente fondeas frente a esta seccion y tienes tu propia playa semi-privada. Las rocas crean piscinas naturales poco profundas que son perfectas para ninos y para snorkel tranquilo. El fondo es de roca y posidonia, con muchos peces.

**Dato curioso:** En los anos 70 y 80, esta seccion de la playa era una zona naturista. Hoy en dia es mixta, pero sigue manteniendo un ambiente mucho mas tranquilo y natural que el resto de Boadella.

**Barco recomendado:** El [Astec 480](/barco/astec-480) (desde 80 EUR/hora) con su equipo de musica bluetooth convierte esta parada en una experiencia premium.

## 4. Micro-calas entre Lloret y Tossa

**Distancia desde el Puerto de Blanes:** 8-10 km (25-30 minutos en barco)
**Barco necesario:** Barco con licencia (la distancia supera la zona practica de los sin licencia)
**Snorkel:** 10/10
**Mejor hora:** Todo el dia (las paredes rocosas crean sombra natural)

El tramo de costa entre la playa de Lloret y Cala Canyelles es uno de los mas salvajes de toda la Costa Brava. Los acantilados caen directamente al mar, sin caminos, sin urbanizaciones, sin nada. Y en la base de esos acantilados hay **docenas de micro-calas sin nombre** que solo se pueden visitar en barco.

Hablamos de rincones de 10-20 metros de ancho, con paredes rocosas verticales cubiertas de vegetacion, aguas tan cristalinas que ves el fondo a 8-10 metros y una vida marina excepcional. Algunos tienen pequenas cuevas submarinas que puedes explorar con snorkel.

**Por que necesitas barco con licencia:** No es solo por la distancia. Estas micro-calas requieren un motor con potencia suficiente para maniobrar cerca de las rocas con seguridad. Los barcos con licencia, como la [Mingolla Brava 19](/barco/mingolla-brava-19) (desde 160 EUR/2h), tienen la maniobrabilidad necesaria.

**Consejo del capitan:** Si contratas nuestra [excursion privada con capitan](/barco/excursion-privada) (desde 240 EUR/2h), el patron conoce exactamente donde estan las mejores micro-calas de este tramo. Es conocimiento que no sale en ningun mapa.

## 5. Cala Pola

**Distancia desde el Puerto de Blanes:** 10 km (30 minutos en barco con licencia)
**Barco necesario:** Barco con licencia o excursion con capitan
**Snorkel:** 9/10
**Mejor hora:** 10:00 - 14:00

Cala Pola se encuentra a medio camino entre Lloret y Tossa de Mar. Tecnicamente tiene un acceso por tierra a traves de un camino de ronda, pero el sendero es largo y empinado, lo que significa que la gran mayoria de visitantes no llega. En barco, estas ahi en media hora desde Blanes.

La cala en si es un anfiteatro natural de rocas y pinos que llegan hasta el agua. La arena es gruesa y el agua tiene esa transparencia que solo encuentras en sitios sin rios cercanos. El snorkel en las rocas laterales es espectacular: peces de colores, erizos (cuidado donde pisas), y si tienes suerte, algun pulpo escondido entre las grietas.

**Lo que la hace unica:** Al estar lejos de cualquier nucleo urbano y con acceso terrestre dificil, Cala Pola mantiene un ambiente de cala virgen incluso en pleno agosto. Es uno de esos sitios donde sientes que has descubierto algo que nadie mas conoce.

**Barco recomendado:** El [Trimarchi 57S](/barco/trimarchi-57s) (desde 160 EUR/2h) combina velocidad para llegar rapido con espacio y confort para hasta 7 personas.

## 6. Calas al norte de Tossa (zona Cala Giverola)

**Distancia desde el Puerto de Blanes:** 11-12 km (35 minutos en barco con licencia)
**Barco necesario:** Barco con licencia o excursion con capitan
**Snorkel:** 10/10
**Mejor hora:** Por la manana (el sol entra directo en la cala)

Justo al norte de Tossa de Mar, pasada la Vila Vella, hay un tramo de costa con varias calas espectaculares. La mas conocida es **Cala Giverola**, un anfiteatro natural de rocas y pinos con un hotel en la parte alta, pero lo interesante esta en las **calas mas pequenas que la rodean**.

Hay al menos 4-5 rincones rocosos sin nombre entre Cala Giverola y la Platja de Llorell que solo se ven desde el mar. Paredes de roca cubiertas de liquen naranja, aguas de color esmeralda y fondos marinos que rivalizan con los mejores del Mediterraneo.

**Snorkel de nivel mundial:** Las rocas submarinas al norte de Tossa estan cubiertas de gorgonias rojas y amarillas. Es uno de los mejores puntos de snorkel de toda la Costa Brava. Si te gusta la biologia marina, este tramo es imprescindible.

**Barco recomendado:** El [Pacific Craft 625](/barco/pacific-craft-625) (desde 180 EUR/2h) es nuestra mejor embarcacion y la mas comoda para un dia completo explorando esta zona. Con solárium doble, mesa para comer a bordo y ducha de agua dulce, es como tener tu propio yate privado.

## 7. Los rincones secretos del capitan

**Distancia desde el Puerto de Blanes:** Variable
**Barco necesario:** Excursion privada con capitan
**Snorkel:** Variable (el capitan te lleva al mejor sitio del dia)
**Mejor hora:** Cuando el capitan diga

Esta ultima entrada no es un lugar concreto, sino una experiencia. Nuestro patron profesional lleva anos navegando esta costa y conoce rincones que no aparecen en ninguna guia, ninguna web y ninguna app. Pequenas cuevas donde el agua brilla azul electrico, rocas donde se concentran bancos de peces enormes, corrientes que crean piscinas de agua caliente junto a la costa.

Lo mas interesante es que **el mejor sitio cambia cada dia**. Depende del viento, la corriente, la hora y la epoca del ano. El capitan lee las condiciones del dia y te lleva al rincon que estara perfecto en ese momento.

**Que incluye la excursion:** El [capitan te lleva en el Pacific Craft 625](/barco/excursion-privada), un barco de 6,24 metros con capacidad para 7 personas. Desde 240 EUR por 2 horas. El capitan adapta la ruta a tus preferencias: snorkel, calas virgenes, vistas de Vila Vella o un mix de todo.

**Para quien es ideal:** Familias con ninos (el capitan se encarga de todo), celebraciones (cumpleanos, aniversarios), y cualquiera que quiera la experiencia mas exclusiva y personalizada de la costa.

## Que barco necesito? Resumen rapido

| Playa/Cala | Sin licencia | Con licencia | Excursion capitan |
|------------|:---:|:---:|:---:|
| 1. Cala Brava | Si | Si | Si |
| 2. Cuevas Sant Francesc - Santa Cristina | Si | Si | Si |
| 3. Cala Boadella (cara oculta) | Si | Si | Si |
| 4. Micro-calas Lloret - Tossa | No | Si | Si |
| 5. Cala Pola | No | Si | Si |
| 6. Calas norte de Tossa | No | Si | Si |
| 7. Rincones secretos del capitan | No | No | Si |

## Extras imprescindibles para estas calas

Si tu plan es explorar calas escondidas, estos son los extras que recomendamos:

- **Equipo de snorkel** (7,50 EUR): Absolutamente imprescindible. Estas calas tienen el mejor fondo marino de la Costa Brava.
- **Paddle surf** (25 EUR): Para entrar en cuevas y explorar rincones donde el barco no llega.
- **Seascooter** (50 EUR): Propulsion submarina para cubrir mas distancia haciendo snorkel. Espectacular en las micro-calas entre Lloret y Tossa.
- **Nevera** (5 EUR): Imprescindible para mantener agua y bebidas frias todo el dia.
- **Adventure Pack** (75 EUR): Incluye nevera + snorkel + paddle surf + seascooter. El pack completo para un dia de exploracion.

## Consejos finales

- **Reserva para dia completo** si quieres visitar las calas mas lejanas (puntos 4-7). Necesitas 6-8 horas minimo.
- **Sal temprano.** Las calas estan mas vacias y el mar mas calmado por la manana.
- **Lleva comida.** En estas calas no hay chiringuitos ni servicios. Es parte de su encanto.
- **Respeta el medio ambiente.** No dejes basura, no toques la posidonia y no ancles sobre praderas de posidonia (busca fondos de arena).
- **Proteccion solar.** En calas con paredes rocosas la reflexion del agua multiplica la radiacion UV.

---

La Costa Brava tiene cientos de calas, pero las que solo puedes visitar en barco son las que realmente merecen ese nombre de "brava". Salvajes, cristalinas y con la sensacion de ser el unico ser humano en kilometros.

[Reserva tu barco](/barcos) y descubre las calas que ningun turista a pie podra visitar jamas. O dejate llevar por nuestro [capitan experto](/barco/excursion-privada) y conoce rincones que no salen en ninguna guia.`,
  },

  // ===== POST: Alquiler barco cumpleanos despedida Costa Brava =====
  {
    title: "Cumpleanos y Celebraciones en Barco: Guia para Eventos en la Costa Brava",
    slug: "alquiler-barco-cumpleanos-despedida-costa-brava",
    category: "Aventuras",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/grupos-barco.jpg",
    metaDescription: "Organiza tu cumpleanos, despedida de soltera o celebracion en barco en la Costa Brava. Barcos para grupos, extras, precios y consejos practicos.",
    tags: ["barco cumpleanos costa brava", "despedida soltera barco blanes", "celebracion barco", "fiesta barco costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-04-03T10:00:00Z"),
    excerpt: "Cumpleanos, despedida de soltera, aniversario o simplemente una celebracion especial: un barco privado en la Costa Brava es la forma mas original y memorable de hacerlo. Te explicamos todo: barcos, precios, extras y consejos.",
    titleByLang: {
      es: "Cumpleanos y Celebraciones en Barco: Guia para Eventos en la Costa Brava",
      en: "Birthday and Celebration Boat Trips: Guide for Events on the Costa Brava",
    },
    excerptByLang: {
      es: "Cumpleanos, despedida de soltera, aniversario o simplemente una celebracion especial: un barco privado en la Costa Brava es la forma mas original y memorable de hacerlo.",
      en: "Birthday, hen party, anniversary or simply a special celebration: a private boat on the Costa Brava is the most original and memorable way to do it.",
    },
    content: `Hay celebraciones que se olvidan al dia siguiente y hay celebraciones que recuerdas toda la vida. Un cumpleanos fondeados en una cala de agua cristalina, una despedida de soltera con musica y banos en el Mediterraneo, un aniversario viendo el atardecer desde el mar. En la Costa Brava, un barco privado convierte cualquier evento en algo extraordinario.

En esta guia te explicamos como organizar tu celebracion perfecta en barco desde el Puerto de Blanes: que barco elegir, cuanto cuesta, que extras anadir y todos los consejos practicos para que todo salga perfecto.

## El mejor barco para celebraciones y grupos

### Para grupos grandes (6-7 personas): Pacific Craft 625

El [Pacific Craft 625](/barco/pacific-craft-625) es nuestra embarcacion estrella para celebraciones. Con **6,24 metros de eslora** y capacidad para **7 personas**, ofrece todo lo que necesitas para un evento en el mar:

- **Solarium doble** (proa y popa) para tomar el sol todo el grupo
- **Mesa central** para poner comida, bebida o la tarta de cumpleanos
- **Ducha de agua dulce** para quitarse la sal despues de cada bano
- **Motor Yamaha 115cv** para llegar a las mejores calas rapidamente
- **Bluetooth y altavoces** para poner vuestra musica favorita

**Precios desde:**
| Duracion | Temporada baja | Temporada media (julio) | Temporada alta (agosto) |
|----------|---------------|------------------------|------------------------|
| 2 horas | 180 EUR | 200 EUR | 220 EUR |
| 4 horas | 250 EUR | 280 EUR | 320 EUR |
| 8 horas | 300 EUR | 360 EUR | 420 EUR |

**Requiere licencia nautica** (PER o PNB). Si nadie del grupo tiene licencia, la excursion con capitan es vuestra opcion.

### Para grupos grandes sin licencia: Excursion con capitan

La [excursion privada con capitan](/barco/excursion-privada) es la opcion perfecta para celebraciones donde **nadie tiene licencia nautica**. Un patron profesional os lleva en el Pacific Craft 625 por las mejores calas mientras vosotros solo os preocupais de pasarlo bien.

**Precios desde:**
| Duracion | Temporada baja | Temporada media (julio) | Temporada alta (agosto) |
|----------|---------------|------------------------|------------------------|
| 2 horas | 240 EUR | 260 EUR | 280 EUR |
| 3 horas | 320 EUR | 340 EUR | 360 EUR |
| 4 horas | 380 EUR | 400 EUR | 420 EUR |

**Ventajas para celebraciones:**
- No necesitais licencia
- El capitan se encarga de la navegacion y el fondeo
- Conoce las mejores calas para cada tipo de celebracion
- Podeis dedicar toda vuestra atencion a disfrutar

### Para grupos medianos (5 personas): Astec 480

Si sois un grupo de hasta 5 personas, el [Astec 480](/barco/astec-480) es una excelente opcion **sin necesidad de licencia**:

- **Musica bluetooth** integrada
- **Solarium acolchado** amplio
- **Gasolina incluida** (sin sorpresas al final)
- Desde **80 EUR/hora** en temporada baja

El Astec 480 es especialmente popular para cumpleanos intimos y aniversarios de pareja o grupos pequenos.

### Para parejas o grupos de 4: Astec 400

El [Astec 400](/barco/astec-400) es la opcion mas economica, perfecta para un aniversario romantico o un cumpleanos intimo:

- Capacidad para 4 personas
- **Sin licencia** necesaria
- Desde **70 EUR/hora** en temporada baja
- Gasolina, seguro y equipo incluidos

## Que se puede hacer en una celebracion en barco

### Fondear en una cala privada

Lo mejor de un barco es que puedes elegir tu propia "playa privada". Desde el puerto de Blanes tienes decenas de calas accesibles. El capitan o nuestro equipo te recomendaran la mejor cala del dia segun el viento y las condiciones.

Fondeais el barco, os tirais al agua, nadais, haceis snorkel y disfrutais de la cala como si fuera vuestra. Sin toallas apinadas, sin sombrillas y sin ruido.

### Musica y ambiente

Los barcos [Astec 480](/barco/astec-480), [Mingolla Brava 19](/barco/mingolla-brava-19), [Trimarchi 57S](/barco/trimarchi-57s) y [Pacific Craft 625](/barco/pacific-craft-625) tienen **equipo de musica bluetooth**. Conectais vuestro movil y poneis vuestra playlist favorita. Musica sonando mientras fondeais en una cala de agua turquesa: asi se celebra en la Costa Brava.

### Picnic a bordo

Los barcos con licencia y la excursion con capitan tienen **mesa** donde podeis montar un picnic completo. Quesos, embutido, fruta, una botella de cava y la tarta de cumpleanos. Alquilad nuestra nevera (5 EUR) para mantener todo fresco.

**Consejo:** Llevad la comida en tuppers estables y la tarta en un recipiente rigido y bien cerrado. El mar puede moverse, asi que evitad envases abiertos.

### Actividades acuaticas

Anadid diversión con nuestros extras:

- **Paddle surf** (25 EUR): Perfecto para competiciones amistosas o para explorar cuevas cercanas
- **Seascooter** (50-60 EUR): Propulsion submarina para snorkel. Diversion garantizada para todos
- **Equipo de snorkel** (7,50 EUR): Las calas de la Costa Brava tienen un fondo marino espectacular
- **GoPro** (30 EUR): Grabad toda la experiencia bajo el agua y sobre cubierta

### El Adventure Pack

Para celebraciones, recomendamos nuestro **Adventure Pack** por **75 EUR**:
- Nevera con hielo
- Equipo de snorkel
- Paddle surf
- Seascooter

Es el complemento perfecto para un dia completo de celebracion en el mar.

## Ideas para cada tipo de celebracion

### Cumpleanos

- **Barco recomendado:** [Pacific Craft 625](/barco/pacific-craft-625) o [excursion con capitan](/barco/excursion-privada)
- **Duracion:** 4 horas minimo
- **Ruta:** Salida del puerto, cala para bano y picnic, vuelta con musica
- **Toque especial:** Llevad la tarta en un tupper rigido, cuchillo de plastico y platos. Cantad el cumpleanos feliz fondeados en una cala. Momento inolvidable.

### Despedida de soltera o soltero

- **Barco recomendado:** [Excursion con capitan](/barco/excursion-privada) (nadie se preocupa de conducir)
- **Duracion:** 3-4 horas
- **Ruta:** El capitan os lleva a las calas mas espectaculares
- **Toque especial:** Decorad el barco con globos y carteles (nada que pueda salir volando al mar). Musica, banos y mucho paddle surf.

### Aniversario romantico

- **Barco recomendado:** [Astec 400](/barco/astec-400) o [Solar 450](/barco/solar-450)
- **Duracion:** 2-3 horas, idealmente al atardecer
- **Ruta:** Cala Sant Francesc, fondear y disfrutar de la tranquilidad
- **Toque especial:** Llevad una botella de cava y algo para picar. El atardecer desde una cala sin nadie alrededor es puro romanticismo.

### Reunion familiar

- **Barco recomendado:** [Astec 480](/barco/astec-480) o [Remus 450](/barco/remus-450) (sin licencia, facil para todos)
- **Duracion:** 3-4 horas
- **Ruta:** Calas cercanas con aguas poco profundas, perfectas para ninos
- **Toque especial:** El paddle surf es un exito total con ninos y adolescentes. La nevera con bebidas frias mantiene a todos contentos.

## Lo que dicen nuestros clientes

Nuestros clientes valoran especialmente las celebraciones en barco. Con mas de **307 resenas en Google** y una puntuacion media de **4,8 estrellas**, estos son algunos comentarios reales de clientes que celebraron eventos con nosotros:

- "Hicimos la despedida de soltera de mi amiga y fue el mejor plan que hemos hecho nunca. El capitan nos llevo a unas calas preciosas."
- "Celebramos el cumpleanos de mi hijo de 10 anos. Los ninos no querian volver al puerto."
- "Aniversario de boda perfecto. Cava, atardecer y una cala para nosotros solos."
- "Grupo de 7 amigos, dia completo. La mejor experiencia de nuestras vacaciones en la Costa Brava."

## Consejos practicos para celebraciones en barco

### Reserva con antelacion

Las celebraciones requieren planificacion. En temporada alta (julio-agosto), los barcos grandes se reservan con semanas de antelacion, especialmente para fines de semana. **Reserva con al menos 7-10 dias** de margen.

### Elige el horario de manana

Para celebraciones, recomendamos el **slot de manana** (10:00 - 14:00) por varias razones:
- El mar esta mas calmado (menos probabilidad de mareo)
- Las calas estan mas vacias
- La luz es perfecta para fotos
- Despues podeis seguir la celebracion en tierra por la tarde

Si prefieres **atardecer**, reserva el ultimo slot del dia. Los atardeceres desde el barco son espectaculares, pero el mar puede estar mas movido por la tarde.

### Designa un patron sobrio

Si alquilais un barco con licencia y planeais beber alcohol, **la persona que conduce el barco NO puede beber**. Es la ley, es sentido comun y es por vuestra seguridad. Si todos quereis disfrutar sin restricciones, la [excursion con capitan](/barco/excursion-privada) es la opcion: el patron profesional conduce y vosotros celebrais.

### Proteccion solar

En el mar, la radiacion solar se multiplica por la reflexion del agua. Usad **factor 50+**, renovadlo cada 2 horas y no olvideis cuello, orejas y empeines de los pies. Un dia de celebracion arruinado por quemaduras solares no es un buen recuerdo.

### Que llevar

- Proteccion solar y gorra
- Toallas
- Comida y bebida (en tuppers y envases cerrados)
- Tarta en recipiente rigido
- Ropa de recambio seca
- Funda impermeable para moviles
- Calzado acuatico
- Buen humor

### Que NO llevar

- Objetos que se lleve el viento (globos de helio, confeti suelto)
- Cristal (usar vasos y platos de plastico)
- Demasiado equipaje (el espacio en un barco es limitado)

## Como reservar tu celebracion

1. **Elige barco y duracion** en nuestra [pagina de barcos](/barcos)
2. **Anade extras** (Adventure Pack recomendado para grupos)
3. **Paga online** con tarjeta de forma segura
4. **Escribenos por [WhatsApp](https://wa.me/34611500372)** si quieres planificar algo especial o tienes peticiones
5. **Presentaos en el puerto** 15 minutos antes con todo lo necesario

---

Una celebracion en barco en la Costa Brava no es solo un plan original: es una experiencia que vuestro grupo recordara durante anos. El mar, las calas, la musica, los banos y esa sensacion de libertad total hacen que cualquier evento sea infinitamente mejor sobre el agua.

[Reserva tu barco para la proxima celebracion](/barcos) o contactanos por [WhatsApp](https://wa.me/34611500372) para que te ayudemos a planificar el evento perfecto.`,
  },
];

/**
 * Seeds the database with 28 SEO blog posts.
 * Handles duplicate slugs gracefully by upserting existing posts.
 * After creation, updates publishedAt to the staggered date.
 */
export async function seedBlogPosts(storageInstance: IStorage): Promise<number> {
  let created = 0;
  let updated = 0;

  for (const postData of blogPostsData) {
    try {
      // Check if post with this slug already exists
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

      // Extract the custom publishedAt and remove it from insert data
      const { _publishedAt, ...insertData } = postData;

      // Create the blog post
      const post = await storageInstance.createBlogPost(insertData);

      // Update publishedAt to the staggered date (createBlogPost sets it to now())
      await storageInstance.updateBlogPost(post.id, {
        publishedAt: _publishedAt,
      } as any);

      created++;
      logger.info("Created blog post", { title: postData.title, slug: postData.slug });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to create blog post", { slug: postData.slug, error: message });
    }
  }

  logger.info("Blog seed complete", { created, updated, total: blogPostsData.length });
  return created;
}
