# Semana 2 — Experience (UX + Cancelaciones) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Que cada cliente pueda reservar perfectamente en cualquier dispositivo y pueda cancelar sin fricciones si lo necesita.

**Architecture:** Tres grandes bloques — (1) paridad desktop/mobile del formulario de reserva, (2) handoff real a agente humano vía WhatsApp, (3) flujo completo de cancelación con token único, endpoint y emails. No hay tests (no hay setup de testing en el proyecto).

**Tech Stack:** React + TailwindCSS (frontend), Express + Drizzle ORM (backend), SendGrid (emails), Twilio (WhatsApp), TypeScript strict mode.

---

## Contexto del proyecto

- **Working directory:** `/Users/macbookpro/costa-brava-rent-a-boat`
- **Comando de check:** `npm run check` (TypeScript, sin tests)
- **Idioma de UI:** multi-idioma (es/ca/en/fr/de/nl/it/ru), traducciones en `client/src/lib/translations.ts`
- **Datos de barcos:** `shared/boatData.ts` exporta `BOAT_DATA` y `EXTRA_PACKS`
- **Props compartidas:** `BookingFormWidget.tsx` gestiona TODO el estado (extras, packs, códigos) y lo pasa a `BookingFormDesktop` y `BookingWizardMobile` via `sharedProps`. El desktop YA RECIBE todas las props pero no las renderiza.
- **Estado de extras en desktop:** las props `boatExtras`, `selectedExtras`, `selectedPack`, `showExtras`, `setShowExtras`, `extrasInPack`, `totalExtrasPrice`, `handlePackSelect`, `handleExtraToggle`, `iconMap`, `calculatePackSavings`, `isSpanishLang`, `language` ya existen en `BookingWizardMobileProps` pero `BookingFormDesktop` no las destructura ni usa.
- **Estado de códigos en desktop:** las props `showCodeSection`, `setShowCodeSection`, `codeInput`, `setCodeInput`, `isValidatingCode`, `validatedCode`, `codeError`, `handleValidateCode`, `handleRemoveCode`, `getCodeDiscount` ya existen en props pero desktop no las usa.

---

## Task 1: Desktop form — Extras & Packs section

**Files:**
- Modify: `client/src/components/BookingFormDesktop.tsx`

### Step 1: Read the full file

Read `client/src/components/BookingFormDesktop.tsx` (full file, ~448 lines).

### Step 2: Add imports

At the top of the file, after existing imports, add:

```typescript
import { EXTRA_PACKS } from "@shared/boatData";
```

### Step 3: Destructure extras props

In the destructuring of `props` (currently lines 10-40), add after `t`:

```typescript
    boatExtras,
    selectedExtras,
    selectedPack,
    showExtras, setShowExtras,
    extrasInPack,
    totalExtrasPrice,
    handlePackSelect,
    handleExtraToggle,
    iconMap,
    calculatePackSavings,
    isSpanishLang,
```

### Step 4: Add Extras & Packs section to JSX

Find the `{/* Divider */}` comment (line ~275) and the `{/* Personal data */}` section below it.
Insert the following BETWEEN the divider and personal data:

```tsx
          {/* Extras & Packs */}
          {boatExtras.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowExtras(!showExtras)}
                className="flex items-center justify-between w-full mb-2"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t.wizard.extrasAndPacks}
                </p>
                <span className="flex items-center gap-2 text-xs">
                  {totalExtrasPrice > 0 && (
                    <span className="text-primary font-bold">+{totalExtrasPrice}€</span>
                  )}
                  <span className="text-gray-400">{showExtras ? '▲' : '▼'}</span>
                </span>
              </button>

              {showExtras && (
                <div className="space-y-2">
                  {/* Packs */}
                  {EXTRA_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handlePackSelect(pack.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 text-left transition-all ${
                        selectedPack === pack.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900">
                          {isSpanishLang ? pack.name : pack.nameEN}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {pack.extras.join(', ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-bold text-primary">{pack.price}€</p>
                        <p className="text-[10px] text-green-600">
                          -{calculatePackSavings(pack.id)}€ {t.wizard.savings || 'ahorro'}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Individual extras */}
                  {boatExtras.map((extra) => {
                    const Icon = iconMap[extra.icon] || iconMap['Package'];
                    const inPack = extrasInPack.has(extra.name);
                    const isSelected = selectedExtras.includes(extra.name);
                    return (
                      <button
                        key={extra.name}
                        type="button"
                        onClick={() => handleExtraToggle(extra.name)}
                        disabled={inPack}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border-2 text-left transition-all ${
                          inPack
                            ? 'border-primary/30 bg-primary/5 opacity-70 cursor-default'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
                        <span className="flex-1 text-xs font-medium text-gray-900">
                          {extra.name}
                        </span>
                        {inPack ? (
                          <span className="text-[10px] text-primary font-semibold flex-shrink-0">
                            {t.wizard.included || 'incluido'}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-primary flex-shrink-0">
                            {extra.price}€
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
```

