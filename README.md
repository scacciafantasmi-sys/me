# Politis-IT — Fonda il Tuo Partito

> Questo repository ospita più mini-giochi statici indipendenti. Il gioco descritto qui sotto (`index.html`) è il primo; vedi anche [`villa-franca.html`](villa-franca.html) — **Villa Franca 1980**, un roguelike testuale pre-alpha ambientato in un paese immaginario di Sicilia nel 1980, ispirato ai server GTA RP (creazione personaggio, tempo a ore, permadeath, wipe annuale) — e [`azzurri82.html`](azzurri82.html) — **Notti Azzurre 82-26**, un football-manager delle Nazionali che segue l'Italia da Spagna '82 al Mondiale 2026.

Gioco di simulazione politica italiana, interamente client-side: un unico file HTML, nessun server, nessun backend, nessuna dipendenza da installare.

Vesti i panni del fondatore di un nuovo partito politico italiano, partendo da zero: scegli tra oltre una dozzina di filiazioni ideologiche e otto stili di leadership, gestisci fondi/iscritti/sezioni, assumi lo staff del partito, affronta situazioni settimanali sempre diverse e conduci il partito fino alle elezioni — con soglie reali del 3% (liste singole) e 10% (coalizioni). Il gioco è pensato per essere **endless**: dopo ogni elezione la simulazione continua.

## Come si gioca

Basta aprire `index.html` in un browser (anche da mobile) — nessuna installazione richiesta, nessuna intelligenza artificiale, nessuna chiave, nessuna connessione di rete necessaria per giocare. La partita si salva automaticamente nel browser (`localStorage`) e può anche essere esportata/importata come file JSON dal pannello di gioco, per portarla su un altro dispositivo o metterla al sicuro.

### Iniziativa Libera e situazioni settimanali

Ogni settimana il gioco compone una situazione da affrontare combinando temi, angolazioni narrative, città italiane reali, partiti rivali reali e il tono dato dallo stile di leadership scelto: le combinazioni possibili sono centinaia di migliaia, e restano coerenti nel tempo perché il generatore tiene conto di cosa il partito ha già fatto nelle settimane precedenti. Puoi sempre rispondere scrivendo liberamente cosa vuole fare o dire il tuo partito ("Iniziativa Libera"): il testo viene letto da un'analisi euristica locale (specificità, coerenza ideologica, contenuti gravi, impatto economico) — tutto calcolato istantaneamente nel browser, senza alcun modello linguistico esterno.

## Notti Azzurre 82-26

Football-manager delle Nazionali, giocato come CT dell'Italia: la carriera parte sempre dai Mondiali di Spagna 1982 e attraversa, un'edizione alla volta (Mondiale o Europeo), tutta la storia della Nazionale fino al Mondiale 2026 — 23 edizioni in tutto. Ogni edizione segue qualificazioni e amichevoli con calendario generato in stile realistico, convocazioni (lista provvisoria e rosa definitiva), scelta di modulo/mentalità/pressing/ampiezza fra dieci sistemi tattici, e partite simulate minuto per minuto a velocità scelta dal giocatore (lenta/media/veloce/velocissima), con cronaca testuale, cambi, cartellini, infortuni, pagelle a fine partita e titolo di giornale. Il numero massimo di sostituzioni per gara segue le regole storiche dell'epoca (2 fino al 1994, 3 fino al 2018, 5 da Euro 2020 in poi). Quattro livelli di difficoltà (facile/media/difficile/realistica) scalano la forza della CPU. A fine carriera, per ogni edizione, il gioco confronta l'esito ottenuto in partita con quanto accaduto realmente alla Nazionale in quegli anni.

Per le edizioni di Spagna '82, Italia '90, USA '94, Germania 2006 ed Euro 2020 la rosa azzurra è quasi interamente storica (giocatori realmente convocati, club e ruoli reali); per le altre edizioni un nucleo di giocatori realmente convocati in quegli anni è integrato da compagni generati proceduralmente per completare la rosa. Gli avversari (oltre 50 nazionali, incluse le denominazioni storiche come Germania Ovest, URSS e Cecoslovacchia) hanno una forza di base coerente con la loro storia calcistica, ma le rose avversarie sono generate. È un gioco di finzione a scopo di ambientazione storica: l'esito di ogni partita è sempre determinato dalla simulazione, non dalla cronaca reale — l'obiettivo dichiarato è proprio poter riscrivere la storia della Nazionale.

## Hosting

Questo repository è pubblicato tramite **GitHub Pages** direttamente da questo branch: il file `index.html` nella root è il gioco principale. Non è necessaria alcuna build, server o manutenzione continua.

## Struttura del progetto

- `index.html` — Politis-IT: l'intero gioco (markup, CSS e logica JavaScript in un solo file).
- `villa-franca.html` — Villa Franca 1980: roguelike testuale pre-alpha, anch'esso un unico file autonomo, nessuna dipendenza da `index.html`.
- `azzurri82.html` — Notti Azzurre 82-26: football-manager delle Nazionali, anch'esso un unico file autonomo.
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Note

- Nessun dato di gioco viene mai inviato a server propri: tutto vive nel browser dell'utente.
- Politis-IT è dichiaratamente uno scenario-planning ipotetico/fittizio e non rappresenta fatti reali o dichiarazioni reali di persone viventi.
- Villa Franca e tutti i suoi abitanti sono interamente immaginari; il calendario storico del 1980 richiama invece fatti realmente accaduti, riportati in forma sintetica e neutra.
- Notti Azzurre 82-26 usa nomi di calciatori realmente convocati dalla Nazionale a scopo di ambientazione storica; l'andamento di ogni partita è sempre simulato e può discostarsi liberamente dalla storia reale.
