# Politis-IT — Fonda il Tuo Partito

Gioco di simulazione politica italiana, interamente client-side: un unico file HTML, nessun server, nessun backend, nessuna dipendenza da installare.

Vesti i panni del fondatore di un nuovo partito politico italiano, partendo da zero: scegli l'ideologia, lo stile di leadership, gestisci fondi/iscritti/sezioni, assumi lo staff del partito, affronta dossier settimanali (crisi, media, correnti interne) e conduci il partito fino alle elezioni — con soglie reali del 3% (liste singole) e 10% (coalizioni). Il gioco è pensato per essere **endless**: dopo ogni elezione la simulazione continua.

## Come si gioca

Basta aprire `index.html` in un browser (anche da mobile) — nessuna installazione richiesta. La partita si salva automaticamente nel browser (`localStorage`) e può anche essere esportata/importata come file JSON dal pannello di gioco, per portarla su un altro dispositivo o metterla al sicuro.

### Intelligenza artificiale (opzionale)

Il gioco include una modalità "Iniziativa Libera" in cui puoi scrivere liberamente cosa vuole fare il tuo partito in una settimana. Per un impatto realistico generato da un modello linguistico, puoi collegare gratuitamente una chiave API di **Google Gemini** (ottenibile su [aistudio.google.com](https://aistudio.google.com/)) dal pannello impostazioni del gioco. La chiave resta **solo nel tuo browser** (mai su alcun server) e viene inviata direttamente all'API di Google. Senza chiave, il gioco usa comunque una risoluzione automatica delle iniziative libere, meno raffinata ma pienamente funzionante.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: il file `index.html` nella root è l'intero gioco. Non è necessaria alcuna build, server o manutenzione continua.

## Struttura del progetto

- `index.html` — l'intero gioco (markup, CSS e logica JavaScript in un solo file).
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Note

- Nessun dato di gioco o chiave API viene mai inviato a server propri: tutto vive nel browser dell'utente.
- Il gioco è dichiaratamente uno scenario-planning ipotetico/fittizio e non rappresenta fatti reali o dichiarazioni reali di persone viventi.
