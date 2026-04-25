import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Camera, Star, ExternalLink, Waves } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Link } from "wouter";
import { trackPhoneClick, trackWhatsAppClick } from "@/utils/analytics";

export default function ContactSection() {
  const t = useTranslations();
  const { ref: revealRef, isVisible } = useScrollReveal();

  return (
    <section ref={revealRef} className={`py-12 sm:py-16 lg:py-20 bg-background transition-[opacity,transform,filter] duration-500 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"}`} id="contact">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-3 lg:mb-4 text-foreground tracking-tight">
            {t.contact.title}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl sm:max-w-2xl mx-auto px-2">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Contact Information - Full Width Layout */}
        <div className="mb-12">
          <Card>
            <CardContent className="pt-6">
              {/* Contact Items Grid - 2 Columns on Mobile, 4 Columns on Desktop/Tablet */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                {/* Phone & WhatsApp */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2 text-sm">{t.contact.phone} & {t.contact.whatsapp}</h3>
                  <a
                    href="tel:+34611500372"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer block mb-1 text-sm"
                    data-testid="phone-link"
                    aria-label={`${t.a11y.callPhone} +34 611 500 372`}
                    onClick={() => trackPhoneClick()}
                  >
                    +34 611 500 372
                  </a>
                </div>

                {/* Email */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2 text-sm">{t.contact.emailLabel}</h3>
                  <a
                    href="mailto:costabravarentaboat@gmail.com"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer block mb-1 text-xs sm:text-sm break-all"
                    data-testid="email-link"
                    aria-label={`${t.a11y.sendEmail} costabravarentaboat@gmail.com`}
                  >
                    costabravarentaboat@gmail.com
                  </a>
                  <p className="text-xs text-muted-foreground">{t.contact.emailResponse}</p>
                </div>

                {/* Location */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2 text-sm">{t.contact.locationLabel}</h3>
                  <a
                    href="https://www.google.com/maps/place/Costa+Brava+Rent+a+Boat+-+Blanes+%7C+Alquiler+de+Barcos+Con+y+Sin+Licencia/@41.6722544,2.7952876,17z/data=!3m1!4b1!4m6!3m5!1s0x12bb172c94a8856f:0x9a2dfa936ef2e0a7!8m2!3d41.6722504!4d2.7978625!16s%2Fg%2F11q2xl6s9f?entry=ttu&g_ep=EgoyMDI1MDkxNy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    data-testid="location-link"
                    aria-label={`${t.a11y.viewOnMap}: Puerto de Blanes`}
                  >
                    <span className="block mb-1 text-sm">Puerto de Blanes</span>
                    <span className="block text-xs text-muted-foreground hover:text-primary/80">{t.contact.locationCity}</span>
                  </a>
                </div>

                {/* Season */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2 text-sm">{t.contact.seasonLabel}</h3>
                  <p className="text-muted-foreground mb-2 text-sm">{t.contact.seasonMonths}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.contact.flexibleHours}</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="pt-6 border-t border-border">
                <Button
                  onClick={() => { trackWhatsAppClick("contact_section"); window.open("https://wa.me/34611500372", "_blank"); }}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 h-12 text-base transition-colors"
                  data-testid="button-whatsapp-quick"
                  aria-label={t.a11y.checkWhatsApp}
                >
                  <SiWhatsapp className="w-5 h-5 mr-2" />
                  {t.contact.consultWhatsApp}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <div className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-[450px]">
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

              {/* Overlay sutil para legibilidad del texto */}
              <div className="absolute inset-0 bg-foreground/20 pointer-events-none"></div>

              {/* Contenido */}
              <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[450px] pointer-events-none">
                <div className="pointer-events-auto">
                  <MapPin className="w-12 h-12 text-white mx-auto mb-4 drop-shadow-lg" />
                  <h3 className="font-heading text-lg sm:text-xl font-semibold text-white mb-2 drop-shadow-lg text-center">
                    {t.contact.mapTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 mb-4 drop-shadow-lg text-center">
                    {t.contact.mapSubtitle}
                  </p>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => window.open("https://maps.app.goo.gl/VrSkZNG7289VVdJD9", "_blank")}
                      className="bg-white/90 backdrop-blur hover:bg-white"
                      data-testid="button-view-map"
                      aria-label={t.a11y.viewOnMap}
                    >
                      {t.contact.viewMap}
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
