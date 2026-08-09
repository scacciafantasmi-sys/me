# TikTok Auto Editor

Editor video automatico in stile TikTok, interamente client-side: nessun server, nessun backend, nessuna dipendenza da installare. Carichi le tue clip e una traccia audio, l'app le monta da sola **a tempo di musica**, con transizioni articolate in stile TikTok/CapCut (non semplici dissolvenze).

## Come funziona

1. **Carichi una canzone** (MP3/WAV/…): l'app la decodifica con la Web Audio API e ne rileva il **BPM** e la griglia dei beat tramite un algoritmo di *spectral flux* + autocorrelazione (implementato da zero in JS, senza librerie esterne). Puoi scegliere quale porzione della canzone usare trascinando le due maniglie sulla forma d'onda, oppure scrivendo direttamente il minutaggio di inizio/fine.
2. **Carichi le clip video** (una o più, in qualsiasi risoluzione/framerate): puoi riordinarle trascinandole. Vengono riciclate automaticamente se l'edit richiede più tagli di quante clip hai caricato, continuando ogni volta da dove la clip era rimasta.
3. **Rilevamento automatico delle scene**: qualunque clip più lunga di 20 secondi viene divisa da sola in scene — l'app individua i cambi di scena/inquadratura con lo stesso punteggio di "scene change" di ffmpeg, che in pratica scatta sui tagli netti e sui movimenti/cambi rapidi di inquadratura — e tratta ogni scena come una sorgente a sé nel montaggio. Per le clip un po' più corte (ma non cortissime) la divisione non parte da sola ma resta disponibile a comando con un pulsante ✂️ sulla clip. Utile per caricare un video lungo (es. uno "scene pack" scaricato altrove) e lasciare che il sito lo spezzi da solo.
4. **L'app costruisce l'Edit Decision List**: i tagli cadono sui beat rilevati, con un **ritmo dinamico** (tagli più rapidi nei momenti di picco energetico del brano, tagli più lenti nelle parti calme — modalità "Automatico"), o con un ritmo fisso a scelta. Ad ogni taglio viene scelta una transizione da un pool di ~40 transizioni ffmpeg `xfade` (circleopen, radial, pixelize, wipe, slide, diagonali, slice, squeeze…), pesate in base all'energia del beat, così da alternare tagli puliti e momenti più "flashy" come nei veri edit TikTok.
5. **Il rendering avviene nel browser** tramite [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm): ogni scena viene tagliata, normalizzata (scala/crop/fps) e incatenata alle altre con `xfade`, la traccia audio originale delle clip viene sostituita dalla canzone caricata (tagliata sulla porzione scelta, con fade-in/out), il tutto esportato come MP4 (H.264/AAC) scaricabile.

Nessuna clip o traccia audio lascia mai il tuo dispositivo: analisi del ritmo, rilevamento scene, montaggio e rendering girano tutti localmente nel browser.

Per usare musica o clip prese da YouTube: scaricale prima con uno strumento a parte (di contenuti di cui hai i diritti d'uso) e caricale come faresti con un file qualsiasi — il rilevamento del ritmo e la divisione in scene partono comunque in automatico.

## Come si usa

Basta aprire `index.html` in un browser desktop o mobile aggiornato (serve supporto a WebAssembly e Web Audio API — va bene qualunque browser moderno). Nessuna installazione, build o account richiesti.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: `index.html` nella root è il punto d'ingresso dell'app. Non è necessaria alcuna build: i moduli JS sono caricati come `<script type="module">` nativi e ffmpeg.wasm viene caricato a runtime da CDN (jsDelivr).

## Struttura del progetto

- `index.html` — markup e struttura della pagina.
- `css/style.css` — tema visivo.
- `js/beatDetector.js` — decodifica audio + rilevamento BPM/beat/energia (FFT, spectral flux, autocorrelazione, phase search).
- `js/transitions.js` — pool di transizioni `xfade` (sottili/flashy) e logica di scelta.
- `js/edl.js` — costruzione dell'Edit Decision List: pacing dinamico, rotazione delle scene, durate/offset delle transizioni.
- `js/sceneDetect.js` — rilevamento automatico dei cambi scena in un video lungo (usa ffmpeg.wasm).
- `js/ffmpegEngine.js` — istanza condivisa di ffmpeg.wasm, generazione del grafo di filtri (`filter_complex`) ed esecuzione del rendering.
- `js/vendor/ffmpeg-wasm/` — copia locale (stessa origine del sito) dei file `dist/esm` di `@ffmpeg/ffmpeg`: necessaria perché quella libreria crea un Web Worker, e i browser rifiutano di costruire un Worker con script su un'origine diversa dal sito — vedi il README in quella cartella per i dettagli.
- `js/waveform.js` — visualizzazione interattiva della forma d'onda, della griglia dei beat e dell'anteprima dei tagli.
- `js/app.js` — collegamento dell'interfaccia (upload, riordino/divisione clip, impostazioni, progresso, download).
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Limiti noti

- Il rendering gira su un core ffmpeg.wasm a singolo thread (per funzionare su GitHub Pages senza header COOP/COEP dedicati): video lunghi o con molte clip pesanti possono richiedere qualche minuto.
- La memoria disponibile è quella del browser: con clip molto pesanti (centinaia di MB) il rendering può rallentare o fallire per memoria esaurita.
