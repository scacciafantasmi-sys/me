# Politis-IT — Fonda il Tuo Partito

> Questo repository ospita più mini-giochi statici indipendenti. Il gioco descritto qui sotto (`index.html`) è il primo; vedi anche [`villa-franca.html`](villa-franca.html) — **Villa Franca 1980**, un roguelike testuale pre-alpha ambientato in un paese immaginario di Sicilia nel 1980, ispirato ai server GTA RP (creazione personaggio, tempo a ore, permadeath, wipe annuale).

Gioco di simulazione politica italiana, interamente client-side: un unico file HTML, nessun server, nessun backend, nessuna dipendenza da installare.

Vesti i panni del fondatore di un nuovo partito politico italiano, partendo da zero: scegli tra oltre una dozzina di filiazioni ideologiche e otto stili di leadership, gestisci fondi/iscritti/sezioni, assumi lo staff del partito, affronta situazioni settimanali sempre diverse e conduci il partito fino alle elezioni — con soglie reali del 3% (liste singole) e 10% (coalizioni). Il gioco è pensato per essere **endless**: dopo ogni elezione la simulazione continua.

## Come si gioca

Basta aprire `index.html` in un browser (anche da mobile) — nessuna installazione richiesta, nessuna intelligenza artificiale, nessuna chiave, nessuna connessione di rete necessaria per giocare. La partita si salva automaticamente nel browser (`localStorage`) e può anche essere esportata/importata come file JSON dal pannello di gioco, per portarla su un altro dispositivo o metterla al sicuro.

### Iniziativa Libera e situazioni settimanali

Ogni settimana il gioco compone una situazione da affrontare combinando temi, angolazioni narrative, città italiane reali, partiti rivali reali e il tono dato dallo stile di leadership scelto: le combinazioni possibili sono centinaia di migliaia, e restano coerenti nel tempo perché il generatore tiene conto di cosa il partito ha già fatto nelle settimane precedenti. Puoi sempre rispondere scrivendo liberamente cosa vuole fare o dire il tuo partito ("Iniziativa Libera"): il testo viene letto da un'analisi euristica locale (specificità, coerenza ideologica, contenuti gravi, impatto economico) — tutto calcolato istantaneamente nel browser, senza alcun modello linguistico esterno.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: il file `index.html` nella root è l'intero gioco. Non è necessaria alcuna build, server o manutenzione continua.

## Struttura del progetto

- `index.html` — Politis-IT: l'intero gioco (markup, CSS e logica JavaScript in un solo file).
- `villa-franca.html` — Villa Franca 1980: roguelike testuale pre-alpha, anch'esso un unico file autonomo, nessuna dipendenza da `index.html`.
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Note

- Nessun dato di gioco viene mai inviato a server propri: tutto vive nel browser dell'utente.
- Politis-IT è dichiaratamente uno scenario-planning ipotetico/fittizio e non rappresenta fatti reali o dichiarazioni reali di persone viventi.
- Villa Franca e tutti i suoi abitanti sono interamente immaginari; il calendario storico del 1980 richiama invece fatti realmente accaduti, riportati in forma sintetica e neutra.
