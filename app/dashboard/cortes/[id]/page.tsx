"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  Copy,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";
import { mockCortes } from "@/lib/mock-data";
import { toast } from "sonner";

export default function CortesPage() {
  const [showCortes, setShowCortes] = useState(true);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cortes gerados</h1>
          <p className="text-sm text-primary">
            {mockCortes.length} cortes prontos para publicar
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCortes(!showCortes)}
          className="gap-1 self-start"
        >
          {showCortes ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar cortes
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Mostrar cortes
            </>
          )}
        </Button>
      </div>

      {/* Grid de cortes */}
      {showCortes && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockCortes.map((corte) => (
            <CorteCard key={corte.id} corte={corte} />
          ))}
        </div>
      )}
    </div>
  );
}

function CorteCard({ corte }: { corte: (typeof mockCortes)[0] }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopyLegenda = () => {
    navigator.clipboard.writeText(corte.legenda);
    toast.success("Legenda copiada!");
  };

  const handleShare = () => {
    toast.info("Link de compartilhamento copiado!");
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      {/* Player mockado */}
      <div className="relative aspect-[9/16] max-h-64 sm:max-h-80 bg-gradient-to-br from-muted to-muted/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-1 h-6 w-6" />
            )}
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center gap-2 text-xs text-white">
            <span>0:00</span>
            <div className="flex-1 h-1 rounded-full bg-white/30">
              <div className="h-full w-1/3 rounded-full bg-primary" />
            </div>
            <span>{corte.duracao}</span>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        {/* Título */}
        <h3 className="font-semibold leading-tight">{corte.titulo}</h3>

        {/* Legenda */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Legenda do Post
          </p>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {corte.legenda}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {corte.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Ações */}
        <div className="space-y-2 pt-1">
          <Button className="w-full gap-2" size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Postar no TikTok
          </Button>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={handleCopyLegenda}
            >
              <Copy className="h-3 w-3" />
              Legenda
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Download className="h-3 w-3" />
              Baixar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
