import { Scissors, Zap, Smartphone, Rocket } from "lucide-react";
import { ScrollReveal } from "@/components/ui/animations";

const featuresList = [
  {
    icon: Scissors,
    title: "Cortes Automáticos",
    description:
      "A IA identifica os melhores momentos e gera cortes prontos para publicar.",
  },
  {
    icon: Zap,
    title: "Processamento Rápido",
    description:
      "Pipeline otimizado que entrega seus cortes em minutos, não horas.",
  },
  {
    icon: Smartphone,
    title: "Formato Vertical",
    description:
      "Vídeos adaptados automaticamente para TikTok, Reels e Shorts (9:16).",
  },
  {
    icon: Rocket,
    title: "Pronto para Redes",
    description:
      "Legendas, títulos virais e hashtags gerados pela IA para maximizar alcance.",
  },
];

export function FeaturesSection() {
  return (
    <section id="recursos" className="border-t border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
              Recursos
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Simplicidade que surpreende
            </h2>
            <p className="text-muted-foreground">
              Tudo o que você precisa para transformar seu conteúdo em hits nas
              redes sociais.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuresList.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100} direction="up">
              <div className="group flex flex-col items-center rounded-xl border border-border/50 bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Seção estilo do corte */}
        <div className="mt-20">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h3 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                Configure o estilo do seu corte em segundos
              </h3>
            </div>
          </ScrollReveal>

          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <ScrollReveal delay={0} direction="left">
              <div className="group cursor-pointer rounded-xl border-2 border-border/50 bg-card p-6 text-center transition-all hover:border-primary/50">
                <div className="mx-auto mb-4 h-40 w-24 overflow-hidden rounded-xl bg-muted/50">
                  <div className="flex h-full flex-col">
                    <div className="flex-1 bg-gradient-to-b from-primary/20 to-primary/5 blur-sm" />
                    <div className="mx-auto -mt-20 h-20 w-16 rounded bg-primary/30" />
                    <div className="flex-1 bg-gradient-to-t from-primary/20 to-primary/5 blur-sm" />
                  </div>
                </div>
                <h4 className="font-semibold">Fundo Desfocado</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vídeo original no centro com fundo desfocado preenchendo a
                  tela
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150} direction="right">
              <div className="group cursor-pointer rounded-xl border-2 border-primary bg-card p-6 text-center transition-all">
                <div className="mx-auto mb-4 flex h-40 w-24 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                    <Smartphone className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h4 className="font-semibold">Preencher Tela</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zoom no vídeo para preencher toda a tela (corta laterais)
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