**Note:** `t.wizard.extrasAndPacks` and `t.wizard.included` may need to be verified in translations.ts. If they don't exist, use hardcoded fallbacks: `'Extras & Packs'` and `'incluido'`. Do NOT add translation keys for this task.

**Note on `iconMap` prop:** `BookingFormDesktop` uses `BookingWizardMobileProps` type. The `iconMap` prop exists in `sharedProps` in BookingFormWidget but check that `BookingWizardMobileProps` interface includes it. If not, look at `BookingWizardMobile.tsx` to find the interface definition and add `iconMap` to it if missing.

### Step 5: Check TypeScript

```bash
npm run check
```

Expected: No errors.

### Step 6: Commit

```bash
git add client/src/components/BookingFormDesktop.tsx
git commit -m "feat(ux): add extras and packs section to desktop booking form"
```

---

## Task 2: Desktop form — Discount/Gift card code section + updated price summary

**Files:**
- Modify: `client/src/components/BookingFormDesktop.tsx`

### Step 1: Read current file (already done in Task 1, re-read if needed)

### Step 2: Destructure code props

Add to the existing props destructuring (after the extras props added in Task 1):

```typescript
    showCodeSection, setShowCodeSection,
    codeInput, setCodeInput,
    isValidatingCode,
    validatedCode,
    codeError,
    handleValidateCode,
    handleRemoveCode,
    getCodeDiscount,
```

Also add `Loader2` to the existing import from `lucide-react` if not already there (it's already imported at line 3 in the original file).

Add `X` to the lucide-react import: `import { CalendarIcon, Check, Loader2, X } from "lucide-react";`

### Step 3: Add discount code section

Find the `{/* RGPD consent */}` label block and insert the discount code section BEFORE it:

```tsx
          {/* Discount / Gift card code */}
          <div>
            <button
              type="button"
              onClick={() => setShowCodeSection(!showCodeSection)}
              className="flex items-center justify-between w-full mb-2"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.codeValidation?.title || 'Código descuento / tarjeta regalo'}
              </p>
              <span className="text-gray-400 text-xs">{showCodeSection ? '▲' : '▼'}</span>
            </button>

            {showCodeSection && (
              <div className="space-y-2">
                {validatedCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-bold text-green-800">{validatedCode.code}</p>
                      <p className="text-[10px] text-green-600">
                        {validatedCode.type === 'gift_card'
                          ? `-${getCodeDiscount()}€`
                          : `-${validatedCode.percentage}% (-${getCodeDiscount()}€)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCode}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Eliminar código"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder={t.codeValidation?.enterCode || 'CÓDIGO'}
                      className="flex-1 p-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none uppercase"
                      maxLength={32}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleValidateCode(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleValidateCode}
                      disabled={isValidatingCode || !codeInput.trim()}
                      className="px-3 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      {isValidatingCode
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : (t.codeValidation?.validate || 'Validar')}
                    </button>
                  </div>
                )}
                {codeError && (
                  <p className="text-xs text-red-500">{codeError}</p>
                )}
              </div>
            )}
          </div>
```

### Step 4: Update price summary to show extras + discount breakdown

Find the price summary block (around line 391-399 in original file, now shifted down):

```tsx
          {/* Price summary + submit */}
          {price !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{t.booking.estimatedTotal}</p>
                <p className="text-xl font-bold text-primary">{price}€</p>
              </div>
              <p className="text-xs text-gray-400 max-w-[120px] text-right">{t.booking.priceConfirmedWhatsApp}</p>
            </div>
          )}
