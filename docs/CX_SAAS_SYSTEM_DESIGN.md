# Sistema Completo de Experiencia de Cliente - SaaS de Alquiler de Embarcaciones

> **Autor**: CCO - Costa Brava Rent a Boat
> **Fecha**: 15 de febrero de 2026
> **Version**: 1.0
> **Estado**: Propuesta de diseno

---

## Indice

1. [Analisis del Sistema Actual](#1-analisis-del-sistema-actual)
2. [Chatbot WhatsApp Multi-Tenant](#2-chatbot-whatsapp-multi-tenant)
3. [Experiencia B2B - Clientes del SaaS](#3-experiencia-b2b---clientes-del-saas)
4. [Experiencia B2C - Clientes Finales](#4-experiencia-b2c---clientes-finales)
5. [Sistema de Soporte](#5-sistema-de-soporte)
6. [Feedback y Mejora Continua](#6-feedback-y-mejora-continua)
7. [Esquema de Base de Datos](#7-esquema-de-base-de-datos)
8. [Plan de Implementacion](#8-plan-de-implementacion)

---

## 1. Analisis del Sistema Actual

### 1.1 Arquitectura del Chatbot Existente

Tras analizar los 18 archivos en `/server/whatsapp/`, el chatbot actual tiene la siguiente arquitectura:

```
webhookHandler.ts          -- Punto de entrada (Twilio webhook)
    |
    v
sessionManager.ts          -- Gestion de sesiones por telefono
    |
    v
messageRouter.ts            -- Enrutador de estados (FSM)
    |                           |
    v                           v
aiService.ts               flows/booking.ts
(gpt-4o-mini +             flows/availability.ts
 function calling +         flows/boatInfo.ts
 RAG)                       flows/mainMenu.ts
    |
    v
functionCallingService.ts   -- 4 funciones: availability, price, list, details
ragService.ts               -- Embeddings text-embedding-3-small + cosine similarity
chatMemoryService.ts        -- Sesiones persistentes + lead scoring
```

**Archivos clave y sus responsabilidades:**

| Archivo | Lineas | Funcion | Acoplamiento Directo |
|---------|--------|---------|---------------------|
| `aiService.ts` | 370 | Prompt fijo con BUSINESS_CONTEXT, modelo gpt-4o-mini, max_tokens 500 | Hardcoded: nombre empresa, telefono, email, web, temporadas |
| `functionCallingService.ts` | 355 | 4 tools de OpenAI: get_boat_availability, get_price_for_date, list_available_boats, get_boat_details | Lee directamente de `storage` global |
| `webhookHandler.ts` | 221 | Procesa mensajes de Twilio, detecta idioma, envia respuestas | Numero fijo del propietario (+34611500372) |
| `ragService.ts` | 158 | Embeddings con OpenAI, busqueda por cosine similarity en PostgreSQL | Filtra por idioma, threshold 0.65 |
| `chatMemoryService.ts` | 221 | Sesiones AI persistentes, lead scoring (0-100), clasificacion hot/warm/cold | Tablas globales ai_chat_sessions/messages |
| `seedKnowledgeBase.ts` | 154 | 14 entradas hardcoded (7 FAQs + 4 rutas + 3 general), solo en espanol | Contenido especifico de Costa Brava |
| `translations.ts` | 1046 | 8 idiomas completos con ~85 cadenas cada uno | Templates fijos, mismos extras para todos |
| `languageDetector.ts` | 128 | Mapeo prefijo telefonico a idioma, 25+ paises | Mensajes de bienvenida hardcoded |
| `intentDetector.ts` | 604 | Keywords por idioma, parseDate DD/MM/YYYY, parseEmail | Sin NLP avanzado |
| `sessionManager.ts` | 195 | CRUD de chatbotConversations, stale check 24h | Tabla unica global |
| `messageRouter.ts` | 532 | FSM con 18 estados, mapeo numeros a boat IDs | BOAT_IDS hardcoded en array |
| `analyticsEndpoints.ts` | 186 | 5 endpoints: analytics, leads, conversations, knowledge | Sin autenticacion |

### 1.2 Puntos de Dolor Identificados

**Problemas criticos para conversion a SaaS:**

1. **Acoplamiento total al negocio**: El BUSINESS_CONTEXT en `aiService.ts` (lineas 27-70) tiene hardcoded el nombre de la empresa, telefono, email, ubicacion, temporadas y servicios. No hay ningun concepto de "tenant".

2. **Base de datos sin aislamiento**: Las tablas `ai_chat_sessions`, `ai_chat_messages`, `chatbot_conversations`, y `knowledge_base` en `shared/schema.ts` no tienen campo `tenantId`. Todos los datos van al mismo sitio.

3. **Credenciales compartidas**: `twilioClient.ts` usa un unico par de credenciales Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`) y un unico numero de WhatsApp (`TWILIO_WHATSAPP_FROM`). Cada tenant necesitara sus propias credenciales.

4. **Knowledge base estatica**: `seedKnowledgeBase.ts` tiene contenido hardcoded especifico de Blanes. No hay interfaz para que un tenant gestione su propia base de conocimiento.

5. **Lead scoring generico**: `chatMemoryService.ts` usa puntuaciones fijas (booking_request: 30, availability: 20, etc.) que no son configurables por negocio.

6. **Notificaciones al propietario**: En `messageRouter.ts` linea 476, el numero del propietario (+34611500372) esta hardcoded para recibir notificaciones de nuevas reservas.

7. **Precios y barcos globales**: `functionCallingService.ts` lee de `storage.getAllBoats()` sin filtrar por tenant. El `pricing.ts` opera sobre un `BOAT_DATA` global.

8. **Extras y traducciones rigidas**: `translations.ts` tiene los mismos 5 extras (Parking 10E, Nevera 5E, Snorkel 7.50E, Paddle Surf 25E, Seascooter 50E) para todos los idiomas, sin posibilidad de personalizacion.

### 1.3 Fortalezas a Preservar

1. **Arquitectura modular**: Los flows estan separados en archivos individuales, lo que facilita la refactorizacion.
2. **RAG funcional**: El servicio de embeddings con cosine similarity es solido y escalable.
3. **Function Calling**: Las 4 funciones de OpenAI estan bien definidas y son reutilizables.
4. **Lead scoring**: El concepto de scoring por intent es valioso, solo necesita ser configurable.
5. **Multi-idioma maduro**: 8 idiomas con traducciones completas es una base excelente.
6. **Deteccion de idioma dual**: Por prefijo telefonico + contenido del mensaje es robusta.

---

## 2. Chatbot WhatsApp Multi-Tenant

### 2.1 Arquitectura Propuesta

```
                    Twilio Webhook (POST /api/whatsapp/webhook)
                              |
                              v
                    +---------------------+
                    | Tenant Resolver     |  <-- Resuelve tenant por:
                    | (nuevo middleware)   |      1. Numero destino (To)
                    +---------------------+      2. Lookup en tenant_whatsapp_numbers
                              |
                              v
                    +---------------------+
                    | Tenant Context      |  <-- Inyecta: config, credenciales,
                    | Provider            |      prompts, idiomas, knowledge base
                    +---------------------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        AI Service      Session Mgr     Function Calling
        (configurable)  (tenant-scoped) (tenant-scoped)
```

### 2.2 Modelo de Datos para Multi-Tenancy

Nuevas tablas requeridas en `shared/schema.ts`:

```typescript
// ===== TENANT / ORGANIZATION =====

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),                    // "Costa Brava Rent a Boat"
  slug: varchar("slug", { length: 100 }).notNull().unique(), // "costa-brava"

  // Plan y estado
  plan: varchar("plan", { length: 20 }).notNull().default("basic"),
    // "basic" | "pro" | "enterprise"
  status: varchar("status", { length: 20 }).notNull().default("trial"),
    // "trial" | "active" | "suspended" | "cancelled"
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),

  // Informacion del negocio
  businessName: text("business_name").notNull(),
  businessType: varchar("business_type", { length: 50 }).default("boat_rental"),
  location: text("location"),                       // "Puerto de Blanes, Costa Brava"
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>(),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  website: text("website"),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Madrid"),
  currency: varchar("currency", { length: 3 }).default("EUR"),

  // Configuracion operativa
  operationalMonths: json("operational_months").$type<number[]>(),
    // [4,5,6,7,8,9,10] para abril-octubre
  seasonConfig: json("season_config").$type<{
    [seasonName: string]: { months: number[]; label: string };
  }>(),

  // Limites del plan
  maxBoats: integer("max_boats").notNull().default(5),
  maxMonthlyConversations: integer("max_monthly_conversations").default(500),
  maxKnowledgeEntries: integer("max_knowledge_entries").default(50),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// ===== CHATBOT CONFIGURATION PER TENANT =====

export const tenantChatbotConfig = pgTable("tenant_chatbot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),

  // Credenciales Twilio (encriptadas en produccion)
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),       // Encriptado
  twilioWhatsappFrom: varchar("twilio_whatsapp_from", { length: 30 }),

  // Credenciales OpenAI
  openaiApiKey: text("openai_api_key"),             // Encriptado
  openaiModel: varchar("openai_model", { length: 50 }).default("gpt-4o-mini"),
  maxTokens: integer("max_tokens").default(500),
  temperature: decimal("temperature", { precision: 2, scale: 1 }).default("0.7"),

  // Personalidad del bot
  botName: varchar("bot_name", { length: 100 }).default("Asistente"),
  botPersonality: text("bot_personality"),
    // "Amable, profesional y entusiasta sobre la experiencia nautica."
  botTone: varchar("bot_tone", { length: 30 }).default("friendly"),
    // "friendly" | "formal" | "casual" | "luxury"
  botLanguageInstructions: text("bot_language_instructions"),
    // Instrucciones adicionales de idioma

  // Prompt del sistema personalizable
  systemPromptTemplate: text("system_prompt_template"),
    // Template con placeholders: {{business_name}}, {{location}}, etc.

  // Idiomas habilitados
  defaultLanguage: varchar("default_language", { length: 5 }).default("es"),
  enabledLanguages: text("enabled_languages").array(),
    // ["es", "en", "fr", "de"]

  // Comportamiento
  welcomeMessageTemplate: text("welcome_message_template"),
  fallbackMessage: text("fallback_message"),
  sessionTimeoutHours: integer("session_timeout_hours").default(24),
  enableFunctionCalling: boolean("enable_function_calling").default(true),
  enableRag: boolean("enable_rag").default(true),
  enableLeadScoring: boolean("enable_lead_scoring").default(true),

  // Notificaciones
  ownerNotificationNumbers: text("owner_notification_numbers").array(),
    // ["+34611500372", "+34600000000"]
  notifyOnBooking: boolean("notify_on_booking").default(true),
  notifyOnHotLead: boolean("notify_on_hot_lead").default(false),

  // Lead scoring personalizable
  leadScoringConfig: json("lead_scoring_config").$type<{
    [intent: string]: number;
  }>(),

  // Limites de uso
  monthlyTokenBudget: integer("monthly_token_budget").default(1000000),
  currentMonthTokens: integer("current_month_tokens").default(0),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

### 2.3 Tenant Resolver -- Nuevo Middleware

El componente mas critico es el resolver que, a partir del numero de telefono destino en el webhook de Twilio, identifica a que tenant pertenece la conversacion.

**Archivo propuesto**: `server/whatsapp/tenantResolver.ts`

```
Flujo de resolucion:

1. Twilio envia POST con campo "To" = "whatsapp:+34611500372"
2. Lookup en tabla tenant_whatsapp_numbers: +34611500372 -> tenant_id = "costa-brava"
3. Cargar tenantChatbotConfig para ese tenant_id
4. Cargar boats, knowledge_base, etc. filtrados por tenant_id
5. Inyectar contexto del tenant en el request para uso downstream
```

**Logica clave:**

```
Request.body.To -> normalize -> query tenant_whatsapp_numbers
  -> Si encontrado: cargar tenant config, continuar
  -> Si no encontrado: log error, responder con mensaje generico
```

Cada tabla existente necesitara un campo `tenantId`:
- `boats.tenantId`
- `bookings.tenantId`
- `ai_chat_sessions.tenantId`
- `ai_chat_messages` (hereda via session)
- `knowledge_base.tenantId`
- `chatbot_conversations.tenantId`

### 2.4 Sistema de Prompts Configurables

**Problema actual**: El `BUSINESS_CONTEXT` en `aiService.ts` (lineas 27-70) es un string literal con toda la informacion del negocio hardcoded.

**Solucion**: Sistema de templates con placeholders que se resuelven en runtime:

```
Template guardado en tenant_chatbot_config.system_prompt_template:

"Eres el asistente virtual de {{business_name}}, empresa de {{business_type}}
ubicada en {{location}}.

INFORMACION DEL NEGOCIO:
- Ubicacion: {{location}}
- Telefono: {{phone}}
- Email: {{email}}
- Web: {{website}}
- Temporada: {{operational_season_text}}

SERVICIOS:
{{services_description}}

TEMPORADAS DE PRECIOS:
{{seasons_description}}

NORMAS IMPORTANTES:
{{policies_description}}

{{custom_instructions}}

Tu objetivo es:
1. Responder preguntas sobre barcos, precios y disponibilidad
2. Ayudar a los clientes a elegir el barco adecuado
3. Proporcionar informacion util sobre la experiencia
4. Cuando el cliente quiera reservar, {{booking_cta}}

Se {{bot_personality}}.
Si no sabes algo especifico, sugiere contactar directamente por WhatsApp o email."
```

**Motor de resolucion de placeholders:**

```
Fuente de datos para cada placeholder:

{{business_name}}           <- tenants.businessName
{{business_type}}           <- tenants.businessType (con mapeo legible)
{{location}}                <- tenants.location
{{phone}}                   <- tenants.phone
{{email}}                   <- tenants.email
{{website}}                 <- tenants.website
{{operational_season_text}} <- Generado desde tenants.operationalMonths
{{services_description}}    <- Generado desde boats del tenant (con/sin licencia)
{{seasons_description}}     <- Generado desde tenants.seasonConfig
{{policies_description}}    <- Generado desde knowledge_base categoria "policy"
{{custom_instructions}}     <- tenantChatbotConfig.botLanguageInstructions
{{booking_cta}}             <- Configurable: "web", "whatsapp", "telefono"
{{bot_personality}}         <- tenantChatbotConfig.botPersonality
```

### 2.5 Knowledge Base por Tenant

**Estado actual**: `seedKnowledgeBase.ts` tiene 14 entradas hardcoded en espanol. La tabla `knowledge_base` no tiene campo `tenantId`.

**Propuesta**:

1. Agregar `tenantId` a la tabla `knowledge_base`.
2. Crear interfaz web en el dashboard del tenant para gestionar entradas.
3. Cada tenant podra:
   - Crear/editar/eliminar entradas de conocimiento
   - Organizar por categorias (faq, policy, route, general, custom)
   - Activar/desactivar entradas
   - Ver que entradas se usan mas en conversaciones (analytics)
   - Importar/exportar entradas (CSV)
4. Los embeddings se generan automaticamente al crear/editar.
5. Limites por plan: Basic 50 entradas, Pro 200, Enterprise ilimitado.

**Flujo de RAG por tenant:**

```
Mensaje del usuario
    |
    v
generateEmbedding(mensaje)
    |
    v
searchKnowledgeBase(
  query = mensaje,
  language = idioma_detectado,
  tenantId = tenant_actual,    // NUEVO filtro
  limit = 3,
  minSimilarity = 0.65
)
    |
    v
Resultados filtrados por tenant + idioma + similitud
    |
    v
Se inyectan en el prompt como contexto RAG
```

### 2.6 Personalizacion de la Personalidad del Bot

Cada tenant podra configurar:

| Parametro | Opciones | Ejemplo |
|-----------|----------|---------|
| `botName` | Texto libre | "Marina", "Captain Bot", "Asistente" |
| `botTone` | friendly / formal / casual / luxury | "luxury" para yates de lujo |
| `botPersonality` | Texto libre | "Entusiasta, experto en nautica, usa humor ligero" |
| `maxResponseLength` | Palabras | 150 (conciso) o 300 (detallado) |
| `useEmojis` | boolean | true/false |
| `signOffMessage` | Texto | "Un saludo desde el puerto de Blanes" |

**Ejemplo de prompt resultante para un tenant de lujo:**

```
Eres Marina, asistente virtual de Mediterranean Yacht Club.
Tu tono es elegante y sofisticado. Tratas a los clientes de usted.
Respondes de forma concisa pero con atencion al detalle.
No uses emojis. Usa vocabulario nautico cuando sea apropiado.
```

**Ejemplo para un tenant casual de paddlesurf:**

```
Eres Wave, el asistente de SurfBoard Rentals Ibiza.
Tu tono es relajado y divertido. Tratas a los clientes de tu.
Puedes usar algun emoji. Transmite energia positiva y ganas de playa.
```

### 2.7 Multi-Idioma por Tenant

**Estado actual**: 8 idiomas soportados con traducciones completas en `translations.ts`. La deteccion de idioma funciona bien.

**Propuesta para SaaS:**

1. Cada tenant elige que idiomas habilitar en `enabledLanguages`.
2. El idioma por defecto se configura en `defaultLanguage`.
3. Las traducciones del chatbot UI (menus, botones) siguen siendo globales (mantenidas por la plataforma).
4. Las traducciones de contenido especifico (FAQs, policies) son responsabilidad del tenant via knowledge base multilingue.
5. El sistema de deteccion de idioma sigue funcionando igual, pero si detecta un idioma no habilitado para ese tenant, cae al `defaultLanguage`.

```
Idioma detectado: "ru" (ruso)
Idiomas del tenant: ["es", "en", "fr"]
Resultado: fallback a "es" (defaultLanguage)

Idioma detectado: "fr" (frances)
Idiomas del tenant: ["es", "en", "fr"]
Resultado: "fr" (soportado)
```

### 2.8 Function Calling por Tenant

Las 4 funciones actuales (`get_boat_availability`, `get_price_for_date`, `list_available_boats`, `get_boat_details`) deben filtrar por `tenantId`:

```
ANTES (functionCallingService.ts):
  const allBoats = await storage.getAllBoats();

DESPUES:
  const allBoats = await storage.getBoatsByTenant(tenantId);
```

Ademas, tenants en plan Pro/Enterprise podrian definir funciones custom:

| Plan | Funciones Disponibles |
|------|----------------------|
| Basic | availability, price, list, details |
| Pro | + create_booking_draft, get_weather, route_suggestions |
| Enterprise | + custom functions via API |

---

## 3. Experiencia B2B - Clientes del SaaS

### 3.1 Onboarding Guiado

El onboarding es el momento critico donde un nuevo cliente (empresa de alquiler) configura su cuenta. Debe ser simple, guiado y completable en menos de 30 minutos.

**Flujo de Onboarding en 5 Pasos:**

```
Paso 1: CUENTA                    Paso 2: NEGOCIO
[Nombre de empresa]               [Tipo: alquiler barcos / yates / motos acuaticas]
[Email principal]                  [Ubicacion: ciudad, puerto]
[Telefono]                         [Temporada: meses operativos]
[Contrasena]                       [Moneda y zona horaria]
     |                                  |
     v                                  v
Paso 3: FLOTA                     Paso 4: WHATSAPP
[Agregar primer barco]             [Conectar numero Twilio]
[Nombre, capacidad, precio]        [Verificar conexion]
[Foto (opcional)]                  [Personalizar bienvenida]
[Deposito]                         [Elegir idiomas]
     |                                  |
     v                                  v
Paso 5: ACTIVACION
[Resumen de configuracion]
[Test: enviar mensaje de prueba]
[Activar chatbot]
[Tour del dashboard]
```

**Detalle tecnico por paso:**

**Paso 1 - Cuenta:**
- Registro con email + password (o Google OAuth)
- Verificacion de email obligatoria
- Seleccion de plan (trial gratuito 14 dias)
- Aceptacion de terminos de servicio

**Paso 2 - Negocio:**
- Formulario con los datos basicos del negocio
- Auto-deteccion de timezone por ubicacion
- Configuracion de temporadas: selector visual de meses
- Preset para "temporada completa" (todo el ano) o "estacional"

**Paso 3 - Flota:**
- Wizard para agregar el primer barco:
  - Nombre y modelo
  - Capacidad (personas)
  - Requiere licencia (si/no)
  - Precios por duracion (tabla editable)
  - Deposito
  - Foto principal (upload a Google Cloud Storage)
- Opcion de "agregar mas despues" para no bloquear el onboarding
- Importacion masiva via CSV para flotas grandes

**Paso 4 - WhatsApp:**
- Guia paso a paso para conectar Twilio:
  1. Crear cuenta en Twilio (link directo)
  2. Obtener Account SID y Auth Token
  3. Configurar numero de WhatsApp Business
  4. Pegar credenciales en el formulario
  5. Boton "Probar conexion" que envia un mensaje de test
- Alternativa: el SaaS proporciona numeros compartidos (plan Enterprise)
- Configuracion del mensaje de bienvenida con preview en tiempo real

**Paso 5 - Activacion:**
- Resumen visual de toda la configuracion
- Boton "Enviar mensaje de prueba" que simula una conversacion
- Checklist de verificacion:
  - Datos de negocio completos
  - Al menos 1 barco configurado
  - WhatsApp conectado y verificado
  - Mensaje de bienvenida configurado
- Tour interactivo del dashboard (tooltips guiados)

### 3.2 Setup Wizard Detallado

Despues del onboarding inicial, el wizard de configuracion avanzada esta disponible en el dashboard:

```
Dashboard del Tenant
|
+-- Configuracion General
|   +-- Datos del negocio
|   +-- Temporadas y horarios
|   +-- Moneda y zona horaria
|   +-- Logo e imagen de marca
|
+-- Gestion de Flota
|   +-- Crear / editar / desactivar barcos
|   +-- Precios por temporada (tabla editable)
|   +-- Extras disponibles (personalizables)
|   +-- Fotos y galeria
|   +-- Disponibilidad y bloqueos manuales
|
+-- Chatbot WhatsApp
|   +-- Conexion Twilio
|   +-- Personalidad del bot
|   +-- Mensaje de bienvenida (por idioma)
|   +-- Idiomas habilitados
|   +-- Knowledge base (FAQs, politicas, rutas)
|   +-- Lead scoring (umbrales configurables)
|   +-- Notificaciones (numeros, eventos)
|
+-- Reservas
|   +-- Flujo de reserva (web / whatsapp / ambos)
|   +-- Pagos (Stripe connect / manual)
|   +-- Comunicaciones automaticas
|   +-- Politica de cancelacion
|
+-- Equipo
|   +-- Usuarios y roles
|   +-- Permisos por rol
|   +-- Horarios de atencion
|
+-- Integraciones
    +-- Stripe (pagos)
    +-- SendGrid (email)
    +-- Google Calendar (sync)
    +-- Google Analytics
```

### 3.3 Centro de Ayuda / Knowledge Base para Clientes SaaS

**Estructura del centro de ayuda:**

```
Ayuda y Soporte
|
+-- Guias de Inicio Rapido
|   +-- "Configura tu primer barco en 5 minutos"
|   +-- "Conecta WhatsApp paso a paso"
|   +-- "Tu primera reserva via chatbot"
|
+-- Tutoriales por Area
|   +-- Gestion de Flota (5 articulos)
|   +-- Chatbot WhatsApp (8 articulos)
|   +-- Reservas y Pagos (6 articulos)
|   +-- Analytics y Reportes (4 articulos)
|   +-- Knowledge Base (3 articulos)
|
+-- Videos Tutoriales
|   +-- Tour del dashboard (3 min)
|   +-- Configurar chatbot (5 min)
|   +-- Gestionar reservas (4 min)
|
+-- FAQ del SaaS
|   +-- Facturacion y planes
|   +-- Limites y cuotas
|   +-- Seguridad y datos
|   +-- Integraciones
|
+-- Changelog
|   +-- Novedades mensuales
|   +-- Proximas funcionalidades (roadmap publico)
|
+-- API Docs (solo Enterprise)
    +-- Referencia de endpoints
    +-- Webhooks
    +-- Autenticacion
```

### 3.4 Tutoriales Interactivos In-App

Implementados como tooltips contextuales que aparecen la primera vez que el usuario accede a cada seccion:

**Ejemplo - Primera visita al panel de Analytics:**

```
Paso 1/4: "Este es tu panel de conversaciones. Aqui ves todas las
           conversaciones de WhatsApp en tiempo real."
           [Siguiente] [Saltar tour]

Paso 2/4: "Los leads calientes aparecen con indicador rojo. Son
           clientes con alta intencion de reserva que deberias
           contactar pronto."
           [Siguiente] [Atras]

Paso 3/4: "Aqui ves las metricas clave: total de conversaciones,
           tasa de resolucion del bot, y tiempo medio de respuesta."
           [Siguiente] [Atras]

Paso 4/4: "Puedes filtrar por fecha, idioma o calidad del lead.
           Exporta los datos a CSV desde este boton."
           [Finalizar tour]
```

**Tours disponibles:**

| Tour | Trigger | Duracion |
|------|---------|----------|
| Dashboard general | Primer login despues del onboarding | 4 pasos |
| Gestion de flota | Primera visita a /boats | 5 pasos |
| Configuracion chatbot | Primera visita a /chatbot-settings | 6 pasos |
| Analytics | Primera visita a /analytics | 4 pasos |
| Knowledge base | Primera visita a /knowledge | 3 pasos |
| Reservas | Primera reserva recibida | 5 pasos |

---

## 4. Experiencia B2C - Clientes Finales

### 4.1 Flujo de Reserva Optimizado via WhatsApp

**Flujo actual (7-10 mensajes para reservar):**

```
1. Cliente: "Hola"
2. Bot: Bienvenida + menu
3. Cliente: "4" (reservar)
4. Bot: Pide fecha
5. Cliente: "15/07/2026"
6. Bot: Muestra barcos
7. Cliente: "1" (Solar 450)
8. Bot: Pide hora
9. Cliente: "1" (10:00)
10. Bot: Pide duracion
11. Cliente: "3" (4 horas)
12. Bot: Pide personas
13. Cliente: "4"
14. Bot: Pide extras
15. Cliente: "0" (ninguno)
16. Bot: Pide nombre
17. Cliente: "Juan Garcia"
18. Bot: Pide email
19. Cliente: "juan@email.com"
20. Bot: Muestra resumen
21. Cliente: "1" (confirmar)
22. Bot: Reserva creada
```

**Flujo optimizado propuesto (4-6 mensajes con IA):**

```
1. Cliente: "Quiero alquilar un barco para 4 personas el sabado que viene"
2. Bot: [IA entiende: fecha=proximo sabado, personas=4, intent=booking]
   "Para el sabado 21/02 tengo 5 barcos disponibles para 4 personas.
    Te recomiendo el Solar 450 (sin licencia, desde 150E por 4 horas).
    Que duracion prefieres? 2h, 4h, 6h u 8h?"
3. Cliente: "4 horas, a las 10 de la manana"
4. Bot: [IA entiende: duracion=4h, hora=10:00]
   "Perfecto. Solar 450, sabado 21/02, 10:00-14:00, 4 personas.
    Precio: 150E + 250E deposito (devolvible).
    Necesito tu nombre y email para confirmar."
5. Cliente: "Juan Garcia, juan@email.com"
6. Bot: [IA parsea nombre y email]
   "Reserva confirmada:
    Solar 450 | Sab 21/02 | 10:00-14:00 | 4 personas
    Total: 150E + 250E deposito
    Juan, te hemos enviado confirmacion por email.
    El dia de la reserva, presentate en Puerto de Blanes a las 9:45.
    Alguna pregunta?"
```

**Mejoras clave:**
- El bot usa IA para extraer multiples datos de un solo mensaje
- Sugiere barcos proactivamente basado en el numero de personas
- Combina pasos (nombre + email en un mensaje)
- Confirma automaticamente y envia instrucciones post-reserva
- Total: 6 mensajes vs 22 del flujo actual

### 4.2 Comunicaciones Automatizadas

Sistema de comunicaciones post-reserva por WhatsApp y email:

```
TIMELINE DE COMUNICACIONES

Reserva confirmada (T+0)
    |
    +-- WhatsApp: Confirmacion inmediata con resumen
    +-- Email: Confirmacion formal con PDF adjunto
    |
T-48h (2 dias antes)
    |
    +-- WhatsApp: Recordatorio con checklist:
    |   "Tu reserva es pasado manana! Recuerda llevar:
    |    proteccion solar, toalla, agua. Te esperamos
    |    a las 9:45 en Puerto de Blanes."
    |
T-2h (2 horas antes)
    |
    +-- WhatsApp: Ultima hora:
    |   "En 2 horas empieza tu aventura!
    |    Ubicacion exacta: [Google Maps link]
    |    Tiempo: soleado, 28C, mar en calma.
    |    Contacto de emergencia: +34 611 500 372"
    |
T+2h (2 horas despues de terminar)
    |
    +-- WhatsApp: Follow-up:
    |   "Como ha ido la experiencia?
    |    Nos encantaria que nos dejaras tu opinion:
    |    [link a Google Reviews]"
    |
T+7d (1 semana despues)
    |
    +-- Email: Fidelizacion:
        "Gracias por navegar con nosotros!
         Aqui tienes un 10% de descuento para tu
         proxima reserva: REPITE10
         Valido hasta fin de temporada."
```

**Tabla de comunicaciones en la base de datos:**

```typescript
export const tenantCommunicationTemplates = pgTable("tenant_comm_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),

  // Tipo de comunicacion
  triggerEvent: varchar("trigger_event", { length: 50 }).notNull(),
    // "booking_confirmed" | "reminder_48h" | "reminder_2h" |
    // "post_trip" | "loyalty_7d" | "review_request"
  channel: varchar("channel", { length: 20 }).notNull(),
    // "whatsapp" | "email" | "sms"

  // Timing
  delayMinutes: integer("delay_minutes").default(0),
    // 0 = inmediato, -2880 = 48h antes, 120 = 2h despues

  // Contenido (con placeholders)
  subject: text("subject"),                  // Solo para email
  bodyTemplate: text("body_template").notNull(),
  language: varchar("language", { length: 5 }).notNull(),

  // Estado
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

**Placeholders disponibles en templates:**

```
{{customer_name}}        -- Nombre del cliente
{{customer_first_name}}  -- Solo primer nombre
{{boat_name}}            -- Nombre del barco
{{booking_date}}         -- Fecha formateada
{{booking_time}}         -- Hora de inicio
{{booking_end_time}}     -- Hora de fin
{{booking_duration}}     -- Duracion en horas
{{total_price}}          -- Precio total
{{deposit}}              -- Deposito
{{location_name}}        -- Nombre de ubicacion
{{location_maps_url}}    -- Link Google Maps
{{business_name}}        -- Nombre del negocio
{{business_phone}}       -- Telefono del negocio
{{weather_forecast}}     -- Prevision meteo (si integrado)
{{review_link}}          -- Link a Google Reviews
{{discount_code}}        -- Codigo descuento personalizado
{{next_booking_url}}     -- URL para nueva reserva
```

### 4.3 Programa de Fidelizacion

**Estructura del programa:**

```
NIVELES DE FIDELIZACION

Nivel 1: MARINERO (1 reserva)
  - 5% descuento en proxima reserva
  - Codigo unico personal

Nivel 2: CAPITAN (3 reservas)
  - 10% descuento permanente
  - Prioridad en reservas de temporada alta
  - Extra gratuito (a elegir 1)

Nivel 3: ALMIRANTE (5+ reservas)
  - 15% descuento permanente
  - Upgrade gratuito de barco (si disponible)
  - Extra premium gratuito
  - Invitacion a eventos exclusivos
```

**Tabla de fidelizacion:**

```typescript
export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),

  // Configuracion del programa
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),

  // Niveles como JSON configurable
  tiers: json("tiers").$type<Array<{
    name: string;
    minBookings: number;
    discountPercent: number;
    perks: string[];
    badgeIcon: string;
  }>>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const customerLoyalty = pgTable("customer_loyalty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),

  // Progreso
  totalBookings: integer("total_bookings").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  currentTier: varchar("current_tier", { length: 50 }),
  personalDiscountCode: varchar("personal_discount_code", { length: 20 }),

  // Tracking
  lastBookingAt: timestamp("last_booking_at", { withTimezone: true }),
  firstBookingAt: timestamp("first_booking_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

**Integracion con el chatbot:**

Cuando un cliente existente contacta por WhatsApp, el bot puede:

1. Detectar al cliente por numero de telefono via `customerLoyalty`
2. Saludar por nombre: "Hola Juan, bienvenido de vuelta"
3. Informar de su nivel: "Como Capitan, tienes un 10% de descuento"
4. Aplicar descuentos automaticamente al calcular precios
5. Sugerir upgrades disponibles por su nivel

---

## 5. Sistema de Soporte

### 5.1 Sistema de Tickets para Clientes SaaS

```typescript
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),

  // Ticket info
  ticketNumber: varchar("ticket_number", { length: 20 }).notNull().unique(),
    // Formato: "TK-2026-00001"
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
    // "billing" | "technical" | "chatbot" | "integration" | "feature_request" | "other"
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
    // "low" | "medium" | "high" | "critical"
  status: varchar("status", { length: 20 }).notNull().default("open"),
    // "open" | "in_progress" | "waiting_customer" | "waiting_internal" | "resolved" | "closed"

  // Asignacion
  assignedTo: varchar("assigned_to"),           // ID del agente de soporte

  // SLA
  slaTarget: timestamp("sla_target", { withTimezone: true }),
  slaBreached: boolean("sla_breached").default(false),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),

  // Metadata
  attachments: text("attachments").array(),
  tags: text("tags").array(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id),

  senderType: varchar("sender_type", { length: 20 }).notNull(),
    // "customer" | "agent" | "system"
  senderId: varchar("sender_id"),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  isInternal: boolean("is_internal").default(false), // Notas internas del equipo

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

### 5.2 Chat en Vivo

Integrado en el dashboard del tenant. Dos modos:

**Modo 1: Chat con soporte SaaS (para el tenant)**

```
Dashboard del tenant -> Icono de chat en esquina inferior derecha
  -> Conecta con equipo de soporte del SaaS
  -> Horario: L-V 9:00-18:00 CET
  -> Fuera de horario: crea ticket automaticamente
  -> Historial persistente
```

**Modo 2: Chat con clientes finales (para el operador del tenant)**

```
Dashboard del tenant -> Seccion "Conversaciones"
  -> Ve todas las conversaciones de WhatsApp en tiempo real
  -> Puede intervenir manualmente (takeover del bot)
  -> Boton "Tomar conversacion" pausa el bot para ese cliente
  -> Boton "Devolver al bot" reactiva respuestas automaticas
  -> Indicadores de urgencia por lead score
```

### 5.3 Escalado de Incidencias

```
NIVELES DE ESCALADO

Nivel 1 (L1): Bot de soporte + Knowledge base
  - Respuestas automaticas a preguntas frecuentes
  - Resolucion esperada: < 5 min
  - Tasa objetivo: 40% de tickets

Nivel 2 (L2): Agente de soporte junior
  - Problemas de configuracion, dudas de uso
  - Resolucion esperada: < 4 horas
  - Tasa objetivo: 40% de tickets

Nivel 3 (L3): Agente de soporte senior / especialista
  - Problemas tecnicos complejos, integraciones
  - Resolucion esperada: < 24 horas
  - Tasa objetivo: 15% de tickets

Nivel 4 (L4): Ingenieria / Desarrollo
  - Bugs, mejoras de producto, problemas de infra
  - Resolucion esperada: segun SLA del plan
  - Tasa objetivo: 5% de tickets
```

**Reglas de escalado automatico:**

```
SI ticket.status == "open" Y tiempo > SLA_primera_respuesta
  -> Escalar a L2 + notificar manager

SI ticket.priority == "critical"
  -> Asignar a L3 inmediatamente + notificar CTO

SI ticket.category == "billing" Y tenant.plan == "enterprise"
  -> Asignar a account manager dedicado

SI ticket.slaBreached == true
  -> Notificar director de soporte
  -> Agregar etiqueta "SLA_BREACH"
  -> Incrementar prioridad
```

### 5.4 SLAs por Tier

| Metrica | Basic | Pro | Enterprise |
|---------|-------|-----|-----------|
| Primera respuesta | < 24h | < 4h | < 1h |
| Resolucion (low) | 5 dias | 3 dias | 2 dias |
| Resolucion (medium) | 3 dias | 1 dia | 8h |
| Resolucion (high) | 1 dia | 8h | 4h |
| Resolucion (critical) | 8h | 4h | 1h |
| Canal de soporte | Email + tickets | + chat en vivo | + telefono + Slack dedicado |
| Horario soporte | L-V 9-18 | L-V 8-20 | 24/7 |
| Account manager | No | No | Si, dedicado |
| Uptime garantizado | 99% | 99.5% | 99.9% |
| Onboarding asistido | Documentacion | Videollamada 1h | Sesion presencial/remota |

---

## 6. Feedback y Mejora Continua

### 6.1 Sistema de Feedback In-App

**Widget de feedback contextual:**

Aparece en cada seccion del dashboard con opciones rapidas:

```
+------------------------------------------+
| Como valorarias esta seccion?            |
|                                          |
|  [Genial]  [Bien]  [Regular]  [Mal]     |
|                                          |
| Comentario (opcional):                   |
| [________________________________]       |
| [Enviar]                                 |
+------------------------------------------+
```

**Tabla de feedback:**

```typescript
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id"),

  // Contexto
  page: text("page").notNull(),           // "/dashboard/chatbot-settings"
  component: text("component"),            // "knowledge-base-editor"

  // Valoracion
  rating: integer("rating"),               // 1-4 (Genial/Bien/Regular/Mal)
  comment: text("comment"),

  // Metadata
  browserInfo: text("browser_info"),
  screenshotUrl: text("screenshot_url"),   // Opcional

  // Estado
  status: varchar("status", { length: 20 }).default("new"),
    // "new" | "reviewed" | "actioned" | "archived"
  internalNotes: text("internal_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

### 6.2 NPS Tracking

**Encuesta NPS automatizada:**

- Se envia por email cada 90 dias a tenants activos
- Aparece como modal in-app despues de 30 dias de uso activo
- Pregunta unica: "Del 0 al 10, con que probabilidad recomendarias [NombreSaaS] a un colega?"

```
CLASIFICACION:

0-6: Detractores
  -> Trigger: alerta al equipo de Customer Success
  -> Accion: llamada personal dentro de 48h
  -> Objetivo: entender el problema y resolverlo

7-8: Pasivos
  -> Trigger: email con encuesta de seguimiento
  -> Accion: identificar que les falta para ser promotores
  -> Objetivo: convertir en promotores

9-10: Promotores
  -> Trigger: email de agradecimiento
  -> Accion: solicitar testimonio/caso de exito
  -> Objetivo: programa de referidos
```

**Tabla de NPS:**

```typescript
export const npsResponses = pgTable("nps_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id"),

  score: integer("score").notNull(),        // 0-10
  comment: text("comment"),                  // "Por que elegiste esta puntuacion?"
  category: varchar("category", { length: 20 }),
    // "detractor" | "passive" | "promoter"

  // Seguimiento
  followUpSent: boolean("follow_up_sent").default(false),
  followUpResponse: text("follow_up_response"),

  surveyType: varchar("survey_type", { length: 20 }).notNull(),
    // "email_90d" | "in_app_30d" | "post_onboarding"

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});
```

**Dashboard de NPS:**

```
+--------------------------------------------------+
|  NPS Score: 47  (+5 vs mes anterior)             |
|                                                   |
|  Promotores (9-10):  42%  ██████████░░           |
|  Pasivos (7-8):      33%  ████████░░░░           |
|  Detractores (0-6):  25%  ██████░░░░░░           |
|                                                   |
|  Tendencia: 38 -> 42 -> 47 (ultimos 3 meses)    |
|                                                   |
|  Top razones detractores:                         |
|  1. "El onboarding fue confuso" (4 menciones)    |
|  2. "Falta integracion con Calendario" (3)       |
|  3. "El chatbot no entiende bien frances" (2)    |
+--------------------------------------------------+
```

### 6.3 Feature Requests y Votacion

**Sistema de Feature Requests publico:**

Accesible desde el dashboard del tenant en seccion "Ideas y Sugerencias".

```
Flujo:

1. Tenant propone feature -> Formulario:
   - Titulo (obligatorio)
   - Descripcion detallada
   - Categoria (chatbot / reservas / analytics / integraciones / otro)
   - Impacto estimado en su negocio (bajo / medio / alto / critico)

2. Feature aparece en el tablero publico con estado "En revision"

3. Otros tenants pueden:
   - Votar (upvote)
   - Comentar ("A mi tambien me serviria para...")
   - Suscribirse a actualizaciones

4. El equipo de producto:
   - Revisa semanalmente
   - Cambia estado: En revision -> Planificado -> En desarrollo -> Lanzado
   - Responde a los tenants que propusieron
   - Agrupa features similares
```

**Tabla de feature requests:**

```typescript
export const featureRequests = pgTable("feature_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id"),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  businessImpact: varchar("business_impact", { length: 20 }),

  // Votacion
  voteCount: integer("vote_count").notNull().default(1),

  // Estado
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
    // "submitted" | "under_review" | "planned" | "in_development"
    // | "released" | "declined" | "duplicate"
  statusComment: text("status_comment"),     // Explicacion del cambio de estado

  // Planificacion
  targetRelease: varchar("target_release", { length: 20 }),  // "Q2-2026"
  releasedAt: timestamp("released_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const featureVotes = pgTable("feature_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureId: varchar("feature_id").notNull().references(() => featureRequests.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => ({
  uniqueVote: unique().on(table.featureId, table.tenantId),
}));
```

---

## 7. Esquema de Base de Datos

### 7.1 Resumen de Tablas Nuevas

A continuacion se listan todas las tablas nuevas requeridas para la transformacion a SaaS, agrupadas por dominio. Las tablas existentes (`boats`, `bookings`, `ai_chat_sessions`, `ai_chat_messages`, `knowledge_base`, `chatbot_conversations`) solo requieren agregar el campo `tenantId`.

```
TABLAS NUEVAS POR DOMINIO:

Multi-Tenancy (core):
  - tenants                          -- Organizaciones/empresas
  - tenant_users                     -- Usuarios por tenant (roles)
  - tenant_chatbot_config            -- Config del chatbot por tenant
  - tenant_whatsapp_numbers          -- Mapeo numero -> tenant

Comunicaciones:
  - tenant_comm_templates            -- Templates de comunicacion
  - scheduled_communications         -- Cola de envios programados
  - communication_log                -- Historial de envios

Fidelizacion:
  - loyalty_programs                 -- Config del programa por tenant
  - customer_loyalty                 -- Progreso del cliente

Soporte:
  - support_tickets                  -- Tickets de soporte
  - ticket_messages                  -- Mensajes en tickets

Feedback:
  - feedback                         -- Feedback in-app
  - nps_responses                    -- Encuestas NPS
  - feature_requests                 -- Solicitudes de funcionalidades
  - feature_votes                    -- Votos por feature
  - feature_comments                 -- Comentarios en features

Facturacion:
  - tenant_subscriptions             -- Suscripciones activas
  - tenant_invoices                  -- Facturas
  - tenant_usage                     -- Metricas de uso mensual

Total: ~18 tablas nuevas + 6 tablas existentes modificadas
```

### 7.2 Migracion de Tablas Existentes

Cada tabla existente necesita un campo `tenantId` con un valor por defecto para la migracion del tenant original (Costa Brava Rent a Boat).

**Estrategia de migracion:**

```
1. Crear tabla tenants con un registro para Costa Brava:
   INSERT INTO tenants (id, name, slug, ...)
   VALUES ('costa-brava-original', 'Costa Brava Rent a Boat', 'costa-brava', ...)

2. Agregar columna tenant_id a cada tabla:
   ALTER TABLE boats ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
   ALTER TABLE bookings ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
   ALTER TABLE ai_chat_sessions ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
   ALTER TABLE knowledge_base ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
   ALTER TABLE chatbot_conversations ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);

3. Poblar tenant_id en registros existentes:
   UPDATE boats SET tenant_id = 'costa-brava-original';
   UPDATE bookings SET tenant_id = 'costa-brava-original';
   (etc.)

4. Hacer tenant_id NOT NULL:
   ALTER TABLE boats ALTER COLUMN tenant_id SET NOT NULL;
   (etc.)

5. Agregar indices por tenant_id en cada tabla.
```

### 7.3 Diagrama de Relaciones

```
tenants (1)
  |
  +--< tenant_users (N)
  +--< tenant_chatbot_config (1)
  +--< tenant_whatsapp_numbers (N)
  +--< tenant_comm_templates (N)
  +--< loyalty_programs (1)
  +--< boats (N)
  |      +--< bookings (N)
  |             +--< booking_extras (N)
  |             +--< scheduled_communications (N)
  +--< knowledge_base (N)
  +--< ai_chat_sessions (N)
  |      +--< ai_chat_messages (N)
  +--< chatbot_conversations (N)
  +--< customer_loyalty (N)
  +--< support_tickets (N)
  |      +--< ticket_messages (N)
  +--< feedback (N)
  +--< nps_responses (N)
  +--< feature_requests (N)
         +--< feature_votes (N)
```

---

## 8. Plan de Implementacion

### 8.1 Fases

```
FASE 1: Fundacion Multi-Tenant (Semanas 1-4)
  Objetivo: Aislar datos por tenant sin romper funcionalidad actual

  1.1 Crear tabla tenants y migrar Costa Brava como primer tenant
  1.2 Agregar tenantId a todas las tablas existentes
  1.3 Crear middleware tenantResolver
  1.4 Modificar storage.ts para filtrar por tenant
  1.5 Modificar aiService.ts para usar prompt configurable
  1.6 Modificar twilioClient.ts para credenciales por tenant
  1.7 Tests manuales: verificar que Costa Brava sigue funcionando identico

FASE 2: Dashboard B2B (Semanas 5-8)
  Objetivo: Panel de administracion para tenants

  2.1 Autenticacion B2B (email + password, no PIN)
  2.2 Onboarding wizard (5 pasos)
  2.3 Gestion de flota (CRUD barcos por tenant)
  2.4 Configuracion del chatbot (personalidad, idiomas, prompts)
  2.5 Editor de Knowledge Base con generacion automatica de embeddings
  2.6 Vista de conversaciones WhatsApp en tiempo real

FASE 3: Comunicaciones y Fidelizacion (Semanas 9-12)
  Objetivo: Automatizar post-venta

  3.1 Sistema de templates de comunicacion por tenant
  3.2 Motor de programacion (cron) para envios automaticos
  3.3 Programa de fidelizacion configurable
  3.4 Descuentos automaticos en el chatbot para clientes recurrentes
  3.5 Dashboard de metricas de retencion

FASE 4: Soporte y Feedback (Semanas 13-16)
  Objetivo: Sistema completo de soporte B2B

  4.1 Sistema de tickets con SLAs
  4.2 Chat en vivo (soporte y takeover de conversaciones)
  4.3 Centro de ayuda con documentacion
  4.4 Widget de feedback in-app
  4.5 Encuestas NPS automatizadas
  4.6 Portal de feature requests con votacion

FASE 5: Facturacion y Escalado (Semanas 17-20)
  Objetivo: Monetizacion y crecimiento

  5.1 Planes y precios (Basic/Pro/Enterprise)
  5.2 Facturacion con Stripe Billing
  5.3 Limites y cuotas por plan
  5.4 Metricas de uso (tokens, conversaciones, almacenamiento)
  5.5 Landing page SaaS
  5.6 Segundo tenant piloto para validacion
```

### 8.2 Metricas de Exito

| KPI | Objetivo Mes 1 | Objetivo Mes 6 | Objetivo Mes 12 |
|-----|-----------------|-----------------|------------------|
| Tenants activos | 1 (Costa Brava) | 10 | 50 |
| Tasa de churn mensual | 0% | <5% | <3% |
| NPS | Baseline | >40 | >50 |
| Tiempo medio de onboarding | <30 min | <20 min | <15 min |
| Tasa de resolucion del bot (B2C) | 70% | 75% | 80% |
| CSAT cliente final (B2C) | 4.5/5 | 4.5/5 | 4.7/5 |
| Tickets soporte / tenant / mes | - | <3 | <2 |
| Feature requests implementados / trimestre | - | 5 | 10 |
| MRR | 0 (trial) | 2.000 EUR | 15.000 EUR |

### 8.3 Colaboracion Requerida con CTO

Para implementar este sistema necesito del CTO:

1. **Fase 1**: Migracion de base de datos a multi-tenant. Esto es trabajo critico de backend que debe hacerse sin downtime.
2. **Fase 1**: Middleware de tenant resolver y refactorizacion del storage layer.
3. **Fase 2**: Autenticacion B2B (reemplazar el sistema de PIN por auth real).
4. **Fase 2**: API de administracion de Knowledge Base con generacion de embeddings.
5. **Fase 3**: Motor de cron para comunicaciones programadas.
6. **Fase 4**: Infraestructura de chat en vivo (websockets).
7. **Fase 5**: Integracion con Stripe Billing y metering.

### 8.4 Colaboracion Requerida con CMO

Para la experiencia del cliente necesito del CMO:

1. **Fase 2**: Contenido del centro de ayuda y tutoriales.
2. **Fase 2**: Copy del onboarding wizard.
3. **Fase 3**: Templates por defecto de comunicaciones post-venta.
4. **Fase 4**: Texto de encuestas NPS y pagina de feature requests.
5. **Fase 5**: Landing page del SaaS, comparativa de planes, casos de exito.

---

## Apendice A: Mapa de Archivos Afectados

Archivos existentes que requieren modificacion para la transformacion a SaaS:

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `/Users/macbookpro/costa-brava-rent-a-boat/shared/schema.ts` | Agregar tablas tenant, tenantId a tablas existentes | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/aiService.ts` | BUSINESS_CONTEXT dinamico, prompt por tenant | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/twilioClient.ts` | Credenciales por tenant en lugar de env vars | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/webhookHandler.ts` | Tenant resolver antes de procesar mensaje | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/functionCallingService.ts` | Filtrar barcos/bookings por tenant | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/ragService.ts` | Filtrar knowledge base por tenant | Alta |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/chatMemoryService.ts` | tenantId en sessions y messages | Alta |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/sessionManager.ts` | Scoping de sesiones por tenant | Alta |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/seedKnowledgeBase.ts` | Convertir en template reutilizable por tenant | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/languageDetector.ts` | Respetar idiomas habilitados del tenant | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/messageRouter.ts` | BOAT_IDS dinamicos por tenant, no hardcoded | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/translations.ts` | Extras dinamicos por tenant | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/whatsapp/analyticsEndpoints.ts` | Filtrar por tenant, agregar auth | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/routes.ts` | Nuevos endpoints B2B, middleware tenant | Alta |
| `/Users/macbookpro/costa-brava-rent-a-boat/server/storage.ts` | Todas las queries filtradas por tenant | Critica |
| `/Users/macbookpro/costa-brava-rent-a-boat/shared/pricing.ts` | seasonConfig dinamico por tenant | Media |
| `/Users/macbookpro/costa-brava-rent-a-boat/shared/boatData.ts` | Dejar de usar como fuente global, migrar a DB | Alta |

## Apendice B: Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|-----------|
| Migracion DB rompe Costa Brava actual | Alta | Critico | Feature flags, rollback plan, staging previo |
| Credenciales Twilio mal gestionadas | Media | Critico | Encriptacion AES-256, vault, rotacion automatica |
| Tenant malicioso abusa del API de OpenAI | Media | Alto | Rate limiting por tenant, budget mensual, alerts |
| Aislamiento de datos insuficiente | Baja | Critico | Tests exhaustivos de aislamiento, row-level security en PostgreSQL |
| Onboarding demasiado complejo | Alta | Alto | User testing iterativo, simplificar a 3 pasos minimos |
| Coste de OpenAI por tenant inasumible | Media | Alto | Modelo configurable (gpt-4o-mini vs gpt-3.5), cache de respuestas frecuentes |
