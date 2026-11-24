import { useState, useEffect, useRef } from "react";
import { Check, Copy, Gift, X, Clock, MapPin } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { formatBookingDate } from "@/utils/intl-helpers";
import { useToast } from "@/hooks/use-toast";
import { trackWhatsAppClick, trackBookingConfirmed } from "@/utils/analytics";
import {
  ACTIVITATUM_PICKS,
  activitatumPicksBySlot,
  activitatumUrl,
} from "@shared/activitatumLinks";
import { coastrentUrl } from "@shared/coastrentLinks";

interface BookingConfirmationProps {
  boatName: string;
  date: string;
  time: string;
  duration: string;
  people: number;
  price: number | null;
  onClose: () => void;
}

const REPEAT_DISCOUNT_CODE = "REPITE10";

export function BookingConfirmation({
  boatName,
  date,
  time,
  duration,
  people,
  price,
  onClose,
}: BookingConfirmationProps) {
  const t = useTranslations();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const ct = t.confirmation;
  const ap = t.activitiesPage;

  // Initialize checklist
  useEffect(() => {
    if (ct?.checklistItems) {
      setCheckedItems(new Array(ct.checklistItems.length).fill(false));
    }
  }, [ct?.checklistItems?.length]);

  // Track booking confirmation on mount
  useEffect(() => {
    trackBookingConfirmed("", boatName, date, price || 0);
  }, [boatName, date, price]);

  // Trigger the checkmark animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowCheckAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Not a Radix dialog: Escape and initial focus are handled here.
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ct) return null;

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const formatDate = (dateStr: string): string =>
    formatBookingDate(dateStr, language, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handleShareWhatsApp = () => {
    trackWhatsAppClick("booking_confirmation");
    const shareText = `${ct.shareWhatsAppMessage || "Voy a alquilar un barco en Blanes con Costa Brava Rent a Boat"} (${boatName}) costabravarentaboat.com`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText("https://www.costabravarentaboat.com")
      .then(() => {
        toast({
          title: ct.linkCopied,
        });
      })
      .catch(() => {
        toast({
          title: ct.copyError || "Error al copiar",
          description: ct.copyErrorDescription || "No se pudo copiar al portapapeles.",
          variant: "destructive",
        });
      });
  };

  // Timeline step icons
  const timelineIcons = [SiWhatsapp, Clock, MapPin];

  const copyCode = () => {
    navigator.clipboard
      .writeText(REPEAT_DISCOUNT_CODE)
      .then(() => toast({ title: ct.linkCopied }))
      .catch(() =>
        toast({
          title: ct.copyError || "Error al copiar",
          description: ct.copyErrorDescription || "No se pudo copiar al portapapeles.",
          variant: "destructive",
        })
      );
  };

  const summary: Array<{ label: string; value: string; strong?: boolean; wide?: boolean }> = [
    { label: ct.labels?.boat || "Barco", value: boatName, wide: true },
    { label: ct.labels?.date || "Fecha", value: formatDate(date), wide: true },
    { label: ct.labels?.time || "Hora", value: `${time}h` },
    { label: ct.labels?.duration || "Duración", value: duration },
    { label: ct.labels?.people || "Personas", value: String(people) },
    ...(price !== null
      ? [{ label: ct.labels?.price || "Precio", value: `${price}€`, strong: true }]
      : []),
  ];

  const focus =
    "focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none";

  return (
    // Fills its host: inside the booking modal (a transformed box, so `fixed` anchors to it) it takes over the
    // wizard; on the standalone /booking page it is a full-screen sheet. No second card, no second backdrop.
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-confirmation-title"
      tabIndex={-1}
      className="confirm-enter fixed inset-0 z-50 bg-card text-card-foreground focus:outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={ct.close}
        className={`absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-muted ${focus}`}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="h-full overflow-y-auto overscroll-contain">
        {/* Success header. Title and reply time each stay on ONE line: the font scales with the box width. */}
        <header className="bg-muted px-5 pb-6 pt-8 text-center [container-type:inline-size] sm:px-8">
          <div
            className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success text-success-foreground transition-all duration-700 ${
              showCheckAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <Check className="h-7 w-7" strokeWidth={3} aria-hidden="true" />
          </div>
          <h2
            id="booking-confirmation-title"
            className="whitespace-nowrap font-heading font-semibold leading-tight tracking-tight text-foreground text-[length:clamp(0.8rem,4.6cqw,1.875rem)]"
          >
            {ct.title}
          </h2>
          {ct.responseTime && (
            <p className="mt-3 inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full bg-success/10 px-4 py-2 font-medium text-success text-[length:clamp(0.7rem,3.8cqw,0.875rem)]">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {ct.responseTime}
            </p>
          )}
        </header>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
            <div className="space-y-4">
              <section aria-label={ct.summary} className="rounded-3xl border border-border p-4">
                <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">{ct.summary}</h3>
                <dl className="grid grid-cols-2 gap-2">
                  {summary.map(item => (
                    <div
                      key={item.label}
                      className={`rounded-2xl px-3 py-2.5 ${item.wide ? "col-span-2" : ""} ${item.strong ? "bg-cta text-primary-foreground dark:text-background" : "bg-muted/60"}`}
                    >
                      <dt
                        className={`text-xs ${item.strong ? "opacity-80" : "text-muted-foreground"}`}
                      >
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 font-heading text-base font-semibold leading-tight tabular-nums">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-label={ct.checklist} className="rounded-3xl border border-border p-4">
                <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">{ct.checklist}</h3>
                <div className="flex flex-wrap gap-2">
                  {ct.checklistItems.map((item, i) => {
                    const on = checkedItems[i] || false;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleItem(i)}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-left text-sm transition-colors ${focus} ${
                          on
                            ? "border-transparent bg-muted text-muted-foreground line-through"
                            : "border-border bg-background text-foreground hover:border-foreground/30"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            on
                              ? "border-cta bg-cta text-primary-foreground dark:text-background"
                              : "border-border"
                          }`}
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <section aria-label={ct.whatsNext} className="rounded-3xl border border-border p-4">
                <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">{ct.whatsNext}</h3>
                <ol className="space-y-3">
                  {ct.whatsNextSteps.map((step, i) => {
                    const Icon = timelineIcons[i] || Clock;
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <p className="text-sm leading-snug text-foreground/85">{step}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <section aria-label={ct.shareTitle} className="rounded-3xl border border-border p-4">
                <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">{ct.shareTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className={`inline-flex min-h-11 min-w-[10rem] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-success px-5 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 ${focus}`}
                  >
                    <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
                    {ct.shareWhatsApp}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex min-h-11 min-w-[10rem] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted ${focus}`}
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {ct.copyLink}
                  </button>
                </div>
              </section>

              {/* Repeat booking: solid navy, no gradient. */}
              <section className="rounded-3xl bg-cta p-4 text-primary-foreground dark:text-background">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Gift className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{ct.repeatBooking}</p>
                    <p className="mt-0.5 text-xs opacity-80">{ct.saveDiscount}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-full bg-white/15 py-1.5 pl-4 pr-1.5">
                  <span className="min-w-0 truncate text-xs opacity-80">{ct.discountCode}</span>
                  <span className="font-mono text-sm font-bold tracking-wider">
                    {REPEAT_DISCOUNT_CODE}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    aria-label={ct.copyCode || "Copiar código"}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </section>
            </div>

            {/* What else there is to do: the one moment the visitor is thinking about the rest of the trip. */}
            {ap && (
              <section aria-label={ap.teaserTitle} className="md:col-span-2">
                <h3 className="mb-3 px-1 text-sm font-semibold text-foreground">
                  {ap.teaserTitle}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {activitatumPicksBySlot("afterBoat")
                    .slice(0, 3)
                    .map(key => {
                      const copy = ap.activities?.[key];
                      if (!copy) return null;
                      return (
                        <li key={key}>
                          <a
                            href={activitatumUrl(
                              ACTIVITATUM_PICKS[key].path,
                              language,
                              "booking-confirmation"
                            )}
                            target="_blank"
                            rel="noopener"
                            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted ${focus}`}
                          >
                            {copy.name}
                            <span className="font-normal text-muted-foreground">
                              {ap.priceFrom} {ACTIVITATUM_PICKS[key].priceEur}&euro;
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  {/* Tierra: Coast Rent (misma propiedad) a 10 min del puerto. Sin precio a propósito:
                      los suyos cambian y no son nuestros. */}
                  <li>
                    <a
                      href={coastrentUrl("home", language, "post-booking")}
                      target="_blank"
                      rel="noopener"
                      className={`inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted ${focus}`}
                    >
                      {t.coastrentOffice.postBooking}
                    </a>
                  </li>
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
