# Politis-IT — Fonda il Tuo Partito

> Questo repository ospita più mini-giochi statici indipendenti. Il gioco descritto qui sotto (`index.html`) è il primo; vedi anche [`piscina.html`](piscina.html) — **Vestiti in Piscina**, un dress-up game in cui vesti un personaggio con moltissimi costumi e accessori e poi lo tuffi a nuotare in piscina.

Gioco di simulazione politica italiana, interamente client-side: un unico file HTML, nessun server, nessun backend, nessuna dipendenza da installare.

Vesti i panni del fondatore di un nuovo partito politico italiano, partendo da zero: scegli tra oltre una dozzina di filiazioni ideologiche e otto stili di leadership, gestisci fondi/iscritti/sezioni, assumi lo staff del partito, affronta situazioni settimanali sempre diverse e conduci il partito fino alle elezioni — con soglie reali del 3% (liste singole) e 10% (coalizioni). Il gioco è pensato per essere **endless**: dopo ogni elezione la simulazione continua.

## Come si gioca

Basta aprire `index.html` in un browser (anche da mobile) — nessuna installazione richiesta, nessuna intelligenza artificiale, nessuna chiave, nessuna connessione di rete necessaria per giocare. La partita si salva automaticamente nel browser (`localStorage`) e può anche essere esportata/importata come file JSON dal pannello di gioco, per portarla su un altro dispositivo o metterla al sicuro.

### Iniziativa Libera e situazioni settimanali

Ogni settimana il gioco compone una situazione da affrontare combinando temi, angolazioni narrative, città italiane reali, partiti rivali reali e il tono dato dallo stile di leadership scelto: le combinazioni possibili sono centinaia di migliaia, e restano coerenti nel tempo perché il generatore tiene conto di cosa il partito ha già fatto nelle settimane precedenti. Puoi sempre rispondere scrivendo liberamente cosa vuole fare o dire il tuo partito ("Iniziativa Libera"): il testo viene letto da un'analisi euristica locale (specificità, coerenza ideologica, contenuti gravi, impatto economico) — tutto calcolato istantaneamente nel browser, senza alcun modello linguistico esterno.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: il file `index.html` nella root è l'intero gioco. Non è necessaria alcuna build, server o manutenzione continua.

## Struttura del progetto

- `index.html` — l'intero gioco (markup, CSS e logica JavaScript in un solo file).
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Note

- Nessun dato di gioco viene mai inviato a server propri: tutto vive nel browser dell'utente.
- Il gioco è dichiaratamente uno scenario-planning ipotetico/fittizio e non rappresenta fatti reali o dichiarazioni reali di persone viventi.

---

## Vestiti in Piscina — dress-up game (`piscina.html`)

Un secondo gioco, anch'esso interamente client-side in un unico file HTML (`piscina.html`), indipendente da Politis-IT.

Vesti un personaggio femminile disegnato in stile vettoriale (con ombreggiature a gradiente su pelle e capelli per un look più realistico) scegliendo tra moltissime combinazioni: 6 acconciature (ognuna con 12 colori), 7 stili di top costume, 4 stili di slip, 13 colori/fantasie per il costume (tinte unite, righe, pois, fiori), 5 copricostume, 5 copricapi, 3 occhiali, 4 set di gioielli, accessori da piscina e **abbigliamento casual** — maglietta, felpa, jeans skinny, jeans baggy (ognuno con più colori), sneaker stile AF1 e stivali — per decine di migliaia di outfit possibili. Un pulsante "Sorprendimi" genera un outfit casuale, e l'outfit scelto viene salvato automaticamente nel browser (`localStorage`).

Premendo "Tuffati in piscina" il personaggio si immerge in acqua con un'animazione di nuotata (bracciate, gambe, increspature, bollicine) mantenendo tutti i vestiti indossati — compresi jeans, maglietta o felpa — per l'appunto per poter "nuotare vestiti" in piscina. Mentre è in acqua compare un mini D-pad touch-friendly (funziona anche con le frecce della tastiera) per far nuotare il personaggio a destra/sinistra/su/giù dentro la piscina. Uscendo dall'acqua i vestiti restano visibilmente bagnati (colori più scuri e satinati, gocce che cadono, pozzanghera ai piedi) finché non si preme "Asciugamano" per asciugarsi.

Apri semplicemente `piscina.html` in un browser: nessuna build, nessun server, nessuna dipendenza esterna. Funziona anche su smartphone/tablet con controlli touch.
