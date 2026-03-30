# Guia de Solucion de Problemas - Costa Brava Rent a Boat

> Ultima actualizacion: Marzo 2026
> Stack: React 18 + Express.js + PostgreSQL (Neon) + Drizzle ORM

---

## Tabla de Contenidos

1. [Problemas de Desarrollo Local](#1-problemas-de-desarrollo-local)
2. [Problemas de Base de Datos](#2-problemas-de-base-de-datos)
3. [Problemas de Despliegue (Replit)](#3-problemas-de-despliegue-replit)
4. [Problemas de APIs Externas](#4-problemas-de-apis-externas)
5. [Problemas del Frontend](#5-problemas-del-frontend)
6. [Problemas del CRM/Admin](#6-problemas-del-crm-admin)
7. [Problemas de WhatsApp Chatbot](#7-problemas-de-whatsapp-chatbot)
8. [Comandos Utiles de Diagnostico](#8-comandos-utiles-de-diagnostico)

---

## 1. Problemas de Desarrollo Local

### 1.1 El servidor no arranca: "Invalid environment configuration"

**Sintoma:** Al ejecutar `npm run dev` aparece un error como:

```
Invalid environment variables: { DATABASE_URL: ['Required'], JWT_SECRET: ['...'] }
Error: Invalid environment configuration. Check the errors above.
```

**Causa:** Faltan variables de entorno obligatorias. El archivo `server/config.ts` valida con Zod tres variables requeridas al iniciar:

- `DATABASE_URL` - cadena de conexion PostgreSQL
- `JWT_SECRET` - minimo 32 caracteres
- `ADMIN_PIN` - exactamente 6 digitos

**Solucion:**

```bash
# 1. Copiar el archivo de ejemplo
cp .env.example .env

# 2. Editar .env y rellenar al menos estas tres variables:
#    DATABASE_URL=postgresql://user:password@host:5432/dbname
#    JWT_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres
#    ADMIN_PIN=123456

# 3. Verificar que .env existe y tiene contenido
cat .env | grep -E "^(DATABASE_URL|JWT_SECRET|ADMIN_PIN)"

# 4. Arrancar de nuevo
npm run dev
```

**Nota:** El resto de variables (Stripe, SendGrid, Twilio, OpenAI, etc.) son opcionales. Las funcionalidades asociadas se desactivan automaticamente si no estan configuradas.

---

### 1.2 El servidor no arranca: puerto en uso (EADDRINUSE)

**Sintoma:**

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Causa:** Otro proceso ya esta escuchando en el puerto 5000 (el puerto por defecto).

**Solucion:**

```bash
# 1. Encontrar que proceso usa el puerto
lsof -i :5000

# 2. Matar el proceso (reemplaza PID con el numero real)
kill -9 <PID>

# 3. O bien, cambiar el puerto en .env
echo "PORT=3001" >> .env

# 4. Arrancar de nuevo
npm run dev
```

**Importante:** En Replit, solo el puerto definido en la variable `PORT` esta abierto. Si cambias el puerto localmente, recuerda que en produccion debe coincidir con lo que Replit espera (normalmente 5000).

---

### 1.3 Errores de compilacion TypeScript

**Sintoma:** Errores de tipo al ejecutar el proyecto o al hacer build.

**Solucion:**

```bash
# Ejecutar el type-checker completo (sin emitir archivos)
npx tsc --noEmit

# O usar el script del proyecto
npm run check
```

**Nota importante:** `tsc` tarda mas de 2 minutos en este codebase debido a su tamano. Es normal.

**Errores frecuentes:**

| Error | Causa | Solucion |
|-------|-------|----------|
| `Cannot find module '@/...'` | Path alias roto | Verificar que `tsconfig.json` tiene `"@/*": ["./client/src/*"]` |
| `Cannot find module '@shared/...'` | Path alias shared roto | Verificar que `tsconfig.json` tiene `"@shared/*": ["./shared/*"]` |
| `Type 'any' is not assignable` | Strict mode activo | Anadir tipos explicitos, no usar `any` |
| `Property does not exist on type` | Campo nuevo en schema | Verificar que `shared/schema.ts` esta actualizado y ejecutar `npm run db:push` |

---

### 1.4 Vite HMR no funciona (cambios no se reflejan)

**Sintoma:** Editas un archivo React y el navegador no se actualiza automaticamente.

**Causa probable:** Cache de Vite corrupta, o el servidor WebSocket de HMR no conecta.

**Solucion:**

```bash
# 1. Limpiar la cache de Vite
rm -rf node_modules/.vite

# 2. Reiniciar el servidor de desarrollo
npm run dev
```

**Si sigue sin funcionar:**

- Verificar que el navegador no bloquea WebSocket (extensiones como uBlock pueden interferir).
- Revisar la consola del navegador para errores de tipo `[vite] failed to connect to websocket`.
- En Replit, el proxy puede interferir con WebSocket. Intentar acceder directamente al puerto de Vite si es posible.

**Nota sobre `vite.config.ts`:** El proyecto usa `server.fs.strict: true` y deniega acceso a archivos ocultos (`**/.*`). Si tienes archivos con nombres que empiezan por `.` que necesitas importar, esto los bloqueara.

---

### 1.5 Problemas con path aliases (@/ imports)

**Sintoma:**

```
Module not found: Can't resolve '@/components/...'
```

**Causa:** Los path aliases deben estar configurados en dos sitios:

1. `tsconfig.json` - para TypeScript
2. `vite.config.ts` - para el bundler de Vite

**Verificacion:**

```bash
# Verificar tsconfig.json
grep -A 5 '"paths"' tsconfig.json
# Debe mostrar:
#   "@/*": ["./client/src/*"]
#   "@shared/*": ["./shared/*"]
#   "@assets/*": ["./attached_assets/*"]
```

Los aliases configurados en `vite.config.ts` son:

| Alias | Resuelve a |
|-------|-----------|
| `@/` | `client/src/` |
| `@shared/` | `shared/` |
| `@assets/` | `attached_assets/` |

**Nota:** Los archivos dentro de `server/mcp/` usan imports relativos, NO path aliases `@shared/`. Esto es intencionado porque los MCP servers no pasan por Vite.

---

### 1.6 `npm install` falla o dependencias rotas

**Sintoma:** Errores al instalar dependencias, especialmente `sharp` o `bcrypt` (modulos nativos).

**Solucion:**

```bash
# 1. Limpiar completamente
rm -rf node_modules package-lock.json

# 2. Reinstalar
npm install

# Si sharp falla en Mac con ARM (M1/M2/M3):
npm install --platform=darwin --arch=arm64 sharp
```

---

## 2. Problemas de Base de Datos

### 2.1 Error de conexion a Neon PostgreSQL

**Sintoma:**

```
Error: connect ETIMEDOUT
```

o

```
[DB] Pool connection error (will reconnect on next query): Connection terminated unexpectedly
```

**Causa:** Neon PostgreSQL es serverless y suspende bases de datos inactivas. La primera conexion tras un periodo de inactividad puede tardar unos segundos.

**Solucion:**

```bash
# 1. Verificar que DATABASE_URL es correcta
echo $DATABASE_URL
# Formato esperado: postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# 2. Probar la conexion directamente
npx tsx -e "
  import { Pool } from '@neondatabase/serverless';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('SELECT NOW()');
  console.log('Conexion OK:', res.rows[0]);
  await pool.end();
"
```

**Configuracion del pool en `server/db.ts`:**

| Parametro | Valor | Descripcion |
|-----------|-------|-------------|
| `max` | 10 | Maximo de conexiones simultaneas |
| `idleTimeoutMillis` | 30000 | Cierra conexiones inactivas tras 30s |
| `connectionTimeoutMillis` | 10000 | Timeout de conexion: 10s |

Si los timeouts son frecuentes, verifica en el dashboard de Neon que la base de datos no este en una region lejana o que no hayas excedido el limite del plan gratuito.

---

### 2.2 Schema desincronizado: campos faltantes en la DB

**Sintoma:**

```
column "nuevo_campo" of relation "boats" does not exist
```

**Causa:** Has anadido un campo en `shared/schema.ts` pero no lo has propagado a la base de datos.

**Solucion:**

```bash
# Sincronizar schema de Drizzle con la base de datos
npx drizzle-kit push

# Si hay conflictos y quieres forzar (CUIDADO: puede borrar datos):
npx drizzle-kit push --force
```

**Flujo correcto para anadir un campo:**

1. Editar `shared/schema.ts` - anadir el campo a la tabla
2. Ejecutar `npx drizzle-kit push` - propagar el cambio a PostgreSQL
3. Actualizar `server/storage.ts` si es necesario - ajustar queries
4. Reiniciar el servidor - `npm run dev`

---

### 2.3 Errores comunes de Drizzle ORM

**Error: "Cannot read properties of undefined (reading 'referencedTable')"**

Causa: Relacion circular o referencia a una tabla que no se ha exportado correctamente en `shared/schema.ts`.

Solucion: Verificar que todas las tablas referenciadas con `references` existen y estan exportadas.

---

**Error: "column reference is ambiguous"**

Causa: JOIN entre tablas que tienen columnas con el mismo nombre (ej. `id`, `createdAt`).

Solucion: Usar `.select()` con campos especificos en vez de `select()` sin argumentos.

---

**Error: "relation does not exist"**

Causa: La tabla no se ha creado en la base de datos.

```bash
# Listar tablas existentes
npx tsx -e "
  import { pool } from './server/db';
  const res = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\");
  console.log(res.rows.map(r => r.tablename));
  await pool.end();
"

# Si faltan tablas, sincronizar
npx drizzle-kit push
```

---

### 2.4 Migraciones: push vs. generate + migrate

Este proyecto usa `drizzle-kit push` (sincronizacion directa), NO migraciones con archivos SQL. Esto significa:

- No hay carpeta `migrations/` con archivos SQL activos (la carpeta existe pero no se usa activamente).
- Los cambios de schema se aplican directamente al ejecutar `npx drizzle-kit push`.
- En produccion, se ejecuta `push` antes del despliegue si hay cambios de schema.

**Si necesitas ver que cambios va a aplicar `push`:**

```bash
# Ver el SQL que se generaria (sin ejecutar)
npx drizzle-kit push --dry-run
```

---

## 3. Problemas de Despliegue (Replit)

### 3.1 Build falla

**Sintoma:** Error durante `npm run build`.

**Diagnostico:**

```bash
# El build ejecuta dos pasos:
# 1. vite build (frontend)
# 2. esbuild (servidor)

# Probar cada paso por separado:
npx vite build --outDir dist/public
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

**Errores frecuentes:**

| Error | Causa | Solucion |
|-------|-------|----------|
| `Could not resolve "@/..."` | Path alias no resuelto por Vite | Verificar `vite.config.ts` resolve.alias |
| `Top-level await` | esbuild no soporta top-level await por defecto | El proyecto usa `--format=esm` que si lo soporta |
| `Cannot find module 'sharp'` | Modulo nativo no instalado | `npm install sharp` |
| Out of memory | Codebase grande | Aumentar memoria: `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |

---

### 3.2 Variables de entorno no configuradas en Replit

**Sintoma:** La aplicacion arranca pero funcionalidades especificas no funcionan (pagos, emails, chatbot).

**Solucion:**

1. En Replit, ir a la pestana "Secrets" (icono del candado).
2. Anadir cada variable necesaria. Las tres obligatorias son:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_PIN`
3. Las opcionales habilitan funcionalidades:
   - `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` = pagos
   - `SENDGRID_API_KEY` = emails
   - `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` = WhatsApp (Twilio)
   - `META_WHATSAPP_TOKEN` + `META_WHATSAPP_PHONE_ID` = WhatsApp (Meta Cloud API)
   - `OPENAI_API_KEY` = chatbot IA
   - `SENTRY_DSN` = monitoring de errores

---

### 3.3 Object Storage: URLs de imagenes devuelven 401

**Sintoma:** Las imagenes subidas desde el CRM no se cargan en el frontend. La URL devuelve 401 Unauthorized.

**Causa:** Replit Object Storage requiere que los objetos esten en paths publicos correctos.

**Solucion:**

1. Verificar que las imagenes se suben al path correcto definido en `PUBLIC_OBJECT_SEARCH_PATHS` (por defecto: `public/images:public/assets`).
2. Comprobar que la URL generada es correcta y no ha expirado.
3. Si usas Google Cloud Storage (`GCS_BUCKET_NAME`), verificar que el bucket tiene permisos publicos de lectura.

---

### 3.4 El servidor se reinicia continuamente en produccion

**Sintoma:** El log muestra que el servidor arranca y se cae en bucle.

**Diagnostico:**

```bash
# Verificar que el build fue exitoso
ls -la dist/index.js dist/public/index.html

# Ejecutar manualmente para ver el error completo
NODE_ENV=production node dist/index.js
```

**Causas comunes:**

- Variable de entorno faltante (ver seccion 3.2).
- `DATABASE_URL` invalida o base de datos inaccesible.
- Puerto en conflicto (en Replit, usar solo el puerto asignado por `PORT`).
- Modulo nativo incompatible con la arquitectura de Replit (ej. `sharp`, `bcrypt`).

---

## 4. Problemas de APIs Externas

### 4.1 Stripe: webhooks no se reciben

**Sintoma:** Los pagos se completan en Stripe pero las reservas no pasan a estado "confirmed".

**Causa:** El webhook de Stripe no puede alcanzar tu servidor, o la firma no se verifica.

**Diagnostico y solucion:**

```bash
# 1. Verificar que STRIPE_WEBHOOK_SECRET esta configurado
echo $STRIPE_WEBHOOK_SECRET
# Debe empezar por "whsec_"

# 2. En desarrollo local, usar Stripe CLI para reenviar eventos
stripe listen --forward-to localhost:5000/api/stripe-webhook

# 3. Verificar en el dashboard de Stripe:
#    Developers > Webhooks > tu endpoint
#    - URL: https://costabravarentaboat.com/api/stripe-webhook
#    - Eventos suscritos: payment_intent.succeeded, payment_intent.payment_failed
#    - Ver log de intentos de entrega
```

**Punto critico:** El endpoint `/api/stripe-webhook` necesita el body RAW (no parseado como JSON). En `server/index.ts`, el middleware `express.json()` se salta explicitamente para esta ruta:

```typescript
if (req.path === '/api/stripe-webhook') {
  return next(); // Salta el JSON parser
}
```

Si has movido o renombrado este endpoint, asegurate de mantener esta exclusion.

---

### 4.2 SendGrid: emails no se envian

**Sintoma:** No se reciben emails de confirmacion de reserva ni notificaciones al propietario.

**Diagnostico:**

```bash
# 1. Verificar que la API key esta configurada
echo $SENDGRID_API_KEY
# Debe empezar por "SG."

# 2. Verificar el email remitente
echo $SENDGRID_FROM_EMAIL
# Debe ser un remitente verificado en SendGrid
# Por defecto: costabravarentaboat@gmail.com

# 3. Probar envio manual
npx tsx -e "
  import sgMail from '@sendgrid/mail';
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  const msg = {
    to: 'tu-email@test.com',
    from: process.env.SENDGRID_FROM_EMAIL || 'costabravarentaboat@gmail.com',
    subject: 'Test desde Costa Brava Rent a Boat',
    text: 'Este es un email de prueba.',
  };
  const res = await sgMail.send(msg);
  console.log('Status:', res[0].statusCode);
"
```

**Errores frecuentes:**

| Error | Causa | Solucion |
|-------|-------|----------|
| 401 Unauthorized | API key invalida | Regenerar en SendGrid |
| 403 Forbidden | Sender no verificado | Verificar el email remitente en SendGrid > Sender Authentication |
| Emails van a spam | Dominio no autenticado | Configurar SPF, DKIM y DMARC para el dominio |

---

### 4.3 Twilio/WhatsApp: mensajes no se envian

**Sintoma:** El chatbot de WhatsApp no responde o no envia mensajes.

**Diagnostico (Twilio):**

```bash
# 1. Verificar configuracion
echo $TWILIO_ACCOUNT_SID   # Debe empezar por "AC"
echo $TWILIO_AUTH_TOKEN
echo $TWILIO_WHATSAPP_FROM  # Formato: whatsapp:+14155238886
```

**Diagnostico (Meta Cloud API):**

```bash
# 1. Verificar configuracion
echo $META_WHATSAPP_TOKEN
echo $META_WHATSAPP_PHONE_ID
echo $META_WHATSAPP_VERIFY_TOKEN
```

**Errores frecuentes con Twilio:**

- Error 21608: El numero del destinatario no ha iniciado conversacion con el sandbox. El usuario debe enviar primero "join <keyword>" al numero del sandbox.
- Error 63016: Canal de WhatsApp no aprobado. En produccion, necesitas un numero de WhatsApp Business aprobado por Meta.

**Errores frecuentes con Meta Cloud API:**

- 401 en webhook: `META_WHATSAPP_VERIFY_TOKEN` no coincide con el configurado en Meta Developer.
- Mensajes no se envian: El token de acceso ha expirado. Los tokens temporales duran 24h. Usar un token de System User permanente.

---

### 4.4 OpenAI: errores en el chatbot IA

**Sintoma:** El chatbot responde con mensajes genericos o errores.

**Diagnostico:**

```bash
# 1. Verificar API key
echo $OPENAI_API_KEY
# Debe empezar por "sk-"

# 2. Probar conexion
npx tsx -e "
  import OpenAI from 'openai';
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hola' }],
    max_tokens: 50,
  });
  console.log('Respuesta:', res.choices[0].message.content);
"
```

**Errores frecuentes:**

| Error | Causa | Solucion |
|-------|-------|----------|
| 401 Unauthorized | API key invalida o expirada | Regenerar en platform.openai.com |
| 429 Rate limit | Demasiadas peticiones | El chatbot usa gpt-4o-mini, verificar limites de tu plan |
| 500 Internal | Problema temporal de OpenAI | Reintentar. El chatbot tiene manejo de errores con fallback |
| Embeddings fallan | Modelo incorrecto | El proyecto usa `text-embedding-3-small` para RAG |

---

### 4.5 Sentry: no captura errores

**Sintoma:** No aparecen errores en el dashboard de Sentry.

**Verificacion:**

1. Confirmar que `SENTRY_DSN` esta configurado (formato: `https://key@o0.ingest.sentry.io/0`).
2. Sentry solo se inicializa si `SENTRY_DSN` existe (ver `server/index.ts` linea 15).
3. En desarrollo, el `tracesSampleRate` es 1.0 (100% de trazas). En produccion es 0.2 (20%).
4. Solo los errores 5xx se envian a Sentry (ver `server/index.ts` linea 244).

**Probar manualmente:**

```bash
# Llamar a un endpoint que genere error 500
curl -s http://localhost:5000/api/admin/stats | jq .
# (sin token de admin, deberia generar un error)
```

---

## 5. Problemas del Frontend

### 5.1 Los barcos no se cargan en la pagina principal

**Sintoma:** La seccion de flota aparece vacia o con un spinner infinito.

**Diagnostico:**

```bash
# 1. Verificar que el endpoint de barcos funciona
curl -s http://localhost:5000/api/boats | jq '.[0].name'

# 2. Si devuelve array vacio, verificar que hay barcos activos en la DB
npx tsx -e "
  import { db } from './server/db';
  import { boats } from '@shared/schema';
  import { eq } from 'drizzle-orm';
  const active = await db.select().from(boats).where(eq(boats.isActive, true));
  console.log('Barcos activos:', active.length);
  active.forEach(b => console.log('-', b.id, b.name));
"
```

**Si el endpoint funciona pero el frontend no muestra barcos:**

- Abrir DevTools del navegador > Network > filtrar por `/api/boats`.
- Verificar que la respuesta es un array JSON valido.
- Comprobar la consola del navegador para errores de `IntersectionObserver` (en moviles antiguos, `FleetSection.tsx` usa lazy loading con IntersectionObserver).

---

### 5.2 Imagenes no se muestran

**Sintoma:** Las imagenes de barcos o del blog aparecen rotas (icono de imagen rota).

**Causas y soluciones:**

| Causa | Diagnostico | Solucion |
|-------|-------------|----------|
| URL invalida en la DB | Inspeccionar `imageUrl` del barco en la DB | Actualizar la URL desde el CRM |
| Object Storage inaccesible | Abrir la URL de la imagen directamente en el navegador | Ver seccion 3.3 |
| CORS bloqueando la imagen | Revisar consola del navegador para errores CORS | Las imagenes deben servirse con headers CORS correctos |
| Imagen borrada del storage | La URL devuelve 404 | Subir la imagen de nuevo desde el CRM |

---

### 5.3 Problemas de responsive design

**Sintoma:** La interfaz se ve mal en moviles o tablets.

**Diagnostico:**

1. Usar Chrome DevTools > Toggle Device Toolbar (Ctrl+Shift+M).
2. Probar en iPhone SE (375px), iPhone 14 (390px), iPad (768px).

**Notas especificas del proyecto:**

- El proyecto usa mobile-first design con Tailwind (`sm:`, `md:`, `lg:` breakpoints).
- Todos los botones e inputs tienen minimo 44px de altura/anchura (WCAG 2.1 AA).
- En iOS, el viewport usa `viewport-fit=cover` para manejar safe areas (notch, Dynamic Island).
- Si hay problemas con el teclado virtual en iOS, verificar que no hay `position: fixed` conflictivo.

---

### 5.4 Metadata SEO no se renderiza

**Sintoma:** Al compartir una URL en redes sociales no aparece el titulo/descripcion correctos, o Google no indexa bien la pagina.

**Diagnostico:**

```bash
# 1. Verificar el HTML renderizado del servidor
curl -s https://costabravarentaboat.com/barco/solar-450 | grep -E "<title>|og:title|og:description"

# 2. Verificar sitemaps
curl -s https://costabravarentaboat.com/sitemap.xml
curl -s https://costabravarentaboat.com/sitemap-boats.xml
```

**Nota:** Este proyecto usa React con `react-helmet-async` para SEO. Los meta tags se inyectan en el lado del cliente. Para que los crawlers los vean correctamente, el servidor inyecta meta tags en el HTML estático antes de servir la pagina (ver `server/routes.ts`).

**Archivos relevantes:**
- `client/src/utils/seo-config.ts` - Configuracion de meta tags por pagina (1118 lineas)
- `client/src/components/SEO.tsx` - Componente que renderiza los meta tags
- `server/routes.ts` - Sitemaps XML y SEO injection

---

## 6. Problemas del CRM/Admin

### 6.1 Login al CRM falla

**Sintoma:** Al introducir el PIN en `/crm`, aparece "PIN incorrecto" o la pagina se recarga.

**Diagnostico:**

```bash
# 1. Verificar el PIN configurado
echo $ADMIN_PIN
# Debe ser exactamente 6 digitos

# 2. Probar el endpoint de login directamente
curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"123456"}' | jq .
# Debe devolver: { "token": "eyJ..." }
```

**Causas comunes:**

| Problema | Solucion |
|----------|----------|
| PIN no es 6 digitos | La validacion Zod requiere exactamente 6 caracteres: `z.string().length(6)` |
| PIN con espacios | Asegurarse de que no hay espacios en la variable de entorno |
| Rate limiting | El endpoint `/api/admin/login` tiene limite de 5 intentos cada 15 minutos. Esperar o reiniciar el servidor |

---

### 6.2 Token de admin expirado

**Sintoma:** Estabas usando el CRM y de repente las peticiones devuelven 401.

**Causa:** El token JWT de admin tiene un tiempo de expiracion.

**Solucion:**

1. Cerrar sesion en el CRM.
2. Volver a introducir el PIN.
3. El CRM deberia almacenar el nuevo token automaticamente.

**Si el problema persiste,** limpiar el localStorage del navegador:

```javascript
// En la consola del navegador (DevTools):
localStorage.removeItem('admin_token');
// O limpiar todo:
localStorage.clear();
```

---

### 6.3 Subida de imagenes falla

**Sintoma:** Al intentar subir una imagen de barco o blog, aparece un error o la imagen no se guarda.

**Diagnostico:**

1. Abrir DevTools > Network > filtrar por la peticion de upload.
2. Verificar el codigo de respuesta y el cuerpo del error.

**Causas comunes:**

| Error | Causa | Solucion |
|-------|-------|----------|
| 413 Payload Too Large | Imagen mayor a 1MB | Reducir tamano de la imagen antes de subir |
| 500 Storage Error | Object Storage no configurado | Verificar `GCS_BUCKET_NAME` o Replit Object Storage |
| CORS Error | Peticion bloqueada por CORS | Verificar que el origin esta en la lista de `allowedOrigins` en `server/index.ts` |

**Nota sobre el limite de tamano:** El middleware `express.json()` tiene un limite de `1mb` (ver `server/index.ts`). Para imagenes mas grandes, se usa multipart/form-data que tiene su propio limite.

---

### 6.4 Posts del blog no se guardan

**Sintoma:** Al crear o editar un post del blog en el CRM, aparece un error al guardar.

**Diagnostico:**

```bash
# Probar crear un post via API
curl -s -X POST http://localhost:5000/api/admin/blog \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ADMIN" \
  -d '{
    "title": "Test post",
    "slug": "test-post",
    "content": "Contenido de prueba",
    "excerpt": "Extracto de prueba",
    "status": "draft"
  }' | jq .
```

**Causas comunes:**

- Slug duplicado: cada post necesita un slug unico.
- Campos obligatorios faltantes: title, slug, content son requeridos.
- Token expirado: ver seccion 6.2.

---

## 7. Problemas de WhatsApp Chatbot

### 7.1 Webhook de Meta no se verifica

**Sintoma:** Al configurar el webhook en Meta Developer Console, la verificacion falla con error 403.

**Causa:** El `META_WHATSAPP_VERIFY_TOKEN` no coincide o no esta configurado.

**Solucion:**

```bash
# 1. Verificar que la variable esta configurada
echo $META_WHATSAPP_VERIFY_TOKEN

# 2. Probar la verificacion manualmente (simula lo que Meta envia)
curl -s "http://localhost:5000/api/meta-whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=test123"
# Debe devolver: test123
```

**Configuracion en Meta Developer:**

1. Ir a Meta for Developers > tu app > WhatsApp > Configuration.
2. En "Callback URL": `https://costabravarentaboat.com/api/meta-whatsapp/webhook`
3. En "Verify token": el mismo valor que `META_WHATSAPP_VERIFY_TOKEN` en tu `.env`.
4. Suscribir al campo `messages`.

---

### 7.2 Mensajes de WhatsApp no se envian

**Sintoma:** El chatbot recibe mensajes pero no responde.

**Diagnostico:**

```bash
# 1. Verificar el health check del chatbot
curl -s http://localhost:5000/api/whatsapp/health | jq .

# 2. Revisar logs del servidor para errores de Twilio/Meta
# Buscar lineas con "[Meta Webhook]" o "[Twilio]"
```

**Con Twilio (sandbox):**

- El usuario debe haber enviado primero "join <keyword>" al numero del sandbox de Twilio.
- Los mensajes del sandbox expiran tras 24h de inactividad.

**Con Meta Cloud API:**

- Los tokens temporales expiran tras 24h. Usar un token de System User permanente.
- La ventana de mensajeria de 24h: solo puedes responder dentro de las 24h posteriores al ultimo mensaje del usuario. Fuera de esa ventana, solo puedes enviar templates aprobados.

---

### 7.3 Respuestas de IA genericas o incorrectas

**Sintoma:** El chatbot responde pero con informacion incorrecta sobre precios, barcos o disponibilidad.

**Causa:** La knowledge base (RAG) puede estar desactualizada o el embedding search no encuentra documentos relevantes.

**Solucion:**

```bash
# 1. Verificar el estado de la knowledge base
npx tsx -e "
  import { db } from './server/db';
  import { knowledgeBase } from '@shared/schema';
  const docs = await db.select().from(knowledgeBase);
  console.log('Documentos en knowledge base:', docs.length);
  docs.forEach(d => console.log('-', d.category, ':', d.title));
"

# 2. Si esta vacia, ejecutar el seed
npx tsx server/whatsapp/seedKnowledgeBase.ts
```

**Archivos relevantes para modificar el comportamiento del chatbot:**

| Archivo | Funcion |
|---------|---------|
| `server/whatsapp/aiService.ts` | Prompt del sistema, modelo (gpt-4o-mini), logica de respuesta |
| `server/whatsapp/functionCallingService.ts` | Functions para consultar disponibilidad y precios en tiempo real |
| `server/whatsapp/ragService.ts` | Busqueda semantica con embeddings (text-embedding-3-small) |
| `server/whatsapp/seedKnowledgeBase.ts` | Datos de la knowledge base (precios, horarios, barcos, FAQ) |

---

## 8. Comandos Utiles de Diagnostico

### 8.1 Verificar estado general del sistema

```bash
# Estado del servidor
curl -s http://localhost:5000/api/whatsapp/health | jq .

# Verificar que responde con HTML (frontend)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/

# Verificar barcos activos
curl -s http://localhost:5000/api/boats | jq 'length'

# Verificar testimonios
curl -s http://localhost:5000/api/testimonials | jq 'length'
```

### 8.2 Verificar estado de la base de datos

```bash
# Contar registros en tablas principales
npx tsx -e "
  import { pool } from './server/db';
  const tables = ['boats', 'bookings', 'customers', 'blog_posts', 'testimonials', 'knowledge_base'];
  for (const t of tables) {
    const res = await pool.query('SELECT COUNT(*) FROM ' + t);
    console.log(t + ':', res.rows[0].count);
  }
  await pool.end();
"

# Ver reservas recientes
npx tsx -e "
  import { db } from './server/db';
  import { bookings } from '@shared/schema';
  import { desc } from 'drizzle-orm';
  const recent = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(5);
  recent.forEach(b => console.log(b.id, b.boatId, b.bookingStatus, b.createdAt));
"
```

### 8.3 Probar endpoints de API manualmente

```bash
# Login de admin (obtener token)
TOKEN=$(curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"'$ADMIN_PIN'"}' | jq -r '.token')

echo "Token: $TOKEN"

# Listar reservas (requiere token admin)
curl -s http://localhost:5000/api/admin/bookings \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]'

# Verificar estadisticas del dashboard
curl -s http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

# Verificar disponibilidad de un barco
curl -s -X POST http://localhost:5000/api/boats/solar-450/check-availability \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-07-15","duration":2}' | jq .
```

### 8.4 Verificar variables de entorno

```bash
# Verificar que las variables requeridas existen (sin mostrar valores sensibles)
for var in DATABASE_URL JWT_SECRET ADMIN_PIN; do
  if [ -n "${!var}" ]; then
    echo "$var: configurada (${#!var} caracteres)"
  else
    echo "$var: NO CONFIGURADA"
  fi
done

# Verificar variables opcionales
for var in STRIPE_SECRET_KEY SENDGRID_API_KEY TWILIO_ACCOUNT_SID OPENAI_API_KEY META_WHATSAPP_TOKEN SENTRY_DSN ANTHROPIC_API_KEY; do
  if [ -n "${!var}" ]; then
    echo "$var: configurada"
  else
    echo "$var: no configurada (funcionalidad deshabilitada)"
  fi
done
```

### 8.5 Limpiar y reiniciar completamente

```bash
# Nuclear option: limpiar todo y empezar de cero
rm -rf node_modules dist node_modules/.vite
npm install
npx drizzle-kit push
npm run dev
```

### 8.6 Verificar sitemaps y SEO

```bash
# Comprobar que los sitemaps se generan correctamente
curl -s http://localhost:5000/sitemap.xml | head -20
curl -s http://localhost:5000/sitemap-boats.xml | head -30
curl -s http://localhost:5000/sitemap-blog.xml | head -20
curl -s http://localhost:5000/robots.txt
```

### 8.7 Logs del servidor

El servidor escribe logs en stdout. Todas las peticiones a `/api/` se logean con formato:

```
METHOD /api/ruta STATUS in XXXms :: {respuesta}
```

Para filtrar logs utiles en produccion:

```bash
# En Replit, los logs se ven en la consola directamente.
# Si redireccionas logs a archivo:
npm run dev 2>&1 | tee server.log

# Buscar errores
grep -i "error\|fail\|500" server.log

# Buscar actividad del chatbot
grep "whatsapp\|chatbot\|Meta Webhook" server.log
```

---

## Referencia rapida

| Problema | Primer paso |
|----------|-------------|
| Server no arranca | Verificar `.env` con las 3 variables requeridas |
| DB no conecta | Probar `DATABASE_URL` con script de test |
| Build falla | Ejecutar `npm run check` para ver errores TS |
| Pagos no funcionan | Verificar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` |
| Emails no llegan | Verificar `SENDGRID_API_KEY` y sender verificado |
| WhatsApp no responde | Verificar tokens de Twilio o Meta y webhook URL |
| Chatbot da info incorrecta | Re-ejecutar seed de knowledge base |
| CRM login falla | Verificar `ADMIN_PIN` (6 digitos exactos) |
| Imagenes rotas | Verificar URLs en la DB y accesibilidad del storage |
| SEO no indexa | Verificar sitemaps y meta tag injection |
