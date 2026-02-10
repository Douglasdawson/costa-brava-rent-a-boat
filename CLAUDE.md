# Instrucciones para Claude Code

## Contexto del Proyecto
Este es un proyecto de alquiler de barcos en Blanes, Costa Brava. Lee `PROJECT_CONTEXT.md` para contexto completo.

## Idioma
- **Comunicación**: Español (el usuario prefiere español)
- **Código**: Inglés (nombres de variables, funciones, comentarios técnicos)
- **UI/Contenido**: Multi-idioma (8 idiomas soportados)

## Convenciones de Código

### TypeScript
- Strict mode habilitado
- Usar tipos explícitos, evitar `any`
- Interfaces sobre types cuando sea posible
- Usar Zod para validación runtime

### React
- Componentes funcionales con hooks
- Nombrar componentes en PascalCase
- Usar `@/` para imports absolutos desde `client/src/`
- Lazy loading para páginas no críticas

### Estilos
- TailwindCSS exclusivamente (no CSS custom)
- Usar clases de `shadcn/ui` cuando existan
- Mobile-first responsive design
- Colores via CSS variables (ver `tailwind.config.ts`)

### API
- RESTful endpoints
- Validación con Zod en servidor
- Errores en español para usuario final
- Logs en inglés para debugging

### Base de Datos
- Drizzle ORM para queries
- Schemas en `shared/schema.ts`
- Nombres de tablas en snake_case
- Campos en camelCase en TypeScript

## Archivos Importantes

| Modificación | Archivo(s) |
|--------------|------------|
| Nueva ruta frontend | `client/src/App.tsx` |
| Nuevo componente | `client/src/components/` |
| Nuevo endpoint API | `server/routes.ts` |
| Nuevo campo DB | `shared/schema.ts` + `npm run db:push` |
| Precios/temporadas | `shared/pricing.ts` |
| Datos de barcos | `shared/boatData.ts` |
| SEO de página | `client/src/utils/seo-config.ts` |
| Chatbot comportamiento | `server/whatsapp/aiService.ts` |
| Knowledge base | `server/whatsapp/seedKnowledgeBase.ts` |

## Patrones Comunes

### Crear nuevo endpoint API
```typescript
// En server/routes.ts
app.get("/api/nuevo-endpoint", async (req, res) => {
  try {
    const data = await storage.getData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: "Error: " + error.message });
  }
});

// Con autenticación admin
app.get("/api/admin/endpoint", requireAdminSession, async (req, res) => {
  // ...
});
```

### Crear nuevo componente
```typescript
// client/src/components/MiComponente.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export function MiComponente() {
  const { language } = useLanguage();
  // ...
}
```

### Añadir campo a tabla existente
```typescript
// 1. Modificar shared/schema.ts
export const miTabla = pgTable("mi_tabla", {
  // campos existentes...
  nuevoCampo: text("nuevo_campo"),
});

// 2. Ejecutar: npm run db:push
```

### Query con Drizzle
```typescript
// SELECT con filtros
const results = await db
  .select()
  .from(bookings)
  .where(
    and(
      eq(bookings.boatId, boatId),
      gte(bookings.startTime, startDate)
    )
  );

// INSERT
const [newRecord] = await db
  .insert(bookings)
  .values(bookingData)
  .returning();

// UPDATE
const [updated] = await db
  .update(bookings)
  .set({ status: "confirmed" })
  .where(eq(bookings.id, id))
  .returning();
```

## Cosas a Evitar

- NO crear archivos `.md` nuevos sin que el usuario lo pida
- NO añadir emojis al código o UI
- NO usar `console.log` en producción (usar solo para debug temporal)
- NO commitear cambios sin que el usuario lo solicite
- NO modificar `package.json` sin explicar por qué
- NO usar `any` en TypeScript
- NO crear tests (no hay setup de testing)

## Flujo de Trabajo Recomendado

1. **Antes de modificar**: Leer el archivo completo con `Read`
2. **Cambios pequeños**: Usar `Edit` con old_string/new_string
3. **Archivos nuevos**: Usar `Write`
4. **Verificar sintaxis**: El usuario puede correr `npm run check`
5. **Probar**: El usuario puede correr `npm run dev`

## Información de Negocio

- **Temporada**: Abril - Octubre (fuera de temporada no se aceptan reservas)
- **Ubicación**: Puerto de Blanes, Girona, España
- **Teléfono**: +34 611 500 372
- **Email**: costabravarentboat@gmail.com
- **PIN Admin CRM**: 0760

## Preguntas Frecuentes del Desarrollo

**¿Cómo añadir un nuevo barco?**
1. Añadir datos en `shared/boatData.ts`
2. Insertar en DB via CRM o `POST /api/admin/boats`

**¿Cómo cambiar precios?**
1. Modificar `pricing` en `shared/boatData.ts`
2. Actualizar barco en DB

**¿Cómo añadir nuevo idioma SEO?**
1. Añadir traducciones en `client/src/utils/seo-config.ts`
2. Añadir hreflang en `HREFLANG_CODES`
3. Actualizar sitemaps en `server/routes.ts`

**¿Cómo modificar el chatbot?**
1. Comportamiento IA: `server/whatsapp/aiService.ts`
2. Functions: `server/whatsapp/functionCallingService.ts`
3. Knowledge base: `server/whatsapp/seedKnowledgeBase.ts`
