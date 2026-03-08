import { useState } from "react";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import logoHorizontal from "@/assets/real-photos/logo-horizontal.png";
import { SiWhatsapp, SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const { language } = useLanguage();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterState('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim(), language, source: 'footer' }),
      });
      if (res.ok || res.status === 409) {
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
    <footer className="bg-[#1A2B4A] text-white/70">
      <div className="container mx-auto px-4 py-16 sm:py-20 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">

          {/* Column 1: Company */}
          <div>
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); handleLogoClick(); }}
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
              data-testid="footer-logo-button"
              aria-label="Ir a la pagina principal"
            >
              <img src={logoHorizontal} alt="Costa Brava Rent a Boat" className="h-8 brightness-0 invert" />
            </a>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">
              {t.footer.description}
            </p>
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
                className="text-white/50 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-instagram"
                aria-label="Siguenos en Instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/costabravarentaboat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-facebook"
                aria-label="Siguenos en Facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@costabravarentaboat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                data-testid="social-tiktok"
                aria-label="Siguenos en TikTok"
              >
                <SiTiktok className="w-5 h-5" />
              </a>
            </div>

            {/* Newsletter */}
            <div className="mt-8">
              <h3 className="font-medium text-white mb-2 text-sm">{t.locationPages.newsletter.title}</h3>
              <p className="text-sm text-white/50 mb-3">{t.locationPages.newsletter.subtitle}</p>
              {newsletterState === 'success' ? (
                <p className="text-xs text-green-400">{t.locationPages.newsletter.success}</p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
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
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-3 text-base md:text-sm text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none focus:border-white/40 flex-1 min-w-0"
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
          <div>
            <h3 className="font-medium text-white mb-4 text-sm">{t.footer.information}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#fleet" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.fleet}</a>
              </li>
              <li>
                <a href="/rutas" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Destinos</a>
              </li>
              <li>
                <a href="/blog" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-blog-link">{t.footer.blog}</a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-faq-link">{t.footer.faqLabel}</a>
              </li>
              <li>
                <a href="/tarjetas-regalo" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.giftCards}</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.nav.contact}</a>
              </li>
              <li>
                <a href="/testimonios" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-testimonials-link">{t.footer.customerReviews}</a>
              </li>
              <li>
                <a href="/galeria" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">Galeria</a>
              </li>
            </ul>

            <h3 className="font-medium text-white mb-4 text-sm mt-8">{t.footer.services}</h3>
            <ul className="space-y-1 text-sm">
              <li><a href="/barcos-sin-licencia" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.boats.withoutLicense}</a></li>
              <li><a href="/barcos-con-licencia" className="hover:text-white transition-colors py-1.5 block rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none">{t.boats.withLicense}</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-medium text-white mb-4 text-sm">{t.footer.contact}</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="tel:+34611500372"
                    className="text-sm hover:text-white transition-colors block"
                    data-testid="phone-call-link"
                    aria-label="Llamar al telefono +34 611 500 372"
                  >+34 611 500 372</a>
                  <p className="text-xs text-white/50 mt-0.5">{t.footer.callsAndWhatsapp}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="mailto:costabravarentaboat@gmail.com"
                    className="text-sm hover:text-white transition-colors block break-all"
                    data-testid="email-link"
                    aria-label="Enviar email a costabravarentaboat@gmail.com"
                  >
                    costabravarentaboat@gmail.com
                  </a>
                  <p className="text-xs text-white/50 mt-0.5">{t.footer.responseTime}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <a
                    href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-white transition-colors block"
                    data-testid="maps-link"
                    aria-label="Ver ubicacion en Google Maps: Puerto de Blanes"
                  >
                    {t.footer.location}
                  </a>
                  <p className="text-xs text-white/50 mt-0.5">{t.footer.region}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">{t.footer.businessHours}</p>
                  <p className="text-xs text-white/50 mt-0.5">{t.footer.flexibleHours}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col items-center gap-3">
            <div className="text-white/60 text-sm flex flex-wrap gap-2 sm:gap-4 justify-center">
              <a href="/terms-conditions" className="hover:text-white/60 transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-terms-link">{t.footer.terms}</a>
              <a href="/privacy-policy" className="hover:text-white/60 transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-privacy-link">{t.footer.privacy}</a>
              <a href="/cookies-policy" className="hover:text-white/60 transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-cookies-link">{t.footer.cookiesPolicy}</a>
              <a href="/accesibilidad" className="hover:text-white/60 transition-colors rounded focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none" data-testid="footer-accessibility-link">Accesibilidad</a>
            </div>
            <p className="text-white/40 text-xs text-center">
              {currentYear} Costa Brava Rent a Boat Blanes. {t.footer.rights}
            </p>
            <p className="text-white/30 text-xs text-center">
              NIF: B22566327
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
