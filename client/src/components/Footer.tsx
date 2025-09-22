import { Anchor, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleWhatsApp = () => {
    window.open("https://wa.me/34611500372?text=Hola%2C%20me%20gustar%C3%ADa%20informaci%C3%B3n%20sobre%20el%20alquiler%20de%20barcos", "_blank");
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Anchor className="w-6 h-6 text-primary" />
              <span className="font-heading font-bold text-xl text-white">
                Costa Brava Rent a Boat Blanes
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Alquiler de embarcaciones en Blanes. Sin licencia requerida para la mayoría de nuestros barcos. 
              Experiencias únicas en la Costa Brava desde 2020.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Temporada operativa: Abril - Octubre</span>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary" />
                <div>
                  <div className="flex items-center space-x-2">
                    <a 
                      href="tel:+34611500372"
                      className="text-sm hover:text-primary transition-colors cursor-pointer"
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
                  <p className="text-xs text-gray-400">Llamadas y WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <div>
                  <a 
                    href="mailto:costabravarentboat@gmail.com"
                    className="text-sm hover:text-primary transition-colors cursor-pointer"
                    data-testid="email-link"
                  >
                    costabravarentboat@gmail.com
                  </a>
                  <p className="text-xs text-gray-400">Respuesta en 24h</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm">Puerto de Blanes</p>
                  <p className="text-xs text-gray-400">Girona, Costa Brava</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Barcos sin licencia</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Barcos con licencia</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Extras: Snorkel</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Extras: Paddle Surf</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Extras: Seascooter</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Alquiler por horas</a></li>
            </ul>
          </div>

          {/* Hours & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Horarios</h3>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>9:00 - 19:00 (Temporada alta)</span>
              </div>
              <p className="text-xs text-gray-400">
                Horarios flexibles según disponibilidad
              </p>
            </div>

            <h4 className="font-medium text-white mb-2">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Cancelación</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400">
            © {currentYear} Costa Brava Rent a Boat Blanes. Todos los derechos reservados.
          </p>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button 
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-whatsapp-button"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            
            <a 
              href="tel:+34611500372"
              className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
              data-testid="footer-call-button"
            >
              <Phone className="w-4 h-4" />
              <span>Llamar</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}