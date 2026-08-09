# Server di importazione da YouTube

Piccolo backend (Express + [yt-dlp](https://github.com/yt-dlp/yt-dlp)) che scarica un video (o solo l'audio) da YouTube e lo serve al [TikTok Auto Editor](../README.md). È l'**unico** pezzo del progetto che non gira su GitHub Pages: tutto il resto (analisi del ritmo, rilevamento scene, montaggio, rendering) resta interamente nel browser dell'utente. Questo server si limita a scaricare e restituire il file — non fa nessun montaggio.

⚠️ **Usa questa funzione solo con video/musica di cui hai i diritti** (contenuti tuoi, materiale con licenza libera, uso personale/fair use secondo le leggi della tua giurisdizione). Scaricare contenuti da YouTube può violare i suoi Termini di Servizio a seconda dell'uso: la responsabilità è di chi gestisce questo server e di chi incolla i link.

## Requisiti

- Node.js 18+
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) installato e nel `PATH` (`pip install yt-dlp` oppure il binario standalone)
- `ffmpeg` installato e nel `PATH` (serve a yt-dlp per unire video e audio)

## Avvio in locale

```bash
cd server
npm install
npm start
```

Il server parte su `http://localhost:8787`. Nell'app incolla questo indirizzo nel campo "URL del server di importazione" (sezione "Colonna sonora" o "Clip video" — sono collegati, basta impostarlo una volta).

## Con Docker

```bash
cd server
docker build -t tiktok-auto-editor-yt .
docker run -p 8787:8787 -e ALLOWED_ORIGIN=https://scacciafantasmi-sys.github.io tiktok-auto-editor-yt
```

## Deploy su Render / Railway / una VPS qualsiasi

Qualunque piattaforma che sappia buildare un `Dockerfile` va bene (es. Render "Web Service" da questo repo con Root Directory `server`, o Railway "Deploy from repo"). Imposta:

- `ALLOWED_ORIGIN` — l'origine del sito (es. `https://scacciafantasmi-sys.github.io`), per limitare il CORS a chi deve davvero usarlo. Più origini separate da virgola.
- `MAX_DURATION_SECONDS` (default `1800` = 30 min) — rifiuta video più lunghi.
- `MAX_CONCURRENT_DOWNLOADS` (default `2`) — quanti download può gestire in parallelo.
- `PORT` — di solito impostata automaticamente dalla piattaforma.

Poi copi l'URL pubblico del servizio (es. `https://tuo-servizio.onrender.com`) e lo incolli nell'app come "URL del server di importazione".

## API

- `GET /api/health` → `{ ok, activeDownloads, maxConcurrent }`
- `POST /api/youtube/start` con body `{ "url": "https://www.youtube.com/watch?v=...", "kind": "video" | "audio" }` (`kind` opzionale, default `video`) → `{ jobId }`. Con `kind: "audio"` scarica solo la traccia audio migliore disponibile (niente video), utile per importare la colonna sonora.
- `GET /api/youtube/status/:jobId` → `{ status: 'downloading'|'ready'|'error', progress, title, ext, error }`
- `GET /api/youtube/file/:jobId` → stream del file (video MP4 o audio, a seconda del `kind` richiesto; solo quando `status === 'ready'`)

I job e i file temporanei vengono ripuliti automaticamente dopo 30 minuti.

## Note

- Accetta solo URL `youtube.com`/`youtu.be` (validati lato server), niente playlist intere e niente dirette live.
- Non c'è persistenza: riavviando il server tutti i job in corso vanno persi (il client dovrà semplicemente reimportare).
