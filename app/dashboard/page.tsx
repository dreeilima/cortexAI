"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Video,
  Scissors,
  Loader2,
  Link as LinkIcon,
  Upload,
  Settings2,
  ChevronDown,
  Smartphone,
  Monitor,
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  History,
  Play,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createVideoRecord,
  getDashboardStats,
  getRecentActivity,
  getRecentCuts,
  getUploadUrl,
  getVideoStatus,
} from "./actions";

// ... previous imports

const pipelineSteps = [
  { label: "Download", key: "download" },
  { label: "Transcrição", key: "transcricao" },
  { label: "Análise IA", key: "analise" },
  { label: "Renderização", key: "renderizacao" },
  { label: "Upload", key: "upload" },
];

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real Data State
  const [stats, setStats] = useState({
    videosProcessados: 0,
    cortesGerados: 0,
    taxa: 0,
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [recentCuts, setRecentCuts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [viralTitle, setViralTitle] = useState(true);
  const [videoLanguage, setVideoLanguage] = useState("auto");
  const [cutStyle, setCutStyle] = useState<"blur" | "fill">("fill");
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, activityData, cutsData] = await Promise.all([
          getDashboardStats(),
          getRecentActivity(),
          getRecentCuts(),
        ]);
        setStats(statsData as any);
        setActivity(activityData);
        setRecentCuts(cutsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Erro ao carregar dados do dashboard.");
        // Fallback to mocks if fail? keeping empty for now
      } finally {
        setLoadingData(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleUploadAndProcess = async () => {
    setIsProcessing(true);
    setPipelineStep(0);

    try {
      const supabase = createClient();
      let finalVideoUrl = videoUrl;

      // 1. Upload File (Direct to R2)
      if (selectedFile) {
        // A. Get Presigned URL
        const uploadConfig = await getUploadUrl(
          selectedFile.name,
          selectedFile.type,
        );
        if (uploadConfig.error || !uploadConfig.uploadUrl) {
          throw new Error(
            "Erro ao gerar link de upload: " + uploadConfig.error,
          );
        }

        // B. Upload to R2
        const uploadResponse = await fetch(uploadConfig.uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Falha no upload para o R2");
        }

        finalVideoUrl = uploadConfig.publicUrl || uploadConfig.fileKey || "";
        setPipelineStep(1);
      }

      // 2. Create DB Record
      const formData = new FormData();
      formData.append(
        "title",
        selectedFile ? selectedFile.name : "Video from URL",
      );
      formData.append("originalUrl", finalVideoUrl);
      // formData.append("duration", "0"); // Can't get easily without metadata parsing

      formData.append("generateSubtitles", String(generateSubtitles));
      formData.append("videoLanguage", videoLanguage);
      formData.append("cutStyle", cutStyle);

      const result = await createVideoRecord(formData);
      if (result.error) throw new Error(result.error);

      setPipelineStep(2);
      toast.success("Vídeo enviado! Acompanhe o progresso.");
      setDialogOpen(false);

      // 3. Real status polling
      const videoId = result.videoId;
      if (videoId) {
        const pollStatus = async () => {
          const maxAttempts = 120; // ~10 minutos
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            try {
              const status = await getVideoStatus(videoId);
              if (!status) continue;
              
              if (status.status === "processing") {
                setPipelineStep(2); // Análise IA
              }

              if (status.status === "rendering") {
                setPipelineStep(3); // Renderização FFmpeg
              }
              
              if (status.status === "completed" || status.status === "archived") {
                setPipelineStep(4); // Finalizado
                toast.success(
                  `${status.cortesCount} cortes gerados com sucesso!`,
                );
                // Refresh data
                getDashboardStats().then(setStats as any);
                getRecentActivity().then(setActivity);
                getRecentCuts().then(setRecentCuts);
                setTimeout(() => {
                  setPipelineStep(-1);
                  setIsProcessing(false);
                }, 2000);
                return;
              }
              
              if (status.status === "error") {
                toast.error("Erro no processamento do vídeo.");
                setPipelineStep(-1);
                setIsProcessing(false);
                return;
              }
            } catch (e) {
              console.error("Polling error:", e);
            }
          }
          // Timeout
          toast.info("Processamento está demorando. Verifique o histórico.");
          setPipelineStep(-1);
          setIsProcessing(false);
        };
        pollStatus();
      } else {
        setPipelineStep(-1);
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao processar vídeo");
      setIsProcessing(false);
      setPipelineStep(-1);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Bem-vindo de volta!
              </span>
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">
              O que vamos cortar hoje?
            </h1>
            <p className="mt-1 text-muted-foreground">
              Cole um link ou faça upload para começar a gerar cortes virais.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shrink-0">
                <Plus className="h-5 w-5" />
                Novo Corte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar novo corte</DialogTitle>
                <DialogDescription>
                  Adicione um vídeo para gerar cortes virais com IA.
                </DialogDescription>
              </DialogHeader>
              <NewCutForm
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                advancedOpen={advancedOpen}
                setAdvancedOpen={setAdvancedOpen}
                generateSubtitles={generateSubtitles}
                setGenerateSubtitles={setGenerateSubtitles}
                viralTitle={viralTitle}
                setViralTitle={setViralTitle}
                videoLanguage={videoLanguage}
                setVideoLanguage={setVideoLanguage}
                cutStyle={cutStyle}
                setCutStyle={setCutStyle}
                isProcessing={isProcessing}
                onProcess={() => {
                  handleUploadAndProcess();
                  // setDialogOpen(false); // Handled inside handleUploadAndProcess
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats + Pipeline (se ativo) */}
      {pipelineStep >= 0 ? (
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <h3 className="font-semibold text-lg">
                {pipelineSteps[pipelineStep]?.label || "Processando"}...
              </h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {Math.round(((pipelineStep + 1) / pipelineSteps.length) * 100)}%
              </span>
            </div>
            <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{
                  width: `${((pipelineStep + 1) / pipelineSteps.length) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              {pipelineSteps.map((step, index) => (
                <div
                  key={step.key}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      index < pipelineStep
                        ? "bg-primary text-primary-foreground"
                        : index === pipelineStep
                          ? "bg-primary text-primary-foreground animate-pulse ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < pipelineStep ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : index === pipelineStep ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>
                  <span
                    className={`text-xs hidden sm:block ${
                      index <= pipelineStep
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Bento Grid - Stats */
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="group transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.videosProcessados}</p>
                <p className="text-xs text-muted-foreground">
                  Vídeos processados
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="group transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Scissors className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cortesGerados}</p>
                <p className="text-xs text-muted-foreground">Cortes gerados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="group transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-muted-foreground">
                  Taxa de aproveitamento
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bento Grid - Conteúdo */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Coluna principal - Ação rápida + Atividade */}
        <div className="space-y-6 lg:col-span-3">
          {/* Quick Input - Ação rápida sem abrir modal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Ação rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole um link do YouTube para gerar cortes..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="h-11"
                />
                <Button
                  onClick={() => {
                    if (videoUrl) handleUploadAndProcess();
                    else setDialogOpen(true);
                  }}
                  disabled={isProcessing}
                  className="h-11 gap-2 shrink-0 px-5"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Gerar
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Ou clique em <strong>Novo Corte</strong> para mais opções
                (upload, legendas, estilo)
              </p>
            </CardContent>
          </Card>

          {/* Atividade recente */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-primary" />
                  Atividade recente
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  asChild
                >
                  <Link href="/dashboard/historico">
                    Ver tudo
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <History className="h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhuma atividade recente</p>
                    </div>
                ) : (
                    activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        item.status === "concluido"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {item.status === "concluido" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.data}
                      </p>
                    </div>
                    {item.status === "concluido" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        asChild
                      >
                        <Link href={`/dashboard/cortes/${item.id}`}>
                          <Badge variant="outline" className="gap-1">
                            {item.cortesCount} <Scissors className="h-3 w-3" />
                          </Badge>
                        </Link>
                      </Button>
                    )}
                    {item.status === "aguardando" && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      >
                        Processando
                      </Badge>
                    )}
                  </div>
                ))
              )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral - Cortes recentes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Preview de cortes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scissors className="h-4 w-4 text-primary" />
                  Últimos cortes
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  asChild
                >
                  <Link href="/dashboard/historico">
                    Ver todos
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCuts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Scissors className="h-10 w-10 mb-3 opacity-20" />
                      <p>Nenhum corte gerado ainda</p>
                      <p className="text-xs mt-1">Envie um vídeo para começar!</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {recentCuts.slice(0, 2).map((corte: any) => (
                  <Link
                    key={corte.id}
                    href={`/dashboard/cortes/${corte.videoId}`}
                    className="group cursor-pointer overflow-hidden rounded-lg border transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="relative aspect-[9/16] bg-black">
                      {corte.videoUrl ? (
                        <video 
                          src={corte.videoUrl} 
                          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          muted 
                          onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseOut={(e) => {
                            (e.target as HTMLVideoElement).pause();
                            (e.target as HTMLVideoElement).currentTime = 0;
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/30">
                           <Scissors className="h-8 w-8 opacity-20" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/20 pointer-events-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                          <Play className="ml-0.5 h-4 w-4" />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 right-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {corte.duracao}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">
                        {corte.titulo}
                      </p>
                      <div className="mt-1 flex gap-1">
                        {corte.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="text-[10px] text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Card de dicas */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Dica do CortexAI</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Vídeos com mais de 10 minutos geram melhores cortes. A IA
                    consegue identificar mais momentos de destaque quando há
                    mais conteúdo para analisar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   Componente do formulário dentro do Dialog
   ========================================== */
function NewCutForm({
  videoUrl,
  setVideoUrl,
  advancedOpen,
  setAdvancedOpen,
  generateSubtitles,
  setGenerateSubtitles,
  viralTitle,
  setViralTitle,
  videoLanguage,
  setVideoLanguage,
  cutStyle,
  setCutStyle,
  isProcessing,
  onProcess,
  selectedFile,
  setSelectedFile,
}: {
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (v: boolean) => void;
  generateSubtitles: boolean;
  setGenerateSubtitles: (v: boolean) => void;
  viralTitle: boolean;
  setViralTitle: (v: boolean) => void;
  videoLanguage: string;
  setVideoLanguage: (v: string) => void;
  cutStyle: "blur" | "fill";
  setCutStyle: (v: "blur" | "fill") => void;
  isProcessing: boolean;
  onProcess: () => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
}) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="link">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Colar Link
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="mt-4">
          <Input
            placeholder="Cole aqui o link do YouTube, Vimeo ou qualquer vídeo..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="h-12"
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 transition-colors hover:border-primary/50 relative">
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {selectedFile
                ? selectedFile.name
                : "Arraste um vídeo ou clique para selecionar"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, MOV, AVI, MKV ou WEBM (máx. 1GB)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Opções Avançadas */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Opções Avançadas
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span>📝</span>
              <div>
                <p className="text-sm font-medium">Gerar Legendas</p>
                <p className="text-xs text-muted-foreground">
                  Legendas automáticas nos cortes
                </p>
              </div>
            </div>
            <Switch
              checked={generateSubtitles}
              onCheckedChange={setGenerateSubtitles}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span>🔥</span>
              <div>
                <p className="text-sm font-medium">Título Viral (IA)</p>
                <p className="text-xs text-muted-foreground">
                  Título chamativo gerado pela IA
                </p>
              </div>
            </div>
            <Switch checked={viralTitle} onCheckedChange={setViralTitle} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span>🌐</span>
              <div>
                <p className="text-sm font-medium">Idioma do Vídeo</p>
                <p className="text-xs text-muted-foreground">
                  Forçar idioma para transcrição
                </p>
              </div>
            </div>
            <Select value={videoLanguage} onValueChange={setVideoLanguage}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detectar Auto</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
                <SelectItem value="es">Espanhol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-3 mb-3">
              <span>🎬</span>
              <div>
                <p className="text-sm font-medium">Estilo do Corte</p>
                <p className="text-xs text-muted-foreground">
                  Como o vídeo será adaptado para vertical
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCutStyle("blur")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  cutStyle === "blur"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Monitor className="h-6 w-6 text-primary/60" />
                <span className="text-xs font-medium">Fundo Desfocado</span>
              </button>
              <button
                onClick={() => setCutStyle("fill")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  cutStyle === "fill"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Smartphone className="h-6 w-6 text-primary/60" />
                <span className="text-xs font-medium">Preencher Tela</span>
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Botão processar */}
      <Button
        onClick={onProcess}
        disabled={isProcessing}
        className="w-full gap-2"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            Processar Vídeo
          </>
        )}
      </Button>
    </div>
  );
}
