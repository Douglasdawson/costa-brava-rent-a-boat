import { Anchor, Phone, Mail, MapPin, Clock } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLocation } from "wouter";

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const [, setLocation] = useLocation();

  const handleWhatsApp = () => {
    const message = encodeURIComponent(t.footer.whatsappMessage);
    window.open(`https://wa.me/34611500372?text=${message}`, "_blank");
  };

  const handleLogoClick = () => {
    setLocation("/");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
              data-testid="footer-logo-button"
            >
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="font-heading font-bold text-base sm:text-lg text-white">
                <span className="hidden sm:inline">Costa Brava Rent a Boat Blanes</span>
                <span className="sm:hidden">Costa Brava Rent a Boat - Blanes</span>
              </span>
            </button>
            <p className="text-xs sm:text-xs text-gray-400 mb-4">
              {t.footer.description}
            </p>
            <div className="flex items-center space-x-2 text-xs sm:text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{t.footer.operatingSeason}</span>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.footer.contact}</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary" />
                <div>
                  <div className="flex items-center space-x-2">
                    <a 
                      href="tel:+34611500372"
                      className="text-xs hover:text-primary transition-colors cursor-pointer"
                      data-testid="phone-call-link"
                    >
                      +34 611 500 372
                    </a>
                    <span className="text-xs text-gray-500">|</span>
                    <button
                      onClick={handleWhatsApp}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                      data-testid="phone-whatsapp-link"
                    >
                      WhatsApp
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">{t.footer.callsAndWhatsapp}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <div>
                  <a 
                    href="mailto:costabravarentboat@gmail.com"
                    className="text-xs hover:text-primary transition-colors cursor-pointer"
                    data-testid="email-link"
                  >
                    costabravarentboat@gmail.com
                  </a>
                  <p className="text-xs text-gray-400">{t.footer.responseTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <a 
                    href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:text-primary transition-colors cursor-pointer"
                    data-testid="maps-link"
                  >
                    {t.footer.location}
                  </a>
                  <p className="text-xs text-gray-400">{t.footer.region}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.footer.services}</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-primary transition-colors">{t.boats.withoutLicense}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.boats.withLicense}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.extrasSnorkel}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.extrasPaddle}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.extrasSeascooter}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.hourlyRental}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.portParking}</a></li>
            </ul>
          </div>

          {/* Hours & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t.footer.hours}</h3>
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{t.footer.businessHours}</span>
              </div>
              <p className="text-xs text-gray-400">
                {t.footer.flexibleHours}
              </p>
            </div>

            <h4 className="font-medium text-white mb-2">{t.footer.legal}</h4>
            <ul className="space-y-1 text-xs">
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.terms}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.privacy}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t.footer.cancelationPolicy}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-whatsapp-button"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            
            <a 
              href="tel:+34611500372"
              className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-call-button"
            >
              <Phone className="w-4 h-4" />
              <span>{t.footer.call}</span>
            </a>
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            © {currentYear} Costa Brava Rent a Boat Blanes. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}