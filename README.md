# TikTok Auto Editor

Editor video automatico in stile TikTok: l'app di per sé è interamente client-side (nessun server per montaggio/rendering, nessuna dipendenza da installare). Carichi le tue clip (o importi un video da YouTube) e una traccia audio, l'app le monta da sola **a tempo di musica**, con transizioni articolate in stile TikTok/CapCut (non semplici dissolvenze).

## Come funziona

1. **Carichi una canzone** (MP3/WAV/…) **oppure incolli il link YouTube della canzone**: l'app la decodifica con la Web Audio API e ne rileva il **BPM** e la griglia dei beat tramite un algoritmo di *spectral flux* + autocorrelazione (implementato da zero in JS, senza librerie esterne). Puoi scegliere quale porzione della canzone usare trascinando le due maniglie sulla forma d'onda, oppure scrivendo direttamente il minutaggio di inizio/fine.
2. **Carichi le clip video** (una o più, in qualsiasi risoluzione/framerate) **oppure incolli un link YouTube** (es. un video/"scene pack" già montato da altri, di cui hai i diritti d'uso) — vedi [Importare da YouTube](#importare-da-youtube) qui sotto. Puoi riordinare le clip trascinandole. Vengono riciclate automaticamente se l'edit richiede più tagli di quante clip hai caricato, continuando ogni volta da dove la clip era rimasta.
3. **Rilevamento automatico delle scene**: per le clip più lunghe di qualche secondo (e sempre per i video importati da YouTube abbastanza lunghi) l'app individua da sola i cambi di scena/inquadratura — lo stesso punteggio di "scene change" di ffmpeg, che in pratica scatta sui tagli netti e sui movimenti/cambi rapidi di inquadratura — e divide quella clip in più scene indipendenti, ciascuna poi trattata come una sorgente a sé nel montaggio.
4. **L'app costruisce l'Edit Decision List**: i tagli cadono sui beat rilevati, con un **ritmo dinamico** (tagli più rapidi nei momenti di picco energetico del brano, tagli più lenti nelle parti calme — modalità "Automatico"), o con un ritmo fisso a scelta. Ad ogni taglio viene scelta una transizione da un pool di ~40 transizioni ffmpeg `xfade` (circleopen, radial, pixelize, wipe, slide, diagonali, slice, squeeze…), pesate in base all'energia del beat, così da alternare tagli puliti e momenti più "flashy" come nei veri edit TikTok.
5. **Il rendering avviene nel browser** tramite [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm): ogni scena viene tagliata, normalizzata (scala/crop/fps) e incatenata alle altre con `xfade`, la traccia audio originale delle clip viene sostituita dalla canzone caricata (tagliata sulla porzione scelta, con fade-in/out), il tutto esportato come MP4 (H.264/AAC) scaricabile.

Nessuna clip o traccia audio lascia mai il tuo dispositivo per il montaggio: analisi del ritmo, rilevamento scene, montaggio e rendering girano tutti localmente nel browser (l'unica eccezione è l'eventuale download da YouTube, vedi sotto).

## Importare da YouTube

I browser non possono scaricare da YouTube via JavaScript (CORS + Termini di Servizio di YouTube), quindi serve un piccolo **server separato** che faccia solo questo: scaricare con `yt-dlp` (video o solo audio) e passare il file all'app, che poi fa tutto il resto (rilevamento scene, analisi del ritmo, montaggio, rendering) come per un file caricato a mano. Il codice di questo server è in [`server/`](server/README.md), con istruzioni per farlo girare in locale, con Docker, o su Render/Railway/una VPS.

Una volta che il server gira da qualche parte, incolla il suo URL nel campo "URL del server di importazione" (viene ricordato nel browser e vale sia per la sezione canzone che per quella clip) e poi incolla il link YouTube — della canzone nella sezione 1, delle clip/scene pack nella sezione 2. Per la canzone il server scarica solo la traccia audio, senza video.

⚠️ Usa questa funzione solo con video/musica di cui hai i diritti d'uso.

## Come si usa

Basta aprire `index.html` in un browser desktop o mobile aggiornato (serve supporto a WebAssembly e Web Audio API — va bene qualunque browser moderno). Nessuna installazione, build o account richiesti per la parte di montaggio; l'importazione da YouTube richiede invece il server separato descritto sopra.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: `index.html` nella root è il punto d'ingresso dell'app. Non è necessaria alcuna build: i moduli JS sono caricati come `<script type="module">` nativi e ffmpeg.wasm viene caricato a runtime da CDN (jsDelivr). Il server di importazione YouTube in `server/` **non** fa parte di questo deploy statico: va ospitato separatamente (vedi sopra).

## Struttura del progetto

- `index.html` — markup e struttura della pagina.
- `css/style.css` — tema visivo.
- `js/beatDetector.js` — decodifica audio + rilevamento BPM/beat/energia (FFT, spectral flux, autocorrelazione, phase search).
- `js/transitions.js` — pool di transizioni `xfade` (sottili/flashy) e logica di scelta.
- `js/edl.js` — costruzione dell'Edit Decision List: pacing dinamico, rotazione delle scene, durate/offset delle transizioni.
- `js/sceneDetect.js` — rilevamento automatico dei cambi scena in un video lungo (usa ffmpeg.wasm).
- `js/ffmpegEngine.js` — istanza condivisa di ffmpeg.wasm, generazione del grafo di filtri (`filter_complex`) ed esecuzione del rendering.
- `js/waveform.js` — visualizzazione interattiva della forma d'onda, della griglia dei beat e dell'anteprima dei tagli.
- `js/app.js` — collegamento dell'interfaccia (upload, import YouTube, riordino/divisione clip, impostazioni, progresso, download).
- `server/` — backend separato per l'importazione da YouTube (yt-dlp), vedi [`server/README.md`](server/README.md).
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Limiti noti

- Il rendering gira su un core ffmpeg.wasm a singolo thread (per funzionare su GitHub Pages senza header COOP/COEP dedicati): video lunghi o con molte clip pesanti possono richiedere qualche minuto.
- La memoria disponibile è quella del browser: con clip molto pesanti (centinaia di MB) il rendering può rallentare o fallire per memoria esaurita.
- L'importazione da YouTube richiede che tu gestisca (o usi) un server separato — GitHub Pages da solo non può farlo.
