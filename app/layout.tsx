import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CortexAI - Transforme vídeos longos em cortes virais",
  description:
    "Use inteligência artificial para identificar os melhores momentos dos seus vídeos e gerar cortes verticais prontos para TikTok, Reels e Shorts automaticamente.",
  keywords: [
    "cortes de vídeo",
    "IA",
    "inteligência artificial",
    "TikTok",
    "Reels",
    "Shorts",
    "vídeo vertical",
    "criador de conteúdo",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
