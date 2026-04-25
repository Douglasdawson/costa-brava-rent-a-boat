import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, Check, Ship } from "lucide-react";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { trackGiftCardPurchase } from "@/utils/analytics";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks, generateBreadcrumbSchema } from "@/utils/seo-config";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

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
  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const fleetCount = (boats || []).filter((b) => b.isActive).length || 9;
  const { toast } = useToast();
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  const seoConfig = getSEOConfig("giftCards", language) || {
    title: "Tarjetas Regalo | Costa Brava Rent a Boat",
    description: "Regala una experiencia en barco por la Costa Brava. Tarjetas regalo desde 50 EUR.",
  };
  const canonical = generateCanonicalUrl("giftCards", language);
  const hreflangLinks = generateHreflangLinks("giftCards");
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.giftCards, url: "/tarjetas-regalo" }
  ]);

  const effectiveAmount = selectedAmount === -1 ? Number(customAmount) : selectedAmount;

  const handlePurchase = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      toast({ variant: "destructive", title: t.giftCards?.selectAmount || "Selecciona un importe" });
      return;
    }
    if (!purchaserName.trim()) {
      toast({ variant: "destructive", title: t.giftCards?.yourNameRequired || "Tu nombre es requerido" });
      return;
    }
    if (!purchaserEmail.trim()) {
      toast({ variant: "destructive", title: t.giftCards?.yourEmailRequired || "Tu email es requerido" });
      return;
    }
    if (!recipientName.trim()) {
      toast({ variant: "destructive", title: t.giftCards?.recipientNameRequired || "Nombre del destinatario requerido" });
      return;
    }
    if (!recipientEmail.trim()) {
      toast({ variant: "destructive", title: t.giftCards?.recipientEmailRequired || "Email del destinatario requerido" });
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
        <SEO title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
        <Navigation />
        <ReadingProgressBar />
        <div className="py-16 sm:py-20 bg-background">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-muted border border-border rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
                {t.giftCards?.purchaseSuccess || "Tarjeta regalo creada"}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t.giftCards?.purchaseSuccessDesc || "Se enviara por email una vez confirmado el pago."}
              </p>
              <div className="bg-background rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground/60 mb-1">{t.giftCards?.code || "Codigo"}</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{giftCardCode}</p>
              </div>
              <p className="text-sm text-muted-foreground/60 mb-6">
                {t.giftCards?.forRecipient || "Para"}: {recipientName}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => window.location.href = localizedPath("home")}>
                  {t.giftCards?.backHome || "Volver al inicio"}
                </Button>
                <Button onClick={() => {
                  setPurchaseComplete(false);
                  setSelectedAmount(null);
                  setCustomAmount("");
                  setPurchaserName("");
                  setPurchaserEmail("");
                  setRecipientName("");
                  setRecipientEmail("");
                  setPersonalMessage("");
                  setGiftCardCode("");
                }}>
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

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <SEO title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} jsonLd={breadcrumbSchema} />
      <Navigation />
      <ReadingProgressBar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mt-8">
            <Gift className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-blue-100" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-4">
              {t.giftCards?.title || "Tarjetas Regalo"}
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto text-blue-50">
              {t.giftCards?.subtitle || "Regala una experiencia inolvidable en barco por la Costa Brava"}
            </p>
          </div>
        </div>
      </div>

      {/* Intro text + image */}
      <RevealSection className="py-16 sm:py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                Por que regalar una experiencia en barco?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Un regalo original que no se olvida. Navegar por las calas de la Costa Brava,
                descubrir playas escondidas y disfrutar del Mediterraneo es una experiencia unica
                que supera cualquier regalo material.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Nuestras tarjetas regalo son validas para cualquiera de nuestros{" "}
                <a href={localizedPath("home") + "#fleet"} className="text-primary hover:underline">{fleetCount} barcos</a>,
                tanto sin licencia como con licencia. El destinatario puede elegir el barco,
                la fecha y la duracion que prefiera durante toda la temporada (abril a octubre).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Perfecta para cumpleanos, aniversarios, despedidas de soltero/a o simplemente
                para sorprender a alguien especial. El mar siempre es el mejor regalo.
              </p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-proa-aperitivo.webp"
                alt="Aperitivo en la proa del Trimarchi 57S en la Costa Brava"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Form section */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Amount Selection */}
          <div className="bg-background border border-border rounded-xl p-6 sm:p-8 mb-6">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              {t.giftCards?.selectAmount || "Selecciona el importe"}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
              {AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className="h-16 text-lg font-bold"
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                >
                  {amount}EUR
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={selectedAmount === -1 ? "default" : "outline"}
                className="whitespace-nowrap"
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
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="EUR"
                  className="w-32"
                />
              )}
            </div>
          </div>

          {/* Purchaser & Recipient Info */}
          <div className="bg-background border border-border rounded-xl p-6 sm:p-8 mb-6">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              {t.giftCards?.details || "Datos de compra"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.giftCards?.yourName || "Tu nombre"}</Label>
                  <Input
                    value={purchaserName}
                    onChange={(e) => setPurchaserName(e.target.value)}
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.giftCards?.yourEmail || "Tu email"}</Label>
                  <Input
                    type="email"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {t.giftCards?.recipientInfo || "Datos del destinatario"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.giftCards?.recipientName || "Nombre del destinatario"}</Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nombre y apellido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.giftCards?.recipientEmail || "Email del destinatario"}</Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="destinatario@email.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.giftCards?.message || "Mensaje personal (opcional)"}</Label>
                <Textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder={t.giftCards?.messagePlaceholder || "Escribe un mensaje para el destinatario..."}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Summary & Purchase */}
          <div className="bg-background border border-border rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground/60">{t.giftCards?.total || "Total"}</p>
                <p className="text-3xl font-bold">
                  {effectiveAmount ? `${effectiveAmount}EUR` : "---"}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  <Ship className="w-3 h-3 mr-1" />
                  {t.giftCards?.validOneYear || "Valida 1 ano"}
                </Badge>
                <p className="text-xs text-muted-foreground/60">
                  {t.giftCards?.allBoats || "Valida para todos los barcos"}
                </p>
              </div>
            </div>
            <Button
              className="w-full h-12 text-lg"
              onClick={handlePurchase}
              disabled={isSubmitting || !effectiveAmount || effectiveAmount < 10}
            >
              {isSubmitting
                ? (t.giftCards?.processing || "Procesando...")
                : (t.giftCards?.buy || "Comprar Tarjeta Regalo")}
            </Button>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/grupos-barco.jpg"
          alt="Grupo de amigos disfrutando en barco por la Costa Brava"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-6">
            Preguntas frecuentes sobre tarjetas regalo
          </h2>
          <div className="space-y-3">
            <details className="group border border-border rounded-lg bg-muted">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                Cuanto tiempo es valida la tarjeta regalo?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground leading-relaxed">
                La tarjeta regalo tiene una validez de 1 ano desde la fecha de compra.
                Puede utilizarse en cualquier momento durante la temporada de navegacion (abril a octubre).
              </p>
            </details>
            <details className="group border border-border rounded-lg bg-muted">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                El destinatario puede elegir el barco?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground leading-relaxed">
                Si, el destinatario puede elegir cualquier barco de nuestra flota, sujeto a disponibilidad.
                Si el valor de la tarjeta no cubre el total, puede pagar la diferencia.
              </p>
            </details>
            <details className="group border border-border rounded-lg bg-muted">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                Como se canjea la tarjeta regalo?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground leading-relaxed">
                El destinatario recibira un codigo unico por email. Para canjearla, solo tiene que contactarnos
                por WhatsApp al +34 611 500 372 o por email indicando el codigo y la fecha deseada.
              </p>
            </details>
          </div>
        </div>
      </RevealSection>

      {/* CTA Section */}
      <RevealSection className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4">
            El mar siempre es el mejor regalo
          </h2>
          <p className="text-primary-foreground/85 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Sorprende a alguien especial con una experiencia inolvidable navegando por las calas de la Costa Brava.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Comprar Tarjeta Regalo
          </Button>
        </div>
      </RevealSection>

      <Footer />
    </main>
  );
}
