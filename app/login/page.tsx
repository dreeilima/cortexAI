"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ArrowRight,
  Play,
  Scissors,
  LogIn,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { login, signup, loginWithGoogle } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register State
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", loginEmail);
    formData.append("password", loginPassword);

    try {
      const result = await login(formData);
      if (result?.error) {
        toast.error("Erro ao entrar: " + result.error);
      } else if (result?.success) {
        toast.dismiss(); // Clean existing toasts
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error); // Log error for debugging
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", registerEmail);
    formData.append("password", registerPassword);
    formData.append("fullName", registerName);
    formData.append("origin", window.location.origin);

    try {
      const result = await signup(formData);
      if (result?.error) {
        toast.error("Erro ao cadastrar: " + result.error);
      } else if (result?.success) {
        toast.success(result.message);
        setLoginEmail(registerEmail);
        // Switch to login tab ideally
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error("Erro ao iniciar login com Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado esquerdo - Branding */}
      <div className="relative hidden flex-col justify-between bg-muted/30 p-10 lg:flex">
        {/* Gradients de fundo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">CortexAI</span>
        </Link>

        {/* Ilustração central */}
        <div className="relative flex flex-col items-center">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">
              Transforme vídeos longos em cortes virais com IA
            </h2>
          </div>

          {/* Animação visual */}
          <div className="flex items-center gap-6">
            {/* Vídeo original */}
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium">Video.mp4</span>
              </div>
              <div className="h-24 w-40 rounded-md bg-muted animate-pulse" />
              <p className="mt-1 text-xs text-muted-foreground">2:45:30</p>
            </div>

            <ArrowRight className="h-6 w-6 text-primary" />

            {/* Cortes */}
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5"
                >
                  <Scissors className="h-3 w-3 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-primary">Clip {i}</p>
                    <p className="text-[10px] text-muted-foreground">
                      00:{15 + i * 12}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              { icon: Scissors, text: "Cortes automáticos" },
              { icon: "⚡", text: "Processamento rápido" },
              { icon: "📱", text: "Formato vertical" },
              { icon: "🚀", text: "Pronto para redes" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                {typeof item.icon === "string" ? (
                  <span>{item.icon}</span>
                ) : (
                  <item.icon className="h-4 w-4 text-primary" />
                )}
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <p className="relative text-sm text-muted-foreground">
          © {new Date().getFullYear()} CortexAI. Transformando conteúdo em
          viralidade.
        </p>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md space-y-6">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">CortexAI</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Bem-vindo</h1>
            <p className="text-muted-foreground">
              Faça login ou crie uma conta para começar
            </p>
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full gap-2"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continuar com Google
          </Button>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou continue com email
              </span>
            </div>
          </div>

          {/* Tabs Login/Register */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input
                    id="register-name"
                    placeholder="Seu nome"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Termos */}
          <p className="text-center text-xs text-muted-foreground">
            <Link href="#" className="hover:underline">
              Termos de Uso
            </Link>
            {" · "}
            <Link href="#" className="hover:underline">
              Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
