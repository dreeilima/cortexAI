"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Share2,
  Copy,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Trash2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteCorte, updateCorte } from "../../actions";

interface Corte {
  id: string;
  titulo: string;
  legenda: string;
  tags: string[];
  duracao: string;
  thumbnail: string | null;
  startTime: string | null;
  endTime: string | null;
  videoUrl: string | null;
  videoId?: string;
  isProcessed?: boolean;
}

// ======== SKELETON ========
export function CortesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[9/16] w-full" />
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <div className="grid grid-cols-3 gap-1.5">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CortesList({ cortes: initialCortes }: { cortes: Corte[] }) {
  const [showCortes, setShowCortes] = useState(true);
  const [cortes, setCortes] = useState(initialCortes);

  const handleRemoveCorte = (corteId: string) => {
    setCortes((prev) => prev.filter((c) => c.id !== corteId));
  };

  const handleUpdateCorte = (corteId: string, data: { titulo?: string; legenda?: string }) => {
    setCortes((prev) =>
      prev.map((c) =>
        c.id === corteId ? { ...c, ...data } : c
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cortes gerados</h1>
          <p className="text-sm text-primary">
            {cortes.length} cortes prontos para publicar
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
          {cortes.map((corte) => (
            <CorteCard
              key={corte.id}
              corte={corte}
              onRemove={handleRemoveCorte}
              onUpdate={handleUpdateCorte}
            />
          ))}
          {cortes.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>Nenhum corte encontrado para este vídeo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseTimeToSeconds(timeStr: string | null): number {
  if (!timeStr) return 0;
  try {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  } catch (e) {
    return 0;
  }
}

function CorteCard({
  corte,
  onRemove,
  onUpdate,
}: {
  corte: Corte;
  onRemove: (id: string) => void;
  onUpdate: (id: string, data: { titulo?: string; legenda?: string }) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(corte.titulo);
  const [editCaption, setEditCaption] = useState(corte.legenda);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isProcessed = corte.isProcessed;
  const startSeconds = isProcessed ? 0 : parseTimeToSeconds(corte.startTime);
  const endSeconds = isProcessed ? (videoRef.current?.duration || 0) : parseTimeToSeconds(corte.endTime);

  const handlePlayToggle = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (!isProcessed) {
        if (
          Math.abs(videoRef.current.currentTime - endSeconds) < 1 ||
          videoRef.current.currentTime < startSeconds
        ) {
          videoRef.current.currentTime = startSeconds;
        }
      }
      try {
        await videoRef.current.play();
      } catch {
        toast.error("Não foi possível reproduzir este vídeo.");
        return;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const duration = isProcessed ? videoRef.current.duration : (endSeconds - startSeconds);
    const relativePos = isProcessed ? current : (current - startSeconds);
    
    if (duration > 0) {
      setProgress((relativePos / duration) * 100);
    }

    if (!isProcessed && current >= endSeconds) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = startSeconds;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isProcessed) {
      videoRef.current.currentTime = startSeconds;
    }
  };

  const handleCopyLegenda = () => {
    navigator.clipboard.writeText(corte.legenda);
    toast.success("Legenda copiada!");
  };

  const handleShare = () => {
    toast.info("Link de compartilhamento copiado!");
  };

  const handleRender = async () => {
    if (!corte.videoId) return;
    try {
      toast.info("Gerando arquivo do corte...");
      const response = await fetch("/api/render", {
        method: "POST",
        body: JSON.stringify({ videoId: corte.videoId }),
      });
      if (response.ok) {
        toast.success("Arquivo gerado com sucesso! Recarregue para baixar.");
      } else {
        toast.error("Erro ao gerar arquivo.");
      }
    } catch (e) {
      toast.error("Erro ao processar.");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await deleteCorte(corte.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Corte removido.");
      onRemove(corte.id);
    } catch (e) {
      toast.error("Erro ao remover corte.");
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const result = await updateCorte(corte.id, {
        title: editTitle,
        caption: editCaption,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Corte atualizado.");
      onUpdate(corte.id, { titulo: editTitle, legenda: editCaption });
      setEditOpen(false);
    } catch (e) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-lg group">
        <div className="relative aspect-[9/16] bg-black">
          {corte.videoUrl ? (
            <video
              ref={videoRef}
              src={corte.videoUrl}
              className="h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={isProcessed}
              onClick={!isProcessed ? handlePlayToggle : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground bg-muted">
              <span className="text-xs">Vídeo não disponível</span>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isPlaying && corte.videoUrl && (
              <button
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-110 pointer-events-auto"
                onClick={handlePlayToggle}
              >
                <Play className="ml-1 h-6 w-6" />
              </button>
            )}
          </div>

          {/* CRUD overlay */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-black/60 hover:bg-black/80 text-white border-0"
              onClick={() => {
                setEditTitle(corte.titulo);
                setEditCaption(corte.legenda);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-black/60 hover:bg-red-600/80 text-white border-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover corte?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá este corte permanentemente. Esta ação não pode
                    ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Barra de progresso */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none group-hover:opacity-0 transition-opacity">
            <div className="flex items-center gap-2 text-xs text-white">
              <span>{isProcessed ? "00:00" : (corte.startTime || "0:00")}</span>
              <div className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{isProcessed ? corte.duracao : (corte.endTime || "0:00")}</span>
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
                Comp.
              </Button>
              {corte.isProcessed ? (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 text-xs bg-green-600 hover:bg-green-700"
                  asChild
                >
                  <a
                    href={corte.videoUrl || "#"}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-3 w-3" />
                    Baixar
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs border-primary text-primary hover:bg-primary/10"
                  onClick={handleRender}
                >
                  <Download className="h-3 w-3" />
                  Gerar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar corte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título do corte"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Legenda</label>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Legenda do post"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
