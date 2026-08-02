# POLITIS-IT

Web app di simulazione politica, economica ed elettorale italiana (e internazionale), basata sull'API di Claude. Interfaccia di chat Next.js con streaming delle risposte.

Il motore simula in modo dichiaratamente **fittizio** (scenario-planning ipotetico) l'evoluzione settimanale del sistema politico italiano: sondaggi, spread, calendario parlamentare, dossier di crisi, prime pagine e trend social. Vedi `lib/systemPrompt.ts` per il system prompt completo, incluse le regole editoriali che impediscono di presentare contenuti generati come fatti reali o dichiarazioni reali di persone viventi.

## Setup

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Copia `.env.example` in `.env.local` e imposta la tua chiave API:

   ```bash
   cp .env.example .env.local
   ```

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   Puoi ottenere una chiave da [console.anthropic.com](https://console.anthropic.com/).

3. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

4. Apri [http://localhost:3000](http://localhost:3000) e scrivi "Inizia la simulazione" per far generare al motore la prima settimana.

## Struttura del progetto

- `app/page.tsx` — interfaccia di chat (React, client component), con rendering markdown della dashboard settimanale.
- `app/api/chat/route.ts` — route handler che inoltra la conversazione all'API di Claude in streaming.
- `lib/systemPrompt.ts` — persona/system prompt di POLITIS-IT v5.0.
- `lib/anthropic.ts` — client Anthropic SDK e configurazione modello (`ANTHROPIC_MODEL`, default `claude-sonnet-5`).

## Note

- La chiave API resta lato server (usata solo nella route handler) e non viene mai esposta al client.
- Il modello di default è configurabile tramite la variabile d'ambiente `ANTHROPIC_MODEL`.