```

Replace with:

```tsx
          {/* Price summary + submit */}
          {price !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t.booking.estimatedTotal}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{t.booking.basePrice || 'Precio base'}</span>
                  <span className="font-medium">{price}€</span>
                </div>
                {totalExtrasPrice > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Extras</span>
                    <span className="font-medium">+{totalExtrasPrice}€</span>
                  </div>
                )}
                {getCodeDiscount() > 0 && (
                  <div className="flex justify-between text-xs text-green-700">
                    <span>{validatedCode?.code}</span>
                    <span>-{getCodeDiscount()}€</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline border-t border-primary/20 pt-1.5 mt-1">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {price + totalExtrasPrice - getCodeDiscount()}€
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t.booking.priceConfirmedWhatsApp}</p>
            </div>
          )}
```

**Note:** `t.booking.basePrice` may not exist. Use the string `'Precio base'` as fallback for now — do NOT add new translation keys.

### Step 5: Check TypeScript

```bash
npm run check
```

Fix any TypeScript errors. Common issues:
- `iconMap[extra.icon]` may complain about indexing — use `iconMap[extra.icon as string]` or cast appropriately
- If `t.codeValidation` is optional in the type, use optional chaining or fallback strings

### Step 6: Commit

```bash
git add client/src/components/BookingFormDesktop.tsx
git commit -m "feat(ux): add discount code section and itemized price breakdown to desktop form"
```

---

## Task 3: Agent handoff — forward to owner WhatsApp when customer requests human

**Files:**
- Modify: `server/whatsapp/webhookHandler.ts`

### Step 1: Read webhookHandler.ts

Read `server/whatsapp/webhookHandler.ts` (full file). Focus on `processIncomingMessage` function (~lines 62-164).

Key structure:
```
processIncomingMessage()
  → detect language
  → if stale session: reset
  → if first message: send welcome
  → detect intent (menu / cancel / greeting)
  → if AI configured: call getAIResponseEnhanced()
  → send response
