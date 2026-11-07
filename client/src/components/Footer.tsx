import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { eraCopy, isLicenseFreeEraActive } from "@shared/constants";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Lock } from "lucide-react";
import LogoCostaBravaFooter from "@/components/icons/LogoCostaBravaFooter";
import { SiWhatsapp, SiInstagram, SiFacebook, SiTiktok } from "@/components/icons/BrandIcons";
import { useTranslations } from "@/lib/translations";
import { NewsletterLegalNote } from "@/components/NewsletterLegalNote";
import CoastrentOfficeNote from "@/components/CoastrentOfficeNote";
import { useLanguage } from "@/hooks/use-language";
import { BUSINESS_ADDRESS_FORMATTED } from "@shared/businessProfile";
import CentresNLCatalunyaLogo from "@/components/icons/CentresNLCatalunyaLogo";
import ClusterNauticLogo from "@/components/icons/ClusterNauticLogo";
import DonQualitaLogo from "@/components/icons/DonQualitaLogo";
import { trackPhoneClick, trackNewsletterSignup } from "@/utils/analytics";
import { isValidEmail } from "@/utils/booking-validation";
import { openWhatsApp } from "@/utils/whatsapp";

const ring = "focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none";
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  testId?: string;
}

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const { language, localizedPath } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [website, setWebsite] = useState("");
  const [newsletterEmailError, setNewsletterEmailError] = useState(false);
  const reduce = useReducedMotion();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Own validation (form is noValidate): empty or malformed email -> inline i18n error.
    if (!newsletterEmail.trim() || !isValidEmail(newsletterEmail.trim())) {
      setNewsletterEmailError(true);
      return;
    }
    setNewsletterEmailError(false);
    setNewsletterState("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website,
          email: newsletterEmail.trim(),
          language,
          source: "footer",
        }),
      });
      if (res.ok || res.status === 409) {
        trackNewsletterSignup("footer");
        setNewsletterState("success");
      } else {
        setNewsletterState("error");
      }
    } catch {
      setNewsletterState("error");
    }
  };

  const isOperatingSeason = () => {
    const currentMonth = new Date().getMonth();
    return currentMonth >= 3 && currentMonth <= 9;
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const infoLinks: FooterLink[] = [
    { label: t.nav.fleet, href: "#fleet" },
    { label: t.footer.destinations, to: "routes" },
    { label: t.footer.blog, to: "blog", testId: "footer-blog-link" },
    { label: t.sharedSailing.navLabel, to: "sharedSailing", testId: "footer-shared-sailing-link" },
    { label: t.footer.pricing, to: "pricing" },
    { label: t.footer.faqLabel, to: "faq", testId: "footer-faq-link" },
    {
      label: t.garantiasPage?.navLabel || "Garantías",
      to: "garantias",
      testId: "footer-garantias-link",
    },
    { label: t.nav.giftCards, to: "giftCards" },
    { label: t.nav.contact, href: "#contact" },
    { label: t.footer.customerReviews, to: "testimonials", testId: "footer-testimonials-link" },
    { label: t.footer.gallery, to: "gallery" },
  ];

  const locationLinks: FooterLink[] = [
    { label: t.footer.locations.blanes, to: "locationBlanes" },
    { label: t.footer.locations.lloret, to: "locationLloret" },
    { label: t.footer.locations.tossa, to: "locationTossa" },
    { label: t.footer.locations.malgrat, to: "locationMalgrat" },
    { label: t.footer.locations.santaSusanna, to: "locationSantaSusanna" },
    { label: t.footer.locations.calella, to: "locationCalella" },
    { label: t.footer.locations.pinedaDeMar, to: "locationPinedaDeMar" },
    { label: t.footer.locations.palafolls, to: "locationPalafolls" },
    { label: t.footer.locations.tordera, to: "locationTordera" },
    { label: t.footer.locations.barcelona, to: "locationBarcelona" },
    { label: t.footer.locations.costaBrava, to: "locationCostaBrava" },
  ];

  const serviceLinks: FooterLink[] = [
    // "Sin necesidad de licencia" stops being true on 2026-10-01 (RD 1188/2025).
    ...(isLicenseFreeEraActive()
      ? [{ label: t.boats.withoutLicense, to: "categoryLicenseFree" }]
      : []),
    { label: t.boats.withLicense, to: "categoryLicensed" },
    ...(t.captainedPage?.crossLinkLabel
      ? [{ label: t.captainedPage.crossLinkLabel, to: "categoryCaptained" }]
      : []),
    ...(t.navigationLicensePage?.navLabel
      ? [{ label: t.navigationLicensePage.navLabel, to: "navigationLicense" }]
      : []),
    { label: t.footer.boatsNearBarcelona, to: "locationBarcelona" },
    { label: t.jetskiHub?.hero?.title ?? t.nav.jetski, to: "jetskiHub" },
    { label: t.jetskiLanding?.efoil?.navLabel ?? "eFoil", to: "efoilBlanes" },
    { label: t.scootersPage?.hero?.title ?? t.nav.scooters, to: "scooters" },
    {
      label: t.activitiesPage?.navLabel ?? t.nav.activities,
      to: "activities",
      testId: "footer-activitatum-link",
    },
    { label: t.shopPage?.navLabel ?? t.nav.tienda, to: "tienda" },
  ];

  const columns = [
    { title: t.footer.information, links: infoLinks },
    { title: t.footer.locationsHeading, links: locationLinks },
    { title: t.footer.services, links: serviceLinks },
  ];

  const legalLinks: FooterLink[] = [
    { label: t.footer.terms, to: "termsConditions", testId: "footer-terms-link" },
    { label: t.footer.privacy, to: "privacyPolicy", testId: "footer-privacy-link" },
    { label: t.footer.cookiesPolicy, to: "cookiesPolicy", testId: "footer-cookies-link" },
    { label: t.footer.accessibility, to: "accessibility", testId: "footer-accessibility-link" },
    {
      label: t.footer.rentalConditions,
      to: "condicionesGenerales",
      testId: "footer-rental-conditions-link",
    },
    { label: t.footer.legalNotice, to: "legalNotice", testId: "footer-legal-notice-link" },
  ];

  const socials = [
    {
      href: "https://www.instagram.com/costabravarentaboat/",
      label: "Instagram",
      testId: "social-instagram",
      Icon: SiInstagram,
    },
    {
      href: "https://www.facebook.com/costabravarentaboat",
      label: "Facebook",
      testId: "social-facebook",
      Icon: SiFacebook,
    },
    {
      href: "https://www.tiktok.com/@costabravarentaboat",
      label: "TikTok",
      testId: "social-tiktok",
      Icon: SiTiktok,
    },
  ];

  const linkHref = (l: FooterLink) => (l.to ? localizedPath(l.to) : (l.href ?? "#"));
  const legalClass = `hover:text-primary-foreground transition-colors min-h-11 inline-flex items-center rounded ${ring}`;

  return (
    <footer className="below-fold rounded-b-2xl bg-foreground text-primary-foreground/80">
      <motion.div
        variants={container}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="container mx-auto px-4 py-16 sm:py-20 lg:px-8 max-w-7xl"
      >
        {/* Brand + newsletter */}
        <motion.div
          variants={rise}
          className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <a
              href={localizedPath("home")}
              onClick={e => {
                e.preventDefault();
                handleLogoClick();
              }}
              className={`mb-5 flex items-center pointer-coarse:py-1 hover:opacity-80 transition-opacity rounded w-fit ${ring} focus-visible:ring-offset-2`}
              data-testid="footer-logo-button"
              aria-label={t.a11y.goToHomePage}
            >
              <LogoCostaBravaFooter className="h-12" />
            </a>
            <p className="max-w-md text-base text-primary-foreground/70 mb-5 leading-relaxed text-pretty">
              {eraCopy(t.footer.description, t.footer.descriptionPostEra ?? t.footer.description)}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div
                className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/90 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-3 py-1"
                data-testid="footer-independent-operator-badge"
              >
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                <span>{t.footer.independentOperator}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${isOperatingSeason() ? "bg-green-400" : "bg-red-400"}`}
                  aria-hidden="true"
                ></div>
                <span>{t.footer.operatingSeason}</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:justify-self-end lg:max-w-md w-full">
            <h3 className="font-heading text-xl font-semibold text-primary-foreground mb-2 text-balance">
              {t.locationPages.newsletter.title}
            </h3>
            <p className="text-sm text-primary-foreground/70 mb-4">
              {t.locationPages.newsletter.subtitle}
            </p>
            {newsletterState === "success" ? (
              <p className="text-sm text-green-400">{t.locationPages.newsletter.success}</p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2" noValidate>
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    opacity: 0,
                    height: 0,
                    width: 0,
                  }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  {t.locationPages.newsletter.placeholder}
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={e => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterEmailError) setNewsletterEmailError(false);
                  }}
                  placeholder={t.locationPages.newsletter.placeholder}
                  required
                  aria-invalid={newsletterEmailError}
                  aria-describedby={
                    newsletterEmailError ? "footer-newsletter-email-error" : undefined
                  }
                  className={`bg-white/10 border rounded-full px-5 py-3 min-h-12 text-base md:text-sm text-primary-foreground placeholder:text-primary-foreground/60 ${ring} focus:border-white/40 flex-1 min-w-0 ${newsletterEmailError ? "border-red-400" : "border-white/20"}`}
                />
                <button
                  type="submit"
                  disabled={newsletterState === "loading"}
                  className={`bg-background text-foreground hover:bg-background/90 rounded-full px-6 py-3 min-h-12 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50 ${ring}`}
                >
                  {newsletterState === "loading" ? "..." : t.locationPages.newsletter.button}
                </button>
              </form>
            )}
            {newsletterEmailError && (
              <p
                id="footer-newsletter-email-error"
                role="alert"
                className="text-xs text-red-400 mt-1"
              >
                {t.footer.newsletterEmailError}
              </p>
            )}
            {newsletterState === "error" && (
              <p className="text-xs text-red-400 mt-1">{t.locationPages.newsletter.error}</p>
            )}
            {newsletterState !== "success" && (
              <NewsletterLegalNote className="text-xs text-primary-foreground/60 mt-3" />
            )}
          </div>
        </motion.div>

        {/* Link columns + contact */}
        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4 lg:gap-x-12">
          {columns.map(col => (
            <motion.nav key={col.title} variants={rise} aria-label={col.title} className="min-w-0">
              <h3 className="mb-4 text-sm font-semibold text-primary-foreground/60">{col.title}</h3>
              <ul className="space-y-1">
                {col.links.map(l => (
                  <li key={`${l.to ?? l.href}-${l.label}`}>
                    <a
                      href={linkHref(l)}
                      data-testid={l.testId}
                      className={`inline-flex items-center py-1 rounded-sm text-[15px] font-medium leading-snug text-primary-foreground transition-colors hover:text-primary-foreground/60 ${ring}`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}

          <motion.div variants={rise} className="col-span-2 lg:col-span-1 min-w-0">
            <h3 className="mb-4 text-sm font-semibold text-primary-foreground/60">
              {t.footer.contact}
            </h3>
            <div className="space-y-5">
              <div>
                <a
                  href="tel:+34611500372"
                  className={`font-heading text-2xl font-semibold text-primary-foreground hover:text-primary-foreground/70 transition-colors inline-flex items-center gap-2 rounded-sm ${ring}`}
                  data-testid="phone-call-link"
                  aria-label={`${t.a11y.callPhone} +34 611 500 372`}
                  onClick={() => trackPhoneClick()}
                >
                  <Phone className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                  +34 611 500 372
                </a>
                <p className="text-xs text-primary-foreground/60 mt-1">
                  {t.footer.callsAndWhatsapp}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp(t.fleet.whatsappHelpPrefill)}
                className={`inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-semibold text-cta hover:brightness-95 transition ${ring}`}
              >
                <SiWhatsapp className="w-5 h-5" aria-hidden="true" />
                {t.contact.whatsapp}
              </button>

              <div className="flex items-start gap-3">
                <Mail
                  className="w-4 h-4 text-primary-foreground/50 flex-shrink-0 mt-1.5"
                  strokeWidth={2.5}
                />
                <a
                  href="mailto:info@costabravarentaboat.com"
                  className="text-sm hover:text-primary-foreground transition-colors py-0.5 break-all"
                  data-testid="email-link"
                  aria-label={`${t.a11y.sendEmail} info@costabravarentaboat.com`}
                >
                  info@costabravarentaboat.com
                </a>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 text-primary-foreground/50 flex-shrink-0 mt-1.5"
                  strokeWidth={2.5}
                />
                <div>
                  <a
                    href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-primary-foreground transition-colors py-0.5 inline-block"
                    data-testid="maps-link"
                    aria-label={`${t.a11y.viewOnMap}: Puerto de Blanes`}
                  >
                    {t.footer.location}
                  </a>
                  <p className="text-xs text-primary-foreground/60 mt-0.5">
                    {BUSINESS_ADDRESS_FORMATTED}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock
                  className="w-4 h-4 text-primary-foreground/50 flex-shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <p className="text-sm">{t.footer.businessHours}</p>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary-foreground/50 flex-shrink-0 mt-1" strokeWidth={2.5} />
                <CoastrentOfficeNote surface="contact" className="text-xs leading-relaxed text-primary-foreground/60" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Brand row: copyright + socials */}
        <motion.div
          variants={rise}
          className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-primary-foreground/60 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              &copy; {currentYear} Costa Brava Rent a Boat Blanes. {t.footer.rights}
            </span>
            <span>NIF: B22566327</span>
            <a
              href={localizedPath("login")}
              className="inline-flex items-center justify-center min-h-11 min-w-11 -m-2 hover:text-primary-foreground/60 transition-colors"
              aria-label={t.a11y.adminAccess ?? "Acceso administración"}
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
          <div className="flex items-center gap-1">
            {socials.map(({ href, label, testId, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground transition-colors ${ring}`}
                data-testid={testId}
                aria-label={label}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Legal + institutional */}
        <motion.div
          variants={rise}
          className="mt-4 flex flex-col items-center gap-4 text-center sm:items-start sm:text-left"
        >
          <div className="text-primary-foreground/70 text-sm flex flex-wrap items-center justify-center gap-x-5 gap-y-0 sm:justify-start">
            {legalLinks.map(l => (
              <a key={l.to} href={linkHref(l)} className={legalClass} data-testid={l.testId}>
                {l.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("cbrb:cookie-settings"))}
              className={legalClass}
              data-testid="footer-cookie-settings"
            >
              {t.footer.cookieSettings}
            </button>
          </div>
          <p
            className="text-primary-foreground/60 text-xs"
            data-testid="footer-brand-differentiator"
          >
            {t.footer.nameDifferentiator}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <CentresNLCatalunyaLogo className="h-10" />
            <ClusterNauticLogo className="h-10" />
            <DonQualitaLogo className="h-8" />
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
