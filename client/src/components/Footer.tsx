import { Anchor, Phone, Mail, MapPin, Clock } from "lucide-react";
import { SiWhatsapp, SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { useTranslations } from "@/lib/translations";
import { useLocation } from "wouter";

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const [, setLocation] = useLocation();

  // Detectar si estamos en temporada operativa (Abril - Octubre)
  const isOperatingSeason = () => {
    const currentMonth = new Date().getMonth(); // 0-11 (Enero = 0)
    return currentMonth >= 3 && currentMonth <= 9; // Abril (3) - Octubre (9)
  };

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
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Company Info */}
          <div>
            <button 
              onClick={handleLogoClick}
              className="flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
              data-testid="footer-logo-button"
              aria-label="Ir a la página principal"
            >
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <span className="font-heading font-bold text-white text-sm sm:text-base">
                Costa Brava Rent a Boat
              </span>
            </button>
            <p className="text-xs text-gray-400 mb-4">
              {t.footer.description}
            </p>
            <div className="flex items-center space-x-2 text-xs mb-6">
              <div className={`w-2 h-2 rounded-full ${isOperatingSeason() ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{t.footer.operatingSeason}</span>
            </div>
            
            {/* Social Media */}
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Síguenos</h3>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.instagram.com/costabravarentaboat/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                  data-testid="social-instagram"
                  aria-label="Síguenos en Instagram"
                >
                  <SiInstagram className="w-7 h-7" />
                </a>
                <a
                  href="https://www.facebook.com/costabravarentaboat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  data-testid="social-facebook"
                  aria-label="Síguenos en Facebook"
                >
                  <SiFacebook className="w-7 h-7" />
                </a>
                <a
                  href="https://www.tiktok.com/@costabravarentaboat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  data-testid="social-tiktok"
                  aria-label="Síguenos en TikTok"
                >
                  <SiTiktok className="w-7 h-7" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">{t.footer.contact}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <a 
                    href="tel:+34611500372"
                    className="text-xs hover:text-primary transition-colors block mb-1"
                    data-testid="phone-call-link"
                    aria-label="Llamar al teléfono +34 611 500 372"
                  >+34 611 500 372</a>
                  <p className="text-xs text-gray-400">{t.footer.callsAndWhatsapp}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <a 
                    href="mailto:costabravarentboat@gmail.com"
                    className="text-xs hover:text-primary transition-colors block mb-1 break-all"
                    data-testid="email-link"
                    aria-label="Enviar email a costabravarentboat@gmail.com"
                  >
                    costabravarentboat@gmail.com
                  </a>
                  <p className="text-xs text-gray-400">{t.footer.responseTime}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <a 
                    href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs hover:text-primary transition-colors block mb-1"
                    data-testid="maps-link"
                    aria-label="Ver ubicación en Google Maps: Puerto de Blanes"
                  >
                    {t.footer.location}
                  </a>
                  <p className="text-xs text-gray-400">{t.footer.region}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">{t.footer.hours}</h3>
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{t.footer.businessHours}</span>
              </div>
              <p className="text-xs text-gray-400">
                {t.footer.flexibleHours}
              </p>
            </div>

            <h4 className="font-semibold text-white mb-3 text-sm">Información</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => {
                    setLocation("/blog");
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth"
                    });
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-blog-link"
                  aria-label="Ver artículos del blog"
                >
                  Blog
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/faq");
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth"
                    });
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-faq-link"
                  aria-label="Ver preguntas frecuentes"
                >
                  Preguntas Frecuentes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/testimonios");
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth"
                    });
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-testimonials-link"
                  aria-label="Ver opiniones de clientes"
                >
                  Opiniones de Clientes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/terms-conditions");
                    setTimeout(() => {
                      window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                      });
                    }, 100);
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-terms-link"
                  aria-label="Ver términos y condiciones del servicio"
                >
                  {t.footer.terms}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/terms-conditions");
                    setTimeout(() => {
                      const element = document.getElementById("cancelaciones-cambios");
                      if (element) {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        });
                      }
                    }, 100);
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-cancellation-link"
                  aria-label="Ver política de cancelaciones y cambios"
                >
                  {t.footer.cancelationPolicy}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/privacy-policy");
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth"
                    });
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-privacy-link"
                  aria-label="Ver política de privacidad"
                >
                  {t.footer.privacy}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setLocation("/cookies-policy");
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth"
                    });
                  }} 
                  className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                  data-testid="footer-cookies-link"
                  aria-label="Ver política de cookies"
                >
                  Política de Cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">{t.footer.services}</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.boats.withoutLicense}</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.boats.withLicense}</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.footer.extrasSnorkel}</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.footer.extrasPaddle}</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.footer.extrasSeascooter}</a></li>
              <li><a href="#fleet" className="hover:text-primary transition-colors">{t.footer.hourlyRental}</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">{t.footer.portParking}</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={handleWhatsApp}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-whatsapp-button"
              aria-label="Abrir chat de WhatsApp para consultas"
            >
              <SiWhatsapp className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            
            <a 
              href="tel:+34611500372"
              className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-call-button"
              aria-label="Llamar al teléfono de Costa Brava Rent a Boat"
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