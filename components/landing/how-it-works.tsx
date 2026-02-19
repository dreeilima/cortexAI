import { Link, Upload, Wand2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/animations";

const steps = [
  {
    icon: Link,
    title: "Cole o link ou faça upload",
    description:
      "Adicione o link do YouTube, Vimeo ou faça upload direto do seu vídeo em qualquer formato.",
    step: "01",
  },
  {
    icon: Wand2,
    title: "A IA analisa seu conteúdo",
    description:
      "Nossa inteligência artificial transcreve, analisa e identifica os momentos mais impactantes.",
    step: "02",
  },
  {
    icon: Upload,
    title: "Baixe seus cortes prontos",
    description:
      "Receba cortes verticais com legendas, títulos virais e hashtags, prontos para publicar.",
    step: "03",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="border-t border-border/40 py-20 md:py-28"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
              Como funciona
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Do vídeo longo ao corte viral em 3 passos
            </h2>
            <p className="text-muted-foreground">
              Simples, rápido e sem complicação. Deixe a IA fazer o trabalho
              pesado.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollReveal key={index} delay={index * 150} direction="up">
              <div className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                {/* Número do passo */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {step.step}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Linha conectora */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-border md:block" />
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
