import { useState, useEffect } from "react";
import { CheckCircle2, Copy, Share2, Gift, X, Clock, MapPin, MessageCircle } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";
import { trackWhatsAppClick } from "@/utils/analytics";

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
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);

  const ct = t.confirmation;

  // Initialize checklist
  useEffect(() => {
    if (ct?.checklistItems) {
      setCheckedItems(new Array(ct.checklistItems.length).fill(false));
    }
  }, [ct?.checklistItems?.length]);

  // Trigger the checkmark animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowCheckAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ct) return null;

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleShareWhatsApp = () => {
    trackWhatsAppClick("booking_confirmation");
    const shareText = `${ct.shareWhatsAppMessage || 'Voy a alquilar un barco en Blanes con Costa Brava Rent a Boat'} (${boatName}) costabravarentaboat.com`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://costabravarentaboat.com").then(() => {
      toast({
        title: ct.linkCopied,
      });
    }).catch(() => {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive",
      });
    });
  };

  // Timeline step icons
  const timelineIcons = [MessageCircle, Clock, MapPin];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-muted rounded-full transition-colors z-10"
          aria-label={ct.close}
        >
          <X className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* Success header */}
        <div className="text-center pt-8 pb-4 px-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 transition-all duration-700 ${
              showCheckAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <CheckCircle2
              className={`h-10 w-10 text-green-600 transition-all duration-500 delay-300 ${
                showCheckAnimation ? "scale-100" : "scale-0"
              }`}
            />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            {ct.title}
          </h2>
        </div>

        {/* Booking summary */}
        <div className="mx-6 mb-4 p-4 bg-muted rounded-xl border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {ct.summary}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground/60">Barco:</span>
              <p className="font-medium text-foreground">{boatName}</p>
            </div>
            <div>
              <span className="text-muted-foreground/60">Fecha:</span>
              <p className="font-medium text-foreground">{formatDate(date)}</p>
            </div>
            <div>
              <span className="text-muted-foreground/60">Hora:</span>
              <p className="font-medium text-foreground">{time}h</p>
            </div>
            <div>
              <span className="text-muted-foreground/60">Duracion:</span>
              <p className="font-medium text-foreground">{duration}</p>
            </div>
            <div>
              <span className="text-muted-foreground/60">Personas:</span>
              <p className="font-medium text-foreground">{people}</p>
            </div>
            {price !== null && (
              <div>
                <span className="text-muted-foreground/60">Precio:</span>
                <p className="font-bold text-foreground">{price}€</p>
              </div>
            )}
          </div>
        </div>

        {/* Pre-trip checklist */}
        <div className="mx-6 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {ct.checklist}
          </h3>
          <div className="space-y-1.5">
            {ct.checklistItems.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={checkedItems[i] || false}
                  onChange={() => toggleItem(i)}
                  className="h-4 w-4 rounded border-border text-cta focus:ring-cta cursor-pointer"
                />
                <span
                  className={`text-sm transition-all ${
                    checkedItems[i]
                      ? "line-through text-muted-foreground/60"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* What's next timeline */}
        <div className="mx-6 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {ct.whatsNext}
          </h3>
          <div className="space-y-3">
            {ct.whatsNextSteps.map((step, i) => {
              const Icon = timelineIcons[i] || Clock;
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cta/20 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-foreground/80" />
                  </div>
                  <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share section */}
        <div className="mx-6 mb-4 p-4 bg-muted rounded-xl">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Share2 className="h-4 w-4" />
            {ct.shareTitle}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {ct.shareWhatsApp}
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
              {ct.copyLink}
            </button>
          </div>
        </div>

        {/* Repeat booking CTA */}
        <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-foreground/90 to-foreground/70 rounded-xl text-white">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 flex-shrink-0 mt-0.5 text-cta" />
            <div>
              <p className="font-semibold text-sm">{ct.repeatBooking}</p>
              <p className="text-xs text-white/80 mt-0.5">{ct.saveDiscount}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5">
                <span className="text-xs text-white/70">{ct.discountCode}:</span>
                <span className="font-mono font-bold text-sm tracking-wider">{REPEAT_DISCOUNT_CODE}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(REPEAT_DISCOUNT_CODE).then(() => {
                      toast({ title: ct.linkCopied });
                    }).catch(() => {
                      toast({
                        title: "Error al copiar",
                        description: "No se pudo copiar al portapapeles.",
                        variant: "destructive",
                      });
                    });
                  }}
                  className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors"
                  aria-label="Copy code"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
