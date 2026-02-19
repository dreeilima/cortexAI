"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  const [hashError, setHashError] = useState<{
    code: string | null;
    description: string | null;
  }>({
    code: null,
    description: null,
  });

  useEffect(() => {
    // Check for hash parameters if search params are missing
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1); // Remove the leading #
      const params = new URLSearchParams(hash);
      const hashErrorCode = params.get("error_code");
      const hashErrorDescription = params.get("error_description");

      if (hashErrorCode || hashErrorDescription) {
        setHashError({
          code: hashErrorCode,
          description: hashErrorDescription
            ? hashErrorDescription.replace(/\+/g, " ")
            : null,
        });
      }
    }
  }, []); // Run once on mount

  const finalErrorCode = errorCode || hashError.code;
  const finalErrorDescription = errorDescription || hashError.description;

  let title = "Erro de Autenticação";
  let message =
    "Ocorreu um problema ao verificar seu login. Por favor, tente novamente.";

  if (finalErrorCode === "otp_expired") {
    title = "Link Expirado";
    message =
      "Este link de verificação expirou ou é inválido. Por favor, solicite um novo link fazendo login novamente.";
  } else if (finalErrorDescription) {
    message = finalErrorDescription;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">
              <RefreshCw className="mr-2 h-4 w-4" />
              Voltar para Login
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Início
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
