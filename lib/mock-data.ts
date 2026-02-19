// Dados mockados para demonstração do CortexAI

export const pricingPlans = [
  {
    name: "Starter",
    price: "Grátis",
    description: "Ideal para testar a plataforma",
    features: [
      "3 vídeos por mês",
      "Até 30 min por vídeo",
      "Legendas automáticas",
      "Qualidade 720p",
      "1 workspace",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    description: "Para criadores de conteúdo ativos",
    features: [
      "30 vídeos por mês",
      "Até 2h por vídeo",
      "Legendas + Título Viral IA",
      "Qualidade Full HD",
      "5 workspaces",
      "Estilo Blur Background",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "R$ 149",
    period: "/mês",
    description: "Para equipes e agências",
    features: [
      "Vídeos ilimitados",
      "Até 4h por vídeo",
      "Todas as funcionalidades",
      "Qualidade 4K",
      "Workspaces ilimitados",
      "API de integração",
      "Suporte dedicado",
      "Multi-idiomas",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

export const faqItems = [
  {
    question: "Como funciona o CortexAI?",
    answer:
      "Basta colar o link do seu vídeo do YouTube ou fazer upload. Nossa IA analisa o conteúdo, identifica os momentos mais relevantes e gera cortes verticais otimizados para TikTok, Reels e Shorts automaticamente.",
  },
  {
    question: "Quais formatos de vídeo são aceitos?",
    answer:
      "Aceitamos MP4, MOV, AVI, MKV e WEBM com até 1GB de tamanho. Para links, suportamos YouTube, Vimeo e qualquer URL pública de vídeo.",
  },
  {
    question: "Quanto tempo leva para gerar os cortes?",
    answer:
      "O tempo varia conforme a duração do vídeo. Em média, um vídeo de 30 minutos gera cortes em aproximadamente 5-10 minutos. Você será notificado assim que os cortes estiverem prontos.",
  },
  {
    question: "Posso personalizar as legendas e títulos?",
    answer:
      "Sim! A IA gera legendas e títulos virais automaticamente, mas você pode editá-los antes de publicar. Também é possível configurar o estilo das legendas.",
  },
  {
    question: "O que são workspaces?",
    answer:
      "Workspaces permitem que você organize seus vídeos por canal ou projeto. Cada workspace tem seus próprios cortes, histórico e configurações, ideal para quem gerencia múltiplos canais.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. Seus créditos restantes ficam disponíveis até o final do período pago.",
  },
];

export const features = [
  {
    icon: "Scissors",
    title: "Cortes Automáticos",
    description:
      "A IA identifica os melhores momentos e gera cortes prontos para publicar.",
  },
  {
    icon: "Zap",
    title: "Processamento Rápido",
    description:
      "Pipeline otimizado que entrega seus cortes em minutos, não horas.",
  },
  {
    icon: "Smartphone",
    title: "Formato Vertical",
    description:
      "Vídeos adaptados automaticamente para TikTok, Reels e Shorts (9:16).",
  },
  {
    icon: "Rocket",
    title: "Pronto para Redes",
    description:
      "Legendas, títulos virais e hashtags gerados pela IA para maximizar alcance.",
  },
];

// Dados mockados do dashboard
export const mockStats = {
  videosProcessados: 12,
  cortesGerados: 47,
  emProcessamento: 2,
};

export const mockWorkspaces = [
  {
    id: "ws-1",
    name: "Canal Principal",
    icon: "🎬",
    stats: { videos: 8, cortes: 32 },
  },
  {
    id: "ws-2",
    name: "Canal de Tecnologia",
    icon: "💻",
    stats: { videos: 4, cortes: 15 },
  },
];

export const mockHistorico = [
  {
    id: "vid-001",
    nome: "Como usar IA para criar conteúdo",
    data: "19 de fevereiro às 10:12",
    status: "concluido" as const,
    cortesCount: 6,
  },
  {
    id: "vid-002",
    nome: "Tutorial de FFmpeg avançado",
    data: "18 de fevereiro às 15:30",
    status: "concluido" as const,
    cortesCount: 4,
  },
  {
    id: "vid-003",
    nome: "Review do novo MacBook Pro",
    data: "19 de fevereiro às 11:00",
    status: "aguardando" as const,
    cortesCount: 0,
  },
];

export const mockCortes = [
  {
    id: "corte-1",
    titulo: "Automação com IA",
    legenda:
      "Cansei de tutoriais inúteis — vamos falar de automação que realmente funciona e muda o jogo...",
    tags: ["#automação", "#produtividade", "#IA"],
    duracao: "0:45",
    thumbnail: "/api/placeholder/270/480",
  },
  {
    id: "corte-2",
    titulo: "VPS é a solução",
    legenda:
      "Quer rodar automações sem ficar na máquina? Eu mostro por que uma VPS é o melhor custo-benefício...",
    tags: ["#VPS", "#infraestrutura", "#DevOps"],
    duracao: "0:38",
    thumbnail: "/api/placeholder/270/480",
  },
  {
    id: "corte-3",
    titulo: "Segurança na Web",
    legenda:
      "Não coloque suas credenciais no código — nunca. Escuta o que eu tenho pra te falar sobre segurança...",
    tags: ["#segurança", "#webscraping", "#proxy"],
    duracao: "1:15",
    thumbnail: "/api/placeholder/270/480",
  },
  {
    id: "corte-4",
    titulo: "LLMs Gratuitas",
    legenda:
      "Eu mostro uma alternativa menos conhecida pra testar LLMs direto no OpenRouter — vale pra quem quer economia...",
    tags: ["#LLM", "#OpenRouter", "#IA"],
    duracao: "0:55",
    thumbnail: "/api/placeholder/270/480",
  },
  {
    id: "corte-5",
    titulo: "Quanto custa isso?",
    legenda:
      "Na comparação de preços de LLMs mostro por que um modelo pode ser imbatível pelo custo — ideal pra startup...",
    tags: ["#custos", "#LLM", "#startup"],
    duracao: "0:31",
    thumbnail: "/api/placeholder/270/480",
  },
  {
    id: "corte-6",
    titulo: "WebScraping Seguro",
    legenda:
      "Eu mostro a arquitetura segura pra um serviço OpenSauce que guarda credenciais de web scraping...",
    tags: ["#segurança", "#webscraping"],
    duracao: "1:10",
    thumbnail: "/api/placeholder/270/480",
  },
];
