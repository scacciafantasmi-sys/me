# Villa Franca 1980 — Roguelike RP

Prototipo pre-alpha di un browser game ispirato ai server GTA RP, ambientato in un **paese di Sicilia immaginario, Villa Franca**, nel 1980. È un roguelike testuale a turni orari, interamente client-side: un unico set di file HTML/CSS/JS, nessun server, nessun backend, nessuna dipendenza da installare, **nessuna intelligenza artificiale esterna e nessuna chiave API**.

> Nota importante: questo è un prototipo **single-player**. Simula l'atmosfera di un server RP vivo (NPC con relazioni, voci di paese, una "lore" che avanza in sottofondo, cronaca storica reale del 1980), ma non è un vero server multigiocatore con altri utenti o Game Master umani — quello richiederebbe un backend dedicato, fuori dallo scopo di questo primo scheletro.

## Come si gioca

Apri `index.html` in un browser (anche da mobile) — nessuna installazione richiesta. La partita si salva automaticamente nel browser (`localStorage`).

1. **Creazione del personaggio**: nome, aspetto fisico, città natale (qualunque comune italiano, in campo libero con suggerimenti), lavoro precedente, backstory scritta liberamente, distribuzione di punti abilità (26 abilità in 7 categorie, da 1 a 5) e scelta facoltativa di un oscuro segreto tra oltre 30 disponibili, ciascuno con un pregio e un difetto.
2. **Villa Franca**: oltre 30 luoghi visitabili (istituzioni, botteghe, ritrovi, porto, campagne, sedi politiche...) ciascuno con azioni proprie, orari di apertura e NPC di finzione con cui interagire.
3. **Il tempo scorre a ore**: ogni azione costa ore di gioco; la giornata segue meteo stagionale, orari di apertura, e un calendario che nel 1980 riporta anche fatti storici realmente accaduti (stampa/radio locale).
4. **Permadeath**: azioni rischiose possono concludere la storia del personaggio in modo permanente. Si può anche decidere di ritirarsi in ogni momento.
5. **Wipe annuale**: al 31 dicembre il personaggio viene archiviato nella Sala della memoria e si riparte con uno nuovo l'anno successivo (fino al 1990, fine del ciclo del server), mentre lo stato del mondo (giornale, voci di paese, avanzamento della lore) resta persistente.

### Il motore "senza AI"

Le scelte disponibili e gli esiti delle azioni sono generati da un motore locale a tabelle pesate e template combinati a runtime (skill check con dadi + abilità, testo narrativo composto da frammenti che tengono conto di luogo, orario, meteo, NPC coinvolto ed esito) — nessun modello linguistico esterno, nessuna chiamata di rete.

## Stato del progetto

Questa è una **prima pre-alpha**: pensata per validare l'impianto (creazione personaggio, mappa di Villa Franca, motore narrativo, tempo/wipe/permadeath) prima di ampliare contenuti e sistemi (fazioni giocabili in modo più profondo, sistema di gruppi creati dai giocatori, redazione del giornale più ricca, eventi di lore più articolati, ecc.).

## Struttura del progetto

- `index.html` — struttura e stile del gioco.
- `js/data.js` — dati statici: abilità, oscuri segreti, comuni, lavori, luoghi, NPC, fazioni, calendario storico 1980.
- `js/engine.js` — stato di gioco, tempo, motore narrativo, salvataggio.
- `js/ui.js` — interfaccia e gestione degli eventi.
- `js/main.js` — avvio del gioco.
- `.nojekyll` — disabilita l'elaborazione Jekyll di GitHub Pages, non necessaria per un sito statico puro.

## Hosting

Questo repository può essere pubblicato tramite **GitHub Pages** direttamente da questo branch. Non è necessaria alcuna build, server o manutenzione continua. Se si vuole un dominio personalizzato, va aggiunto un file `CNAME` nella root (non presente in questo branch).

## Note

- Nessun dato di gioco viene mai inviato a server esterni: tutto vive nel browser dell'utente.
- Villa Franca e tutti i suoi abitanti sono interamente immaginari. Gli eventi storici richiamati nel calendario del 1980 sono invece fatti realmente accaduti, riportati in forma sintetica e neutra.
