/* ==========================================================================
   VILLA FRANCA 1980 — interfaccia
   Rendering a stringhe + delega degli eventi, nessun framework.
   ========================================================================== */

const UI = (() => {
  const root = () => document.getElementById('app');

  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  let view = { screen: 'boot', categoria: null, luogo: null, tab: 'diario' };
  let creationState = null;
  let lastResult = null;
  let suppressNextRender = false;

  /* ------------------------------ boot ------------------------------ */
  function renderBoot() {
    const st = ENGINE.getState();
    const haveChar = st.character && st.character.stato === 'vivo';
    root().innerHTML = `
      <div class="boot">
        <h1>VILLA FRANCA</h1>
        <p class="sub">un paese di Sicilia, ${ENGINE.START_YEAR}&ndash;${ENGINE.END_YEAR}</p>
        <p class="tagline">Simulazione roguelike di un server di ruolo. Wipe annuale. Nessuna intelligenza artificiale esterna, nessuna chiave API: tutto gira nel tuo browser.</p>
        <div class="boot-actions">
          ${haveChar ? `<button data-act="continua" class="btn primary">Continua partita — ${esc(st.character.nome)} ${esc(st.character.cognome)}</button>` : ''}
          <button data-act="nuova-partita" class="btn ${haveChar ? '' : 'primary'}">${haveChar ? 'Nuovo personaggio (wipe)' : 'Avvia il wipe — nuova partita'}</button>
          <button data-act="salafama-open" class="btn ghost">Sala della memoria</button>
        </div>
        <p class="anno-corrente">Anno corrente del server: <strong>${st.clock.anno}</strong>${st.world.serverConcluso ? ' — il server ha concluso il suo ciclo ufficiale' : ''}</p>
      </div>`;
  }

  /* ------------------------------ creazione personaggio ------------------------------ */
  const STEPS = ['Identità', 'Aspetto', 'Passato', 'Abilità', 'Segreto', 'Riepilogo'];

  function startCreation() {
    creationState = {
      nome: '', cognome: '', sesso: 'uomo', eta: 28, cittaNatale: '', lavoroPrecedente: 'disoccupato',
      altezza: 'media', corporatura: 'normale', capelli: '', occhi: '', trattoDistintivo: '',
      backstory: '', allocazioneSkill: {}, segreto: 'nessuno', step: 0,
    };
    GAME_DATA.SKILLS.forEach(s => { creationState.allocazioneSkill[s.id] = GAME_DATA.SKILL_MIN; });
    view.screen = 'creation';
    render();
  }

  function readStepInputs() {
    const g = id => document.getElementById(id);
    if (creationState.step === 0) {
      creationState.nome = g('f-nome') ? g('f-nome').value.trim() : creationState.nome;
      creationState.cognome = g('f-cognome') ? g('f-cognome').value.trim() : creationState.cognome;
      creationState.sesso = g('f-sesso') ? g('f-sesso').value : creationState.sesso;
      creationState.eta = g('f-eta') ? parseInt(g('f-eta').value, 10) || 18 : creationState.eta;
      creationState.cittaNatale = g('f-citta') ? g('f-citta').value.trim() : creationState.cittaNatale;
      creationState.lavoroPrecedente = g('f-lavoro') ? g('f-lavoro').value : creationState.lavoroPrecedente;
    } else if (creationState.step === 1) {
      creationState.altezza = g('f-altezza') ? g('f-altezza').value : creationState.altezza;
      creationState.corporatura = g('f-corporatura') ? g('f-corporatura').value : creationState.corporatura;
      creationState.capelli = g('f-capelli') ? g('f-capelli').value.trim() : creationState.capelli;
      creationState.occhi = g('f-occhi') ? g('f-occhi').value.trim() : creationState.occhi;
      creationState.trattoDistintivo = g('f-tratto') ? g('f-tratto').value.trim() : creationState.trattoDistintivo;
    } else if (creationState.step === 2) {
      creationState.backstory = g('f-backstory') ? g('f-backstory').value.trim() : creationState.backstory;
    }
  }

  function creationErrors() {
    if (creationState.step === 0) {
      const errs = [];
      if (!creationState.nome) errs.push('Inserisci un nome.');
      if (!creationState.cognome) errs.push('Inserisci un cognome.');
      if (!creationState.cittaNatale) errs.push('Indica una città natale.');
      if (!creationState.eta || creationState.eta < 16 || creationState.eta > 80) errs.push('Età non valida (16-80).');
      return errs;
    }
    return [];
  }

  function renderCreation() {
    const s = creationState.step;
    root().innerHTML = `
      <div class="creation">
        <div class="wizard-progress">
          ${STEPS.map((t,i) => `<span class="wp-step ${i===s?'active':''} ${i<s?'done':''}">${i+1}. ${t}</span>`).join('')}
        </div>
        <div class="wizard-body">
          ${s===0 ? stepIdentita() : ''}
          ${s===1 ? stepAspetto() : ''}
          ${s===2 ? stepPassato() : ''}
          ${s===3 ? stepAbilita() : ''}
          ${s===4 ? stepSegreto() : ''}
          ${s===5 ? stepRiepilogo() : ''}
        </div>
        <div class="wizard-nav">
          ${s>0 ? `<button data-act="step-prev" class="btn ghost">&larr; Indietro</button>` : `<button data-act="torna-boot" class="btn ghost">&larr; Annulla</button>`}
          ${s<STEPS.length-1 ? `<button data-act="step-next" class="btn primary">Avanti &rarr;</button>` : `<button data-act="conferma-creazione" class="btn primary">Inizia la partita nel ${ENGINE.getState().clock.anno}</button>`}
        </div>
      </div>`;
  }

  function stepIdentita() {
    const c = creationState;
    const comuniOpts = GAME_DATA.COMUNI.map(x => `<option value="${esc(x)}">`).join('');
    const lavoriOpts = GAME_DATA.LAVORI_PRECEDENTI.map(l => `<option value="${l.id}" ${c.lavoroPrecedente===l.id?'selected':''}>${esc(l.nome)}</option>`).join('');
    return `
      <h2>Chi sei</h2>
      <div class="grid2">
        <label>Nome <input id="f-nome" type="text" value="${esc(c.nome)}" maxlength="30"></label>
        <label>Cognome <input id="f-cognome" type="text" value="${esc(c.cognome)}" maxlength="30"></label>
        <label>Sesso <select id="f-sesso">
          <option value="uomo" ${c.sesso==='uomo'?'selected':''}>Uomo</option>
          <option value="donna" ${c.sesso==='donna'?'selected':''}>Donna</option>
        </select></label>
        <label>Età <input id="f-eta" type="number" min="16" max="80" value="${c.eta}"></label>
        <label class="span2">Città natale <input id="f-citta" list="comuni-list" type="text" value="${esc(c.cittaNatale)}" placeholder="Scrivi o scegli un comune italiano"></label>
        <datalist id="comuni-list">${comuniOpts}</datalist>
        <label class="span2">Lavoro precedente <select id="f-lavoro">${lavoriOpts}</select></label>
      </div>`;
  }

  function stepAspetto() {
    const c = creationState;
    return `
      <h2>Aspetto fisico</h2>
      <div class="grid2">
        <label>Altezza <select id="f-altezza">
          ${['bassa','media','alta'].map(v=>`<option value="${v}" ${c.altezza===v?'selected':''}>${v}</option>`).join('')}
        </select></label>
        <label>Corporatura <select id="f-corporatura">
          ${['magra','normale','robusta','atletica'].map(v=>`<option value="${v}" ${c.corporatura===v?'selected':''}>${v}</option>`).join('')}
        </select></label>
        <label>Capelli <input id="f-capelli" type="text" value="${esc(c.capelli)}" placeholder="es. neri, mossi"></label>
        <label>Occhi <input id="f-occhi" type="text" value="${esc(c.occhi)}" placeholder="es. scuri"></label>
        <label class="span2">Tratto distintivo <input id="f-tratto" type="text" value="${esc(c.trattoDistintivo)}" placeholder="es. una cicatrice sul sopracciglio, un modo di fumare tutto suo..."></label>
      </div>`;
  }

  function stepPassato() {
    const c = creationState;
    return `
      <h2>Backstory</h2>
      <p class="hint">Racconta chi era il tuo personaggio prima di arrivare o tornare a Villa Franca. Più dettagli dai, più il gioco potrà agganciarsi alla tua storia in futuro (funzionalità in sviluppo nel prototipo).</p>
      <textarea id="f-backstory" rows="8" maxlength="2000" placeholder="Scrivi liberamente la backstory del tuo personaggio...">${esc(c.backstory)}</textarea>`;
  }

  function stepAbilita() {
    const c = creationState;
    const spesi = ENGINE.puntiSkillSpesi(c.allocazioneSkill);
    const rimanenti = GAME_DATA.SKILL_POINTS_POOL - spesi;
    const cats = GAME_DATA.SKILL_CATEGORIES.map(cat => {
      const skills = GAME_DATA.SKILLS.filter(s => s.cat === cat.id);
      return `<div class="skill-cat"><h3>${cat.nome}</h3>
        ${skills.map(s => {
          const v = c.allocazioneSkill[s.id];
          return `<div class="skill-row" title="${esc(s.desc)}">
            <span class="skill-name">${s.nome}</span>
            <button data-act="skill-dec" data-skill="${s.id}" class="btn tiny" ${v<=GAME_DATA.SKILL_MIN?'disabled':''}>−</button>
            <span class="skill-val">${'●'.repeat(v)}${'○'.repeat(GAME_DATA.SKILL_MAX-v)}</span>
            <button data-act="skill-inc" data-skill="${s.id}" class="btn tiny" ${v>=GAME_DATA.SKILL_MAX || rimanenti<=0?'disabled':''}>+</button>
          </div>`;
        }).join('')}
      </div>`;
    }).join('');
    return `
      <h2>Abilità</h2>
      <p class="hint">Punti da distribuire: <strong>${rimanenti}</strong> rimanenti su ${GAME_DATA.SKILL_POINTS_POOL}. Ogni abilità va da 1 a 5. Potrai svilupparle ulteriormente giocando.</p>
      <div class="skills-grid">${cats}</div>`;
  }

  function stepSegreto() {
    const c = creationState;
    const items = GAME_DATA.OSCURI_SEGRETI.map(s => `
      <label class="segreto-row ${c.segreto===s.id?'selected':''}">
        <input type="radio" name="f-segreto" value="${s.id}" data-act="select-segreto" ${c.segreto===s.id?'checked':''}>
        <span class="segreto-nome">${esc(s.nome)}</span>
        <span class="segreto-desc">${esc(s.desc)}</span>
      </label>`).join('');
    return `
      <h2>Un oscuro segreto</h2>
      <p class="hint">Facoltativo: puoi scegliere "Nessun segreto". Ogni segreto porta con sé un vantaggio e uno svantaggio narrativo e meccanico.</p>
      <div class="segreti-list">${items}</div>`;
  }

  function stepRiepilogo() {
    const c = creationState;
    const lavoroNome = (GAME_DATA.LAVORI_PRECEDENTI.find(l => l.id === c.lavoroPrecedente) || {}).nome || '—';
    const segretoDef = GAME_DATA.OSCURI_SEGRETI.find(s => s.id === c.segreto);
    const skillList = GAME_DATA.SKILLS.filter(s => c.allocazioneSkill[s.id] > GAME_DATA.SKILL_MIN || true)
      .map(s => `<span class="chip">${s.nome}: ${c.allocazioneSkill[s.id]}</span>`).join('');
    return `
      <h2>Riepilogo</h2>
      <div class="riepilogo">
        <p><strong>${esc(c.nome)} ${esc(c.cognome)}</strong>, ${c.eta} anni, ${c.sesso === 'uomo' ? 'nato' : 'nata'} a ${esc(c.cittaNatale)}.</p>
        <p>Corporatura ${esc(c.corporatura)}, altezza ${esc(c.altezza)}${c.trattoDistintivo ? ', ' + esc(c.trattoDistintivo) : ''}.</p>
        <p>Prima di arrivare a Villa Franca: ${esc(lavoroNome)}.</p>
        <p class="backstory-preview">${esc(c.backstory) || '<em>Nessuna backstory scritta.</em>'}</p>
        <p><strong>Segreto:</strong> ${esc(segretoDef ? segretoDef.nome : 'Nessuno')}</p>
        <div class="chips">${skillList}</div>
      </div>`;
  }

  /* ------------------------------ hub ------------------------------ */
  function renderHub() {
    const st = ENGINE.getState();
    const c = st.character;
    if (!c || (c.stato !== 'vivo' && !(lastResult && lastResult.morte))) { view.screen = 'boot'; return renderBoot(); }
    const clk = st.clock;
    const dataStr = `${clk.giorno} ${ENGINE.MESI[clk.mese-1]} ${clk.anno}, ${ENGINE.giornoSettimana(clk)}`;
    const oraStr = `${String(clk.ora).padStart(2,'0')}:00`;

    root().innerHTML = `
      <div class="hub">
        <header class="hub-top">
          <div class="hub-id">
            <strong>${esc(c.nome)} ${esc(c.cognome)}</strong>
            <span class="muted">${c.lavoroAttuale ? esc(c.lavoroAttuale.nome) : 'senza lavoro fisso'}</span>
          </div>
          <div class="hub-clock">
            <span>${dataStr}</span> — <span>${oraStr}</span>
            <span class="muted">${esc(ENGINE.meteoOggi())}</span>
          </div>
          <div class="hub-money">£ ${c.denaro}</div>
        </header>
        <div class="hub-body">
          <aside class="hub-side">
            ${renderSkillsPanel(c)}
            ${renderFazioniPanel(c)}
            <div class="quick-actions">
              ${c.lavoroAttuale ? `<button class="btn" data-act="turno-lavoro">Fai un turno di lavoro</button>` : ''}
              <button class="btn" data-act="riposa">Riposa (3 ore)</button>
              <button class="btn" data-act="dormi">Dormi fino al mattino</button>
              <button class="btn ghost" data-act="ritira-personaggio">Lascia Villa Franca</button>
            </div>
          </aside>
          <section class="hub-main">
            ${view.luogo ? renderLuogo(view.luogo) : renderCategorie()}
          </section>
          <aside class="hub-feed">
            <div class="feed-tabs">
              <button class="tab ${view.tab==='diario'?'active':''}" data-act="tab" data-tab="diario">Diario</button>
              <button class="tab ${view.tab==='giornale'?'active':''}" data-act="tab" data-tab="giornale">Giornale</button>
              <button class="tab ${view.tab==='voci'?'active':''}" data-act="tab" data-tab="voci">Voci di paese</button>
            </div>
            <div class="feed-body">
              ${view.tab==='diario' ? renderDiario(c) : ''}
              ${view.tab==='giornale' ? renderGiornale(st) : ''}
              ${view.tab==='voci' ? renderVoci(st) : ''}
            </div>
          </aside>
        </div>
      </div>
      ${lastResult ? renderEsitoModal(lastResult) : ''}`;
  }

  function renderSkillsPanel(c) {
    const rows = GAME_DATA.SKILLS.map(s => `<div class="mini-skill"><span>${s.nome}</span><span>${'●'.repeat(c.skills[s.id])}${'○'.repeat(GAME_DATA.SKILL_MAX-c.skills[s.id])}</span></div>`).join('');
    return `<details class="panel"><summary>Abilità</summary><div class="mini-skills">${rows}</div></details>`;
  }

  function renderFazioniPanel(c) {
    const rows = GAME_DATA.FAZIONI.map(f => {
      const v = c.relazioni[f.id] || 0;
      const cls = v > 15 ? 'good' : v < -15 ? 'bad' : '';
      return `<div class="mini-skill ${cls}"><span>${f.nome}</span><span>${v > 0 ? '+' : ''}${v}</span></div>`;
    }).join('');
    return `<details class="panel"><summary>Relazioni</summary><div class="mini-skills">${rows}</div></details>`;
  }

  function renderCategorie() {
    const cat = view.categoria;
    if (!cat) {
      return `<h2>Villa Franca</h2><div class="categorie-grid">
        ${GAME_DATA.CATEGORIE_LUOGHI.map(c => `<button class="cat-card" data-act="apri-categoria" data-cat="${c.id}">${c.nome}</button>`).join('')}
      </div>`;
    }
    const catDef = GAME_DATA.CATEGORIE_LUOGHI.find(c => c.id === cat);
    const luoghi = GAME_DATA.LUOGHI.filter(l => l.cat === cat);
    return `
      <div class="breadcrumb"><button data-act="apri-categoria" data-cat="" class="link">Villa Franca</button> / ${catDef.nome}</div>
      <h2>${catDef.nome}</h2>
      <div class="luoghi-grid">
        ${luoghi.map(l => {
          const aperto = ENGINE.eLuogoAperto(l);
          return `<button class="luogo-card ${aperto?'':'chiuso'}" data-act="apri-luogo" data-luogo="${l.id}" ${aperto?'':'disabled'}>
            <strong>${l.nome}</strong>
            <span class="muted">${aperto ? (l.orario ? `aperto ${l.orario[0]}–${l.orario[1]}` : 'sempre aperto') : 'chiuso ora'}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function renderLuogo(luogoId) {
    const l = ENGINE.trovaLuogo(luogoId);
    if (!l) { view.luogo = null; return renderCategorie(); }
    const c = ENGINE.getState().character;
    const aperto = ENGINE.eLuogoAperto(l);
    return `
      <div class="breadcrumb"><button data-act="chiudi-luogo" class="link">Villa Franca</button> / ${l.nome}</div>
      <h2>${l.nome}</h2>
      <p class="luogo-desc">${esc(l.desc)}</p>
      ${!aperto ? '<p class="muted">Il luogo è chiuso a quest\'ora. Puoi comunque tornare più tardi.</p>' : ''}
      <div class="azioni-list">
        ${l.azioni.map(a => {
          const npc = a.npc ? ENGINE.trovaNpc(a.npc) : null;
          return `<button class="azione-card" data-act="esegui-azione" data-luogo="${l.id}" data-azione="${a.id}" ${aperto?'':'disabled'}>
            <strong>${a.nome}</strong>
            <span class="muted">${a.ore}h${npc ? ' · con ' + npc.nome : ''}${a.skill ? ' · ' + (GAME_DATA.SKILLS.find(s=>s.id===a.skill)||{}).nome : ''}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function renderDiario(c) {
    if (!c.log.length) return '<p class="muted">Ancora nessuna pagina scritta.</p>';
    return c.log.slice(0, 30).map(e => `<div class="feed-item ${e.tipo}"><span class="feed-date">${e.data}${e.luogo ? ' · ' + esc(e.luogo) : ''}</span><strong>${esc(e.titolo)}</strong><p>${esc(e.testo)}</p></div>`).join('');
  }
  function renderGiornale(st) {
    if (!st.world.giornale.length) return '<p class="muted">"La Voce di Villa Franca" non ha ancora pubblicato nulla in questa partita.</p>';
    return st.world.giornale.slice(0, 30).map(a => `<div class="feed-item"><span class="feed-date">${a.giorno}/${a.mese}/${a.anno} · ${esc(a.autore)}</span><strong>${esc(a.titolo)}</strong><p>${esc(a.testo)}</p></div>`).join('');
  }
  function renderVoci(st) {
    if (!st.world.rumorLog.length) return '<p class="muted">In paese, per ora, non si dice nulla di particolare.</p>';
    return st.world.rumorLog.slice(0, 30).map(r => `<div class="feed-item ${r.lore?'lore':''}"><span class="feed-date">${r.data}</span><p>${esc(r.testo)}</p></div>`).join('');
  }

  function renderEsitoModal(result) {
    return `<div class="modal-backdrop">
      <div class="modal esito-${result.esito}">
        <h3>${esitoTitolo(result.esito)}</h3>
        <p>${esc(result.testo)}</p>
        ${result.dettaglioCheck ? `<p class="muted small">Prova di ${(GAME_DATA.SKILLS.find(s=>s.id===result.dettaglioCheck.skill)||{}).nome}: tiro ${result.dettaglioCheck.roll} vs difficoltà ${result.dettaglioCheck.difficolta}</p>` : ''}
        ${result.morte ? `<p class="fatale">Il tuo personaggio non ce l'ha fatta.</p>` : ''}
        <button class="btn primary" data-act="chiudi-esito">Continua</button>
      </div>
    </div>`;
  }
  function esitoTitolo(e) {
    return { critico_successo: 'Va benissimo', successo: 'Ci sei riuscito', fallimento: 'Non è andata bene', critico_fallimento: 'Disastro', neutro: 'Fatto' }[e] || 'Fatto';
  }

  /* ------------------------------ morte / wipe / fine ------------------------------ */
  function renderDeath(causa) {
    root().innerHTML = `
      <div class="boot death">
        <h1>Fine della storia</h1>
        <p class="tagline">${esc(causa)}</p>
        <p>Il tuo personaggio entra nella Sala della memoria di Villa Franca.</p>
        <div class="boot-actions">
          <button class="btn primary" data-act="nuova-partita">Crea un nuovo personaggio</button>
          <button class="btn ghost" data-act="torna-boot">Menu principale</button>
        </div>
      </div>`;
  }

  function renderWipeScreen(payload) {
    root().innerHTML = `
      <div class="boot wipe">
        <h1>Wipe di fine anno</h1>
        <p class="tagline">Si chiude il ${payload.annoConcluso} e si apre il ${payload.nuovoAnno} a Villa Franca.</p>
        <p>${payload.personaggio ? `${esc(payload.personaggio.nome)} ${esc(payload.personaggio.cognome)} viene ricordato nella storia del paese, ma la sua scheda è stata azzerata.` : ''}</p>
        ${payload.serverConcluso ? '<p class="tagline">Il server ha raggiunto il 1990: è la fine ufficiale del ciclo di Villa Franca.</p>' : ''}
        <div class="boot-actions">
          <button class="btn primary" data-act="nuova-partita">Crea un personaggio per il ${payload.nuovoAnno}</button>
          <button class="btn ghost" data-act="salafama-open">Sala della memoria</button>
        </div>
      </div>`;
  }

  function renderSalaFama() {
    const st = ENGINE.getState();
    root().innerHTML = `
      <div class="boot">
        <h1>Sala della memoria</h1>
        ${st.world.salaFama.length ? `<div class="salafama-list">${st.world.salaFama.map(p => `
          <div class="feed-item"><strong>${esc(p.nome)}</strong> <span class="muted">(${p.stato}, ${p.annoConclusione})</span>
          <p>${esc(p.nota || '')}</p></div>`).join('')}</div>` : '<p class="muted">Ancora nessuna storia conclusa.</p>'}
        <div class="boot-actions"><button class="btn ghost" data-act="torna-boot">Indietro</button></div>
      </div>`;
  }

  /* ------------------------------ render dispatch ------------------------------ */
  function render() {
    if (view.screen === 'boot') renderBoot();
    else if (view.screen === 'creation') renderCreation();
    else if (view.screen === 'hub') renderHub();
    else if (view.screen === 'salafama') renderSalaFama();
  }

  /* ------------------------------ eventi ------------------------------ */
  function bind() {
    document.getElementById('app').addEventListener('click', onClick);
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;

    if (act === 'nuova-partita') { startCreation(); return; }
    if (act === 'continua') { view.screen = 'hub'; view.luogo = null; view.categoria = null; render(); return; }
    if (act === 'salafama-open') { view.screen = 'salafama'; render(); return; }
    if (act === 'torna-boot') { view.screen = 'boot'; render(); return; }

    if (act === 'step-next') {
      readStepInputs();
      const errs = creationErrors();
      if (errs.length) { alert(errs.join('\n')); return; }
      creationState.step++; render(); return;
    }
    if (act === 'step-prev') { readStepInputs(); creationState.step--; render(); return; }
    if (act === 'skill-inc') {
      const id = el.dataset.skill;
      const spesi = ENGINE.puntiSkillSpesi(creationState.allocazioneSkill);
      if (spesi < GAME_DATA.SKILL_POINTS_POOL && creationState.allocazioneSkill[id] < GAME_DATA.SKILL_MAX) creationState.allocazioneSkill[id]++;
      render(); return;
    }
    if (act === 'skill-dec') {
      const id = el.dataset.skill;
      if (creationState.allocazioneSkill[id] > GAME_DATA.SKILL_MIN) creationState.allocazioneSkill[id]--;
      render(); return;
    }
    if (act === 'select-segreto') { creationState.segreto = el.value; render(); return; }
    if (act === 'conferma-creazione') {
      readStepInputs();
      ENGINE.creaPersonaggio(creationState);
      view.screen = 'hub'; view.luogo = null; view.categoria = null; view.tab = 'diario';
      render(); return;
    }

    if (act === 'apri-categoria') { view.categoria = el.dataset.cat || null; view.luogo = null; render(); return; }
    if (act === 'apri-luogo') { view.luogo = el.dataset.luogo; render(); return; }
    if (act === 'chiudi-luogo') { view.luogo = null; render(); return; }
    if (act === 'tab') { view.tab = el.dataset.tab; render(); return; }

    if (act === 'esegui-azione') {
      const result = ENGINE.eseguiAzione(el.dataset.luogo, el.dataset.azione);
      if (suppressNextRender) { suppressNextRender = false; return; }
      lastResult = result;
      render();
      return;
    }
    if (act === 'chiudi-esito') {
      const wasMorte = lastResult && lastResult.morte;
      lastResult = null;
      if (wasMorte) { view.screen = 'boot'; renderDeath(wasMorte); }
      else render();
      return;
    }
    if (act === 'turno-lavoro') {
      const result = ENGINE.eseguiTurnoLavoro();
      if (suppressNextRender) { suppressNextRender = false; return; }
      lastResult = result; render(); return;
    }
    if (act === 'riposa') { ENGINE.riposa(3); if (suppressNextRender) { suppressNextRender = false; return; } render(); return; }
    if (act === 'dormi') { ENGINE.dormiFinoAlMattino(); if (suppressNextRender) { suppressNextRender = false; return; } render(); return; }
    if (act === 'ritira-personaggio') {
      if (confirm('Sei sicuro di voler lasciare Villa Franca? Il personaggio verrà archiviato e la partita terminerà.')) {
        ENGINE.ritiraPersonaggio();
        view.screen = 'boot'; view.luogo = null; view.categoria = null;
        render();
      }
      return;
    }
  }

  ENGINE.setWorldEventHandler((tipo, payload) => {
    if (tipo === 'wipe') {
      view.luogo = null; view.categoria = null; lastResult = null;
      renderWipeScreen(payload);
      suppressNextRender = true;
    }
  });

  return { init: () => { bind(); render(); }, render };
})();
