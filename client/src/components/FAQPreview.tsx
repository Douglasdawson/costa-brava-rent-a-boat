import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { trackFaqExpanded } from "@/utils/analytics";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import type { Boat } from "@shared/schema";

/** Number of items shown on the homepage preview */
const PREVIEW_COUNT = 8;

export default function FAQPreview() {
  const { ref: revealRef, isVisible } = useScrollReveal();
  const t = useTranslations();
  const { localizedPath } = useLanguage();

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqPreview = t.faqPreview!;
  const items = useMemo(() => {
    const vars = computeFaqVars(boats);
    return faqPreview.items.map(item => ({
      ...item,
      question: substituteFaqVars(item.question, vars),
      answer: substituteFaqVars(item.answer, vars),
    }));
  }, [faqPreview.items, boats]);
  const previewItems = items.slice(0, PREVIEW_COUNT);
  const title = faqPreview.title;
  const subtitle = faqPreview.subtitle;
  const viewAll = faqPreview.viewAll;

  return (
    <section
      ref={revealRef}
      className={`py-16 sm:py-20 lg:py-24 bg-background transition-[opacity,transform,filter] duration-500 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"}`}
      aria-labelledby="faq-preview-title"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <h2
            id="faq-preview-title"
            className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3"
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">{subtitle}</p>
        </div>

        {/* Accordion */}
        <Accordion
          type="single"
          collapsible
          className="space-y-2"
          onValueChange={value => {
            if (value) trackFaqExpanded(value);
          }}
        >
          {previewItems.map(item => (
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
