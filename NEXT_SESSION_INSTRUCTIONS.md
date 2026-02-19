# � Guia de Implementação: CortexAI Backend (n8n + AI)

Este documento detalha **exatamente** como construir o "Cérebro" da operação no n8n.

## 🔄 Fluxo Completo (Architecture)

1.  **Next.js** envia sinal para **n8n** (Webhook).
2.  **n8n** baixa o vídeo do **R2**.
3.  **n8n** transcreve o áudio (OpenAI Whisper / Deepgram).
4.  **n8n** analisa a transcrição com **GPT-4o**.
5.  **n8n** gera os cortes (FFmpeg).
6.  **n8n** atualiza o **Supabase** e notifica o usuário.

---

## 🛠️ Passo a Passo da Construção do Workflow

### 1. Webhook (Trigger)

Configurar nodo **Webhook** (Method: `POST`).
**Payload Esperado (JSON):**

```json
{
  "videoId": "uuid-do-video",
  "userId": "uuid-do-usuario",
  "videoUrl": "https://pub-xxxx.r2.dev/nome-do-arquivo.mp4",
  "title": "Titulo do Video.mp4"
}
```

### 2. Transcrição (Ouvidos da AI)

Usar nodo **OpenAI** (Audio -> Transcriptions) ou **Deepgram**.

- **Input**: Binary Data (baixado do `videoUrl`).
- **Prompt**: "Gere timestamps precisos."
- **Output**: Texto completo com timestamps.

### 3. Inteligência de Cortes (Cérebro)

Usar nodo **OpenAI** (Chat Model: GPT-4o).
**System Prompt (Copie e Cole):**

> "Você é um editor de vídeo especialista em viralização (TikTok/Reels).
> Analise a seguinte transcrição e identifique 3 a 5 momentos com alto potencial viral.
> Critérios: Humor, Curiosidade, Polêmica ou Ensinamento Rápido.
> Duração: Entre 30s e 60s.
> Retorne **APENAS** um JSON no formato:
> `[{ "start": "00:00:10", "end": "00:00:55", "summary": "Explicação sobre X", "viral_score": 95 }]`"

### 4. Processamento de Vídeo (Mãos na Massa)

Aqui temos o desafio técnico (Heavy Lifting).
**Opção A (Simples/Home):** Usar nodo **FFmpeg** nativo do n8n.

- Comando: Crop para 9:16.
- `ffmpeg -i input.mp4 -vf "crop=ih*(9/16):ih" output.mp4`

**Opção B (Profissional/Reference Arch):**

- O n8n chama um **Worker Externo** (pode ser outro script Python/Node rodando na sua máquina ou VPS) enviando apenas os Timestamps.
- Esse worker faz o crop inteligente (Blur Background) e devolve o link do arquivo cortado.

### 5. Salvar Resultados

Usar nodo **Supabase** (ou Postgres).

- **Update Row** na tabela `videos`.
- Setar `status` = 'completed'.
- Salvar o JSON dos cortes na coluna `cortes` (precisamos criar essa coluna JSONB se não existir, ou usar a tabela `cuts` relacionada).

---

## 📝 Checklist de Retomada

1.  [ ] **Environment**: Verificar chaves R2 e OpenAI no n8n.
2.  [ ] **Supabase**: Criar tabela/coluna para guardar o "Resultado da IA" (JSON com start/end times).
3.  [ ] **Worker**: Decidir se vai rodar o FFmpeg _dentro_ do n8n ou num script separado chamado via HTTP.
