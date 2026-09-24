import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { trackPhoneClick, trackWhatsAppClick } from "@/utils/analytics";

const MAPS_PLACE_URL = "https://maps.app.goo.gl/VrSkZNG7289VVdJD9";

/**
 * Home closing: "¿Tienes dudas?" (WhatsApp first, it's how bookings close) and,
 * as its own band, "Nos encontramos en el Puerto de Blanes" with the map. The
 * heading sits beside the map, not over it, so the map stays usable.
 */
export default function ContactSection() {
  const t = useTranslations();
  // Only used to defer the ~400KB Maps iframe until the band is near the viewport.
  const { ref: mapRef, isVisible: mapInView } = useScrollReveal();

  const facts = [
    {
      icon: Phone,
      label: `${t.contact.phone} & ${t.contact.whatsapp}`,
      value: (
        <a
          href="tel:+34611500372"
          className="inline-flex min-h-11 items-center hover:text-foreground"
          data-testid="phone-link"
          aria-label={`${t.a11y.callPhone} +34 611 500 372`}
          onClick={() => trackPhoneClick()}
        >
          +34 611 500 372
        </a>
      ),
    },
    {
      wide: true,
      icon: Mail,
      label: t.contact.emailLabel,
      value: (
        <a
          href="mailto:info@costabravarentaboat.com"
          className="inline-flex min-h-11 items-center hover:text-foreground [overflow-wrap:anywhere]"
          data-testid="email-link"
          aria-label={`${t.a11y.sendEmail} info@costabravarentaboat.com`}
        >
          info@costabravarentaboat.com
        </a>
      ),
    },
    { icon: MapPin, label: t.contact.locationLabel, value: "Puerto de Blanes, Girona" },
    { icon: Clock, label: t.contact.seasonLabel, value: t.contact.seasonMonths },
  ];

  return (
    <>
      <section id="contact" className="bg-background py-16 sm:py-24" aria-labelledby="contact-title">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2
              id="contact-title"
              className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl"
            >
              {t.contact.title}
            </h2>
            <p className="mt-3 max-w-lg text-base text-muted-foreground text-pretty sm:text-lg">
              {t.contact.subtitle}
            </p>
            <Button
              onClick={() => {
                trackWhatsAppClick("contact_section");
                window.open("https://wa.me/34611500372", "_blank", "noopener,noreferrer");
              }}
              className="mt-6 h-12 rounded-full bg-whatsapp-active px-6 text-base text-white hover:bg-whatsapp-active/90"
              data-testid="button-whatsapp-quick"
              aria-label={t.a11y.checkWhatsApp}
            >
              <SiWhatsapp className="mr-2 h-5 w-5" />
              {t.contact.consultWhatsApp}
            </Button>
          </div>

          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {facts.map(f => (
              <div key={f.label} className={`flex gap-3 ${"wide" in f && f.wide ? "sm:col-span-2" : ""}`}>
                <f.icon
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-foreground/60"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="font-medium text-foreground">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="location"
        className="bg-muted/40 py-16 sm:py-24"
        aria-labelledby="location-title"
      >
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-5 lg:items-center lg:gap-12">
          <div className="lg:col-span-2">
            <h2
              id="location-title"
              className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl"
            >
              {t.contact.mapTitle}
            </h2>
            <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
              {t.contact.mapSubtitle}
            </p>
            <Button asChild variant="outline" className="mt-6 min-h-11 rounded-full">
              <a
                href={MAPS_PLACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-view-map"
                aria-label={t.a11y.viewOnMap}
              >
                {t.contact.viewMap}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>

          <div
            ref={mapRef}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted lg:col-span-3 lg:aspect-[16/10]"
          >
            {mapInView && (
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1ses!2ses!4v1759782051685!5m2!1ses!2ses"
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t.contact.mapTitle}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
