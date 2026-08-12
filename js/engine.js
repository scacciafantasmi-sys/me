/* ==========================================================================
   VILLA FRANCA 1980 — motore di gioco
   Stato, tempo, generatore narrativo locale (nessuna AI esterna, nessuna
   chiave API: solo tabelle pesate e template combinati a runtime), salvataggio.
   ========================================================================== */

const ENGINE = (() => {
  const SAVE_KEY = 'villafranca_save_v1';
  const START_YEAR = 1980;
  const END_YEAR = 1990;

  /* ------------------------------ stato ------------------------------ */
  let STATE = null;

  function nuovoMondo() {
    return {
      anno: START_YEAR,
      serverConcluso: false,
      npcStato: {}, // npcId -> { vivo:true, relazione:0, note:[] }
      loreStage: 0,
      loreFlags: {},
      giornale: [], // { anno, mese, giorno, titolo, testo, autore }
      salaFama: [], // personaggi conclusi (morti/ritirati/wipe)
      rumorLog: [], // voci di paese recenti (persistenti tra wipe)
      cicli: 0,
    };
  }

  function defaultState() {
    const s = {
      world: nuovoMondo(),
      character: null,
      clock: { anno: START_YEAR, mese: 1, giorno: 1, ora: 8, meteoGiorno: null, meteoData: null },
      version: 1,
    };
    GAME_DATA.NPCS.forEach(n => { s.world.npcStato[n.id] = { vivo: true, relazione: 0, note: [] }; });
    return s;
  }

  function getState() { return STATE; }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(STATE)); } catch (e) { /* storage pieno o non disponibile */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      STATE = JSON.parse(raw);
      return true;
    } catch (e) { return false; }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function resetAll() {
    STATE = defaultState();
    save();
  }

  function init() {
    if (!load()) STATE = defaultState();
  }

  /* ------------------------------ utility ------------------------------ */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  const _lastPick = {};
  function pickNoRepeat(key, arr) {
    if (arr.length <= 1) return arr[0];
    let idx = randInt(0, arr.length - 1);
    if (_lastPick[key] !== undefined && arr.length > 2) {
      let tries = 0;
      while (idx === _lastPick[key] && tries < 5) { idx = randInt(0, arr.length - 1); tries++; }
    }
    _lastPick[key] = idx;
    return arr[idx];
  }

  /* ------------------------------ tempo ------------------------------ */
  function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(m, y) {
    const d = [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d[m - 1];
  }
  const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const GIORNI_SETT = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];

  function dataChiave(c) {
    return `${c.anno}-${String(c.mese).padStart(2,'0')}-${String(c.giorno).padStart(2,'0')}`;
  }

  function giornoSettimana(c) {
    // Zeller-ish via Date object (attenzione: Date gestisce solo anni >=1)
    const d = new Date(Date.UTC(c.anno, c.mese - 1, c.giorno));
    return GIORNI_SETT[d.getUTCDay()];
  }

  const METEO_ESTATE = ['sole a picco e cicale', 'caldo afoso, aria ferma', 'scirocco che porta sabbia dal mare', 'cielo terso, mare calmo', 'temporale improvviso di calore'];
  const METEO_INVERNO = ['pioggia fine e insistente', 'vento freddo da tramontana', 'cielo grigio e coperto', 'freddo pungente ma sereno', 'nebbia bassa sui campi'];
  const METEO_MEZZA = ['tiepido e ventilato', 'nuvole sparse', 'sole gentile', 'pioggia leggera al mattino', 'aria limpida'];

  function calcolaMeteo(mese) {
    if ([6,7,8].includes(mese)) return pick(METEO_ESTATE);
    if ([12,1,2].includes(mese)) return pick(METEO_INVERNO);
    return pick(METEO_MEZZA);
  }

  function meteoOggi() {
    const key = dataChiave(STATE.clock);
    if (STATE.clock.meteoData !== key) {
      STATE.clock.meteoData = key;
      STATE.clock.meteoGiorno = calcolaMeteo(STATE.clock.mese);
    }
    return STATE.clock.meteoGiorno;
  }

  function periodoDelGiorno(ora) {
    if (ora >= 5 && ora < 8) return 'alba';
    if (ora >= 8 && ora < 13) return 'mattina';
    if (ora >= 13 && ora < 17) return 'pomeriggio';
    if (ora >= 17 && ora < 20) return 'sera';
    if (ora >= 20 && ora < 24) return 'notte';
    return 'notte fonda';
  }

  function eLuogoAperto(luogo) {
    if (!luogo.orario) return true;
    const [a, b] = luogo.orario;
    const ora = STATE.clock.ora;
    if (a < b) return ora >= a && ora < b;
    return ora >= a || ora < b; // apertura che attraversa la mezzanotte
  }

  /* callback opzionale impostata da main.js per notificare la UI di un wipe/morte */
  let onWorldEvent = null;
  function setWorldEventHandler(fn) { onWorldEvent = fn; }

  function advanceTime(ore, opts) {
    opts = opts || {};
    let restante = ore;
    while (restante > 0) {
      const step = Math.min(restante, 1);
      restante -= step;
      STATE.clock.ora += step;
      tickOrario();
      if (STATE.clock.ora >= 24) {
        STATE.clock.ora -= 24;
        avanzaGiorno();
      }
    }
  }

  function tickOrario() {
    if (!STATE.character || STATE.character.stato !== 'vivo') return;
    // piccola possibilità che il paese "viva" anche senza il giocatore (rumor / lore)
    if (Math.random() < 0.03) generaRumor();
    if (Math.random() < 0.01) avanzaLore();
  }

  function avanzaGiorno() {
    STATE.clock.giorno++;
    if (STATE.clock.giorno > daysInMonth(STATE.clock.mese, STATE.clock.anno)) {
      STATE.clock.giorno = 1;
      STATE.clock.mese++;
      if (STATE.clock.mese > 12) {
        STATE.clock.mese = 1;
        finisceAnno();
      }
    }
    checkStoriaOggi();
  }

  function checkStoriaOggi() {
    if (STATE.clock.anno !== 1980) return;
    const key = dataChiave(STATE.clock);
    const evt = GAME_DATA.STORIA_1980.find(e => e.data === key);
    if (evt && STATE.character) {
      STATE.character.log.unshift({ tipo: 'storia', titolo: evt.titolo, testo: evt.testo, data: key });
      if (onWorldEvent) onWorldEvent('storia', evt);
    }
  }

  function finisceAnno() {
    const annoConcluso = STATE.clock.anno;
    STATE.clock.anno++;
    STATE.world.cicli++;
    if (STATE.character && STATE.character.stato === 'vivo') {
      archiviaPersonaggio(STATE.character, `Ha attraversato il wipe di fine ${annoConcluso}. La sua storia continua nel ${STATE.clock.anno}, ma la sua scheda personale viene ripristinata.`);
    }
    STATE.world.anno = STATE.clock.anno;
    if (STATE.clock.anno > END_YEAR) {
      STATE.world.serverConcluso = true;
    }
    const wasCharacter = STATE.character;
    STATE.character = null;
    if (onWorldEvent) onWorldEvent('wipe', { annoConcluso, nuovoAnno: STATE.clock.anno, personaggio: wasCharacter, serverConcluso: STATE.world.serverConcluso });
  }

  /* ------------------------------ personaggio ------------------------------ */
  function skillBase() {
    const s = {};
    GAME_DATA.SKILLS.forEach(sk => { s[sk.id] = GAME_DATA.SKILL_MIN; });
    return s;
  }

  function parseEffetto(effetto, character) {
    const parts = effetto.split(':');
    const tipo = parts[0];
    if (tipo === 'skill') {
      const id = parts[1], delta = parseInt(parts[2], 10);
      character.skills[id] = clamp((character.skills[id] || 1) + delta, GAME_DATA.SKILL_MIN, GAME_DATA.SKILL_MAX);
    } else if (tipo === 'denaro_iniziale') {
      character.denaro += parseInt(parts[1], 10);
    } else if (tipo === 'relazione') {
      const fazione = parts[1], delta = parseInt(parts[2], 10);
      character.relazioni[fazione] = clamp((character.relazioni[fazione] || 0) + delta, -100, 100);
    } else if (tipo === 'flag') {
      character.flags.push(parts[1]);
    }
  }

  function creaPersonaggio(dati) {
    const skills = skillBase();
    Object.keys(dati.allocazioneSkill || {}).forEach(id => {
      skills[id] = clamp(dati.allocazioneSkill[id], GAME_DATA.SKILL_MIN, GAME_DATA.SKILL_MAX);
    });

    const relazioni = {};
    GAME_DATA.FAZIONI.forEach(f => { relazioni[f.id] = 0; });

    const character = {
      nome: dati.nome, cognome: dati.cognome, sesso: dati.sesso, eta: dati.eta,
      altezza: dati.altezza, corporatura: dati.corporatura, capelli: dati.capelli,
      occhi: dati.occhi, trattoDistintivo: dati.trattoDistintivo,
      cittaNatale: dati.cittaNatale, backstory: dati.backstory,
      lavoroPrecedente: dati.lavoroPrecedente,
      skills, segreto: dati.segreto || 'nessuno', flags: [],
      denaro: 150,
      relazioni, relazioniNpc: {},
      lavoroAttuale: null,
      stato: 'vivo', causaMorte: null,
      nato: STATE.clock.anno,
      log: [],
    };

    const lavoroDef = GAME_DATA.LAVORI_PRECEDENTI.find(l => l.id === dati.lavoroPrecedente);
    if (lavoroDef) lavoroDef.bonus.forEach(sk => { character.skills[sk] = clamp(character.skills[sk] + 1, GAME_DATA.SKILL_MIN, GAME_DATA.SKILL_MAX); });

    const segretoDef = GAME_DATA.OSCURI_SEGRETI.find(s => s.id === character.segreto);
    if (segretoDef) segretoDef.effetti.forEach(e => parseEffetto(e, character));

    character.log.unshift({ tipo: 'nascita_narrativa', titolo: 'Un nuovo inizio', testo: `${character.nome} ${character.cognome} mette piede a Villa Franca il ${character.eta > 0 ? '' : ''}${STATE.clock.giorno} ${MESI[STATE.clock.mese-1]} ${STATE.clock.anno}.`, data: dataChiave(STATE.clock) });

    STATE.character = character;
    save();
    return character;
  }

  function puntiSkillSpesi(allocazione) {
    let tot = 0;
    Object.keys(allocazione || {}).forEach(id => { tot += Math.max(0, (allocazione[id] || 1) - GAME_DATA.SKILL_MIN); });
    return tot;
  }

  /* ------------------------------ azioni e skill check ------------------------------ */
  const AZIONI_RISCHIOSE = new Set(['traffico_porto','segnala_contrabbando','avvicina_boss','affari_discoteca','partecipa_assemblea_sx','partecipa_riunione_dx','contatta_balordo','ronda_porto','informatore_cc']);

  function trovaLuogo(id) { return GAME_DATA.LUOGHI.find(l => l.id === id); }
  function trovaNpc(id) { return GAME_DATA.NPCS.find(n => n.id === id); }

  function eseguiAzione(luogoId, azioneId) {
    const luogo = trovaLuogo(luogoId);
    const azione = luogo.azioni.find(a => a.id === azioneId);
    const character = STATE.character;
    const npc = azione.npc ? trovaNpc(azione.npc) : null;

    let esito = 'neutro';
    let dettaglioCheck = null;
    if (azione.skill) {
      const skillVal = character.skills[azione.skill] || 1;
      const difficolta = 45 + randInt(-10, 25);
      const roll = randInt(1, 100) + skillVal * 8;
      const scarto = roll - difficolta;
      if (scarto >= 30) esito = 'critico_successo';
      else if (scarto >= 0) esito = 'successo';
      else if (scarto >= -30) esito = 'fallimento';
      else esito = 'critico_fallimento';
      dettaglioCheck = { skill: azione.skill, skillVal, difficolta, roll, scarto };
    }

    const testo = narraEsito(luogo, azione, esito, npc, character);
    applicaEffettiAzione(luogo, azione, esito, npc, character);

    let morte = null;
    if (esito === 'critico_fallimento' && AZIONI_RISCHIOSE.has(azione.id)) {
      if (Math.random() < 0.10) {
        morte = uccidiPersonaggio(`Le cose sono precipitate durante "${azione.nome.toLowerCase()}" a ${luogo.nome}.`);
      }
    }

    character.log.unshift({ tipo: 'azione', titolo: azione.nome, testo, luogo: luogo.nome, data: dataChiave(STATE.clock), esito });
    advanceTime(azione.ore);
    save();
    return { testo, esito, dettaglioCheck, morte };
  }

  const NARRAZIONE = {
    apertura: [
      'Sono le {ora} di {periodo}, {meteo}.',
      'È {periodo} a Villa Franca: {meteo}.',
      'Il {giorno_settimana} scorre lento, {meteo}.',
    ],
    critico_successo: [
      'Ti va meglio di quanto sperassi: {dettaglio}',
      'Le cose girano dalla tua parte: {dettaglio}',
      'Un colpo di fortuna netto: {dettaglio}',
    ],
    successo: [
      'Le cose vanno come speravi: {dettaglio}',
      'Riesci nel tuo intento: {dettaglio}',
      'Con un po\' di attenzione, ottieni quello che cercavi: {dettaglio}',
    ],
    fallimento: [
      'Non va come speravi: {dettaglio}',
      'Qualcosa si mette di traverso: {dettaglio}',
      'Ci provi, ma non basta: {dettaglio}',
    ],
    critico_fallimento: [
      'Va decisamente male: {dettaglio}',
      'È un disastro: {dettaglio}',
      'Le cose precipitano: {dettaglio}',
    ],
    neutro: [
      '{dettaglio}',
    ],
  };

  const DETTAGLIO_NPC = {
    critico_successo: ['{npc} resta colpito da te e si sbilancia più del previsto.', '{npc} ti tratta quasi come un vecchio amico.'],
    successo: ['{npc} ti ascolta e ti concede quello che chiedevi.', '{npc} sembra prendere sul serio le tue parole.'],
    fallimento: ['{npc} resta sulle sue, diffidente.', '{npc} liquida la questione con poche parole.'],
    critico_fallimento: ['{npc} si offende apertamente e te lo fa capire.', 'Con {npc} la situazione degenera in fretta.'],
    neutro: ['Parli un po\' con {npc}.'],
  };

  function narraEsito(luogo, azione, esito, npc, character) {
    const apertura = pickNoRepeat('apertura', NARRAZIONE.apertura)
      .replace('{ora}', String(STATE.clock.ora).padStart(2,'0') + ':00')
      .replace('{periodo}', periodoDelGiorno(STATE.clock.ora))
      .replace('{meteo}', meteoOggi())
      .replace('{giorno_settimana}', giornoSettimana(STATE.clock));

    let dettaglio;
    if (npc) {
      dettaglio = pick(DETTAGLIO_NPC[esito]).replace(/{npc}/g, npc.nome);
    } else {
      dettaglio = `${azione.nome} a ${luogo.nome} — ${luogo.desc}`;
    }
    const corpo = pick(NARRAZIONE[esito]).replace('{dettaglio}', dettaglio);
    return `${apertura} ${corpo}`;
  }

  function applicaEffettiAzione(luogo, azione, esito, npc, character) {
    const positivo = esito === 'successo' || esito === 'critico_successo';
    const negativo = esito === 'fallimento' || esito === 'critico_fallimento';
    const forte = esito === 'critico_successo' || esito === 'critico_fallimento';

    if (npc) {
      const delta = positivo ? (forte ? 12 : 6) : negativo ? (forte ? -12 : -6) : 0;
      character.relazioniNpc[npc.id] = clamp((character.relazioniNpc[npc.id] || 0) + delta, -100, 100);
      if (npc.fazione) character.relazioni[npc.fazione] = clamp((character.relazioni[npc.fazione] || 0) + Math.round(delta / 2), -100, 100);
    }

    if (azione.lavoro && (esito === 'successo' || esito === 'critico_successo')) {
      character.lavoroAttuale = { nome: azione.lavoro, luogoId: luogo.id };
    }

    if (azione.id === 'lavora_campagna' || (character.lavoroAttuale && character.lavoroAttuale.luogoId === luogo.id && azione.id.startsWith('lavora'))) {
      if (positivo) character.denaro += forte ? 60 : 30;
    }

    if (azione.id === 'scrivi_articolo' && positivo) {
      pubblicaArticolo(character);
    }

    if (azione.id === 'vendi_al_mercato' && positivo) character.denaro += forte ? 50 : 25;
    if (azione.id === 'gioca_carte') character.denaro += positivo ? (forte ? 40 : 15) : -(forte ? 40 : 15);
    if (azione.id === 'gioca_totocalcio') { if (Math.random() < 0.05) character.denaro += 200; else character.denaro -= 5; }
    if (['compra_pane','curati','spedisci_lettera','cena_trattoria','guarda_film'].includes(azione.id)) character.denaro = Math.max(0, character.denaro - randInt(5,20));
  }

  /* ------------------------------ giornalismo ------------------------------ */
  const TITOLI_GIORNALE = [
    'Villa Franca tra cronaca e quotidianità', 'Voci dal paese', 'Cosa succede a Villa Franca',
    'La settimana del nostro paese', 'Dal porto alla piazza', 'Taccuino di paese',
  ];
  function pubblicaArticolo(character) {
    const titolo = pick(TITOLI_GIORNALE);
    STATE.world.giornale.unshift({
      anno: STATE.clock.anno, mese: STATE.clock.mese, giorno: STATE.clock.giorno,
      titolo, autore: `${character.nome} ${character.cognome}`,
      testo: `Un resoconto firmato da ${character.nome} ${character.cognome} sulla vita di Villa Franca in questi giorni di ${MESI[STATE.clock.mese-1]}.`,
    });
    if (STATE.world.giornale.length > 100) STATE.world.giornale.length = 100;
  }

  /* ------------------------------ rumor / lore in sottofondo ------------------------------ */
  const RUMOR_TEMPLATES = [
    'Si dice che {npc} sia stato visto parlare a lungo con una persona mai vista prima al {luogo}.',
    'In paese girano voci su strani movimenti notturni vicino al {luogo}.',
    '{npc} sembra particolarmente nervoso negli ultimi giorni.',
    'Qualcuno giura di aver visto luci accese di notte dove non dovrebbero essercene.',
    'Al bar si commenta una lettera arrivata da Palermo, indirizzata a {npc}.',
  ];
  function generaRumor() {
    const npc = pick(GAME_DATA.NPCS);
    const luogo = pick(GAME_DATA.LUOGHI);
    const testo = pick(RUMOR_TEMPLATES).replace('{npc}', npc.nome).replace('{luogo}', luogo.nome);
    STATE.world.rumorLog.unshift({ data: dataChiave(STATE.clock), testo });
    if (STATE.world.rumorLog.length > 40) STATE.world.rumorLog.length = 40;
  }

  const LORE_TAPPE = [
    'In paese non si parla ancora di nulla di strano.',
    'Qualche vecchio del paese accenna a "cose viste nella notte" vicino alla campagna, ma nessuno li prende sul serio.',
    'Un articolo mai pubblicato scompare dalla redazione de La Voce di Villa Franca. Nessuno sa spiegare come.',
    'Un forestiero è stato notato più volte in paese, fa domande e non si presenta mai.',
    'Un vecchio fascicolo dei Carabinieri, dato per perso da anni, viene ritrovato per caso.',
  ];
  function avanzaLore() {
    if (STATE.world.loreStage < LORE_TAPPE.length - 1) {
      STATE.world.loreStage++;
      STATE.world.rumorLog.unshift({ data: dataChiave(STATE.clock), testo: LORE_TAPPE[STATE.world.loreStage], lore: true });
    }
  }

  /* ------------------------------ turno di lavoro e riposo ------------------------------ */
  function eseguiTurnoLavoro() {
    const character = STATE.character;
    const job = character.lavoroAttuale;
    const luogo = trovaLuogo(job.luogoId);
    const guadagno = randInt(40, 90);
    character.denaro += guadagno;
    const testo = `${pick(['Un turno lungo ma senza sorprese.', 'Il lavoro di oggi è filato liscio.', 'Giornata di lavoro come tante altre, ma le lire contano.', 'Fatica, ma alla fine ne vale la pena.'])} Guadagni ${guadagno} lire come ${job.nome.toLowerCase()} a ${luogo.nome}.`;
    character.log.unshift({ tipo: 'lavoro', titolo: 'Turno di lavoro', testo, luogo: luogo.nome, data: dataChiave(STATE.clock), esito: 'successo' });
    advanceTime(6);
    save();
    return { testo, esito: 'successo' };
  }

  function riposa(ore) {
    const character = STATE.character;
    character.log.unshift({ tipo: 'riposo', titolo: 'Riposo', testo: `Ti concedi qualche ora di riposo.`, data: dataChiave(STATE.clock), esito: 'neutro' });
    advanceTime(ore);
    save();
  }

  function dormiFinoAlMattino() {
    let ore = 8 - STATE.clock.ora;
    if (ore <= 0) ore += 24;
    const character = STATE.character;
    character.log.unshift({ tipo: 'riposo', titolo: 'Una notte di sonno', testo: 'Dormi fino al mattino successivo.', data: dataChiave(STATE.clock), esito: 'neutro' });
    advanceTime(ore);
    save();
  }

  /* ------------------------------ morte e archiviazione ------------------------------ */
  function uccidiPersonaggio(causa) {
    const c = STATE.character;
    c.stato = 'morto';
    c.causaMorte = causa;
    archiviaPersonaggio(c, causa);
    save();
    return causa;
  }

  function ritiraPersonaggio(motivo) {
    const c = STATE.character;
    c.stato = 'ritirato';
    archiviaPersonaggio(c, motivo || 'Ha deciso di lasciare Villa Franca per sempre.');
    STATE.character = null;
    save();
  }

  function archiviaPersonaggio(c, nota) {
    STATE.world.salaFama.unshift({
      nome: `${c.nome} ${c.cognome}`, stato: c.stato, causa: c.causaMorte, nota,
      annoConclusione: STATE.clock.anno, lavoro: c.lavoroAttuale ? c.lavoroAttuale.nome : null,
    });
    if (STATE.world.salaFama.length > 200) STATE.world.salaFama.length = 200;
  }

  return {
    init, save, resetAll, hasSave, getState, setWorldEventHandler,
    MESI, GIORNI_SETT, START_YEAR, END_YEAR,
    dataChiave, giornoSettimana, periodoDelGiorno, meteoOggi, eLuogoAperto,
    advanceTime,
    skillBase, creaPersonaggio, puntiSkillSpesi,
    trovaLuogo, trovaNpc, eseguiAzione,
    eseguiTurnoLavoro, riposa, dormiFinoAlMattino,
    uccidiPersonaggio, ritiraPersonaggio,
    randInt, clamp,
  };
})();
