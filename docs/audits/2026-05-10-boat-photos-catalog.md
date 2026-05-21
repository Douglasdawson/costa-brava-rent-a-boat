# Catálogo de fotos de la flota — auditoría visual

**Fecha:** 2026-05-10
**Origen:** las 48 fotos en `client/public/images/boats/{boat-id}/*.webp`
**Motivo:** decidir qué fotos son aptas para uso editorial (blog hero, redes, etc.) tras detectar contaminación por:
1. Branding obsoleto **BOAT ME / BoatMe Costa Brava** (canal/marca anterior — los barcos ya están físicamente rebrandeados como "Costa Brava Rent a Boat").
2. Fotos espejadas (texto reverso, branding ilegible).
3. Localización fuera de Blanes/Costa Brava (Barcelona Port Olímpic / Port Vell / Barceloneta, Costa Blanca).

## Leyenda de estado

| Tag | Significado | Apto para hero editorial |
|---|---|---|
| ✅ `CLEAN_BLANES` | Costa Brava + sin branding ajeno + texto legible | Sí |
| ⚠️ `BLANES_BRAND_OK` | Blanes + branding del fabricante/modelo (Remus, Brava, 57S — equiv. a "Toyota" en un coche) | Sí |
| 🟦 `NEUTRAL_DETAIL` | Closeup de equipo/interior sin pistas de ubicación ni branding ajeno | Sí (apoyo, no hero) |
| 🟥 `BOAT_ME` | Marca BOAT ME / BoatMeCostaBrava.com visible en el casco | No, contradice la marca propia |
| 🟥 `MIRRORED` | Foto espejada — texto reverso visible | No, parece error o foto manipulada |
| 🟧 `BARCELONA` | Skyline / arquitectura de Barcelona reconocible (Hotel W, Hotel Arts, Mapfre, Pez Gehry, yates Port Vell) | No, contradice "Costa Brava" |
| 🟧 `NOT_BLANES` | Marina mediterránea distinta a Blanes (Costa Blanca / Mallorca / luxury resort) | No |

## Resumen ejecutivo

| Barco | Fotos | ✅ aptas para hero | ⚠️ aceptables | 🟥/🟧 contaminadas | 🟦 detalle |
|---|---:|---:|---:|---:|---:|
| Astec 400 | 6 | 6 | 0 | 0 | 0 |
| Astec 480 | 6 | 1 | 1 | 4 | 0 |
| Solar 450 | 3 | 3 | 0 | 0 | 0 |
| Remus 450 | 3 | 3 | 0 | 0 | 0 |
| Mingolla Brava 19 | 7 | 1 | 2 | 3 | 1 |
| Pacific Craft 625 | 8 | 1 | 0 | 5 | 2 |
| Trimarchi 57S | 15 | 2 | 1 | 6 | 6 |
| **TOTAL** | **48** | **17** | **4** | **18** | **9** |

**Hallazgo clave:** **18 de 48 fotos (38%)** tienen contaminación seria (BOAT ME, espejadas, o ubicación fuera de Costa Brava). De las 21 "usables" (`CLEAN_BLANES` + `BLANES_BRAND_OK`), solo cubrirían cómodamente 4 de los 8 barcos para uso hero del blog (Astec 400, Astec 480, Solar 450, Remus 450). Pacific Craft y Trimarchi — los barcos premium top-de-gama — son los más afectados.

## Detalle por barco

### Astec 400 (6/6 ✅)

Todas las fotos están limpias en puerto de Blanes (Sant Joan castle al fondo). Registración `6ª 234-4-11` consistente. Sin branding tercero. **Es el barco con mejor cobertura fotográfica.**

| Archivo | Estado | Notas |
|---|---|---|
| `exterior-costa.webp` | ✅ CLEAN_BLANES | Sant Joan castle + marina Blanes |
| `exterior-puerto.webp` | ✅ CLEAN_BLANES | Sant Joan + paseo |
| `lateral-blanes.webp` | ✅ CLEAN_BLANES | Vista lateral, marina Blanes |
| `lateral-puerto.webp` | ✅ CLEAN_BLANES | Lateral con pantalán |
| `proa-solarium.webp` | ✅ CLEAN_BLANES | Vista cubierta (limpia, sin texto de casco) |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Sant Joan al fondo |

### Astec 480 (1 ✅ + 1 ⚠️ + 4 🟧)

Branding "BRUMA" visible en casco (es el nombre/modelo, OK). **Pero 4 de 6 fotos NO son de Blanes** — arquitectura de marina de lujo tipo Costa Blanca/Mallorca/Calpe.

