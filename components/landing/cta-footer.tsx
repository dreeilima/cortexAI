import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/animations";

export function CtaSection() {
  return (
    <section className="border-t border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-16">
            {/* Glow decorativo */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Pronto para transformar seus{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  vídeos em viralidade?
                </span>
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
                Crie sua conta gratuita e comece a gerar cortes virais agora
                mesmo.
              </p>
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link href="/login">
                  Começar Grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">CortexAI</span>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CortexAI. Transformando conteúdo em
            viralidade.
          </p>

          {/* Links */}
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
