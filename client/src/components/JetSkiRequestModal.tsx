import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  PHONE_PREFIXES,
  getDefaultPhonePrefixForLanguage,
} from "@/utils/phone-prefixes";
import { openWhatsApp } from "@/utils/whatsapp";
import { trackWhatsAppClick } from "@/utils/analytics";
import type { JetSkiProduct } from "@shared/jetskiProducts";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

interface JetSkiRequestModalProps {
  /** When set, the modal is open for this product. */
  product: JetSkiProduct | null;
  onClose: () => void;
}

const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring";

export default function JetSkiRequestModal({
  product,
  onClose,
}: JetSkiRequestModalProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const m = t.jetski?.modal;

  // Local YYYY-MM-DD for the date picker's min (no past dates). Using a native
  // <input type="date"> renders the OS-native calendar on Android/iOS/Windows/macOS.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [slotId, setSlotId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState(
    getDefaultPhonePrefixForLanguage(language),
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [people, setPeople] = useState(1);
  const [when, setWhen] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<SubmitStatus>("idle");

  if (!product) return null;

  const selectedSlot =
    product.slots.find((s) => s.id === slotId) ?? product.slots[0];

  // Effective price for the chosen party size: some slots (the 15-min circuit)
  // are priced per person (65€ for 1, 80€ for 2). Per-craft slots ignore this.
  const effectivePrice =
    people >= 2 && selectedSlot.price2 ? selectedSlot.price2 : selectedSlot.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    if (!firstName.trim() || !phoneNumber.trim()) {
      setStatus("error");
      return;
    }

    // Build a rich WhatsApp message — same structure as the boat booking flow
    // (see useBookingFlowActions.ts). The customer sends it to the company line;
    // the request is also persisted as an inquiry below so it shows in the CRM
    // even if they don't hit "Send".
    const dateStr = when.trim()
      ? (() => {
          try {
            return new Date(`${when}T00:00:00`).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          } catch {
            return when;
          }
        })()
      : "Flexible";

    const whatsappMessage = [
      `¡Hola! Me gustaría solicitar información para ir en jet ski:`,
      ``,
      `🚀 *Producto:* ${product.name}`,
      `📅 *Fecha:* ${dateStr}`,
      `⏱️ *Duración:* ${selectedSlot.label}`,
      `👥 *Persona/s:* ${people}`,
      `💶 *Total:* ${effectivePrice}€`,
      ``,
      `*Mis datos:*`,
      `${firstName.trim()} ${lastName.trim()}`.trim(),
      `Tel: ${phonePrefix}${phoneNumber.trim()}`,
      `Email: ${email.trim() || "(no indicado)"}`,
      ``,
      `¡Gracias!`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    // Fire WhatsApp open SYNCHRONOUSLY before any async work — required for
    // popup-blocker-free behavior (must stay inside the click handler stack).
    trackWhatsAppClick("jetski_request_submit");
    openWhatsApp(whatsappMessage);

    setStatus("submitting");
    try {
      // Persist to BOTH places, like the boat booking flow:
      //  • /api/booking-inquiries → CRM "Inquiries" (lead) + GA4 generate_lead
      //  • /api/jetski-booking    → CRM "Bookings" as a "requested" lead
      // The inquiry is the primary record; the booking mirror is best-effort.
      const [res] = await Promise.all([
        fetch("/api/booking-inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boatId: product.id,
            boatName: product.name,
            bookingDate: when.trim() || "Flexible",
            duration: selectedSlot.label,
            numberOfPeople: people,
            firstName: firstName.trim(),
            lastName: lastName.trim() || "-",
            phonePrefix,
            phoneNumber: phoneNumber.trim(),
            email: email.trim() || undefined,
            estimatedTotal: String(effectivePrice),
            source: "jetski",
            language,
            website, // honeypot — empty for real users
            notes: `[JET SKI – ${product.name}] Franja: ${selectedSlot.label} · ${people} pers. (${effectivePrice}€). Reventa partner Jet Ski Blanes.`,
          }),
        }),
        fetch("/api/jetski-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boatId: product.id,
            slotId: selectedSlot.id,
            bookingDate: when.trim() || null,
            numberOfPeople: people,
            firstName: firstName.trim(),
            lastName: lastName.trim() || "-",
            phonePrefix,
            phoneNumber: phoneNumber.trim(),
            email: email.trim() || null,
            language,
            website,
          }),
        }).catch(() => {
          /* best-effort: the inquiry above is the source of truth */
        }),
      ]);
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {status === "success" ? (
          <div role="status" className="py-6 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--ring))]" />
            <DialogTitle className="mb-2 font-heading text-2xl font-bold text-foreground">
              {m?.successTitle || "¡Solicitud enviada!"}
            </DialogTitle>
            <p className="text-muted-foreground">
              {m?.successText ||
                "Gracias. Te contactamos enseguida para confirmar tu jet ski."}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold text-foreground">
                {product.name}
              </DialogTitle>
              <DialogDescription>
                {m?.subtitle ||
                  "Elige la franja y te confirmamos disponibilidad. Sin pagos online."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="js-website">Website</label>
                <input
                  id="js-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {/* Slot picker */}
              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  {m?.slot || "Franja"}
                </legend>
                <div className="space-y-2">
                  {product.slots.map((slot) => {
                    const checked = slot.id === selectedSlot.id;
                    return (
                      <label
                        key={slot.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          checked
                            ? "border-cta bg-cta/5"
                            : "border-border hover:border-cta/50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="jetski-slot"
                            value={slot.id}
                            checked={checked}
                            onChange={() => setSlotId(slot.id)}
                            className="accent-cta"
                          />
                          <span className="text-sm font-medium text-foreground">
                            {slot.label}
                            {slot.priceNote && (
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                ({slot.priceNote})
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-cta">
                          {slot.price}&euro;
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="js-date"
                    className="mb-1 block text-sm font-medium text-muted-foreground"
                  >
                    {m?.date || "Fecha preferida"}
                  </label>
                  <input
                    id="js-date"
                    type="date"
                    min={todayStr}
                    className={inputClass}
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="js-people"
                    className="mb-1 block text-sm font-medium text-muted-foreground"
                  >
                    {m?.people || "Personas"}
                  </label>
                  <select
                    id="js-people"
                    className={inputClass}
                    value={people}
                    onChange={(e) => setPeople(Number(e.target.value))}
                  >
                    {Array.from({ length: product.capacity }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="js-firstname" className="sr-only">
                    {m?.firstName || "Nombre"}
                  </label>
                  <input
                    id="js-firstname"
                    name="given-name"
                    className={inputClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={m?.firstNamePlaceholder || "Nombre"}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="js-lastname" className="sr-only">
                    {m?.lastName || "Apellidos"}
                  </label>
                  <input
                    id="js-lastname"
                    name="family-name"
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={m?.lastNamePlaceholder || "Apellidos"}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="js-phone" className="sr-only">
                  {m?.phone || "Teléfono / WhatsApp"}
                </label>
                <div className="flex gap-2">
                  <select
                    aria-label={m?.phone || "Teléfono / WhatsApp"}
                    className="w-24 flex-shrink-0 rounded-lg border border-border bg-background px-2 py-3 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                  >
                    {PHONE_PREFIXES.map((p) => (
                      <option key={`${p.code}-${p.country}`} value={p.code}>
                        {p.flag} {p.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="js-phone"
                    className={inputClass}
                    type="tel"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={m?.phone || "Teléfono / WhatsApp"}
                    autoComplete="tel-national"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="js-email" className="sr-only">
                  {m?.email || "Email"}
                </label>
                <input
                  id="js-email"
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${m?.email || "Email"} (${m?.emailHint || "Opcional"})`}
                  autoComplete="email"
                />
              </div>

              {status === "error" && (
                <p role="alert" className="text-sm text-destructive">
                  {firstName.trim() && phoneNumber.trim()
                    ? m?.errorText ||
                      "No hemos podido enviar tu solicitud. Inténtalo de nuevo."
                    : m?.requiredError ||
                      "Por favor, completa tu nombre y teléfono."}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className={`${CTA_CLASS} min-h-12 w-full px-8 text-base`}
              >
                {status === "submitting"
                  ? m?.submitting || "Enviando..."
                  : m?.submit || "Enviar solicitud"}
                {status !== "submitting" && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