| Archivo | Estado | Notas |
|---|---|---|
| `amarrado-puerto.webp` | 🟧 NOT_BLANES | Concrete pier + yates de lujo, no Blanes |
| `exterior-puerto.webp` | ⚠️ BLANES_BRAND_OK | Blanes + "BRUMA" en casco |
| `navegando-costa.webp` | 🟧 NOT_BLANES | Apartamentos lujo no-Blanes; persona visible |
| `navegando-lateral.webp` | 🟧 NOT_BLANES | Misma marina lujo no-Blanes |
| `navegando-patron.webp` | 🟧 NOT_BLANES | Marina con muchos barcos amarrados, no Blanes |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Blanes + Sant Joan, "BRUMA" como modelo |

### Solar 450 (3/3 ✅)

Las 3 fotos limpias en puerto de Blanes. Registración `6ª 238-11-17`. Sin branding tercero.

| Archivo | Estado | Notas |
|---|---|---|
| `cubierta-proa.webp` | ✅ CLEAN_BLANES | Top-down desde pantalán |
| `exterior-puerto.webp` | ✅ CLEAN_BLANES | Sant Joan + marina, bandera Catalana |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Sant Joan al fondo |

### Remus 450 (3/3 ✅)

Las 3 fotos limpias en Blanes con "REMUS 450 SC" (modelo del fabricante, OK). Registración `6ª 233-9-19`. Esta foto `familia-navegando` es la más fuerte de la flota para hero familia.

| Archivo | Estado | Notas |
|---|---|---|
| `exterior-puerto.webp` | ✅ CLEAN_BLANES | Sant Joan + marina Blanes |
| `familia-navegando.webp` | ✅ CLEAN_BLANES | Padre + 2 niños en el barco, Mediterráneo abierto |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Sant Joan + marina Blanes |

### Mingolla Brava 19 (1 ✅ + 2 ⚠️ + 3 🟧 + 1 🟦)

"Brava" es el modelo (Mingolla **Brava** 19). **Pero 3 fotos están claramente en Barcelona Port Olímpic** (Hotel Arts + torre Mapfre + Barceloneta beach reconocibles).

| Archivo | Estado | Notas |
|---|---|---|
| `asiento-mesa.webp` | 🟦 NEUTRAL_DETAIL | Mesa de proa + cojines, sin contexto de ubicación |
| `exterior-puerto.webp` | ⚠️ BLANES_BRAND_OK | Blanes + "Brava" como modelo |
| `lateral-mar.webp` | 🟧 BARCELONA | Barceloneta beach + arquitectura BCN |
| `lateral-navegando.webp` | 🟧 BARCELONA | Hotel Arts + torre Mapfre claramente visibles |
| `popa-motor.webp` | ⚠️ BLANES_BRAND_OK | Marina con muchos barcos, probablemente Blanes |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Sant Joan + Blanes confirmado |
| `solarium-proa.webp` | 🟧 BARCELONA | Barceloneta beach al fondo |

### Pacific Craft 625 (1 ✅ + 5 🟥 + 2 🟦)

**El más contaminado de la flota.** La mayoría de fotos exteriores muestran el branding **"BOAT ME COSTA BRAVA"** + URL `WWW.BOATMECOSTABRAVA.COM` en el casco — marca obsoleta que ya no existe en los barcos físicos. Tampoco hay foto familia-navegando o sunset usable.

| Archivo | Estado | Notas |
|---|---|---|
| `asientos-capitan.webp` | 🟦 NEUTRAL_DETAIL | Vista interior helm + asientos, costa rocosa al fondo (no identificable Blanes) |
| `cala-agua-cristalina.webp` | 🟥 MIRRORED | Texto "BOAT ME COSTA BRAVA" reverso visible |
| `cala-costa-brava.webp` | 🟥 BOAT_ME | "BOAT ME COSTA BRAVA" + URL visibles, Tossa de Mar al fondo |
| `consola-timon-cala.webp` | 🟦 NEUTRAL_DETAIL | Vista timón en cala, sin texto casco visible |
| `exterior-puerto.webp` | 🟥 MIRRORED | "3M TADE" reverso visible (BoatMe espejado) |
| `fondeado-bahia.webp` | 🟥 BOAT_ME | "BOAT ME" + URL claramente visibles en lateral |
| `proa-solarium-cala.webp` | ✅ CLEAN_BLANES | Vista cubierta + cala Costa Brava (acantilados con pinos), sin texto casco |
| `puerto-blanes.webp` | 🟥 MIRRORED | "BAA TAME" reverso, Blanes al fondo |

### Trimarchi 57S (2 ✅ + 1 ⚠️ + 6 🟧 + 6 🟦)

