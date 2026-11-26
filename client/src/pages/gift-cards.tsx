import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { isJetSkiProduct } from "@shared/jetskiProducts";
import { isPubliclyListed } from "@shared/boatData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  Fold,
  H2,
  ON_NAVY_MUTED,
  PageHeader,
  PhotoBand,
  Rise,
  Sheet,
  splitSentences,
} from "@/components/content-kit";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { trackGiftCardPurchase } from "@/utils/analytics";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  getSEOConfig,
  generateCanonicalUrl,
  generateHreflangLinks,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { generateFAQSchema } from "@/utils/seo-schemas";

const AMOUNTS = [50, 100, 150, 200, 300];

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const fleetCount =
    (boats || []).filter(b => isPubliclyListed(b) && !isJetSkiProduct(b.id)).length || 8;
  const { toast } = useToast();
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  const seoConfig = getSEOConfig("giftCards", language) || {
    title: "Tarjetas Regalo | Costa Brava Rent a Boat",
    description:
      "Regala una experiencia en barco por la Costa Brava. Tarjetas regalo desde 50 EUR.",
  };
  const canonical = generateCanonicalUrl("giftCards", language);
  const hreflangLinks = generateHreflangLinks("giftCards");
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.giftCards, url: "/tarjetas-regalo" },
  ]);

  // Single source for the visible FAQ + the FAQPage JSON-LD (no drift).
  const giftCardFaqs = [
    {
      question: "¿Cuánto tiempo es válida la tarjeta regalo?",
      answer:
        "La tarjeta regalo tiene una validez de 1 año desde la fecha de compra. Puede utilizarse en cualquier momento durante la temporada de navegación (abril a octubre).",
    },
    {
      question: "¿El destinatario puede elegir el barco?",
      answer:
        "Sí, el destinatario puede elegir cualquier barco de nuestra flota, sujeto a disponibilidad. Si el valor de la tarjeta no cubre el total, puede pagar la diferencia.",
    },
    {
      question: "¿Cómo se canjea la tarjeta regalo?",
      answer:
        "El destinatario recibirá un código único por email. Para canjearla, solo tiene que contactarnos por WhatsApp al +34 611 500 372 o por email indicando el código y la fecha deseada.",
    },
  ];

  // Product + AggregateOffer so the gift card is eligible for product/offer
  // rich results and is machine-readable by AI answer engines.
  const giftCardProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t.giftCards?.title || "Tarjeta Regalo — Costa Brava Rent a Boat",
    description:
      t.giftCards?.subtitle ||
      "Regala una experiencia en barco por la Costa Brava. Válida para toda la flota durante la temporada (abril–octubre).",
    brand: { "@type": "Brand", name: "Costa Brava Rent a Boat - Blanes" },
    category: "Gift Card",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: String(Math.min(...AMOUNTS)),
      highPrice: String(Math.max(...AMOUNTS)),
      offerCount: AMOUNTS.length,
      availability: "https://schema.org/InStock",
      url: canonical,
    },
  };

  const jsonLd = [breadcrumbSchema, giftCardProductSchema, generateFAQSchema(giftCardFaqs)];

  const effectiveAmount = selectedAmount === -1 ? Number(customAmount) : selectedAmount;

  const handlePurchase = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      toast({
        variant: "destructive",
        title: t.giftCards?.selectAmount || "Selecciona un importe",
      });
      return;
    }
    if (!purchaserName.trim()) {
      toast({
        variant: "destructive",
        title: t.giftCards?.yourNameRequired || "Tu nombre es requerido",
      });
      return;
    }
    if (!purchaserEmail.trim()) {
      toast({
        variant: "destructive",
        title: t.giftCards?.yourEmailRequired || "Tu email es requerido",
      });
      return;
    }
    if (!recipientName.trim()) {
      toast({
        variant: "destructive",
        title: t.giftCards?.recipientNameRequired || "Nombre del destinatario requerido",
      });
      return;
    }
    if (!recipientEmail.trim()) {
      toast({
        variant: "destructive",
        title: t.giftCards?.recipientEmailRequired || "Email del destinatario requerido",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          purchaserName: purchaserName.trim(),
          purchaserEmail: purchaserEmail.trim(),
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          personalMessage: personalMessage.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al comprar");
      }

      const data = await res.json();
      setGiftCardCode(data.code);
      setPurchaseComplete(true);
      trackGiftCardPurchase(effectiveAmount, true);
      toast({ title: t.giftCards?.purchaseSuccess || "Tarjeta regalo creada" });
    } catch (error: unknown) {
      trackGiftCardPurchase(effectiveAmount, false);
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (purchaseComplete) {
    return (
      <main id="main-content" className="min-h-screen bg-background">
        <SEO
          title={seoConfig.title}
          description={seoConfig.description}
          keywords={seoConfig.keywords}
          ogImage={seoConfig.image}
          canonical={canonical}
          hreflang={hreflangLinks}
          jsonLd={jsonLd}
        />
        <Navigation />
        <ReadingProgressBar />
        <div className="py-16 sm:py-20 bg-background">
          <div className="max-w-md mx-auto px-4">
            <div className="rounded-2xl border border-border bg-muted p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="text-h2 font-heading font-semibold tracking-tight text-foreground mb-2">
                {t.giftCards?.purchaseSuccess || "Tarjeta regalo creada"}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t.giftCards?.purchaseSuccessDesc ||
                  "Se enviara por email una vez confirmado el pago."}
              </p>
              <div className="mb-4 rounded-xl bg-background p-4">
                <p className="text-sm text-muted-foreground/60 mb-1">
                  {t.giftCards?.code || "Codigo"}
                </p>
                <p className="text-2xl font-mono font-semibold tracking-wider">{giftCardCode}</p>
              </div>
              <p className="text-sm text-muted-foreground/60 mb-6">
                {t.giftCards?.forRecipient || "Para"}: {recipientName}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = localizedPath("home"))}
                >
                  {t.giftCards?.backHome || "Volver al inicio"}
                </Button>
                <Button
                  onClick={() => {
                    setPurchaseComplete(false);
                    setSelectedAmount(null);
                    setCustomAmount("");
                    setPurchaserName("");
                    setPurchaserEmail("");
                    setRecipientName("");
                    setRecipientEmail("");
                    setPersonalMessage("");
                    setGiftCardCode("");
                  }}
                >
                  {t.giftCards?.buyAnother || "Comprar otra"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const [whyLead, whyRest] = splitSentences(t.giftCards?.whyP1);

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      <PageHeader
        title={t.giftCards?.title || "Tarjetas Regalo"}
        subtitle={
          t.giftCards?.subtitle || "Regala una experiencia inolvidable en barco por la Costa Brava"
        }
        next="background"
      />

      {/* INTRO: first sentence is the lead, the rest are loose facts with rules */}
      <Sheet tone="background" next="muted">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-5 lg:gap-16">
          <Rise className="lg:col-span-3">
            <h2 className={H2}>
              {t.giftCards?.whyTitle || "¿Por qué regalar una experiencia en barco?"}
            </h2>
            <p className="mt-5 max-w-xl text-lg font-medium leading-snug text-foreground text-pretty sm:text-xl">
              {whyLead}
            </p>
            <ul className="mt-6 max-w-xl border-t border-border">
              {whyRest.length > 0 && (
                <li className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty">
                  {whyRest.join(" ")}
                </li>
              )}
              <li className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty">
                {(t.giftCards?.whyP2 || "Válidas para nuestros {count} barcos.").replace(
                  "{count}",
                  String(fleetCount)
                )}{" "}
                <a
                  href={localizedPath("home") + "#fleet"}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {t.giftCards?.viewFleet || "Ver la flota"}
                </a>
              </li>
              {t.giftCards?.whyP3 && (
                <li className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty">
                  {t.giftCards.whyP3}
                </li>
              )}
            </ul>
          </Rise>
          <Rise className="lg:col-span-2" delay={0.1}>
            <img
              src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-proa-aperitivo.webp"
              alt="Aperitivo en la proa del Trimarchi 57S en la Costa Brava"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* FORM */}
      <Sheet tone="muted" next="background">
        <div className="container mx-auto max-w-2xl px-4">
          {/* Amount Selection */}
          <div className="mb-6 rounded-2xl border border-border bg-background p-6 sm:p-8">
            <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
              {t.giftCards?.selectAmount || "Selecciona el importe"}
            </h3>
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {AMOUNTS.map(amount => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="h-16 rounded-xl text-lg font-semibold tabular-nums"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                >
                  {amount}€
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={selectedAmount === -1 ? "default" : "outline"}
                className="whitespace-nowrap rounded-full"
                onClick={() => setSelectedAmount(-1)}
              >
                {t.giftCards?.customAmount || "Otro importe"}
              </Button>
              {selectedAmount === -1 && (
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="€"
                  className="w-32"
                />
              )}
            </div>
          </div>

          {/* Purchaser & Recipient Info */}
          <div className="mb-6 rounded-2xl border border-border bg-background p-6 sm:p-8">
            <h3 className="mb-4 font-heading text-lg font-semibold tracking-tight">
              {t.giftCards?.details || "Datos de compra"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.giftCards?.yourName || "Tu nombre"}</Label>
                  <Input
                    value={purchaserName}
                    onChange={e => setPurchaserName(e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.giftCards?.yourEmail || "Tu email"}</Label>
                  <Input
                    type="email"
                    value={purchaserEmail}
                    onChange={e => setPurchaserEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  {t.giftCards?.recipientInfo || "Datos del destinatario"}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t.giftCards?.recipientName || "Nombre del destinatario"}</Label>
                    <Input
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.giftCards?.recipientEmail || "Email del destinatario"}</Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="destinatario@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.giftCards?.message || "Mensaje personal (opcional)"}</Label>
                <Textarea
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                  placeholder={
                    t.giftCards?.messagePlaceholder || "Escribe un mensaje para el destinatario..."
                  }
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Summary & Purchase */}
          <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.giftCards?.total || "Total"}</p>
                <p className="font-heading text-3xl font-semibold tabular-nums">
                  {effectiveAmount ? `${effectiveAmount}€` : "---"}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {t.giftCards?.validOneYear || "Valida 1 ano"}
                </p>
                <p className="text-xs">{t.giftCards?.allBoats || "Valida para todos los barcos"}</p>
              </div>
            </div>
            <Button
              className="h-12 w-full rounded-full text-base"
              onClick={handlePurchase}
              disabled={isSubmitting || !effectiveAmount || effectiveAmount < 10}
            >
              {isSubmitting
                ? t.giftCards?.processing || "Procesando..."
                : t.giftCards?.buy || "Solicitar tarjeta regalo"}
            </Button>
          </div>
        </div>
      </Sheet>

      <PhotoBand
        tone="background"
        next="muted"
        src="/images/blog/grupos-barco.webp"
        alt="Grupo de amigos disfrutando en barco por la Costa Brava"
      />

      {/* FAQ: folded, answers stay in the DOM */}
      <Sheet tone="muted" next="navy">
        <div className="container mx-auto max-w-2xl px-4">
          <Rise>
            <h2 className={H2}>Preguntas frecuentes sobre tarjetas regalo</h2>
            <div className="mt-8 flex flex-col gap-3">
              {giftCardFaqs.map((faq, i) => (
                <Fold
                  key={faq.question}
                  id={`giftcard-faq-${i}`}
                  title={faq.question}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.answer}
                </Fold>
              ))}
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* CTA: closes over the footer colour */}
      <Sheet tone="navy" next="foot">
        <Rise className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className={H2}>{t.giftCards?.ctaTitle || "El mar siempre es el mejor regalo"}</h2>
          <p
            className={`mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty sm:text-lg ${ON_NAVY_MUTED}`}
          >
            {t.giftCards?.ctaSubtitle ||
              "Sorprende a alguien especial con una experiencia inolvidable navegando por las calas de la Costa Brava."}
          </p>
          <div className="mt-8 flex justify-center">
            <InteractiveHoverButton
              tone="light"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="min-h-12 px-8 text-base"
            >
              {t.giftCards?.buy || "Solicitar tarjeta regalo"}
            </InteractiveHoverButton>
          </div>
        </Rise>
      </Sheet>

      <Footer />
    </main>
  );
}
