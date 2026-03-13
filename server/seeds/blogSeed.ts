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
    title: "Las 10 Mejores Calas de la Costa Brava para Visitar en Barco",
    slug: "mejores-calas-costa-brava-en-barco",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/mejores-calas-costa-brava-en-barco.jpg",
    metaDescription: "Descubre las 10 mejores calas de la Costa Brava accesibles en barco desde Blanes. Calas secretas, aguas cristalinas y rutas recomendadas.",
    tags: ["mejores calas costa brava", "calas costa brava barco", "calas secretas", "calas blanes", "costa brava en barco"],
    isPublished: true,
    _publishedAt: new Date("2026-03-16T10:00:00Z"),
    excerpt: "Desde Cala Sant Francesc hasta Cala Giverola, te presentamos las 10 calas más espectaculares entre Blanes y Tossa de Mar que solo puedes disfrutar plenamente llegando en barco.",
    content: `La Costa Brava esconde algunos de los rincones más bonitos del Mediterráneo, y la mejor forma de descubrirlos es navegando. Desde el puerto de Blanes, tienes acceso directo a decenas de calas de aguas cristalinas, muchas de ellas inaccesibles por tierra o con accesos complicados. En esta guía te presentamos las **10 mejores calas entre Blanes y Tossa de Mar** que puedes visitar alquilando un barco con nosotros.

## 1. Cala Sant Francesc

**Distancia desde el puerto de Blanes:** 1,5 km (5 minutos en barco)

Cala Sant Francesc es, para muchos, la joya escondida de Blanes. Rodeada de pinos y acantilados, esta cala ofrece aguas turquesas poco profundas ideales para el snorkel. Aunque se puede llegar a pie, el acceso en barco te permite disfrutarla sin las caminatas empinadas y llegar antes que la mayoría de visitantes.

**Por qué es especial:** Fue declarada una de las mejores playas de España. El fondo marino es espectacular para hacer snorkel.

**Barco recomendado:** Cualquiera de nuestros [barcos sin licencia](/barcos) como el [Solar 450](/barco/solar-450) o el [Remus 450](/barco/remus-450) son perfectos para esta escapada rápida.

## 2. Cala Bona

**Distancia desde el puerto de Blanes:** 2 km (7 minutos en barco)

Situada justo al lado de Cala Sant Francesc, Cala Bona es más pequeña y tranquila. Su nombre lo dice todo: es una cala "buena" en todos los sentidos. Aguas calmadas, arena fina y un entorno natural protegido.

**Por qué es especial:** Al ser más pequeña, suele estar menos concurrida. Perfecta para fondear y darse un baño en completa tranquilidad.

**Barco recomendado:** El [Astec 400](/barco/astec-400) es ideal para parejas que buscan intimidad en esta cala.

## 3. Sa Palomera

**Distancia desde el puerto de Blanes:** 0,3 km (2 minutos en barco)

La icónica roca de Sa Palomera marca la división entre las dos playas principales de Blanes. Desde el mar, las vistas de esta formación rocosa son impresionantes. No es una cala para fondear largo tiempo, pero sí para disfrutar del paisaje único desde una perspectiva que pocos conocen.

**Por qué es especial:** Es el símbolo de Blanes y el punto donde comienza oficialmente la Costa Brava. Las vistas desde el mar son inigualables.

## 4. Cala Treumal

**Distancia desde el puerto de Blanes:** 3 km (10 minutos en barco)

Cala Treumal se encuentra en el límite entre Blanes y Lloret de Mar. Es una playa rodeada de vegetación exuberante con un chiringuito con encanto. Las aguas son tranquilas y poco profundas, perfectas para familias con niños.

**Por qué es especial:** Combina naturaleza virgen con servicios. Puedes fondear el barco y acercarte nadando para tomar algo en el chiringuito.

**Barco recomendado:** El [Astec 480](/barco/astec-480) con su equipo de música bluetooth es genial para pasar una mañana relajada aquí.

## 5. Playa de Santa Cristina

**Distancia desde el puerto de Blanes:** 3,5 km (12 minutos en barco)

Santa Cristina es una playa de postal: arena dorada, pinos hasta la orilla y aguas de un azul intenso. La ermita de Santa Cristina en lo alto del acantilado completa un paisaje de ensueño.

**Por qué es especial:** Considerada una de las playas más bonitas de la Costa Brava. El contraste entre el verde de los pinos y el azul del mar es fotográfico.

## 6. Playa de Fenals

**Distancia desde el puerto de Blanes:** 5 km (15 minutos en barco)

Fenals es la playa más familiar de Lloret de Mar. Más tranquila que la playa principal de Lloret, ofrece buen fondeo y aguas cristalinas. Es un buen punto intermedio si planeas una ruta más larga hacia Tossa.

**Por qué es especial:** Aguas poco profundas y protegidas del oleaje. Ideal para familias y para descansar durante una ruta más larga.

## 7. Cala Canyelles

**Distancia desde el puerto de Blanes:** 7 km (20 minutos en barco)

Cala Canyelles es la única cala entre Lloret y Tossa con un pequeño puerto deportivo. Sus aguas profundas y limpias la convierten en un paraíso para el snorkel y el submarinismo.

**Por qué es especial:** Ambiente más exclusivo y menos masificado que las playas de Lloret. Tiene un club náutico donde puedes amarrar temporalmente.

**Barco recomendado:** Para llegar cómodamente, te recomendamos el [Pacific Craft 625](/barco/pacific-craft-625) o la [Mingolla Brava 19](/barco/mingolla-brava-19) si tienes licencia.

## 8. Platja de Lloret

**Distancia desde el puerto de Blanes:** 6 km (18 minutos en barco)

La playa principal de Lloret de Mar ofrece una perspectiva totalmente diferente desde el mar. El castillo de Sa Caleta en el extremo sur y la escultura de la Doña Marinera son iconos que se aprecian mejor desde el agua.

**Por qué es especial:** Las vistas del skyline de Lloret y el Castillo de Sa Caleta desde el barco son espectaculares. Puedes fondear y nadar hasta la playa.

## 9. Cala Banys

**Distancia desde el puerto de Blanes:** 8 km (25 minutos en barco)

Cala Banys es una pequeña cala rocosa al sur de Lloret con las ruinas de unos antiguos baños romanos. Es un lugar con mucha historia y un fondo marino ideal para explorar con snorkel.

**Por qué es especial:** Las ruinas romanas visibles junto al agua le dan un aire único. El snorkel aquí es excepcional gracias a las formaciones rocosas submarinas.

## 10. Cala Giverola

**Distancia desde el puerto de Blanes:** 15 km (40 minutos en barco)

Cala Giverola es la más lejana de nuestra lista pero merece cada minuto de navegación. Enclavada entre acantilados cubiertos de pinos, sus aguas son de un verde esmeralda impresionante. Es una de las calas más fotografiadas de la Costa Brava.

**Por qué es especial:** Paisaje de película. Las aguas son tan claras que puedes ver el fondo a varios metros de profundidad. Es la recompensa perfecta para un día completo de navegación.

**Barco recomendado:** Para esta ruta larga, recomendamos el [Pacific Craft 625](/barco/pacific-craft-625) con licencia, o contratar nuestra [excursión privada con capitán](/barco/excursion-privada) para disfrutar sin preocupaciones.

---

## Consejos para visitar las calas en barco

- **Llega temprano:** Las calas más populares se llenan a partir de las 11:00 en verano.
- **Lleva snorkel:** Muchas de estas calas tienen fondos marinos espectaculares. Puedes [alquilar equipo de snorkel](/barcos) con nosotros por solo 7,50EUR.
- **Respeta el entorno:** No tires basura al mar y respeta las zonas de fondeo marcadas.
- **Consulta el tiempo:** Antes de planificar tu ruta, consulta la previsión meteorológica. Nosotros te asesoraremos en el briefing de seguridad.

## Reserva tu barco y descubre estas calas

Con más de **307 reseñas en Google y una puntuación de 4,8 estrellas**, en Costa Brava Rent a Boat nos apasiona ayudarte a descubrir los mejores rincones de la costa. [Reserva tu barco ahora](/barcos) y vive una experiencia inolvidable este verano en la Costa Brava.`,
  },

  // ===== POST 2: Alquiler sin licencia =====
  {
    title: "Guía Completa: Alquiler de Barcos sin Licencia en Blanes 2026",
    slug: "alquiler-barco-sin-licencia-blanes-guia",
    category: "Guías",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/alquiler-barco-sin-licencia-blanes-guia.jpg",
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
    featuredImage: "/images/blog/que-hacer-en-blanes-verano.jpg",
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
    category: "Guias",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/boat-rental-costa-brava-english-guide.jpg",
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
| [Mingolla Brava 19](/barco/mingolla-brava-19) | 6 people | Mercury 80hp | 150EUR/2h |
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
    featuredImage: "/images/blog/rutas-barco-desde-blanes.jpg",
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
    featuredImage: "/images/blog/consejos-primera-vez-alquilar-barco.jpg",
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
];

/**
 * Seeds the database with 6 SEO blog posts.
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
