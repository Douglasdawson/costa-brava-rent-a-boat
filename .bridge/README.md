# `.bridge/` — Buzón Cowork ↔ Claude Code

Canal asíncrono de archivos para eliminar copy-paste entre Claude en Cowork (Ivan's desktop assistant) y Claude Code (CLI en el repo). Ivan sigue siendo el disparador (abre Claude Code y lanza la sesión), pero el **contenido no se copia** — vive en archivos.

## Estructura

```
.bridge/
├── inbox/      # Briefs que Cowork escribe para Claude Code
├── outbox/     # Reportes que Claude Code escribe tras ejecutar un brief
├── archive/    # Briefs+reportes ya resueltos (mover aquí después de consumir)
└── README.md
```

## Protocolo

### 1. Cowork escribe un brief

- Archivo: `inbox/YYYY-MM-DD-HHMM-slug.md`
- Frontmatter obligatorio:

```markdown
---
type: read-only | edit
priority: P0 | P1 | P2
expected_output: inline-report | files | both
blocker: <nombre del otro brief>  # opcional, solo si hay dependencia
---

# Título del brief

## Objetivo
<una frase>

## Contexto
<solo lo que Claude Code necesita saber — no repetir memoria general>

## Tareas
1. …
2. …

## Formato del reporte
<qué quiere Cowork de vuelta — campos, ejemplos, errores aceptables>

## Reglas
- No commits automáticos salvo que el brief lo pida explícito
- Si falla algo, reportar "FAILED: <razón>" en el outbox, no improvisar
```

### 2. Ivan dispara Claude Code

Frase de trigger (copiable siempre):

> "Lee el brief más reciente en `.bridge/inbox/` cuyo nombre no empiece por `DONE-`. Ejecuta las tareas siguiendo las reglas del brief. Escribe el reporte en `.bridge/outbox/` con el mismo nombre que el brief. Cuando termines, renombra el brief de inbox añadiéndole prefijo `DONE-`. No hagas commit ni push salvo que el brief lo pida."

(Si existe slash command `/bridge` en el repo, tecleas `/bridge` y ya.)

### 3. Claude Code ejecuta y reporta

- Lee `inbox/{brief}.md`
- Ejecuta
- Escribe `outbox/{mismo-nombre}.md` con el reporte
- Renombra `inbox/{brief}.md` → `inbox/DONE-{brief}.md`

### 4. Ivan avisa a Cowork

> "Listo, reporte en outbox."

Cowork lee `outbox/`, procesa, mueve ambos archivos (brief + reporte) a `archive/`.

## Reglas de higiene

- **Naming:** `YYYY-MM-DD-HHMM-slug-descriptivo.md`. HHMM en hora local.
- **Un brief, un tema.** Si hay 2 fronts, 2 briefs. Facilita paralelizar y auditar.
- **No borrar briefs ni reportes** salvo traslado a `archive/`. El histórico vale oro para depurar confusiones futuras.
- **Briefs read-only** (diagnóstico, extracción, análisis) nunca deben generar commits.
- **Briefs edit** deben listar archivos tocados al final del reporte.
- Si un brief depende de otro (`blocker: X`), Claude Code debe verificar que X ya tenga su `DONE-` en inbox antes de ejecutar.
