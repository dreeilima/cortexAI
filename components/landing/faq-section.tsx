import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ui/animations";
import { faqItems } from "@/lib/mock-data";

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
              FAQ
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Perguntas frequentes
            </h2>
          </div>
        </ScrollReveal>

        {/* Accordion */}
        <ScrollReveal delay={200}>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
