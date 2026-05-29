import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Star, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
} from "@/utils/seo-config";
import {
  PHONE_PREFIXES,
  getDefaultPhonePrefixForLanguage,
} from "@/utils/phone-prefixes";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
} from "@shared/businessProfile";

const HERO_IMAGE =
  "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function SharedSailingPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.sharedSailing;

  const seoConfig = getSEOConfig("sharedSailing", language);
  const hreflangLinks = generateHreflangLinks("sharedSailing");
  const canonical = generateCanonicalUrl("sharedSailing", language);

  const socialProof = s.hero.socialProof
    .replace("{rating}", BUSINESS_RATING_STR)
    .replace("{count}", BUSINESS_REVIEW_COUNT_STR);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState(
    getDefaultPhonePrefixForLanguage(language),
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    if (!name.trim() || !phoneNumber.trim()) {
      setStatus("error");
      return;
    }

    // Split "Nombre Apellido" so the CRM keeps first/last separate.
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "-";

    setStatus("submitting");
    try {
      const res = await fetch("/api/booking-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: "salida-compartida",
          boatName: "Salida compartida (lista de interés)",
          bookingDate: "Flexible",
          duration: "flexible",
          numberOfPeople: 1,
          firstName,
          lastName,
          phonePrefix,
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          source: "salida-compartida",
          language,
          website, // honeypot — empty for real users
          notes: "[SALIDA COMPARTIDA – lista de interés]",
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

  const captureCard = (
    <div
      id="interes"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-7"
    >
      {status === "success" ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-2xl font-heading font-bold text-foreground">
            {s.form.successTitle}
          </h2>
          <p className="text-muted-foreground">{s.form.successText}</p>
        </div>
      ) : (
        <>
          <div className="mb-5 text-center">
            <h2 className="text-xl font-heading font-bold text-foreground sm:text-2xl">
              {s.form.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.form.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Honeypot — hidden from real users */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="ss-name" className="sr-only">
                {s.form.name}
              </label>
              <input
                id="ss-name"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={s.form.namePlaceholder}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="ss-phone" className="sr-only">
                {s.form.phone}
              </label>
              <div className="flex gap-2">
                <select
                  aria-label={s.form.phone}
                  className="w-24 flex-shrink-0 rounded-lg border border-border bg-background px-2 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  id="ss-phone"
                  className={inputClass}
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={s.form.phone}
                  autoComplete="tel-national"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ss-email" className="sr-only">
                {s.form.email}
              </label>
              <input
                id="ss-email"
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`${s.form.email} (${s.form.emailHint})`}
                autoComplete="email"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-destructive">
                {name.trim() && phoneNumber.trim()
                  ? s.form.errorText
                  : s.form.requiredError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full text-base"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? s.form.submitting : s.form.submit}
              {status !== "submitting" && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {s.form.reassurance}
            </p>
          </form>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
      />
      <Navigation />

      {/* ═══ HERO a pantalla completa ═══ */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden pt-20">
        {/* Imagen de fondo + overlay */}
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
            mounted ? "scale-100" : "scale-110"
          }`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/80 via-black/55 to-primary/40" />

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* Columna izquierda: mensaje */}
          <div
            className={`text-white transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                {s.hero.badge}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {socialProof}
              </span>
            </div>

            <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {s.hero.title}
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/90">
              {s.hero.subtitle}
            </p>

            <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
                {s.hero.priceHook}
              </span>
              <span className="text-sm text-white/75">{s.hero.priceNote}</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-popular px-4 py-2 text-sm font-semibold text-popular-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-popular-foreground/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-popular-foreground" />
              </span>
              {s.hero.scarcity}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {s.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/20 backdrop-blur"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Columna derecha: tarjeta de captura */}
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {captureCard}
          </div>
        </div>
      </section>

      {/* ═══ Barra CTA fija (solo móvil) ═══ */}
      {status !== "success" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">
                {s.hero.priceHook}
              </p>
              <p className="text-xs text-muted-foreground">{s.hero.priceNote}</p>
            </div>
            <Button asChild size="lg" className="flex-shrink-0">
              <a href="#interes">{s.hero.cta}</a>
            </Button>
          </div>
        </div>
      )}

      {/* Margen para que la barra fija no tape el footer en móvil */}
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}
