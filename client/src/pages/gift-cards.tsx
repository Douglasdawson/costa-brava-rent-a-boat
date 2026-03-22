import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, Check, Ship } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks } from "@/utils/seo-config";

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
  const { toast } = useToast();
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();

  const seoConfig = getSEOConfig("giftCards", language) || {
    title: "Tarjetas Regalo | Costa Brava Rent a Boat",
    description: "Regala una experiencia en barco por la Costa Brava. Tarjetas regalo desde 50EUR.",
  };
  const canonical = generateCanonicalUrl("giftCards", language);
  const hreflangLinks = generateHreflangLinks("giftCards");

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
      toast({ title: t.giftCards?.purchaseSuccess || "Tarjeta regalo creada" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (purchaseComplete) {
    return (
      <main id="main-content" className="min-h-screen bg-muted">
        <SEO title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {t.giftCards?.purchaseSuccess || "Tarjeta regalo creada"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {t.giftCards?.purchaseSuccessDesc || "Se enviará por email una vez confirmado el pago."}
              </p>
              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground/60 mb-1">{t.giftCards?.code || "Código"}</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{giftCardCode}</p>
              </div>
              <p className="text-sm text-muted-foreground/60 mb-6">
                {t.giftCards?.forRecipient || "Para"}: {recipientName}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => window.location.href = "/"}>
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
            </CardContent>
          </Card>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-muted">
      <SEO title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} ogImage={seoConfig.image} canonical={canonical} hreflang={hreflangLinks} />
      <Navigation />

      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {t.giftCards?.title || "Tarjetas Regalo"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.giftCards?.subtitle || "Regala una experiencia inolvidable en barco por la Costa Brava"}
          </p>
        </div>

        {/* Why gift a boat experience */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-background rounded-xl p-6 sm:p-8 border border-border">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              ¿Por qué regalar una experiencia en barco?
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Un regalo original que no se olvida. Navegar por las calas de la Costa Brava,
                descubrir playas escondidas y disfrutar del Mediterráneo es una experiencia única
                que supera cualquier regalo material.
              </p>
              <p>
                Nuestras tarjetas regalo son válidas para cualquiera de nuestros{" "}
                <a href={localizedPath("home") + "#fleet"} className="text-primary hover:underline">7 barcos</a>,
                tanto sin licencia como con licencia. El destinatario puede elegir el barco,
                la fecha y la duración que prefiera durante toda la temporada (abril a octubre).
              </p>
              <p>
                Perfecta para cumpleaños, aniversarios, despedidas de soltero/a o simplemente
                para sorprender a alguien especial. El mar siempre es el mejor regalo.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Amount Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5" />
                {t.giftCards?.selectAmount || "Selecciona el importe"}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Purchaser & Recipient Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                {t.giftCards?.details || "Datos de compra"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Summary & Purchase */}
          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-8 space-y-3">
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">
              Preguntas frecuentes sobre tarjetas regalo
            </h2>
            <details className="group border border-border rounded-lg bg-background">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                ¿Cuánto tiempo es válida la tarjeta regalo?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                La tarjeta regalo tiene una validez de 1 año desde la fecha de compra.
                Puede utilizarse en cualquier momento durante la temporada de navegación (abril a octubre).
              </p>
            </details>
            <details className="group border border-border rounded-lg bg-background">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                ¿El destinatario puede elegir el barco?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Sí, el destinatario puede elegir cualquier barco de nuestra flota, sujeto a disponibilidad.
                Si el valor de la tarjeta no cubre el total, puede pagar la diferencia.
              </p>
            </details>
            <details className="group border border-border rounded-lg bg-background">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                ¿Cómo se canjea la tarjeta regalo?
                <Gift className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                El destinatario recibirá un código único por email. Para canjearla, solo tiene que contactarnos
                por WhatsApp al +34 611 500 372 o por email indicando el código y la fecha deseada.
              </p>
            </details>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