```

Agent handoff should be detected BEFORE calling AI (like "menu" and "cancel" intents).

### Step 2: Understand the owner number

The owner's WhatsApp number is `+34611500372`. We'll use `process.env.OWNER_WHATSAPP_NUMBER` with a hardcoded fallback.

The Twilio `From` number (business WhatsApp) is `process.env.TWILIO_WHATSAPP_FROM`.
To send to the owner, we use `sendWhatsAppMessage('whatsapp:+34611500372', message)`.

### Step 3: Add agent handoff detection

Find the intent detection block in `processIncomingMessage` (lines ~106-118):

```typescript
    // Handle global reset commands even in AI mode
    if (intent === "menu" || intent === "cancel" || (intent === "greeting" && !isInMainState)) {
      await resetSession(from);
      ...
```

BEFORE this block, add the agent handoff detection:

```typescript
    // Agent handoff — customer requests human assistance
    const agentHandoffTriggers = [
      'hablar con agente', 'hablar con persona', 'hablar con alguien',
      'speak to agent', 'speak to human', 'speak to person', 'talk to agent', 'talk to human',
      'parler avec un agent', 'parler avec quelqu',
      'mit einem mitarbeiter', 'mit jemandem sprechen',
      'parlare con', 'persona real', 'real person', 'personne réelle',
      'quiero un humano', 'quiero hablar', 'necesito ayuda de una persona',
    ];
    const isAgentHandoff = agentHandoffTriggers.some(trigger =>
      messageBody.toLowerCase().includes(trigger)
    );

    if (isAgentHandoff) {
      const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER || 'whatsapp:+34611500372';
      const clientNumber = from.replace('whatsapp:', '');
      const clientName = profileName || 'Cliente';

      // Notify owner
      const ownerMessage = `[HANDOFF] Cliente solicita hablar con agente humano.\nCliente: ${clientName}\nTelefono: ${clientNumber}\nIdioma: ${finalLang}\nUltimo mensaje: "${messageBody}"`;
      try {
        await sendWhatsAppMessage(ownerNumber, ownerMessage);
        console.log(`[Webhook] Agent handoff notification sent to owner for ${from}`);
      } catch (handoffError: any) {
        console.error(`[Webhook] Could not notify owner for agent handoff: ${handoffError.message}`);
      }

      // Acknowledge to customer
      const ackMessages: Record<string, string> = {
        es: 'He notificado a nuestro equipo. Un agente se pondrá en contacto contigo en breve por WhatsApp. Gracias por tu paciencia.',
        en: 'I have notified our team. An agent will contact you shortly via WhatsApp. Thank you for your patience.',
        fr: "J'ai notifié notre équipe. Un agent vous contactera sous peu par WhatsApp. Merci de votre patience.",
        de: 'Ich habe unser Team benachrichtigt. Ein Mitarbeiter wird sich in Kürze per WhatsApp bei Ihnen melden. Danke für Ihre Geduld.',
        nl: 'Ik heb ons team op de hoogte gesteld. Een medewerker neemt binnenkort contact met u op via WhatsApp. Bedankt voor uw geduld.',
        it: 'Ho notificato il nostro team. Un agente vi contatterà a breve via WhatsApp. Grazie per la vostra pazienza.',
        ru: 'Я уведомил нашу команду. Агент свяжется с вами в ближайшее время через WhatsApp. Спасибо за терпение.',
        ca: 'He notificat el nostre equip. Un agent es posarà en contacte amb tu en breu per WhatsApp. Gràcies per la teva paciència.',
      };
      const ack = ackMessages[finalLang] || ackMessages.es;
      await sendWhatsAppMessage(from, ack);
      return;
    }
```

### Step 4: Check TypeScript

```bash
npm run check
```

### Step 5: Commit

```bash
git add server/whatsapp/webhookHandler.ts
git commit -m "feat(chatbot): agent handoff — forward to owner WhatsApp when customer requests human"
```

---

## Task 4: Cancelation token — add to schema + generate at booking creation

**Files:**
- Modify: `shared/schema.ts`
- Modify: `server/storage.ts`
- Run: `npm run db:push`

### Step 1: Read shared/schema.ts

Read `shared/schema.ts` around lines 298-440 (bookings table + insertBookingSchema).

### Step 2: Add cancelationToken to bookings table

In the `bookings` table definition, add after `notes: text("notes")` and before `language`:

```typescript
  cancelationToken: text("cancelation_token").unique(), // UUID for cancel-without-login flow
```

### Step 3: Add cancelationToken to Zod schema

In `insertBookingSchema.extend({...})`, add after `language: z.string().max(5).optional()`:

```typescript
  cancelationToken: z.string().uuid().optional(),
```

### Step 4: Run database migration

```bash
npm run db:push
```

Expected output: Schema changes applied.

### Step 5: Read server/storage.ts around createBooking (line ~691)

Current implementation:
```typescript
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }
```

### Step 6: Update createBooking to auto-generate cancelationToken

```typescript
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const { randomUUID } = await import('crypto');
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        cancelationToken: booking.cancelationToken || randomUUID(),
      })
      .returning();
    return newBooking;
  }
```

### Step 7: Add getBookingByCancelationToken to IStorage interface and implementation

In `IStorage` interface (around line 44), add after existing booking methods:

```typescript
  getBookingByCancelationToken(token: string): Promise<Booking | undefined>;
  cancelBookingByToken(token: string): Promise<{ booking: Booking; refundAmount: number; refundPercentage: number } | undefined>;
```

In the `DatabaseStorage` class, add the implementations:

```typescript
  async getBookingByCancelationToken(token: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.cancelationToken, token));
    return booking || undefined;
  }

  async cancelBookingByToken(token: string): Promise<{ booking: Booking; refundAmount: number; refundPercentage: number } | undefined> {
    const booking = await this.getBookingByCancelationToken(token);
    if (!booking) return undefined;

    // Only confirmed bookings can be cancelled
    if (!['confirmed', 'pending_payment'].includes(booking.bookingStatus)) return undefined;

    // Calculate refund based on cancellation policy
    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const totalAmount = parseFloat(booking.totalAmount);
    let refundPercentage = 0;
    let refundAmount = 0;
    if (hoursUntilStart >= 48) {
      refundPercentage = 100;
      refundAmount = totalAmount;
    } else if (hoursUntilStart >= 24) {
      refundPercentage = 50;
      refundAmount = Math.round(totalAmount * 0.5 * 100) / 100;
    }

    const [updated] = await db
      .update(bookings)
      .set({
        bookingStatus: 'cancelled',
        refundStatus: refundAmount > 0 ? 'requested' : 'none',
        refundAmount: refundAmount.toString(),
      })
      .where(eq(bookings.cancelationToken, token))
      .returning();

    return { booking: updated, refundAmount, refundPercentage };
  }
