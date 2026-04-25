import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQSection({ items, className }: FAQSectionProps) {
  if (!items.length) return null;

  return (
    <Accordion type="single" collapsible className={className}>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`faq-${index}`}>
          <AccordionTrigger className="text-left font-semibold">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground whitespace-pre-line">{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
