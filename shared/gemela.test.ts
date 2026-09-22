import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { BOAT_DATA } from "./boatData";
import { escolaNauticaHandoff, ESCOLA_NAUTICA_LANGS } from "./escolaNauticaLinks";

/**
 * Cruce con la web HERMANA (`escolanauticablanes`), el espejo del test que ella
 * tiene contra esta.
 *
 * Las dos son del mismo dueño y hablan de la misma escuela, los mismos barcos y
 * la misma titulación. El 22-sep-2026 se cruzaron por primera vez y no
 * cuadraban: aquí se afirmaba **en presente** que la escuela «imparte» la
 * licencia —en el JSON-LD que sirve a GPTBot y ClaudeBot, con el AGR163 sin
 * resolver—, el Pacific Craft se publicaba a 6,24 m *y* como apto para una
 * licencia que topa en 6, y el glosario decía que la Licencia de Navegación
 * lleva examen.
 *
 * 🔴 **No es un import entre repos, y no puede serlo.** Se despliegan por
 * separado; acoplarlos en build sería peor que el problema. Lee los ficheros de
 * la hermana **si están en disco** —lo están en el Mac, donde los dos repos son
 * hermanos de carpeta— y **se salta la prueba si no**, que es lo que pasa en el
 * contenedor del VPS. Caza la deriva donde se trabaja, y no rompe el deploy
 * donde no puede comprobarla.
 *
 * El test de allí existe igual. Hacen falta los dos: quien trabaja en este repo
 * ejecuta estos tests, no los de la escuela.
 *
 * Si falla, la pregunta NO es «¿cómo lo relajo?» sino «¿cuál de las dos webs
 * está mintiendo?».
 */
const HERMANA = path.resolve(__dirname, "..", "..", "escolanauticablanes");
const hay = existsSync(HERMANA);
const leer = (rel: string) => readFileSync(path.join(HERMANA, rel), "utf8");

describe.skipIf(!hay)("lo que las dos webs dicen de la escuela y de la flota", () => {
  it("las esloras de la flota con licencia son las mismas a los dos lados", () => {
    /*
     * El «625» del Pacific Craft es nombre comercial, no medida: su eslora de
     * inscripción son 5,90 m. Esa es la que decide si entra en la licencia, y
     * la que la escuela publica en su copy.
     */
    const flota = leer("shared/i18n/es.ts");
    for (const [barco, eslora] of [
      ["Trimarchi 57S", "5,70 m"],
      ["Pacific Craft 625", "5,90 m"],
      ["Mingolla Brava 19", "5,99 m"],
    ]) {
      expect(flota, `la hermana ya no publica ${barco} a ${eslora}`).toContain(`${barco} · ${eslora}`);
    }

    // Y aquí ninguna puede pasar de los 6 m de la licencia: la ficha decía
    // 6,24 m y a la vez «Requiere Licencia de Navegación (LN) o superior».
    for (const [id, barco] of Object.entries(BOAT_DATA)) {
      const largo = Number(barco.specifications?.length?.replace(/[^\d,]/g, "").replace(",", "."));
      if (!largo) continue;
      expect(largo, `${id} pasa del límite de la LN`).toBeLessThan(6);
    }
  });

  it("ninguna de las dos promete FECHA DE APERTURA", () => {
    // La escuela retiró «abril de 2027» porque depende de una resolución que no
    // controla nadie de aquí; su constante `OPENING` es hoy un adverbio. Dos
    // webs del mismo dueño no pueden prometer cosas distintas sobre la misma.
    expect(leer("shared/business.ts")).toMatch(/export const OPENING = "(?!.*20\d\d)[^"]+"/);
    for (const lang of ESCOLA_NAUTICA_LANGS) {
      const h = escolaNauticaHandoff(lang, "titulin-course")!;
      expect(`${h.title} ${h.body} ${h.finalTitle} ${h.finalBody}`, lang).not.toMatch(
        /\b20(2[7-9]|[3-9]\d)\b/,
      );
    }
  });

  it("el tope del descuento es el mismo a los dos lados", () => {
    // Allí se dibuja en `EscaleraDescuento`; aquí lo aplica el CRM. Si dejan de
    // cuadrar, alguien cobra un porcentaje que la web no prometió.
    expect(leer("shared/business.ts")).toMatch(/TOPE_DESCUENTO_CBRB = 30\b/);
    expect(readFileSync(path.join(__dirname, "..", "server/storage/promotions.ts"), "utf8")).toMatch(
      /capped at 30|cap.*\b30\b/i,
    );
  });
});