```

**Note on `refundStatus`:** The schema currently allows `null | 'requested' | 'processing' | 'completed'`. Use `'requested'` when there is a refund amount, or just set `'none'` if not refundable (check the existing enum and add `'none'` if needed, or leave as null for 0% refund).

### Step 8: Check TypeScript

```bash
npm run check
```

Fix any errors.

### Step 9: Commit

```bash
git add shared/schema.ts server/storage.ts
git commit -m "feat(cancel): add cancelationToken to bookings schema and getBookingByCancelationToken + cancelBookingByToken to storage"
```

---

## Task 5: Cancelation endpoint — GET info + POST cancel

**Files:**
- Modify: `server/routes/bookings.ts`

### Step 1: Read server/routes/bookings.ts (full file)

Read the file to understand the existing route structure. The file exports `registerBookingRoutes(app: Express)`.

### Step 2: Add public cancelation info endpoint (GET)

Add BEFORE the admin-only endpoints, after the quote endpoint:

```typescript
  // Public cancel info endpoint — no auth required, uses token
  app.get("/api/bookings/cancel-info/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token || token.length < 10) {
        return res.status(400).json({ message: "Token inválido" });
      }

      const booking = await storage.getBookingByCancelationToken(token);
      if (!booking) {
        return res.status(404).json({ message: "Reserva no encontrada o token inválido" });
      }

      // Don't expose already-cancelled bookings
      if (booking.bookingStatus === 'cancelled') {
        return res.status(410).json({ message: "Esta reserva ya ha sido cancelada" });
      }

      // Only confirmed/pending_payment bookings can be cancelled
      if (!['confirmed', 'pending_payment'].includes(booking.bookingStatus)) {
        return res.status(422).json({ message: "Esta reserva no puede cancelarse en su estado actual" });
      }

      // Calculate refund info
      const hoursUntilStart = (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
      let refundPercentage = 0;
      if (hoursUntilStart >= 48) refundPercentage = 100;
      else if (hoursUntilStart >= 24) refundPercentage = 50;

      const boat = await storage.getBoat(booking.boatId);

      res.json({
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          customerSurname: booking.customerSurname,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus,
          boatName: boat?.name || booking.boatId,
          language: booking.language,
        },
        refundPolicy: {
          hoursUntilStart: Math.max(0, hoursUntilStart),
          refundPercentage,
          refundAmount: refundPercentage > 0
            ? (parseFloat(booking.totalAmount) * refundPercentage / 100).toFixed(2)
            : '0',
        },
      });
    } catch (error: unknown) {
      console.error("[Bookings] Error fetching cancel info:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
```

### Step 3: Add public cancel endpoint (POST)

Add immediately after the GET cancel-info endpoint:

```typescript
  // Public cancel endpoint — no auth required, uses token
  app.post("/api/bookings/cancel/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token || token.length < 10) {
        return res.status(400).json({ message: "Token inválido" });
      }

      const result = await storage.cancelBookingByToken(token);
      if (!result) {
        return res.status(404).json({ message: "Reserva no encontrada, ya cancelada, o no cancelable" });
      }

      const { booking, refundAmount, refundPercentage } = result;

      // Fire-and-forget emails (don't block response)
      import("../services/emailService").then(({ sendCancelationEmail }) => {
        sendCancelationEmail({ booking, refundAmount, refundPercentage }).catch((err: unknown) => {
          console.error("[Bookings] Error sending cancelation email:", err instanceof Error ? err.message : String(err));
        });
      }).catch(() => {});

      res.json({
        success: true,
        refundAmount,
        refundPercentage,
        message: refundAmount > 0
          ? `Reserva cancelada. Reembolso de ${refundAmount}€ (${refundPercentage}%) en proceso.`
          : "Reserva cancelada. No aplica reembolso según la política de cancelación.",
      });
    } catch (error: unknown) {
      console.error("[Bookings] Error cancelling booking:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Error al cancelar la reserva" });
    }
  });
