#!/usr/bin/env node
/**
 * Corrige en los artículos publicados la promesa de DEVOLVER EL DINERO por la
 * política real: nueva fecha sin coste o bono de 12 meses; devolución en dinero
 * solo con la Garantía de mal tiempo contratada.
 *
 * Por qué: los posts prometían "te devolvemos el depósito íntegro", que contradice
 * las condiciones generales ("las reservas confirmadas con depósito no son
 * reembolsables en dinero") y regala lo que la Garantía de 10€ vende. Están
 * indexados en Google, así que un cliente puede reclamar con ellos en la mano.
 *
 * Uso (dry-run por defecto, como todo script de datos de la casa):
 *   FUNNEL_DATABASE_URL=… node scripts/fix-politica-posts.mjs
 *   FUNNEL_DATABASE_URL=… node scripts/fix-politica-posts.mjs --commit
 *   FUNNEL_DATABASE_URL=… node scripts/fix-politica-posts.mjs --rollback <backup.json>
 *
 * Los pares son LITERALES exactos: si un post cambia de redacción, el par deja de
 * aplicar y el script lo dice en vez de tocar nada a ciegas.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

const URL_BD = process.env.FUNNEL_DATABASE_URL;
if (!URL_BD) {
  console.error("Falta FUNNEL_DATABASE_URL");
  process.exit(1);
}

const sql = (q) =>
  execFileSync("psql", [URL_BD, "-At", "-c", q], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// Cuerpo del artículo (castellano)
const PARES_ES = [
  ["reprogramamos sin coste o te devolvemos el depósito íntegro.",
   "reprogramamos sin coste o te damos un bono por el importe abonado, válido 12 meses."],
  ["Reprogramamos sin coste o te devolvemos el depósito íntegro.",
   "Reprogramamos sin coste o te damos un bono válido 12 meses; con la Garantía de mal tiempo contratada, eliges devolución en dinero."],
  ["reprogramamos sin coste o te devolvemos el depósito íntegro: nadie navega a disgusto.",
   "reprogramamos sin coste o te damos un bono válido 12 meses: nadie navega a disgusto."],
  ["reprogramamos sin coste o devolvemos el depósito íntegro.",
   "reprogramamos sin coste o te damos un bono válido 12 meses."],
  ["Reprogramamos la salida o devolvemos el depósito íntegro.",
   "Reprogramamos la salida o te damos un bono válido 12 meses."],
  ["Reprogramamos sin coste o devolvemos el depósito íntegro si el día no es seguro.",
   "Reprogramamos sin coste o te damos un bono válido 12 meses si el día no es seguro."],
  ["Reprogramamos la fecha o devolvemos el importe íntegro.",
   "Reprogramamos la fecha o te damos un bono por el importe abonado, válido 12 meses."],
  ["reprogramación sin coste o devolución íntegra del depósito.",
   "reprogramación sin coste o bono por el importe abonado, válido 12 meses (devolución en dinero solo con la Garantía de mal tiempo contratada)."],
  ["- **Reembolso completo** si no es posible encontrar otra fecha",
   "- **Bono por el importe abonado**, válido 12 meses, si no es posible encontrar otra fecha"],
  // Borrador aún sin publicar: se corrige antes de que salga con la promesa vieja.
  ["reprogramamos sin coste o te devolvemos el depósito íntegro, algo especialmente útil cuando reservas de un día para otro",
   "reprogramamos sin coste o te damos un bono válido 12 meses, algo especialmente útil cuando reservas de un día para otro"],
];

// Traducciones dentro de content_by_lang
const PARES_LANG = [
  ["we offer a date change at no cost or full refund.",
   "we offer a date change at no cost or a 12-month voucher (cash refund only with the Weather guarantee)."],
  ["bieten wir kostenlosen Terminwechsel oder vollständige Rückerstattung.",
   "bieten wir kostenlosen Terminwechsel oder einen Gutschein über 12 Monate (Rückerstattung in Geld nur mit der Schlechtwetter-Garantie)."],
  ["nous vous offrons un changement de date sans frais ou un remboursement complet.",
   "nous vous offrons un changement de date sans frais ou un bon valable 12 mois (remboursement en argent uniquement avec la Garantie mauvais temps)."],
  ["bieden we kosteloos een andere datum of volledige terugbetaling.",
   "bieden we kosteloos een andere datum of een waardebon van 12 maanden (geld terug alleen met de Slechtweergarantie)."],
  ["- **Full refund** if it's not possible to find another date",
   "- **12-month voucher** if it's not possible to find another date"],
  ["- **Vollständige Rückerstattung** wenn kein anderer Termin möglich ist",
   "- **Gutschein über 12 Monate** wenn kein anderer Termin möglich ist"],
  ["- **Remboursement complet** s'il n'est pas possible de trouver une autre date",
   "- **Bon valable 12 mois** s'il n'est pas possible de trouver une autre date"],
  ["- **Volledige terugbetaling** als het niet mogelijk is om een andere datum te vinden",
   "- **Waardebon van 12 maanden** als het niet mogelijk is om een andere datum te vinden"],
];

const esc = (s) => s.replace(/'/g, "''");

if (process.argv.includes("--rollback")) {
  const fichero = process.argv[process.argv.indexOf("--rollback") + 1];
  const filas = JSON.parse(readFileSync(fichero, "utf8"));
  for (const f of filas) {
    sql(`update blog_posts set content = '${esc(f.content)}', content_by_lang = '${esc(JSON.stringify(f.content_by_lang))}'::jsonb where id = '${f.id}'`);
  }
  console.log(`Restaurados ${filas.length} artículos desde ${fichero}`);
  process.exit(0);
}

const commit = process.argv.includes("--commit");

// 1) Qué pares aplican y a cuántos artículos
let total = 0;
console.log(`\n${commit ? "APLICANDO" : "DRY-RUN"} · promesa de devolución → bono de 12 meses\n`);
for (const [viejo, nuevo] of PARES_ES) {
  const n = Number(sql(`select count(*) from blog_posts where content like '%${esc(viejo)}%'`).trim());
  total += n;
  console.log(`  ${n > 0 ? "✓" : "·"} ${n} art. ES  ${viejo.slice(0, 62)}…`);
}
for (const [viejo] of PARES_LANG) {
  // esc() ya duplica las comillas simples: escaparlas otra vez rompía justo los
  // pares con apóstrofe ("it's", "s'il"), que salían con 0 coincidencias.
  const n = Number(sql(`select count(*) from blog_posts where content_by_lang::text like '%${esc(viejo)}%'`).trim());
  total += n;
  console.log(`  ${n > 0 ? "✓" : "·"} ${n} trad.   ${viejo.slice(0, 62)}…`);
}

if (!commit) {
  console.log(`\n${total} sustituciones pendientes. Repite con --commit para aplicarlas.\n`);
  process.exit(0);
}

// 2) Copia de seguridad de todo lo que se va a tocar
const afectados = JSON.parse(
  sql(`select coalesce(json_agg(row_to_json(t)), '[]') from (
         select id, slug, content, content_by_lang from blog_posts
         where ${PARES_ES.map(([v]) => `content like '%${esc(v)}%'`).join(" or ")}
            or ${PARES_LANG.map(([v]) => `content_by_lang::text like '%${esc(v)}%'`).join(" or ")}
       ) t`)
);
const backup = `/tmp/blog-politica-backup-${afectados.length}.json`;
writeFileSync(backup, JSON.stringify(afectados, null, 2));
console.log(`\nCopia de seguridad: ${backup} (${afectados.length} artículos)`);

// 3) Aplicar, en una sola transacción
const updates = [
  ...PARES_ES.map(([v, n]) => `update blog_posts set content = replace(content, '${esc(v)}', '${esc(n)}') where content like '%${esc(v)}%';`),
  ...PARES_LANG.map(([v, n]) => `update blog_posts set content_by_lang = replace(content_by_lang::text, '${esc(v)}', '${esc(n)}')::jsonb where content_by_lang::text like '%${esc(v)}%';`),
];
sql(`begin; ${updates.join(" ")} commit;`);
console.log("Aplicado.\n");
