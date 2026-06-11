import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  BASE_DOMAIN,
} from "@/utils/seo-config";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
} from "@/utils/seo-schemas";
import {
  PHONE_PREFIXES,
  getDefaultPhonePrefixForLanguage,
} from "@/utils/phone-prefixes";

const HERO_IMAGE =
  "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

// Canonical primary CTA treatment (mirrors Hero.tsx): deep-navy pill, elevated.
const CTA_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

export default function SharedSailingPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.sharedSailing;

  const seoConfig = getSEOConfig("sharedSailing", language);
  const hreflangLinks = generateHreflangLinks("sharedSailing");
  const canonical = generateCanonicalUrl("sharedSailing", language);

  // GEO / AI-search structured data: breadcrumb + service + FAQ (one array node).
  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s.navLabel, url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Social Boat",
      serviceType: s.navLabel,
      description: s.hero.subtitle,
      url: canonical,
      provider: {
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat - Blanes",
        "@id": `${BASE_DOMAIN}/#business`,
      },
      areaServed: { "@type": "Place", name: "Blanes, Costa Brava" },
      offers: {
        "@type": "Offer",
        price: "40",
        priceCurrency: "EUR",
        description: `${s.hero.priceHook} · ${s.hero.priceNote}`,
      },
    },
    generateFAQSchema(s.faq.map((f) => ({ question: f.q, answer: f.a }))),
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState("");
  const [phonePrefix, setPhonePrefix] = useState(
    getDefaultPhonePrefixForLanguage(language),
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [people, setPeople] = useState(1);
  const [when, setWhen] = useState(s.form.whenFlexible);
  const [pilot, setPilot] = useState<"yes" | "maybe" | "no">("maybe");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  const pilotLabel: Record<typeof pilot, string> = {
    yes: s.form.pilotYes,
    maybe: s.form.pilotMaybe,
    no: s.form.pilotNo,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    const errors = {
      name: !name.trim(),
      phone: !phoneNumber.trim(),
    };
    if (errors.name || errors.phone) {
      setFieldErrors(errors);
      // Scroll to (and focus) the first field with an error.
      const firstErrorId = errors.name ? "ss-name" : "ss-phone";
      const el = document.getElementById(firstErrorId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setFieldErrors({});

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
          bookingDate: when || "Flexible",
          duration: "flexible",
          numberOfPeople: people,
          firstName,
          lastName,
          phonePrefix,
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          source: "salida-compartida",
          language,
          website, // honeypot — empty for real users
          notes: `[SALIDA COMPARTIDA – lista de interés] Pilota: ${pilotLabel[pilot]}.${
            message.trim() ? ` Nota: ${message.trim()}` : ""
          }`,
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* ═══ HERO: foto inmersiva + info ═══ */}
      <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden pb-16 pt-28">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          decoding="async"
          draggable={false}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1200ms] ease-out ${
            mounted ? "scale-100" : "scale-[1.06]"
          }`}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/25">
            <Sparkles className="h-4 w-4" />
            {s.hero.badge}
          </span>

          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {s.hero.title}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {s.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
            <span className="font-heading text-3xl font-extrabold text-white [text-shadow:0_2px_16px_hsl(215_45%_12%/0.55)] sm:text-4xl">
              {s.hero.priceHook}
            </span>
            <span className="text-sm text-white/80">{s.hero.priceNote}</span>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-popular px-4 py-2 text-sm font-semibold text-popular-foreground">
            <span className="h-2 w-2 rounded-full bg-popular-foreground" />
            {s.hero.scarcity}
          </div>

          <div className="mt-8">
            <a href="#interes" className={`${CTA_CLASS} min-h-12 px-9 text-base`}>
              {s.hero.cta}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {s.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white ring-1 ring-white/20"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Sección formulario (lista de interés) ═══ */}
      <section
        id="interes"
        className="scroll-mt-20 bg-muted/40 px-4 py-16 sm:px-6 lg:py-20"
      >
        <div className="mx-auto max-w-xl">
          {status === "success" ? (
            <div
              role="status"
              className="rounded-2xl border border-border bg-card p-8 text-center"
            >
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--ring))]" />
              <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">
                {s.form.successTitle}
              </h2>
              <p className="text-muted-foreground">{s.form.successText}</p>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                  {s.form.title}
                </h2>
                <p className="mt-2 text-muted-foreground">{s.form.subtitle}</p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8"
                noValidate
              >
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
                    className={`${inputClass} ${fieldErrors.name ? "border-destructive focus:border-destructive focus:ring-destructive" : ""}`}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: false }));
                    }}
                    placeholder={s.form.namePlaceholder}
                    autoComplete="name"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? "ss-name-error" : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="ss-name-error" className="mt-1 text-sm text-destructive">
                      {t.validation.addName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="ss-phone" className="sr-only">
                    {s.form.phone}
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label={s.form.phone}
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
                      id="ss-phone"
                      className={`${inputClass} ${fieldErrors.phone ? "border-destructive focus:border-destructive focus:ring-destructive" : ""}`}
                      type="tel"
                      inputMode="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((f) => ({ ...f, phone: false }));
                      }}
                      placeholder={s.form.phone}
                      autoComplete="tel-national"
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={fieldErrors.phone ? "ss-phone-error" : undefined}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p id="ss-phone-error" className="mt-1 text-sm text-destructive">
                      {t.validation.addPhone}
                    </p>
                  )}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ss-people"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      {s.form.people}
                    </label>
                    <select
                      id="ss-people"
                      className={inputClass}
                      value={people}
                      onChange={(e) => setPeople(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="ss-when"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      {s.form.when}
                    </label>
                    <select
                      id="ss-when"
                      className={inputClass}
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                    >
                      {s.form.whenOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ss-pilot"
                    className="mb-1 block text-sm font-medium text-muted-foreground"
                  >
                    {s.form.pilot}
                  </label>
                  <select
                    id="ss-pilot"
                    className={inputClass}
                    value={pilot}
                    onChange={(e) => setPilot(e.target.value as typeof pilot)}
                  >
                    <option value="yes">{s.form.pilotYes}</option>
                    <option value="maybe">{s.form.pilotMaybe}</option>
                    <option value="no">{s.form.pilotNo}</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.form.pilotHint}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="ss-message"
                    className="mb-1 block text-sm font-medium text-muted-foreground"
                  >
                    {s.form.message}
                  </label>
                  <textarea
                    id="ss-message"
                    className={`${inputClass} min-h-[88px]`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={s.form.messagePlaceholder}
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-sm text-destructive">
                    {s.form.errorText}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`${CTA_CLASS} min-h-12 w-full px-8 text-base`}
                >
                  {status === "submitting" ? s.form.submitting : s.form.submit}
                  {status !== "submitting" && <ArrowRight className="h-5 w-5" />}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  {s.form.reassurance}
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ═══ FAQ (contenido citable para buscadores de IA) ═══ */}
      <section className="px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s.faqTitle}
          </h2>
          <dl className="mt-8 divide-y divide-border">
            {s.faq.map((f) => (
              <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                <dt className="font-heading font-semibold text-foreground">
                  {f.q}
                </dt>
                <dd className="mt-1.5 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══ Barra CTA fija (solo móvil) ═══ */}
      {status !== "success" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">
                {s.hero.priceHook}
              </p>
              <p className="text-xs text-muted-foreground">{s.hero.priceNote}</p>
            </div>
            <a
              href="#interes"
              className={`${CTA_CLASS} min-h-11 flex-shrink-0 px-6 text-sm`}
            >
              {s.hero.cta}
            </a>
          </div>
        </div>
      )}

      {/* Margen para que la barra fija no tape el contenido en móvil */}
      <div className="h-20 lg:hidden" />

      <Footer />
    </div>
  );
}
