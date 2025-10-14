import { useTranslations } from "@/lib/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Camera, Star, ExternalLink, Waves } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";

export default function ContactSection() {
  const t = useTranslations();

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white" id="contact">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 lg:mb-4 text-[#143352]">
            {t.contact.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto px-2">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Contact Information - Full Width Layout */}
        <div className="mb-12">
          <Card>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{t.contact.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Contact Items Grid - 2 Columns on Mobile, 4 Columns on Desktop/Tablet */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {/* Phone & WhatsApp */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">{t.contact.phone} & {t.contact.whatsapp}</h3>
                  <a 
                    href="tel:+34683172154" 
                    className="text-gray-600 hover:text-primary transition-colors cursor-pointer block mb-1 text-sm"
                    data-testid="phone-link"
                    aria-label="Llamar al teléfono +34 683 172 154"
                  >
                    +34 683 172 154
                  </a>
                </div>

                {/* Email */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Email</h3>
                  <a 
                    href="mailto:costabravarentboat@gmail.com" 
                    className="text-gray-600 hover:text-primary transition-colors cursor-pointer block mb-1 text-sm"
                    data-testid="email-link"
                    aria-label="Enviar email a costabravarentboat@gmail.com"
                  >
                    costabravarentboat@gmail.com
                  </a>
                  <p className="text-xs text-gray-600">Respuesta en 24h</p>
                </div>

                {/* Location */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Ubicación</h3>
                  <a 
                    href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
                    data-testid="location-link"
                    aria-label="Ver ubicación en Google Maps: Puerto de Blanes"
                  >
                    <span className="block mb-1 text-sm">Puerto de Blanes</span>
                    <span className="block text-xs text-gray-600 hover:text-primary/80">Costa Brava, España</span>
                  </a>
                </div>

                {/* Season */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Temporada</h3>
                  <p className="text-gray-600 mb-1 text-sm">Abril - Octubre</p>
                  <p className="text-xs text-gray-600">Horarios flexibles</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button 
                  onClick={() => window.open("https://wa.me/34611500372", "_blank")}
                  className="w-full bg-green-700 hover:bg-green-800 text-white px-6 py-3 h-12 text-base"
                  data-testid="button-whatsapp-quick"
                  aria-label="Consultar disponibilidad por WhatsApp"
                >
                  <SiWhatsapp className="w-5 h-5 mr-2" />
                  Consulta por WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Boxes */}
        <div className="mt-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Descubre Más Opciones
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explora nuestros destinos y tipos de embarcación
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Alquiler Barcos Blanes */}
            <Link href="/alquiler-barcos-blanes" asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Alquiler Barcos Blanes</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-1 flex flex-col">
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      <Clock className="w-3 h-3 mr-1" />
                      Base principal
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3 text-[13px]">
                    Puerto base de operaciones con todas las comodidades. Punto de partida perfecto para explorar toda la Costa Brava.
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Puerto seguro</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Parking gratuito</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Restaurantes</span>
                  </div>
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-white transition-colors"
                      data-testid="link-blanes"
                    >
                      Ver Detalles
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Excursión a Lloret de Mar */}
            <Link href="/alquiler-barcos-lloret-de-mar" asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Excursión a Lloret de Mar</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-1 flex flex-col">
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      <Clock className="w-3 h-3 mr-1" />
                      25 min desde Blanes
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                    Playas vibrantes y calas escondidas. Desde Blanes llegas en 25 minutos navegando por la costa.
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Playas famosas</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Calas vírgenes</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Vida nocturna</span>
                  </div>
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-white transition-colors"
                      data-testid="link-lloret"
                    >
                      Ver Detalles
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Visita Tossa de Mar */}
            <Link href="/visita-tossa-de-mar" asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Visita Tossa de Mar</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-1 flex flex-col">
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      <Clock className="w-3 h-3 mr-1" />
                      45 min desde Blanes
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                    Pueblo medieval con castillo y aguas cristalinas. Un paraíso mediterráneo que no puedes perderte.
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Castillo medieval</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Aguas cristalinas</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Pueblo pintoresco</span>
                  </div>
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-white transition-colors"
                      data-testid="link-tossa"
                    >
                      Ver Detalles
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Barcos Con Licencia */}
            <Link href="/barcos-con-licencia" asChild>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg text-center">Barcos Con Licencia</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-1 flex flex-col">
                  <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                    Embarcaciones potentes para navegación avanzada con titulación.
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">40-115 CV</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Mayor velocidad</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Sin límite distancia</span>
                  </div>
                  <div className="mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-white transition-colors"
                      data-testid="link-licensed"
                    >
                      Ver Barcos
                      <Waves className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <div className="relative min-h-[400px] sm:min-h-[450px]">
              {/* Google Maps iframe de fondo */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1ses!2ses!4v1759782051685!5m2!1ses!2ses" 
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Costa Brava Rent a Boat en Puerto de Blanes"
              />
              
              {/* Overlay oscuro para mejor legibilidad */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
              
              {/* Contenido */}
              <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[450px] pointer-events-none">
                <div className="pointer-events-auto">
                  <MapPin className="w-12 h-12 text-white mx-auto mb-4 drop-shadow-lg" />
                  <h3 className="font-heading text-xl font-semibold text-white mb-2 drop-shadow-lg text-center">
                    Nos encontramos en el Puerto de Blanes
                  </h3>
                  <p className="text-white/90 mb-4 drop-shadow-lg text-center">
                    Fácil acceso y parking disponible cerca del puerto deportivo.
                  </p>
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open("https://maps.app.goo.gl/VrSkZNG7289VVdJD9", "_blank")}
                      className="bg-white/90 backdrop-blur hover:bg-white"
                      data-testid="button-view-map"
                      aria-label="Ver ubicación completa en Google Maps"
                    >
                      Ver en Google Maps
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
