import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { trackFaqExpanded } from "@/utils/analytics";

/** Fallback items (Spanish) used when faqPreview translations are not loaded */
export const FALLBACK_ITEMS = [
  {
    id: "precios",
    question: "¿Cuáles son los precios del alquiler?",
    answer: "Barcos sin licencia desde 70€ con gasolina incluida (1h, 2h, 3h, 4h, 6h o dia completo). Barcos con licencia desde 150€ sin gasolina incluida (2h, 4h, 8h). Los precios varian segun temporada (julio/agosto) y embarcacion.",
  },
  {
    id: "sin-licencia",
    question: "¿Puedo alquilar un barco sin tener licencia náutica?",
    answer: "¡Sí! Tenemos varios barcos perfectos sin licencia de hasta 15 CV. Solo necesitas ser mayor de 18 años. Antes de salir te damos un briefing completo para que navegues con total seguridad.",
  },
  {
    id: "incluye",
    question: "¿Qué está incluido en el precio?",
    answer: "Incluido en todos los alquileres: embarcación equipada, gasolina (en barcos sin licencia), chalecos salvavidas, kit de seguridad, ancla, escalera de baño, instrucciones de uso y seguro básico.",
  },
  {
    id: "cancelacion",
    question: "¿Cuál es la política de cancelación?",
    answer: "El cambio de fecha es gratuito con un mínimo de 7 días de antelación, sujeto a disponibilidad. Las cancelaciones no son reembolsables. En caso de mal tiempo, reprogramación gratuita.",
  },
  {
    id: "donde-navegar",
    question: "¿Por dónde puedo navegar?",
    answer: "Barcos sin licencia: desde Blanes hasta Playa de Fenals al norte y el final de la playa de Blanes al sur, siempre a menos de 2 millas de la costa. Barcos con licencia: mayor radio de navegación, hasta Sant Feliu de Guíxols y más allá.",
  },
  {
    id: "mal-tiempo",
    question: "¿Qué pasa si hace mal tiempo?",
    answer: "Si las condiciones meteorológicas no son seguras, te ofrecemos cambio de fecha gratuito o reembolso completo. Consultamos la previsión 24h antes y te avisamos.",
  },
  {
    id: "experiencia",
    question: "¿Necesito experiencia previa?",
    answer: "No, ninguna. Antes de zarpar te damos una explicación completa del barco (10-15 min). Nuestros barcos sin licencia son muy fáciles de manejar.",
  },
  {
    id: "comida-bebida",
    question: "¿Puedo llevar comida y bebida?",
    answer: "¡Por supuesto! Puedes traer tu propia comida, bebidas y snacks. Tenemos nevera a bordo. Solo pedimos que no se use cristal por seguridad.",
  },
  {
    id: "fianza",
    question: "¿Qué es la fianza y cuándo se devuelve?",
    answer: "La fianza es un depósito de seguridad (200-500€ según el barco) que se paga en el puerto antes de salir y se devuelve íntegramente al regresar si el barco está en buen estado.",
  },
  {
    id: "equipamiento-seguridad",
    question: "¿Qué equipamiento de seguridad incluye?",
    answer: "Todos nuestros barcos incluyen chalecos salvavidas para todos los pasajeros, botiquín de primeros auxilios, extintor, ancla, y kit de señalización según normativa.",
  },
  {
    id: "descuentos",
    question: "¿Hay descuentos para grupos o reservas anticipadas?",
    answer: "Sí, ofrecemos el código BIENVENIDO10 para un 10% de descuento en tu primera reserva. También tenemos tarifas especiales para reservas de día completo.",
  },
  {
    id: "hasta-donde",
    question: "¿Hasta dónde puedo navegar?",
    answer: "Puedes explorar toda la costa entre Blanes y Tossa de Mar. Te recomendamos las calas de Sa Forcanera, Cala Bona y Cala Sant Francesc, accesibles solo por mar.",
  },
  {
    id: "pueblos-cercanos",
    question: "Estoy alojado en Malgrat de Mar / Santa Susanna / Calella. ¿Puedo alquilar un barco?",
    answer: "¡Sí! El Puerto de Blanes es el punto de alquiler náutico más cercano. Malgrat de Mar está a 10 minutos en coche, Santa Susanna a 15 minutos y Calella a 20 minutos. También puedes llegar en tren RENFE línea R1. Tenemos 7 barcos disponibles desde 70 EUR/hora con gasolina incluida.",
  },
  {
    id: "como-llegar-puerto",
    question: "¿Cómo llego al Puerto de Blanes desde los pueblos cercanos?",
    answer: "Desde Malgrat de Mar: 10 min en coche por la N-II o 5 min en tren. Desde Santa Susanna: 15 min en coche o 10 min en tren. Desde Calella: 20 min en coche por la C-32 o 15 min en tren RENFE R1. Hay parking gratuito junto al puerto.",
  },
];

/** Number of items shown on the homepage preview */
const PREVIEW_COUNT = 8;

export default function FAQPreview() {
  const { ref: revealRef, isVisible } = useScrollReveal();
  const t = useTranslations();
  const { localizedPath } = useLanguage();

  const items = t.faqPreview?.items?.length ? t.faqPreview.items : FALLBACK_ITEMS;
  const previewItems = items.slice(0, PREVIEW_COUNT);
  const title = t.faqPreview?.title ?? "Preguntas frecuentes";
  const subtitle = t.faqPreview?.subtitle ?? "Todo lo que necesitas saber antes de salir a navegar";
  const viewAll = t.faqPreview?.viewAll ?? "Ver todas las preguntas frecuentes";

  return (
    <section ref={revealRef} className={`py-16 sm:py-20 lg:py-24 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} aria-labelledby="faq-preview-title">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 id="faq-preview-title" className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3">
            {title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {subtitle}
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-2" onValueChange={(value) => { if (value) trackFaqExpanded(value); }}>
          {previewItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border border-border rounded-xl px-5 data-[state=open]:border-primary/40 data-[state=open]:bg-primary/5 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground text-sm sm:text-base py-4 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Link to full FAQ */}
        <div className="text-center mt-8">
          <a
            href={localizedPath("faq")}
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            {viewAll}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
