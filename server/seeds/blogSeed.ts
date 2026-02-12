import type { IStorage } from "../storage";
import type { InsertBlogPost } from "@shared/schema";

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
    _publishedAt: new Date("2026-01-15T10:00:00Z"),
    excerpt: "Desde Cala Sant Francesc hasta Cala Giverola, te presentamos las 10 calas mas espectaculares entre Blanes y Tossa de Mar que solo puedes disfrutar plenamente llegando en barco.",
    content: `La Costa Brava esconde algunos de los rincones mas bonitos del Mediterraneo, y la mejor forma de descubrirlos es navegando. Desde el puerto de Blanes, tienes acceso directo a decenas de calas de aguas cristalinas, muchas de ellas inaccesibles por tierra o con accesos complicados. En esta guia te presentamos las **10 mejores calas entre Blanes y Tossa de Mar** que puedes visitar alquilando un barco con nosotros.

## 1. Cala Sant Francesc

**Distancia desde el puerto de Blanes:** 1,5 km (5 minutos en barco)

Cala Sant Francesc es, para muchos, la joya escondida de Blanes. Rodeada de pinos y acantilados, esta cala ofrece aguas turquesas poco profundas ideales para el snorkel. Aunque se puede llegar a pie, el acceso en barco te permite disfrutarla sin las caminatas empinadas y llegar antes que la mayoria de visitantes.

**Por que es especial:** Fue declarada una de las mejores playas de Espana. El fondo marino es espectacular para hacer snorkel.

**Barco recomendado:** Cualquiera de nuestros [barcos sin licencia](/barcos) como el [Solar 450](/barco/solar-450) o el [Remus 450](/barco/remus-450) son perfectos para esta escapada rapida.

## 2. Cala Bona

**Distancia desde el puerto de Blanes:** 2 km (7 minutos en barco)

Situada justo al lado de Cala Sant Francesc, Cala Bona es mas pequena y tranquila. Su nombre lo dice todo: es una cala "buena" en todos los sentidos. Aguas calmadas, arena fina y un entorno natural protegido.

**Por que es especial:** Al ser mas pequena, suele estar menos concurrida. Perfecta para fondear y darse un bano en completa tranquilidad.

**Barco recomendado:** El [Astec 400](/barco/astec-400) es ideal para parejas que buscan intimidad en esta cala.

## 3. Sa Palomera

**Distancia desde el puerto de Blanes:** 0,3 km (2 minutos en barco)

La iconica roca de Sa Palomera marca la division entre las dos playas principales de Blanes. Desde el mar, las vistas de esta formacion rocosa son impresionantes. No es una cala para fondear largo tiempo, pero si para disfrutar del paisaje unico desde una perspectiva que pocos conocen.

**Por que es especial:** Es el simbolo de Blanes y el punto donde comienza oficialmente la Costa Brava. Las vistas desde el mar son inigualables.

## 4. Cala Treumal

**Distancia desde el puerto de Blanes:** 3 km (10 minutos en barco)

Cala Treumal se encuentra en el limite entre Blanes y Lloret de Mar. Es una playa rodeada de vegetacion exuberante con un chiringuito con encanto. Las aguas son tranquilas y poco profundas, perfectas para familias con ninos.

**Por que es especial:** Combina naturaleza virgen con servicios. Puedes fondear el barco y acercarte nadando para tomar algo en el chiringuito.

**Barco recomendado:** El [Astec 480](/barco/astec-480) con su equipo de musica bluetooth es genial para pasar una manana relajada aqui.

## 5. Playa de Santa Cristina

**Distancia desde el puerto de Blanes:** 3,5 km (12 minutos en barco)

Santa Cristina es una playa de postal: arena dorada, pinos hasta la orilla y aguas de un azul intenso. La ermita de Santa Cristina en lo alto del acantilado completa un paisaje de ensueno.

**Por que es especial:** Considerada una de las playas mas bonitas de la Costa Brava. El contraste entre el verde de los pinos y el azul del mar es fotografico.

## 6. Playa de Fenals

**Distancia desde el puerto de Blanes:** 5 km (15 minutos en barco)

Fenals es la playa mas familiar de Lloret de Mar. Mas tranquila que la playa principal de Lloret, ofrece buen fondeo y aguas cristalinas. Es un buen punto intermedio si planeas una ruta mas larga hacia Tossa.

**Por que es especial:** Aguas poco profundas y protegidas del oleaje. Ideal para familias y para descansar durante una ruta mas larga.

## 7. Cala Canyelles

**Distancia desde el puerto de Blanes:** 7 km (20 minutos en barco)

Cala Canyelles es la unica cala entre Lloret y Tossa con un pequeno puerto deportivo. Sus aguas profundas y limpias la convierten en un paraiso para el snorkel y el submarinismo.

**Por que es especial:** Ambiente mas exclusivo y menos masificado que las playas de Lloret. Tiene un club nautico donde puedes amarrar temporalmente.

**Barco recomendado:** Para llegar comodamente, te recomendamos el [Pacific Craft 625](/barco/pacific-craft-625) o la [Mingolla Brava 19](/barco/mingolla-brava-19) si tienes licencia.

## 8. Platja de Lloret

**Distancia desde el puerto de Blanes:** 6 km (18 minutos en barco)

La playa principal de Lloret de Mar ofrece una perspectiva totalmente diferente desde el mar. El castillo de Sa Caleta en el extremo sur y la escultura de la Dona Marinera son iconos que se aprecian mejor desde el agua.

**Por que es especial:** Las vistas del skyline de Lloret y el Castillo de Sa Caleta desde el barco son espectaculares. Puedes fondear y nadar hasta la playa.

## 9. Cala Banys

**Distancia desde el puerto de Blanes:** 8 km (25 minutos en barco)

Cala Banys es una pequena cala rocosa al sur de Lloret con las ruinas de unos antiguos banos romanos. Es un lugar con mucha historia y un fondo marino ideal para explorar con snorkel.

**Por que es especial:** Las ruinas romanas visibles junto al agua le dan un aire unico. El snorkel aqui es excepcional gracias a las formaciones rocosas submarinas.

## 10. Cala Giverola

**Distancia desde el puerto de Blanes:** 15 km (40 minutos en barco)

Cala Giverola es la mas lejana de nuestra lista pero merece cada minuto de navegacion. Enclavada entre acantilados cubiertos de pinos, sus aguas son de un verde esmeralda impresionante. Es una de las calas mas fotografiadas de la Costa Brava.

**Por que es especial:** Paisaje de pelicula. Las aguas son tan claras que puedes ver el fondo a varios metros de profundidad. Es la recompensa perfecta para un dia completo de navegacion.

**Barco recomendado:** Para esta ruta larga, recomendamos el [Pacific Craft 625](/barco/pacific-craft-625) con licencia, o contratar nuestra [excursion privada con capitan](/barco/excursion-privada) para disfrutar sin preocupaciones.

---

## Consejos para visitar las calas en barco

- **Llega temprano:** Las calas mas populares se llenan a partir de las 11:00 en verano.
- **Lleva snorkel:** Muchas de estas calas tienen fondos marinos espectaculares. Puedes [alquilar equipo de snorkel](/barcos) con nosotros por solo 7,50EUR.
- **Respeta el entorno:** No tires basura al mar y respeta las zonas de fondeo marcadas.
- **Consulta el tiempo:** Antes de planificar tu ruta, consulta la prevision meteorologica. Nosotros te asesoraremos en el briefing de seguridad.

## Reserva tu barco y descubre estas calas

Con mas de **307 resenas en Google y una puntuacion de 4,8 estrellas**, en Costa Brava Rent a Boat nos apasiona ayudarte a descubrir los mejores rincones de la costa. [Reserva tu barco ahora](/barcos) y vive una experiencia inolvidable este verano en la Costa Brava.`,
  },

  // ===== POST 2: Alquiler sin licencia =====
  {
    title: "Guia Completa: Alquiler de Barcos sin Licencia en Blanes 2026",
    slug: "alquiler-barco-sin-licencia-blanes-guia",
    category: "Guias",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/alquiler-barco-sin-licencia-blanes-guia.jpg",
    metaDescription: "Todo lo que necesitas saber para alquilar un barco sin licencia en Blanes. Requisitos, precios, que incluye y consejos practicos.",
    tags: ["alquiler barco sin licencia", "barco sin licencia blanes", "alquilar barco costa brava", "barco sin carnet blanes", "alquiler embarcacion blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-01-22T10:00:00Z"),
    excerpt: "Todo lo que necesitas saber para alquilar un barco sin licencia en Blanes: requisitos, precios desde 70EUR/hora, que incluye el alquiler y consejos para tu primera experiencia nautica.",
    content: `Alquilar un barco sin licencia es una de las mejores experiencias que puedes vivir en la Costa Brava. No necesitas experiencia previa, ni titulo nautico, ni conocimientos especiales. En esta guia completa te explicamos absolutamente todo lo que necesitas saber para alquilar un barco sin licencia en Blanes durante la temporada 2026.

## Que significa "barco sin licencia"

En Espana, la legislacion nautica permite pilotar embarcaciones de recreo sin necesidad de titulo nautico siempre que cumplan estas condiciones:

- **Motor de hasta 15 CV** (caballos de vapor)
- **Eslora maxima de 5 metros**
- **Navegacion en zona diurna** (de sol a sol)
- **Distancia maxima de la costa:** 2 millas nauticas (aproximadamente 3,7 km)

Estas limitaciones estan pensadas para garantizar la seguridad. Los barcos sin licencia son embarcaciones estables, sencillas de manejar y disenadas para que cualquier persona mayor de edad pueda disfrutar del mar de forma segura.

## Quien puede alquilar un barco sin licencia

Los requisitos para alquilar son muy sencillos:

- **Edad minima:** 18 anos (el patron debe ser mayor de edad)
- **Documento de identidad:** DNI, pasaporte o documento equivalente
- **Deposito de fianza:** Entre 200EUR y 300EUR segun el barco (se devuelve al finalizar)
- **No se requiere:** Licencia, titulo, carnet, ni experiencia previa

Los menores pueden ir como pasajeros sin problema, siempre acompanados de un adulto responsable.

## Nuestra flota sin licencia

En Costa Brava Rent a Boat disponemos de **5 barcos sin licencia** adaptados a diferentes necesidades:

### [Astec 400](/barco/astec-400) - Ideal para parejas
- Capacidad: 4 personas
- Motor: Suzuki 15hp
- Lo mejor: Compacto y facil de manejar, perfecto para parejas
- **Desde 70EUR/hora** en temporada baja

### [Solar 450](/barco/solar-450) - El mas popular
- Capacidad: 5 personas
- Motor: Mercury 15cv
- Lo mejor: Gran solarium, escalera de bano, muy estable
- **Desde 75EUR/hora** en temporada baja

### [Remus 450](/barco/remus-450) y [Remus 450 II](/barco/remus-450-ii) - Familiares
- Capacidad: 5 personas
- Motor: Suzuki 15cv
- Lo mejor: Toldo Bi Mini amplio, perfectos para familias
- **Desde 75EUR/hora** en temporada baja

### [Astec 480](/barco/astec-480) - El mas espacioso
- Capacidad: 5 personas
- Motor: Parsun 40/15cv
- Lo mejor: Equipo de musica bluetooth, mas espacio a bordo
- **Desde 80EUR/hora** en temporada baja

## Que incluye el alquiler

Todos nuestros barcos sin licencia incluyen:

- **Gasolina:** El combustible esta incluido en el precio. No pagas ni un euro mas por el consumo de gasolina.
- **IVA:** El precio que ves es el precio final con impuestos incluidos.
- **Seguro:** Seguro de embarcacion y de todos los ocupantes.
- **Amarre:** El uso del amarre en el puerto de Blanes.
- **Limpieza:** No tienes que preocuparte de lavar el barco al volver.
- **Equipo de seguridad:** Chalecos salvavidas, extintor y todo el equipo reglamentario.
- **Briefing de seguridad:** Una explicacion completa antes de salir.

## Precios temporada 2026

Los precios varian segun la temporada:

### Temporada baja (abril - junio, septiembre - cierre)
| Duracion | Astec 400 | Solar 450 / Remus 450 | Astec 480 |
|----------|-----------|------------------------|-----------|
| 1 hora   | 70EUR       | 75EUR                    | 80EUR       |
| 2 horas  | 105EUR      | 115EUR                   | 130EUR      |
| 4 horas  | 135EUR      | 150EUR                   | 180EUR      |
| 8 horas  | 200EUR      | 220EUR                   | 270EUR      |

### Temporada media (julio)
Los precios aumentan entre un 10% y un 20% respecto a temporada baja.

### Temporada alta (agosto)
Los precios aumentan entre un 20% y un 30% respecto a temporada baja.

Consulta los precios actualizados de cada barco en nuestra [pagina de barcos](/barcos).

## El briefing de seguridad

Antes de zarpar, nuestro equipo te da una **explicacion practica de 10-15 minutos** que cubre:

1. **Como arrancar y apagar el motor**
2. **Acelerador y direccion:** Como girar, acelerar y frenar
3. **Normas basicas de navegacion:** Por donde ir, preferencias de paso
4. **Zonas de fondeo:** Donde puedes y no puedes anclar
5. **Uso del ancla:** Como fondear correctamente en una cala
6. **Equipo de seguridad:** Donde estan los chalecos y como usarlos
7. **Que hacer en caso de emergencia:** Numeros de telefono y protocolo
8. **Limites de navegacion:** Hasta donde puedes ir y zonas a evitar

No te preocupes si no recuerdas todo: estaremos disponibles por telefono durante toda tu navegacion.

## Que llevar a bordo

Te recomendamos llevar:

- **Proteccion solar:** Crema solar alta (factor 50+), gafas de sol y gorra
- **Agua:** Aunque puedes alquilar nuestra nevera (5EUR) y comprar bebidas
- **Toallas:** Para secarte despues de los banos
- **Biquini/banador:** Obvio, pero es facil olvidar cambiarse antes
- **Calzado acuatico:** Recomendable para entrar y salir del barco
- **Funda impermeable para el movil:** Tu telefono te lo agradecera

## Mejor momento para navegar

- **Horario ideal:** De 10:00 a 14:00 el mar suele estar mas calmado
- **Mejor dia:** Entre semana hay menos trafico maritimo que los fines de semana
- **Mejor mes:** Junio y septiembre ofrecen buen tiempo con precios de temporada baja y menos gente

## Como reservar

Reservar es muy sencillo:

1. **Elige tu barco** en nuestra [pagina de barcos](/barcos)
2. **Selecciona fecha y hora** en el calendario
3. **Anade extras** si quieres (snorkel, paddle surf, seascooter, nevera...)
4. **Completa el pago** online de forma segura con tarjeta
5. **Recibe confirmacion** por email y WhatsApp
6. **Presentate en el puerto** 15 minutos antes de la hora reservada

## Por que elegirnos

Con mas de **307 resenas en Google y una puntuacion media de 4,8 estrellas**, nuestros clientes valoran especialmente:

- La simpatia y profesionalidad del equipo
- La claridad del briefing de seguridad
- El estado impecable de los barcos
- Que la gasolina esta incluida (sin sorpresas)
- La flexibilidad y atencion personalizada

[Reserva tu barco sin licencia](/barcos) y descubre por que somos la empresa de alquiler de barcos mejor valorada de Blanes.`,
  },

  // ===== POST 3: Que hacer en Blanes =====
  {
    title: "Que Hacer en Blanes: 15 Planes Imprescindibles para el Verano 2026",
    slug: "que-hacer-en-blanes-verano",
    category: "Destinos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/que-hacer-en-blanes-verano.jpg",
    metaDescription: "Los 15 mejores planes en Blanes para el verano 2026. Desde alquilar un barco hasta visitar jardines botanicos y calas secretas.",
    tags: ["que hacer en blanes", "planes blanes verano", "actividades blanes", "turismo blanes", "blanes costa brava"],
    isPublished: true,
    _publishedAt: new Date("2026-01-29T10:00:00Z"),
    excerpt: "Descubre los 15 mejores planes para disfrutar de Blanes en verano 2026: navegacion, calas, jardines botanicos, gastronomia y mucho mas.",
    content: `Blanes es mucho mas que el "portal de la Costa Brava". Este pueblo marinero de la provincia de Girona combina playas espectaculares, patrimonio historico, gastronomia mediterranea y una oferta de actividades acuaticas que lo convierten en uno de los mejores destinos del verano. Aqui tienes **15 planes imprescindibles para disfrutar de Blanes en 2026**.

## 1. Alquilar un barco y explorar la costa

Sin duda, la mejor forma de conocer la Costa Brava es desde el mar. Desde el puerto de Blanes puedes [alquilar un barco sin licencia](/barcos) y navegar hasta calas escondidas, cuevas y playas inaccesibles por tierra. Es una experiencia que transforma completamente tu forma de ver la costa.

**Nuestro consejo:** El [Astec 480](/barco/astec-480) con equipo de musica bluetooth es perfecto para pasar una manana inolvidable. Y si es tu primera vez, no te preocupes: te explicamos todo en un briefing de seguridad antes de salir. Lee nuestra [guia de alquiler sin licencia](/blog/alquiler-barco-sin-licencia-blanes-guia) para mas detalles.

## 2. Visitar el Jardi Botanic Marimurtra

El jardin botanico Marimurtra es uno de los mas importantes del Mediterraneo. Situado sobre un acantilado con vistas espectaculares al mar, alberga mas de 4.000 especies de plantas de los cinco continentes. El paseo entre cactus gigantes, plantas tropicales y miradores al mar es absolutamente magico.

**Horario:** De 9:00 a 18:00 (verano hasta 20:00) | **Precio:** ~8EUR adultos

## 3. Subir al Castillo de San Juan

Las ruinas del Castillo de San Juan, en lo alto del cerro que separa las dos playas de Blanes, ofrecen las mejores vistas panoramicas del pueblo y la costa. La subida es corta pero empinada, y la recompensa al llegar arriba es una panoramica de 360 grados que abarca desde los Pirineos hasta Barcelona en dias claros.

**Consejo:** Sube al atardecer para una experiencia inolvidable.

## 4. Contemplar Sa Palomera

La roca de Sa Palomera es el simbolo de Blanes y el punto donde oficialmente comienza la Costa Brava. Puedes caminar hasta su cima por un sendero facil y disfrutar de vistas unicas de ambas playas. Desde julio, es tambien el punto de lanzamiento del famoso concurso internacional de fuegos artificiales.

## 5. Disfrutar de la Playa de Blanes

La playa principal de Blanes (Platja de Blanes) es una amplia franja de arena dorada con todos los servicios: chiringuitos, socorristas, duchas y alquiler de hamacas. El paseo maritimo que la bordea esta lleno de restaurantes y heladerias.

## 6. Hacer snorkel en las calas

Las calas entre Blanes y Lloret tienen fondos marinos espectaculares. Cala Sant Francesc y Cala Bona son dos de los mejores puntos para hacer snorkel en la zona. Puedes [alquilar equipo de snorkel](/barcos) con nosotros por 7,50EUR cuando reserves tu barco.

Para conocer las mejores calas, lee nuestro articulo sobre las [10 mejores calas de la Costa Brava en barco](/blog/mejores-calas-costa-brava-en-barco).

## 7. Probar el paddle surf

El paddle surf se ha convertido en una de las actividades estrella del verano en Blanes. Las aguas tranquilas de las primeras horas de la manana son ideales para practicarlo. Puedes [anadirlo como extra](/barcos) al alquilar tu barco por 25EUR y hacer paddle surf en una cala desierta.

## 8. Recorrer el camino de ronda

El Cami de Ronda es un sendero costero que conecta playas y calas a lo largo de toda la Costa Brava. El tramo de Blanes a Lloret (unos 6 km) pasa por acantilados, bosques de pinos y miradores impresionantes. Ideal para caminar por la manana antes de que apriete el calor.

## 9. Degustar la gastronomia local

Blanes es un pueblo pesquero con una tradicion gastronomica excepcional. No te pierdas:

- **El suquet de peix:** Guiso marinero tradicional
- **La gamba de Blanes:** Una de las mejores gambas del Mediterraneo
- **Arroz a la cazuela:** Con mariscos frescos del dia
- **Helados artesanales:** En las heladerias del paseo maritimo

**Restaurantes recomendados:** Los restaurantes del puerto y del paseo maritimo ofrecen pescado fresco del dia a precios razonables.

## 10. Excursion a Lloret de Mar

Lloret de Mar esta a solo 10 minutos en coche (o 15 minutos en barco) desde Blanes. Puedes visitar los Jardines de Santa Clotilde, el Castillo de Sa Caleta y la famosa escultura de la Dona Marinera. Si vas en barco, las vistas de la costa de Lloret desde el mar son espectaculares.

## 11. Visitar el casco antiguo de Tossa de Mar

Tossa de Mar, a unos 30 minutos en coche, tiene uno de los cascos historicos mas bonitos de la Costa Brava: la Vila Vella, una ciudadela medieval amurallada con torres y callejuelas empedradas. Es una excursion de medio dia perfecta. Y si tienes licencia de navegacion, puedes [llegar en barco](/blog/rutas-barco-desde-blanes) para una experiencia todavia mas especial.

## 12. Disfrutar de un atardecer en barco

Hay pocas experiencias mas romanticas que ver el atardecer desde el mar en la Costa Brava. Reserva tu barco para las ultimas horas de la tarde y disfruta de los colores del cielo reflejandose en el agua mientras navegas por la costa. Nuestra [excursion privada con capitan](/barco/excursion-privada) es perfecta para ocasiones especiales.

## 13. Probar el seascooter

El seascooter es una moto acuatica submarina que te permite explorar bajo el agua sin esfuerzo. Es una actividad emocionante y diferente que puedes [anadir a tu alquiler de barco](/barcos) por 50EUR. Ideal para los mas aventureros del grupo.

## 14. Ver el concurso de fuegos artificiales

Cada verano, desde finales de julio, Blanes acoge el **Concurso Internacional de Fuegos Artificiales**. Durante varias noches, las mejores pirotecnias del mundo lanzan sus espectaculos desde la roca de Sa Palomera. Ver los fuegos artificiales desde un barco, con el reflejo en el agua, es una experiencia absolutamente unica.

## 15. Pasear por el Paseo Maritimo al anochecer

Para terminar el dia, nada mejor que un paseo por el Paseo Maritimo de Blanes. Con la brisa del mar, las terrazas iluminadas y el sonido de las olas, es el broche perfecto para un dia de verano en la Costa Brava.

---

## Planifica tu verano en Blanes

Blanes tiene actividades para todos los gustos: aventura, cultura, gastronomia y relax. Si tuvieras que elegir una sola experiencia, te recomendamos sin duda [alquilar un barco](/barcos) y descubrir la costa desde el mar. Con mas de **307 resenas en Google y 4,8 estrellas**, estamos preparados para hacerte vivir un dia inolvidable.

Contactanos por [WhatsApp](https://wa.me/34611500372) o reserva directamente en nuestra web.`,
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
    _publishedAt: new Date("2026-02-05T10:00:00Z"),
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
    metaDescription: "5 rutas en barco desde Blanes: desde escapadas de 1 hora hasta la ruta completa a Tossa de Mar. Distancias, duracion y barcos recomendados.",
    tags: ["rutas barco blanes", "excursion barco costa brava", "ruta costera blanes tossa", "navegacion costa brava", "rutas maritimas blanes"],
    isPublished: true,
    _publishedAt: new Date("2026-02-08T10:00:00Z"),
    excerpt: "5 rutas detalladas en barco desde el puerto de Blanes: desde una escapada rapida de 1 hora hasta la ruta completa a Tossa de Mar pasando por calas secretas y pueblos medievales.",
    content: `El puerto de Blanes es el punto de partida perfecto para explorar la Costa Brava por mar. Desde aqui, la costa se despliega hacia el norte con un rosario de calas, acantilados, cuevas marinas y pueblos con encanto que merecen ser descubiertos desde el agua. Te presentamos **5 rutas en barco**, desde una escapada rapida de 1 hora hasta una aventura de dia completo.

## Ruta 1: Blanes - Sa Palomera - Cala Sant Francesc (1 hora)

**Dificultad:** Principiante | **Distancia:** 3 km (ida y vuelta) | **Duracion:** 1 hora

Esta es la ruta perfecta para quien alquila un barco por primera vez o tiene poco tiempo. Es corta, segura y espectacular.

### Itinerario

1. **Salida del puerto de Blanes** - Navega hacia el sur siguiendo la costa
2. **Sa Palomera** (2 min) - Rodea la iconica roca que marca el inicio de la Costa Brava. Desde el agua, apreciaras su tamano y la forma en que divide las dos playas de Blanes
3. **Cala Sant Francesc** (5 min) - Continua hacia el sur hasta esta cala de aguas turquesas. Fondea el barco y disfruta de un bano en aguas cristalinas
4. **Regreso al puerto** - Vuelve con calma disfrutando de las vistas

### Que veras
- La roca de Sa Palomera desde todos los angulos
- Los acantilados cubiertos de pinos entre Blanes y la cala
- Aguas turquesas y fondo marino visible desde la superficie
- Posiblemente peces y medusas (inofensivas) nadando bajo el barco

### Barco recomendado
Cualquier [barco sin licencia](/barcos). El [Astec 400](/barco/astec-400) es ideal para parejas, y el [Solar 450](/barco/solar-450) para familias.

---

## Ruta 2: Blanes - Cala Sant Francesc - Cala Bona (2 horas)

**Dificultad:** Principiante | **Distancia:** 5 km (ida y vuelta) | **Duracion:** 2 horas

Con una hora mas, puedes explorar dos de las mejores calas de Blanes y disfrutar de tiempo suficiente para banarte y hacer snorkel.

### Itinerario

1. **Salida del puerto de Blanes**
2. **Sa Palomera** - Breve parada fotografica desde el agua
3. **Cala Sant Francesc** (10 min desde puerto) - Primera parada de bano. Fondea durante 20-30 minutos
4. **Cala Bona** (2 min mas al sur) - Segunda parada. Esta cala mas pequena y recogida es perfecta para snorkel
5. **Regreso al puerto** - Navega de vuelta por la misma ruta costera

### Que veras
- Dos de las calas mas bonitas de la Costa Brava sur
- Fondos rocosos ideales para snorkel (si alquilaste el equipo)
- Flora y fauna marina variada en las zonas rocosas entre calas

### Barco recomendado
[Solar 450](/barco/solar-450) o [Remus 450](/barco/remus-450). Ambos tienen escalera de bano que facilita entrar y salir del agua. No olvides anadir **snorkel** (7,50EUR) al reservar.

---

## Ruta 3: Blanes - Costa de Lloret (3-4 horas)

**Dificultad:** Intermedio | **Distancia:** 14 km (ida y vuelta) | **Duracion:** 3-4 horas

Esta ruta te lleva mas alla de Blanes, recorriendo la impresionante costa hasta Lloret de Mar. Es ideal para medio dia y permite descubrir playas y calas variadas.

### Itinerario

1. **Salida del puerto de Blanes**
2. **Calas de Blanes** - Breve paso por Cala Sant Francesc y Cala Bona
3. **Cala Treumal** (15 min) - En la frontera entre Blanes y Lloret. Aguas calmadas, chiringuito en la playa
4. **Santa Cristina** (18 min) - Una de las playas mas bonitas de la costa. La ermita en el acantilado es preciosa desde el mar
5. **Fenals** (22 min) - Playa familiar con aguas protegidas. Buen sitio para parar a comer si has traido picnic
6. **Vista de Lloret** (25 min) - Desde el mar, contempla la playa de Lloret, el Castillo de Sa Caleta y la Dona Marinera
7. **Regreso** - Vuelta por la misma ruta, parando donde mas te haya gustado

### Que veras
- La transicion del paisaje entre Blanes y Lloret
- El Castillo de Sa Caleta sobre los acantilados
- La escultura de la Dona Marinera en el extremo de Lloret
- Acantilados cubiertos de vegetacion mediterranea

### Barco recomendado
El [Astec 480](/barco/astec-480) con su mayor autonomia y equipo bluetooth para poner musica durante la travesia. Si tienes licencia, la [Mingolla Brava 19](/barco/mingolla-brava-19) te permite cubrir la distancia mas rapidamente.

---

## Ruta 4: Blanes - Tossa de Mar (6-8 horas)

**Dificultad:** Avanzado | **Distancia:** 30 km (ida y vuelta) | **Duracion:** 6-8 horas

La ruta estrella. Navegar de Blanes a Tossa de Mar es una experiencia que recordaras siempre. La costa entre ambos pueblos es salvaje, espectacular y llena de sorpresas.

**Importante:** Esta ruta requiere un barco con licencia o nuestra excursion con capitan, ya que la distancia y duracion exceden lo recomendable para barcos sin licencia.

### Itinerario

1. **Salida del puerto de Blanes** (8:30-9:00)
2. **Costa de Blanes** - Paso rapido por las calas conocidas
3. **Lloret de Mar** (30 min) - Vista panoramica desde el mar
4. **Cala Canyelles** (40 min) - Parada tecnica y primer bano del dia
5. **Cala Giverola** (55 min) - Una de las calas mas espectaculares, rodeada de acantilados y pinos
6. **Costa salvaje** - Tramo de costa virgen con cuevas y formaciones rocosas
7. **Tossa de Mar** (1h 15min) - Llegada a Tossa. Vista de la Vila Vella (ciudad medieval amurallada) desde el mar. Fondeo en la playa principal o en la Platja del Reig
8. **Tiempo en Tossa** (2-3 horas) - Bano, paseo por la Vila Vella, comida en un restaurante del pueblo
9. **Regreso a Blanes** - Vuelta con paradas opcionales en calas que te hayan gustado durante la ida

### Que veras
- La Vila Vella de Tossa desde el mar (una de las postales mas iconicas del Mediterraneo)
- Tramos de costa completamente virgen e inaccesible por tierra
- Cuevas marinas que solo se ven desde el agua
- Posiblemente delfines en el tramo mas abierto
- Fondos marinos espectaculares en Cala Giverola

### Barco recomendado
[Pacific Craft 625](/barco/pacific-craft-625) para la maxima comodidad, o la [Trimarchi 57S](/barco/trimarchi-57s) para una experiencia mas deportiva. La opcion mas comoda es contratar nuestra [excursion privada con capitan](/barco/excursion-privada): el capitan conoce la costa a la perfeccion y te llevara a los mejores rincones segun las condiciones del dia.

---

## Ruta 5: Tour Completo Costa Brava Sur (dia completo con licencia)

**Dificultad:** Experto | **Distancia:** 40+ km | **Duracion:** 8+ horas

Para navegantes experimentados con licencia que quieren exprimir al maximo un dia en la Costa Brava.

### Itinerario

1. **Blanes** (salida temprana 8:00) - Rumbo sur hacia Cala Sant Francesc
2. **Calas de Blanes** - Breve parada en Cala Bona para primer bano
3. **Costa de Lloret** - Navegacion continua pasando Santa Cristina, Fenals
4. **Canyelles** - Parada para repostar (si necesario) en el club nautico
5. **Cala Giverola** - Bano y snorkel en aguas esmeralda
6. **Tossa de Mar** - Comida y visita a la Vila Vella
7. **Explorar mas alla de Tossa** - Si el tiempo lo permite, continua hacia el norte descubriendo calas aun mas remotas
8. **Regreso** - Navegacion de vuelta con el sol de la tarde

### Barco recomendado
Exclusivamente [Pacific Craft 625](/barco/pacific-craft-625) por su autonomia, potencia y comodidad. Con tanque de 127 litros y motor Yamaha de 115cv, tienes capacidad de sobra para un dia completo.

---

## Consejos generales para todas las rutas

- **Consulta el parte meteorologico** antes de salir. Nuestro equipo te informara de las condiciones del dia.
- **Lleva proteccion solar** abundante. En el mar, el sol refleja en el agua y quema mas rapido.
- **Agua y comida:** Para rutas de mas de 2 horas, lleva agua suficiente y algo para picar.
- **Respeta las zonas de bano:** Reduce la velocidad cerca de las playas y mantente alejado de los banistas.
- **Fondea en arena:** Siempre que sea posible, ancla sobre fondo de arena para no danar la posidonia.

## Reserva tu ruta

Elige la ruta que mas te inspire y [reserva tu barco](/barcos). Si no estas seguro de que ruta elegir, [contactanos por WhatsApp](https://wa.me/34611500372) y te asesoraremos encantados segun la duracion que quieras, el tipo de barco y las condiciones del dia.`,
  },

  // ===== POST 6: Consejos primera vez =====
  {
    title: "Consejos para tu Primera Vez Alquilando un Barco (Sin Experiencia)",
    slug: "consejos-primera-vez-alquilar-barco",
    category: "Consejos",
    author: "Costa Brava Rent a Boat",
    featuredImage: "/images/blog/consejos-primera-vez-alquilar-barco.jpg",
    metaDescription: "Consejos practicos para alquilar un barco por primera vez sin experiencia. Que llevar, como conducir, fondear y disfrutar con seguridad.",
    tags: ["primera vez barco", "consejos alquilar barco", "barco sin experiencia", "tips navegacion principiante", "alquilar barco primera vez"],
    isPublished: true,
    _publishedAt: new Date("2026-02-12T10:00:00Z"),
    excerpt: "Todos los consejos que necesitas para tu primera experiencia alquilando un barco: desde que esperar en el briefing hasta como fondear, nadar y gestionar el combustible.",
    content: `Alquilar un barco por primera vez puede generar una mezcla de emocion y nervios. Es completamente normal. Pero te aseguramos que es mucho mas sencillo de lo que parece. En Costa Brava Rent a Boat recibimos cada temporada a cientos de personas que nunca habian pisado un barco y todas terminan con una sonrisa enorme. Aqui van nuestros **mejores consejos para que tu primera experiencia sea perfecta**.

## Antes de llegar: la preparacion

### Elige bien la duracion

Si es tu primera vez, te recomendamos empezar con **2 o 3 horas**. Es tiempo suficiente para navegar hasta alguna cala cercana, banarte, hacer snorkel y volver sin prisas. Si te queda corto, la proxima vez puedes reservar mas tiempo con la confianza de saber como funciona.

### Que llevar a bordo

Prepara una bolsa con:

- **Proteccion solar factor 50+** -- El sol en el mar es mucho mas intenso de lo que piensas. El reflejo del agua multiplica los rayos UV. Aplica crema antes de subir al barco y reaplica cada 2 horas.
- **Gafas de sol con cordon** -- El viento puede llevarse las gafas. Un cordon barato puede salvarte unas gafas caras.
- **Gorra o sombrero** -- La insolacion en el mar es un riesgo real. Protege tu cabeza.
- **Agua abundante** -- Minimo 1,5 litros por persona. La deshidratacion llega rapido con el sol y el viento.
- **Snacks** -- Fruta, frutos secos, bocadillos. Navegar abre el apetito.
- **Toallas** -- Al menos una por persona para secarse despues de los banos.
- **Ropa de bano** -- Llevala puesta directamente para no perder tiempo cambiandote.
- **Camiseta de manga larga** -- Para cuando el sol apriete demasiado o para el viaje de vuelta.
- **Calzado acuatico** -- Las chanclas pueden resbalar. El calzado acuatico con suela de goma se agarra bien al barco y te protege los pies en las rocas.
- **Funda impermeable para el movil** -- Cuesta menos de 10EUR y puede salvar un telefono de 1.000EUR. El agua salada es el peor enemigo de la electronica.

### Que NO llevar

- Objetos de valor que no quieras mojar
- Bolsos grandes o maletas (el espacio a bordo es limitado)
- Zapatos con suela negra que pueda marcar la cubierta

## El briefing de seguridad: no es solo un tramite

Cuando llegues al puerto (recuerda: **15 minutos antes de tu hora**), nuestro equipo te dara un briefing de seguridad personalizado. Prestale toda tu atencion porque es la clave para que disfrutes con tranquilidad.

### Que aprenderas

**Arranque del motor:** Girar la llave, tirar del estrangulador y soltar. Es como arrancar una moto. En 30 segundos lo tendras dominado.

**Aceleracion y direccion:** El acelerador esta en el mango del timon. Giras el mango para acelerar y mueves la barra del timon para girar. Es mas intuitivo que conducir un coche porque el barco responde mas despacio y tienes tiempo de corregir.

**Regla de oro de la direccion:** El barco gira al reves que un coche. Si mueves la barra del timon a la derecha, la proa (parte delantera) va a la izquierda, y viceversa. Parece confuso, pero en 5 minutos lo tendras automatizado.

**La marcha atras:** Para frenar el barco no hay frenos. Reduces velocidad y, si necesitas detenerte rapidamente, pones marcha atras brevemente. Nuestro equipo te ensenara como hacerlo de forma segura.

## Tus primeros minutos navegando

### Sal despacio

Al salir del puerto, navega despacio. Es zona de velocidad reducida y ademas te permite ir cogiendole el truco al barco sin presion. No tengas prisa.

### Manten distancia

Deja siempre distancia con otros barcos, boyas, rocas y banistas. Los barcos no frenan como los coches: necesitan distancia para detenerse.

### Navega pegado a la costa

No tienes que alejarte mucho de la costa para disfrutar. Las mejores calas estan a pocos minutos del puerto. Ademas, navegando cerca de la costa el mar suele estar mas calmado y las vistas son mejores.

### Relaja los brazos

Un error comun de los principiantes es agarrar el timon con demasiada fuerza y hacer correcciones bruscas. El barco se mueve con suavidad. Relajate, haz movimientos suaves y deja que el barco fluya.

## Como fondear en una cala

Fondear (anclar) es el momento en que detienes el barco en una cala para banarte. Es mas sencillo de lo que parece:

1. **Acercate despacio** a la cala. Reduce la velocidad a minima desde que entres en la zona de bano.
2. **Elige un punto** con fondo de arena (se ve claro desde el barco). Evita fondear sobre rocas o posidonia.
3. **Apaga el motor** cuando estes en posicion.
4. **Lanza el ancla** por la proa (parte delantera). Dejala caer suavemente hasta el fondo.
5. **Suelta cadena** suficiente. La regla general es 3 veces la profundidad del agua. Si hay 3 metros de profundidad, suelta unos 9 metros de cadena.
6. **Comprueba que agarra** tirando suavemente de la cadena. Si el barco se mantiene en su sitio, perfecto.
7. **Pon una referencia visual** -- fijate en un punto de la costa para detectar si el barco se mueve.

Para levar anclas (recogerla), simplemente recoge la cadena poco a poco hasta que el ancla salga del fondo.

## Nadar desde el barco

Una de las mejores partes de ir en barco es poder banarte en calas de aguas cristalinas. Algunos consejos:

- **Usa la escalera de bano** para entrar y salir del agua. Todos nuestros barcos la tienen.
- **Comprueba que el motor esta apagado** antes de que nadie se meta al agua. Esto es fundamental.
- **No te alejes demasiado** del barco. Las corrientes pueden ser enganosas.
- **Lleva snorkel** -- el fondo marino de las calas de la Costa Brava es espectacular. Puedes [alquilarlo](/barcos) por solo 7,50EUR.
- **Sube por la popa** (parte trasera) usando la escalera, nunca por los laterales.

## Gestion del combustible

En nuestros barcos sin licencia, **la gasolina esta incluida** en el precio. Esto significa que no tienes que preocuparte de quedarte sin combustible ni de calcular el consumo. El tanque esta lleno cuando sales y es mas que suficiente para el tiempo que has reservado.

Aun asi, algun consejo practico:

- **Navega a velocidad moderada** -- Ademas de consumir menos, disfrutaras mas del paisaje y el viaje sera mas comodo.
- **No dejes el motor al ralenti mucho tiempo** -- Si vas a estar parado en una cala, apaga el motor en lugar de dejarlo encendido.

## El tiempo y el mar

### Antes de salir

Nosotros revisamos las condiciones meteorologicas cada manana. Si hay alerta de viento fuerte o mala mar, te contactaremos para reagendar. Tu seguridad es lo primero.

### Senales de que debes volver

- El viento aumenta notablemente y el mar se pica con olas crecientes
- Se acercan nubes oscuras desde el horizonte
- Sientes que las condiciones han cambiado mucho respecto a cuando saliste

Si tienes cualquier duda, **llamanos**. Nuestro telefono esta operativo durante toda tu navegacion y te orientaremos.

## El telefono: tu mejor aliado

- **Guarda nuestro numero** antes de salir: [+34 611 500 372](tel:+34611500372)
- **Lleva el movil en funda impermeable** dentro de un bolsillo accesible
- **Usa el GPS del movil** si quieres ubicar las calas (Google Maps funciona perfecto en el mar)
- **Haz fotos y videos** -- Vas a querer recordar esta experiencia

## Emergencias: que hacer

Las emergencias son extremadamente raras, pero es bueno saber que hacer:

- **Motor que no arranca:** Comprueba que la llave de seguridad esta puesta. Si sigue sin arrancar, llamanos.
- **Te pierdes:** No pasa nada. Usa el GPS del movil o simplemente navega hacia la costa y sigue la linea de costa de vuelta al puerto.
- **Alguien se marea:** Mira al horizonte, bebe agua y reduce la velocidad. El mareo suele pasar rapidamente.
- **Emergencia real:** Llama al 112 (emergencias) o al canal 16 de VHF si el barco tiene radio.

## Despues de la experiencia

Al volver al puerto:

1. **Acercate despacio** al amarre
2. **Nuestro equipo te ayudara** a amarrar el barco
3. **Recoge tus pertenencias** y comprueba que no dejas nada
4. **Se devuelve la fianza** una vez comprobado que todo esta correcto

---

## Tu primera vez sera inolvidable

En Costa Brava Rent a Boat llevamos anos haciendo que la primera experiencia nautica de nuestros clientes sea segura, facil y espectacular. Con **307 resenas en Google y 4,8 estrellas**, nuestros clientes confirman que es una de las mejores actividades que pueden hacer en la Costa Brava.

No hace falta experiencia. No hace falta licencia. Solo hace falta ganas de pasar un dia increible en el mar.

[Reserva tu barco ahora](/barcos) o preguntanos por [WhatsApp](https://wa.me/34611500372). Estamos deseando recibirte en el puerto de Blanes.`,
  },
];

/**
 * Seeds the database with 6 SEO blog posts.
 * Handles duplicate slugs gracefully by skipping existing posts.
 * After creation, updates publishedAt to the staggered date.
 */
export async function seedBlogPosts(storageInstance: IStorage): Promise<number> {
  let created = 0;

  for (const postData of blogPostsData) {
    try {
      // Check if post with this slug already exists
      const existing = await storageInstance.getBlogPostBySlug(postData.slug);
      if (existing) {
        console.log(`Blog post "${postData.slug}" already exists, skipping.`);
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
      console.log(`Created blog post: "${postData.title}" (${postData.slug})`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to create blog post "${postData.slug}": ${message}`);
    }
  }

  console.log(`Blog seed complete: ${created}/${blogPostsData.length} posts created.`);
  return created;
}
