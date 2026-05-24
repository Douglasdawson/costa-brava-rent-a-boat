# AI Discoverability — Tier 3 handoff (HF dataset + Skill + registries)

Auto-generado tras completar Tier 3 del roadmap de "máximo nivel" para
crawlers IA. Lista las acciones manuales que necesitas hacer fuera del repo
para que las nuevas piezas estén vivas.

## 1. Publicar el Hugging Face Dataset (T3.1)

El script ya está construido en `scripts/publish-hf-dataset.ts`. Genera
`data/hf-dataset/` con 5 archivos y los publica en
`huggingface.co/datasets/costabravarentaboat/boat-rental-blanes` bajo
licencia CC-BY-4.0.

Pasos:

1. Crear cuenta en https://huggingface.co/ (si no tienes ya).
2. Crear una organización `costabravarentaboat` (o ajustar `REPO_ID` en el
   script a tu username personal).
3. Obtener token write en https://huggingface.co/settings/tokens
4. Probar local primero (sin upload):
   ```
   tsx scripts/publish-hf-dataset.ts --dry
   ```
   Esto genera `data/hf-dataset/` y muestra los conteos.
5. Publicar:
   ```
   HF_TOKEN=hf_xxx tsx scripts/publish-hf-dataset.ts
   ```

Objetivo a 2–3 años: aparecer en filtros de calidad estilo FineWeb 3.0 y
quedar incluidos en corpus de training de futuros modelos. Pionero absoluto
en el sector hospitality/boat-rental SMB.

## 2. Anthropic Skill manifest (T3.2)

`client/public/.well-known/skills/booking.skill.json` ya se publica en

    https://www.costabravarentaboat.com/.well-known/skills/booking.skill.json

Es JSON (no zip) hasta que Anthropic formalice el `.skill` binario. El
manifest documenta:
- URL del MCP público y sus 9 tools
- Workflow recomendado para un agente
- Límites (capacidad, season, license-free range)
- Disambiguation explícita contra "Rent a Boat Blanes" y otros competidores

## 3. MCP registry submissions

Ningún registry tiene API pública aún — son formularios web. Acciones:

### mcp.run (registry público, vivo hoy)
1. Cuenta en https://www.mcp.run/
2. New listing → tipo "HTTP MCP Server"
3. URL: `https://www.costabravarentaboat.com/api/mcp/public`
4. Authentication: none
5. Pega los 9 tools del manifest skill como descripción de capacidades
6. Tags: `tourism`, `boat-rental`, `booking`, `availability`, `costa-brava`

### Claude Connectors Directory (aún no abierto a SMBs — pendiente Q3 2026 según rumor)
Cuando Anthropic abra el formulario público, submit con:
- MCP URL anterior
- Skill manifest URL anterior
- Logo: `https://www.costabravarentaboat.com/og-image.webp`

### Cursor Marketplace (cuando admita HTTP MCPs no OAuth)
- Igual que Claude Connectors. Cursor tiene un settings.json local; los
  usuarios pueden añadir nuestro MCP manualmente ya mismo poniendo:
  ```json
  "mcp.servers": {
    "costabravarentaboat": {
      "url": "https://www.costabravarentaboat.com/api/mcp/public",
      "transport": "http"
    }
  }
  ```

### Continue.dev registry
- Repo https://github.com/continuedev/continue → abrir PR a `extensions/mcp-servers/` con la entrada.

## 4. Wikidata (T1.2 — pendiente del Tier 1 original)

Recordatorio: queda pendiente crear el ítem Wikidata y pegarme el QID en
`shared/businessProfile.ts` → `BUSINESS_WIKIDATA_QID`. Cuando lo hagas:

- `BUSINESS_WIKIDATA_QID = "Q########"` (sustituir el string vacío)
- Republish
- Verificar `https://www.costabravarentaboat.com/api/ai-context` — verás
  el QID propagarse a `identifier[]` y `sameAs[]` automáticamente.

## 5. db:push pendiente

Recordatorio del Tier 1 + Tier 2: tres tablas nuevas necesitan migración:
- `ai_mentions`
- `citation_experiments`
- `ai_search_index`

Ejecutar:
```
npm run db:push
```

Hasta entonces, los endpoints `/api/admin/ai-mentions/*`,
`/api/admin/citation-experiments/*`, `/api/ai-search` (rama hybrid) van a
fallar silenciosamente con error de tabla no existente.
