import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Anchor, ArrowUpRight, ArrowDown } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";
import { trackPhoneClick, trackWhatsAppClick } from "@/utils/analytics";

const MAPS_PLACE_URL = "https://maps.app.goo.gl/VrSkZNG7289VVdJD9";
// Blanes harbour, from the Maps embed (41.6742939, 2.7957177), shown as a chart position.
const HARBOUR_POSITION = "41°40′27″ N · 2°47′45″ E";

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
      href: true,
      icon: Phone,
      label: `${t.contact.phone} & ${t.contact.whatsapp}`,
      value: (
        <a
          href="tel:+34611500372"
          className="inline-flex min-h-11 items-center after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          data-testid="phone-link"
          aria-label={`${t.a11y.callPhone} +34 611 500 372`}
          onClick={() => trackPhoneClick()}
        >
          +34 611 500 372
        </a>
      ),
    },
    {
      href: true,
      icon: Mail,
      label: t.contact.emailLabel,
      value: (
        <a
          href="mailto:info@costabravarentaboat.com"
          className="inline-flex min-h-11 items-center after:absolute after:inset-0 after:content-[''] focus-visible:outline-none [overflow-wrap:anywhere]"
          data-testid="email-link"
          aria-label={`${t.a11y.sendEmail} info@costabravarentaboat.com`}
        >
          info@costabravarentaboat.com
        </a>
      ),
    },
    {
      href: true,
      internal: true,
      icon: MapPin,
      label: t.contact.locationLabel,
      value: (
        <a
          href="#location"
          className="inline-flex min-h-11 items-center after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          data-testid="location-anchor-link"
        >
          Puerto de Blanes, Girona
        </a>
      ),
    },
    { icon: Clock, label: t.contact.seasonLabel, value: t.contact.seasonMonths },
  ];

  return (
    <>
      <div className="bg-muted/40">
        <section
          id="contact"
          className="rounded-b-2xl squircle-b bg-background py-16 sm:py-24"
          aria-labelledby="contact-title"
        >
          <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2
                id="contact-title"
                className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance"
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

            {/* One panel: phone and email are whole-row links (stretched anchor), place and season are plain facts. */}
            <dl className="grid overflow-hidden rounded-2xl border border-border bg-background sm:grid-cols-2">
              {facts.map(f => {
                const link = "href" in f && f.href;
                const internal = "internal" in f && f.internal;
                return (
                  <div
                    key={f.label}
                    className={cn(
                      "group/row relative flex items-center gap-4 px-5 py-4 transition-colors focus-within:bg-muted/60 sm:px-6",
                      link && "[@media(hover:hover)]:hover:bg-muted/60",
                      link && !internal && "border-b border-border sm:col-span-2",
                      !link &&
                        "sm:[&:nth-child(4)]:border-l sm:[&:nth-child(4)]:border-border max-sm:[&:nth-child(4)]:border-t max-sm:[&:nth-child(4)]:border-border"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/70 transition-colors",
                        link &&
                          "[@media(hover:hover)]:group-hover/row:bg-cta [@media(hover:hover)]:group-hover/row:text-cta-foreground group-focus-within/row:bg-cta group-focus-within/row:text-cta-foreground"
                      )}
                    >
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <dt className="text-sm text-muted-foreground">{f.label}</dt>
                      <dd className="font-medium text-foreground">{f.value}</dd>
                    </div>
                    {link && !internal && (
                      <ArrowUpRight
                        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 [@media(hover:hover)]:group-hover/row:-translate-y-0.5 [@media(hover:hover)]:group-hover/row:translate-x-0.5"
                        aria-hidden="true"
                      />
                    )}
                    {internal && (
                      <ArrowDown
                        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 [@media(hover:hover)]:group-hover/row:translate-y-0.5"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </dl>
          </div>
        </section>
      </div>

      <div className="bg-foreground dark:bg-[hsl(215_45%_16%)]">
        <section
          id="location"
          className="rounded-b-2xl squircle-b bg-[color-mix(in_srgb,hsl(var(--muted))_40%,hsl(var(--background)))] py-16 sm:py-24"
          aria-labelledby="location-title"
        >
          <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-5 lg:items-center lg:gap-12">
            <div className="lg:col-span-2">
              <h2
                id="location-title"
                className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance"
              >
                {t.contact.mapTitle}
              </h2>
              <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
                {t.contact.mapSubtitle}
              </p>
              <InteractiveHoverButton
                tone="dark"
                href={MAPS_PLACE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-view-map"
                aria-label={t.a11y.viewOnMap}
                className="mt-6 min-h-12 px-7 text-base"
              >
                {t.contact.viewMap}
              </InteractiveHoverButton>
            </div>

            {/* The map sits in a navy chart plate; the caption reads like a position fix. */}
            <figure className="rounded-2xl bg-primary p-2 text-primary-foreground dark:bg-[hsl(215_45%_16%)] sm:p-3 lg:col-span-3">
              <div
                ref={mapRef}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted lg:aspect-[16/10]"
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
              <figcaption className="flex items-center gap-2 px-2 pb-1 pt-3 text-sm tabular-nums text-primary-foreground/80 sm:px-1">
                <Anchor className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{HARBOUR_POSITION}</span>
              </figcaption>
            </figure>
          </div>
        </section>
      </div>
    </>
  );
}
