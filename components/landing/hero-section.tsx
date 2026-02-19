import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import {
  ScrollReveal,
  FloatingElement,
  CountUp,
} from "@/components/ui/animations";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradientes decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[400px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <ScrollReveal delay={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Powered by AI
            </div>
          </ScrollReveal>

          {/* Título */}
          <ScrollReveal delay={100}>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Transforme vídeos longos em{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                cortes virais
              </span>
            </h1>
          </ScrollReveal>

          {/* Subtítulo */}
          <ScrollReveal delay={200}>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Use inteligência artificial para identificar os melhores momentos
              dos seus vídeos e gerar cortes verticais prontos para TikTok,
              Reels e Shorts.
            </p>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={300}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link href="/login">
                  Começar Grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base">
                <Play className="h-4 w-4" />
                Ver demonstração
              </Button>
            </div>
          </ScrollReveal>

          {/* Social proof com CountUp */}
          <ScrollReveal delay={400}>
            <div className="mt-10 flex items-center justify-center gap-4 sm:gap-8 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  <CountUp end={1000} suffix="+" />
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Criadores ativos
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  <CountUp end={50000} suffix="+" />
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Cortes gerados
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  <CountUp end={98} suffix="%" />
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Satisfação
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Ilustração visual - Vídeo → Cortes */}
        <ScrollReveal delay={500} direction="up">
          <FloatingElement amplitude={6} duration={4}>
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="relative rounded-xl border border-border/50 bg-card/50 p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-8">
                  {/* Vídeo original */}
                  <div className="flex-1 rounded-lg border border-border/30 bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Video.mp4</span>
                    </div>
                    <div className="aspect-video rounded-md bg-muted animate-pulse" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      2:45:30
                    </p>
                  </div>

                  {/* Seta */}
                  <div className="hidden text-primary md:block">
                    <ArrowRight className="h-8 w-8" />
                  </div>

                  {/* Cortes gerados */}
                  <div className="hidden flex-col gap-2 md:flex">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"
                      >
                        <div className="h-8 w-6 rounded bg-primary/20" />
                        <div>
                          <p className="text-xs font-medium text-primary">
                            Clip {i}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            00:{15 + i * 12}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FloatingElement>
        </ScrollReveal>
      </div>
    </section>
  );
}
