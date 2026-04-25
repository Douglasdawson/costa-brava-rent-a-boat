import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Shield, ShieldCheck, FileCheck, Map, Lock } from "lucide-react";
import logoHorizontal from "@/assets/real-photos/logo-horizontal.png";
import LogoCostaBravaFooter from "@/components/icons/LogoCostaBravaFooter";
import { SiWhatsapp, SiInstagram, SiFacebook, SiTiktok } from "@/components/icons/BrandIcons";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import CentresNLCatalunyaLogo from "@/components/icons/CentresNLCatalunyaLogo";
import ClusterNauticLogo from "@/components/icons/ClusterNauticLogo";
import DonQualitaLogo from "@/components/icons/DonQualitaLogo";
import { trackPhoneClick, trackNewsletterSignup } from "@/utils/analytics";

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const { language, localizedPath } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [website, setWebsite] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website, email: newsletterEmail.trim(), language, source: 'footer' }),
      });
      if (res.ok || res.status === 409) {
        trackNewsletterSignup('footer');
        setNewsletterState('success');
      } else {
        setNewsletterState('error');
      }
    } catch {
      setNewsletterState('error');
    }
  };

  const isOperatingSeason = () => {
    const currentMonth = new Date().getMonth();
    return currentMonth >= 3 && currentMonth <= 9;
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="below-fold bg-foreground text-white/80">
      <div className="container mx-auto px-4 py-16 sm:py-20 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">

          {/* Column 1: Company */}
          <div>
            <a
              href={localizedPath("home")}
              onClick={(e) => { e.preventDefault(); handleLogoClick(); }}
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
              data-testid="footer-logo-button"
              aria-label={t.a11y.goToHomePage}
            >
              <LogoCostaBravaFooter className="h-10" />
            </a>
            <p className="text-sm text-white/60 mb-3 leading-relaxed">
              {t.footer.description}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-cta bg-cta/10 border border-cta/20 rounded-full px-3 py-1 mb-4" data-testid="footer-independent-operator-badge">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              <span>{t.footer.independentOperator}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm mb-6">
              <div className={`w-2 h-2 rounded-full ${isOperatingSeason() ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true"></div>
              <span>{t.footer.operatingSeason}</span>
            </div>

            {/* Social Media */}
            <div className="flex items-center space-x-4">
              <a
                href="https://www.instagram.com/costabravarentaboat/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-instagram"
                aria-label="Instagram"
              >
                <SiInstagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/costabravarentaboat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-facebook"
                aria-label="Facebook"
              >
                <SiFacebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.tiktok.com/@costabravarentaboat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-tiktok"
                aria-label="TikTok"
              >
                <SiTiktok className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <h3 className="font-medium text-white mb-2 text-sm flex items-center gap-1.5">
                <Map className="w-4 h-4 text-cta" />
                {t.locationPages.newsletter.title}
              </h3>
              <p className="text-sm text-white/60 mb-3">{t.locationPages.newsletter.subtitle}</p>
              {newsletterState === 'success' ? (
                <p className="text-xs text-green-400">{t.locationPages.newsletter.success}</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
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
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={t.locationPages.newsletter.placeholder}
                    required
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-3 text-base md:text-sm text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none focus:border-white/40 flex-1 min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={newsletterState === 'loading'}
                    className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-3 text-sm font-medium btn-elevated disabled:opacity-50 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
                  >
                    {newsletterState === 'loading' ? '...' : t.locationPages.newsletter.button}
                  </button>
                </form>
              )}
              {newsletterState === 'error' && (
                <p className="text-xs text-red-400 mt-1">{t.locationPages.newsletter.error}</p>
              )}
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="lg:pl-[20%]">
            <h3 className="font-medium text-white mb-4 text-sm">{t.footer.information}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#fleet" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.fleet}</a>
              </li>
              <li>
                <a href={localizedPath("routes")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.footer.destinations}</a>
              </li>
              <li>
                <a href={localizedPath("blog")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-blog-link">{t.footer.blog}</a>
              </li>
              <li>
                <a href={localizedPath("pricing")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Precios</a>
              </li>
              <li>
                <a href={localizedPath("faq")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-faq-link">{t.footer.faqLabel}</a>
              </li>
              <li>
                <a href={localizedPath("giftCards")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.giftCards}</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.contact}</a>
              </li>
              <li>
                <a href={localizedPath("testimonials")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-testimonials-link">{t.footer.customerReviews}</a>
              </li>
              <li>
                <a href={localizedPath("gallery")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.footer.gallery}</a>
              </li>
            </ul>

            <h3 className="font-medium text-white mb-4 text-sm mt-8">Destinos</h3>
            <ul className="space-y-1 text-sm">
              <li><a href={localizedPath("locationBlanes")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Blanes</a></li>
              <li><a href={localizedPath("locationLloret")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Lloret de Mar</a></li>
              <li><a href={localizedPath("locationTossa")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Tossa de Mar</a></li>
              <li><a href={localizedPath("locationMalgrat")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Malgrat de Mar</a></li>
              <li><a href={localizedPath("locationSantaSusanna")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Santa Susanna</a></li>
              <li><a href={localizedPath("locationCalella")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Calella</a></li>
              <li><a href={localizedPath("locationPinedaDeMar")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Pineda de Mar</a></li>
              <li><a href={localizedPath("locationPalafolls")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Palafolls</a></li>
              <li><a href={localizedPath("locationTordera")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Tordera</a></li>
              <li><a href={localizedPath("locationBarcelona")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Barcelona</a></li>
              <li><a href={localizedPath("locationCostaBrava")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Costa Brava</a></li>
            </ul>

            <h3 className="font-medium text-white mb-4 text-sm mt-8">{t.footer.services}</h3>
            <ul className="space-y-1 text-sm">
              <li><a href={localizedPath("categoryLicenseFree")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.boats.withoutLicense}</a></li>
              <li><a href={localizedPath("categoryLicensed")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.boats.withLicense}</a></li>
              <li><a href={localizedPath("locationBarcelona")} className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Barcos cerca de Barcelona</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-medium text-white mb-4 text-sm">{t.footer.contact}</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="tel:+34611500372"
                    className="text-sm hover:text-white transition-colors block"
                    data-testid="phone-call-link"
                    aria-label={`${t.a11y.callPhone} +34 611 500 372`}
                    onClick={() => trackPhoneClick()}
                  >+34 611 500 372</a>
                  <p className="text-xs text-white/60 mt-0.5">{t.footer.callsAndWhatsapp}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="mailto:costabravarentaboat@gmail.com"
                    className="text-sm hover:text-white transition-colors block break-all"
                    data-testid="email-link"
                    aria-label={`${t.a11y.sendEmail} costabravarentaboat@gmail.com`}
                  >
                    costabravarentaboat@gmail.com
                  </a>
                  <p className="text-xs text-white/60 mt-0.5">{t.footer.responseTime}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition-colors block"
                    data-testid="maps-link"
                    aria-label={`${t.a11y.viewOnMap}: Puerto de Blanes`}
                  >
                    {t.footer.location}
                  </a>
                  <p className="text-xs text-white/60 mt-0.5">{t.footer.region}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">{t.footer.businessHours}</p>
                  <p className="text-xs text-white/60 mt-0.5">{t.footer.flexibleHours}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col items-center gap-3">
            <div className="text-white/70 text-sm flex flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-2 justify-center">
              <a href={localizedPath("termsConditions")} className="hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-terms-link">{t.footer.terms}</a>
              <span className="text-white/30" aria-hidden="true">|</span>
              <a href={localizedPath("privacyPolicy")} className="hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-privacy-link">{t.footer.privacy}</a>
              <span className="text-white/30" aria-hidden="true">|</span>
              <a href={localizedPath("cookiesPolicy")} className="hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-cookies-link">{t.footer.cookiesPolicy}</a>
              <span className="text-white/30" aria-hidden="true">|</span>
              <a href={localizedPath("accessibility")} className="hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-accessibility-link">{t.footer.accessibility}</a>
            </div>
            <p className="text-white/50 text-xs text-center text-balance">
              &copy; {currentYear} Costa Brava Rent a Boat Blanes. {t.footer.rights}
            </p>
            <p className="text-white/60 text-xs text-center text-balance max-w-md px-2 mt-1" data-testid="footer-brand-differentiator">
              {t.footer.nameDifferentiator}
            </p>
            <div className="flex items-center justify-center gap-3 text-white/50 text-xs">
              <span>NIF: B22566327</span>
              <a href={localizedPath("login")} className="inline-flex items-center gap-1 hover:text-white/60 transition-colors" aria-label="Acceso administración">
                <Lock className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
            {/* Institutional logos */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <CentresNLCatalunyaLogo className="h-10" />
              <ClusterNauticLogo className="h-10" />
              <DonQualitaLogo className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