```

**Important:** The `sendCancelationEmail` will be created in Task 7. Use a dynamic import to avoid circular deps and so it compiles even if the function doesn't exist yet (TypeScript will catch it at check time). Actually, for TypeScript to be happy, you need the function to exist before `npm run check`. You can stub it first:

If Task 7 is not done yet, temporarily stub in `emailService.ts`:
```typescript
export async function sendCancelationEmail(_data: unknown): Promise<void> {}
```
Then Task 7 replaces the stub.

**Alternative approach if dynamic import causes issues:** Use a try-catch with a direct import at the top of the file, and check if the function exists.

### Step 4: Check TypeScript

```bash
npm run check
```

### Step 5: Commit

```bash
git add server/routes/bookings.ts
git commit -m "feat(cancel): add public GET cancel-info and POST cancel endpoints using cancelation token"
```

---

## Task 6: Cancelation page (frontend)

**Files:**
- Create: `client/src/pages/CancelBookingPage.tsx`
- Modify: `client/src/App.tsx`

### Step 1: Read client/src/App.tsx to understand routing pattern

Read lines 1-100 of App.tsx. Note:
- Routes use `wouter` library: `import { Switch, Route } from "wouter";`
- Lazy-loaded pages: `const Page = lazy(() => import("@/pages/page-name"));`
- All lazy pages are wrapped in `<Suspense>` in the route

### Step 2: Create CancelBookingPage.tsx

Create `client/src/pages/CancelBookingPage.tsx`:

```tsx
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancelInfo {
  booking: {
    id: string;
    customerName: string;
    customerSurname: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingStatus: string;
    boatName: string;
    language: string;
  };
  refundPolicy: {
    hoursUntilStart: number;
    refundPercentage: number;
    refundAmount: string;
  };
}

