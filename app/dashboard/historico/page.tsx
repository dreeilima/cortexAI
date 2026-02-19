"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, ChevronRight, Filter } from "lucide-react";
import { mockHistorico } from "@/lib/mock-data";

const statusConfig = {
  concluido: {
    label: "Concluído",
    variant: "default" as const,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  aguardando: {
    label: "Aguardando",
    variant: "secondary" as const,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  erro: {
    label: "Erro",
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export default function HistoricoPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  const filtered = mockHistorico.filter((item) => {
    const matchSearch =
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "todos" || item.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Histórico de cortes</h1>
        <p className="text-muted-foreground">
          Acompanhe todos os seus cortes processados
        </p>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID dos cortes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="erro">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const config = statusConfig[item.status];
          return (
            <Card key={item.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 sm:items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.nome}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.data}
                    </p>
                    {item.status === "aguardando" && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                        Processando vídeo...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={config.className}>
                      {config.label}
                    </Badge>
                    {item.status === "concluido" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:inline-flex"
                        asChild
                      >
                        <Link href={`/dashboard/cortes/${item.id}`}>
                          <span className="text-xs mr-1">
                            {item.cortesCount} cortes
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Mobile: link para cortes */}
                {item.status === "concluido" && (
                  <div className="mt-2 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1 text-xs"
                      asChild
                    >
                      <Link href={`/dashboard/cortes/${item.id}`}>
                        Ver {item.cortesCount} cortes
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