**La mayoría de fotos editoriales (people, lifestyle) están en BARCELONA, no en Costa Brava.** Reconocibles: Hotel W (sail-shaped), Hotel Arts, torre Mapfre, Pez Gehry, yates lujo Port Vell, Barceloneta. Branding del modelo "57S" + "Trimarchi" es OK (fabricante).

| Archivo | Estado | Notas |
|---|---|---|
| `altavoz-kicker.webp` | 🟦 NEUTRAL_DETAIL | Closeup altavoz Kicker |
| `consola-timon.webp` | 🟦 NEUTRAL_DETAIL | Closeup consola con GPS + compás |
| `exterior-puerto.webp` | ✅ CLEAN_BLANES | Sant Joan + marina Blanes confirmado |
| `gps-lowrance.webp` | 🟦 NEUTRAL_DETAIL | Closeup GPS Lowrance Hook |
| `lateral-marina.webp` | 🟧 BARCELONA | Hotel Arts + Mapfre al fondo, pareja con bebidas |
| `motor-selva-detalle.webp` | 🟦 NEUTRAL_DETAIL | Closeup motor Selva Spearfish |
| `pareja-navegando.webp` | ⚠️ BLANES_BRAND_OK | Pareja al timón, marina con kayaks (probablemente Barcelona, ambiguo) |
| `pareja-navegando-yates.webp` | 🟧 BARCELONA | Pareja delante de mega-yachts, claramente Port Vell |
| `popa-atardecer.webp` | 🟧 BARCELONA | Hotel W (vela) al sunset, claramente Barcelona |
| `popa-motor-selva.webp` | 🟦 NEUTRAL_DETAIL | Vista popa con motor Selva, "Positano" en lateral |
| `proa-aperitivo.webp` | 🟧 BARCELONA | Skyline BCN claro: Hotel Arts + Mapfre + Pez Gehry |
| `proa-decoracion-verano.webp` | 🟧 BARCELONA | Hotel Arts + Mapfre al fondo, flamenco hinchable |
| `puerto-blanes.webp` | ✅ CLEAN_BLANES | Sant Joan + Blanes confirmado |
| `radio-bluetooth.webp` | 🟦 NEUTRAL_DETAIL | Closeup radio Sportnav |
| `vista-completa-puerto.webp` | ⚠️ BLANES_BRAND_OK | Marina con sailboats, posiblemente Blanes |

## Implicaciones para el blog

**Cobertura por barco para uso hero (✅ + ⚠️):**

| Barco | Hero-aptas | Cobertura editorial |
|---|---:|---|
| Astec 400 | 6 | Excelente — sobra material |
| Solar 450 | 3 | Buena — todas en Blanes |
| Remus 450 | 3 | Buena — incluye `familia-navegando` ⭐ |
| Astec 480 | 2 | Limitada — sólo `puerto-blanes` y `exterior-puerto` |
| Mingolla Brava 19 | 3 | Limitada — `puerto-blanes`, `exterior-puerto`, `popa-motor` |
| Pacific Craft 625 | **1** | **Crítico** — solo `proa-solarium-cala` es usable como hero (sin texto BOAT ME) |
| Trimarchi 57S | **3** | **Crítico** — solo 2 confirmadas Blanes (`puerto-blanes`, `exterior-puerto`) + 1 ambigua |

## Caminos posibles (para decisión)

1. **Camino A — sólo fotos limpias, mapeo restringido**
   Re-mapear los 28 posts del blog usando solo las 21 fotos `CLEAN_BLANES` o `BLANES_BRAND_OK`. Pacific Craft y Trimarchi quedarían infrarrepresentados. Algunos posts no tendrían foto óptima por tema.

2. **Camino B — Nanobanana editing (requiere billing en Google AI Studio)**
   Editar las 18 fotos contaminadas para borrar BOAT ME y/o cambiar background de Barcelona → Costa Brava. Coste estimado: ~$1-2 (Nano Banana 2 a $0.039-0.10/imagen). Riesgo: edits de background son más difíciles que borrado de texto y pueden quedar "AI-evidentes".

3. **Camino C — sesión fotográfica nueva**
   Reservar fotógrafo en Blanes con la flota actual (rebrandeada como Costa Brava Rent a Boat). Tiempo: 1 día de shoot + edición. Coste: variable según fotógrafo. **Único camino que resuelve el problema de raíz** (las fotos seguirán contaminadas digitalmente, pero tendrías material auténtico para usar primero).

4. **Camino D — combinado**
   - Corto plazo: usar sólo fotos limpias para el blog (Camino A) durante la sesión nueva.
   - Plazo medio: organizar shoot fotográfico (Camino C).
   - Plazo largo: Nanobanana editing como complemento si hace falta variedad.