export default function CancelBookingPage() {
  const [, params] = useRoute("/cancel/:token");
  const token = params?.token;

  const [info, setInfo] = useState<CancelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ refundAmount: number; refundPercentage: number } | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token de cancelación no encontrado.");
      setLoading(false);
      return;
    }
    fetch(`/api/bookings/cancel-info/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Error ${res.status}`);
        }
        return res.json();
      })
      .then((data: CancelInfo) => {
        setInfo(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/cancel/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setCancelResult({ refundAmount: data.refundAmount, refundPercentage: data.refundPercentage });
      setCancelled(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-2xl mb-2">No se puede cancelar</p>
          <p className="text-gray-600">{error}</p>
          <a href="/" className="mt-4 inline-block text-primary underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (cancelled && cancelResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva cancelada</h1>
          {cancelResult.refundAmount > 0 ? (
            <p className="text-gray-600">
              Se procesará un reembolso de <strong>{cancelResult.refundAmount}€</strong> ({cancelResult.refundPercentage}%) en los próximos días hábiles.
            </p>
          ) : (
            <p className="text-gray-600">
              La cancelación se ha procesado. Según nuestra política, la cancelación con menos de 24h de antelación no genera reembolso.
            </p>
          )}
          <p className="text-sm text-gray-400 mt-4">Recibirás un email de confirmación.</p>
          <a href="/" className="mt-6 inline-block text-primary underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const { booking, refundPolicy } = info;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancelar reserva</h1>

        {/* Booking details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <p><span className="text-gray-500">Barco:</span> <strong>{booking.boatName}</strong></p>
          <p><span className="text-gray-500">Fecha:</span> <strong>{formatDate(booking.startTime)}</strong></p>
          <p><span className="text-gray-500">Cliente:</span> <strong>{booking.customerName} {booking.customerSurname}</strong></p>
          <p><span className="text-gray-500">Total pagado:</span> <strong>{booking.totalAmount}€</strong></p>
        </div>

        {/* Refund policy */}
        <div className={`rounded-xl p-4 mb-6 text-sm border ${
          refundPolicy.refundPercentage === 100
            ? 'bg-green-50 border-green-200'
            : refundPolicy.refundPercentage === 50
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="font-semibold mb-1">Política de cancelación</p>
          {refundPolicy.refundPercentage === 100 && (
            <p className="text-green-800">Cancelación con más de 48h de antelación: <strong>reembolso completo ({refundPolicy.refundAmount}€)</strong>.</p>
          )}
          {refundPolicy.refundPercentage === 50 && (
            <p className="text-yellow-800">Cancelación entre 24-48h: <strong>reembolso del 50% ({refundPolicy.refundAmount}€)</strong>.</p>
          )}
          {refundPolicy.refundPercentage === 0 && (
            <p className="text-red-800">Cancelación con menos de 24h de antelación: <strong>sin reembolso</strong>.</p>
          )}
        </div>

        {/* Confirm button */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar cancelación
          </Button>
          <a
            href="/"
            className="block text-center text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Mantener reserva
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Add route in App.tsx

Read `client/src/App.tsx` lines 40-50 to see the lazy import pattern. Add:

```typescript
const CancelBookingPage = lazy(() => import("@/pages/CancelBookingPage"));
```

Then in the `<Switch>` routes section (find where routes are defined), add:

```tsx
<Route path="/cancel/:token">
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
    <CancelBookingPage />
  </Suspense>
</Route>
```

Add this BEFORE the `<Route>` catch-all (NotFound route). `Loader2` is already imported from lucide-react in App.tsx — check if it is; if not add to the import.

### Step 4: Check TypeScript

```bash
npm run check
```

### Step 5: Commit

```bash
git add client/src/pages/CancelBookingPage.tsx client/src/App.tsx
git commit -m "feat(cancel): add cancelation page at /cancel/:token with refund policy display"
```

---

## Task 7: Include cancel link in confirmation email

**Files:**
- Modify: `server/services/emailService.ts`

### Step 1: Read emailService.ts — find sendBookingConfirmation

Read `server/services/emailService.ts`. Find the `sendBookingConfirmation` function.

It receives `{ booking, boat, extras }` as `BookingEmailData`. The `booking` object now has `cancelationToken` (from Task 4).

### Step 2: Add cancel link to confirmation email HTML

Inside the `sendBookingConfirmation` function, find where the HTML body is constructed. After the booking details table, add a cancelation link section:

Find the closing part of the confirmation email content (before `emailWrapper()`) and add:

```typescript
const appUrl = process.env.APP_URL || 'https://costabravarentaboat.app';
const cancelUrl = booking.cancelationToken
  ? `${appUrl}/cancel/${booking.cancelationToken}`
  : null;

const cancelBlock = cancelUrl ? `
  <div style="margin-top:24px; padding:16px; background-color:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
    <p style="margin:0 0 8px; color:#64748b; font-size:13px;">${strings.cancelTitle || 'Política de cancelación: reembolso completo con más de 48h de antelación.'}</p>
    <a href="${cancelUrl}" style="color:#dc2626; font-size:13px; text-decoration:underline;">${strings.cancelLink || 'Cancelar mi reserva'}</a>
  </div>
` : '';
```

Then include `${cancelBlock}` in the email HTML body, after the booking details table.

**For the EmailStrings interface**, add two optional fields:
```typescript
  cancelTitle?: string;
  cancelLink?: string;
```

And add to each language entry (use `||` fallback in the template so adding to all 7 is optional for this task — just add to `es` and `en` for now):
- es: `cancelTitle: 'Política de cancelación: reembolso completo con más de 48h de antelación.'`, `cancelLink: 'Cancelar mi reserva'`
- en: `cancelTitle: 'Cancellation policy: full refund with more than 48h notice.'`, `cancelLink: 'Cancel my booking'`

Leave other languages to use the `||` fallback strings.

### Step 3: Check TypeScript

```bash
npm run check
```

### Step 4: Commit

```bash
git add server/services/emailService.ts
git commit -m "feat(email): include cancel link in booking confirmation email"
```

---

## Task 8: Cancelation emails — customer confirmation + owner notification

**Files:**
- Modify: `server/services/emailService.ts`

### Step 1: Read the full emailService.ts (or re-read relevant sections)

Look at the existing pattern for sending emails. Key patterns:
- `initSendGrid()` returns boolean — check before sending
- `emailWrapper(content)` wraps HTML in the common layout
- `sgMail.send({...})` is the send call
- `getFromEmail()` returns sender

### Step 2: Add sendCancelationEmail function

If there's a stub `sendCancelationEmail` (from Task 5), replace it. Otherwise add:

```typescript
interface CancelationEmailData {
  booking: Booking;
  refundAmount: number;
  refundPercentage: number;
}

export async function sendCancelationEmail(data: CancelationEmailData): Promise<EmailResult> {
  if (!data.booking.customerEmail) {
    return { success: false, error: 'No customer email' };
  }
  if (!initSendGrid()) {
    return { success: false, error: 'SendGrid not configured' };
  }

  const { booking, refundAmount, refundPercentage } = data;
  const strings = getEmailStrings(booking.language);
  const appUrl = process.env.APP_URL || 'https://costabravarentaboat.app';

  const refundBlock = refundAmount > 0
    ? `<p style="color:#16a34a; font-weight:bold;">Reembolso: ${refundAmount}€ (${refundPercentage}%) — se procesará en los próximos días hábiles.</p>`
    : `<p style="color:#dc2626;">Sin reembolso según política de cancelación (menos de 24h de antelación).</p>`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 16px; color:#1e3a5f; font-size:22px;">Reserva cancelada</h2>
    <p style="color:#475569; font-size:15px; margin:0 0 16px;">
      Hola ${booking.customerName}, hemos procesado la cancelación de tu reserva.
    </p>
    ${refundBlock}
    <p style="color:#64748b; font-size:13px; margin-top:24px;">
      Si tienes dudas, contáctanos en <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb;">costabravarentboat@gmail.com</a> o al +34 611 500 372.
    </p>
    <p style="margin-top:16px;"><a href="${appUrl}" style="color:#2563eb; text-decoration:none;">Volver a costabravarentaboat.app</a></p>
  `);

  const customerSubject = `Cancelación confirmada — ${booking.customerName}`;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: getFromEmail(),
      subject: customerSubject,
      html,
    });
  } catch (err: unknown) {
    console.error('[Email] Error sending cancelation email:', err instanceof Error ? err.message : String(err));
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }

  // Owner notification (fire-and-forget)
  const ownerEmail = process.env.OWNER_EMAIL || 'costabravarentboat@gmail.com';
  const ownerHtml = emailWrapper(`
    <h2 style="color:#dc2626;">Cancelación de reserva</h2>
    <p>Cliente: <strong>${booking.customerName} ${booking.customerSurname}</strong></p>
    <p>Email: ${booking.customerEmail}</p>
    <p>Teléfono: ${booking.customerPhone}</p>
    <p>Fecha: ${new Date(booking.startTime).toLocaleDateString('es-ES')}</p>
    <p>Total: ${booking.totalAmount}€</p>
    ${refundAmount > 0 ? `<p style="color:#dc2626;">Reembolso a procesar: ${refundAmount}€ (${refundPercentage}%)</p>` : '<p>Sin reembolso.</p>'}
  `);

  sgMail.send({
    to: ownerEmail,
    from: getFromEmail(),
    subject: `[CANCELACIÓN] ${booking.customerName} — ${new Date(booking.startTime).toLocaleDateString('es-ES')}`,
    html: ownerHtml,
  }).catch((err: unknown) => {
    console.error('[Email] Error sending cancelation owner notification:', err instanceof Error ? err.message : String(err));
  });

  return { success: true };
}
```

**Important imports:** The function uses `Booking` type — check existing imports at the top of emailService.ts. If `Booking` isn't imported, find the correct import path (it's `import type { Booking } from "@shared/schema"` or similar).

### Step 3: Check TypeScript

```bash
npm run check
```

Fix any type errors. Common issues:
- `sgMail` import — already exists at top of file
- `Booking` type — add to existing import from `@shared/schema`

### Step 4: Commit

```bash
git add server/services/emailService.ts
git commit -m "feat(email): add sendCancelationEmail with customer confirmation and owner notification"
```

---

## Final check

After all tasks are complete:

```bash
npm run check
```

Expected: zero TypeScript errors across all modified files.

---

## Task order and dependencies

```
Task 1 (desktop extras) → independent
Task 2 (desktop codes + summary) → depends on Task 1 (same file)
Task 3 (agent handoff) → independent
Task 4 (schema + token) → independent, must run BEFORE Task 5
Task 5 (cancel endpoints) → needs Task 4 storage methods + Task 8 email stub
Task 6 (cancel page) → needs Task 5 API endpoints to exist
Task 7 (cancel link in email) → needs Task 4 (cancelationToken field on Booking type)
Task 8 (cancelation emails) → needs Task 4 (Booking type), needed by Task 5
```

**Recommended execution order:** 1 → 2 → 3 → 4 → 8 → 5 → 6 → 7

(Do Task 8 before Task 5 so the `sendCancelationEmail` import in Task 5 resolves correctly.)
