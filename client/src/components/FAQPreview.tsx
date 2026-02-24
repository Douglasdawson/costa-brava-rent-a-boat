import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "precios",
    question: "¿Cuáles son los precios del alquiler?",
    answer: "Barcos sin licencia desde 70€ con gasolina incluida (1h, 2h, 3h, 4h, 6h o día completo). Barcos con licencia desde 150€ sin gasolina incluida (2h, 4h, 8h). Los precios varían según temporada (julio/agosto) y embarcación.",
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
    answer: "Cancelación flexible: más de 48h antes = reembolso completo. Entre 24-48h = 50% de reembolso. Menos de 24h = sin reembolso. En caso de mal tiempo, reprogramación gratuita o reembolso total.",
  },
  {
    id: "donde-navegar",
    question: "¿Por dónde puedo navegar?",
    answer: "Barcos sin licencia: desde Blanes hasta Playa de Fenals al norte y el final de la playa de Blanes al sur, siempre a menos de 2 millas de la costa. Barcos con licencia: mayor radio de navegación, hasta Sant Feliu de Guíxols y más allá.",
  },
];

export default function FAQPreview() {
  return (
    <section className="py-16 sm:py-20 bg-white" aria-labelledby="faq-preview-title">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h2 id="faq-preview-title" className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Preguntas frecuentes
          </h2>
          <p className="text-gray-500 text-base sm:text-lg">
            Todo lo que necesitas saber antes de salir a navegar
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border border-gray-200 rounded-xl px-5 data-[state=open]:border-primary/40 data-[state=open]:bg-primary/5 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 text-sm sm:text-base py-4 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-sm sm:text-base pb-4 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Link to full FAQ */}
        <div className="text-center mt-8">
          <a
            href="/faq"
            className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline"
          >
            Ver todas las preguntas frecuentes
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
