/* ==========================================================================
   VILLA FRANCA 1980 — dati statici del gioco (skill, segreti, comuni,
   lavori, luoghi, NPC, fazioni, calendario storico).
   Nessuna di queste persone è reale: Villa Franca e i suoi abitanti sono
   interamente immaginari. Gli eventi storici in STORIA_1980 sono invece
   fatti realmente accaduti, riportati in forma sintetica e neutra.
   ========================================================================== */

const GAME_DATA = {};

/* ---------------------------------------------------------------------- */
/* ABILITÀ                                                                 */
/* ---------------------------------------------------------------------- */
GAME_DATA.SKILL_CATEGORIES = [
  { id: 'fisiche', nome: 'Fisiche' },
  { id: 'tecniche', nome: 'Tecniche' },
  { id: 'intellettive', nome: 'Intellettive' },
  { id: 'sociali', nome: 'Sociali' },
  { id: 'investigative', nome: 'Investigative' },
  { id: 'manuali', nome: 'Manuali e rurali' },
  { id: 'artistiche', nome: 'Artistiche' },
];

GAME_DATA.SKILLS = [
  { id: 'corsa', nome: 'Corsa', cat: 'fisiche', desc: 'Velocità e fiato per scattare o fuggire.' },
  { id: 'forza', nome: 'Forza', cat: 'fisiche', desc: 'Potenza fisica bruta.' },
  { id: 'resistenza', nome: 'Resistenza', cat: 'fisiche', desc: 'Capacità di incassare fatica e colpi.' },
  { id: 'corpo_a_corpo', nome: 'Combattimento corpo a corpo', cat: 'fisiche', desc: 'Rissa, difesa personale, coltello.' },
  { id: 'guida', nome: 'Guida', cat: 'tecniche', desc: 'Auto, moto, barche a motore.' },
  { id: 'armi_fuoco', nome: 'Armi da fuoco', cat: 'tecniche', desc: 'Uso e manutenzione di pistole e fucili.' },
  { id: 'meccanica', nome: 'Meccanica', cat: 'tecniche', desc: 'Riparare motori, veicoli, macchinari.' },
  { id: 'scasso', nome: 'Scasso', cat: 'tecniche', desc: 'Forzare serrature, casseforti, portiere.' },
  { id: 'ingegneria', nome: 'Ingegneria', cat: 'intellettive', desc: 'Elettricità, impianti, costruzioni.' },
  { id: 'chimica', nome: 'Chimica', cat: 'intellettive', desc: 'Sostanze, esplosivi, farmaci, veleni.' },
  { id: 'medicina', nome: 'Medicina', cat: 'intellettive', desc: 'Pronto soccorso e cure.' },
  { id: 'contabilita', nome: 'Contabilità', cat: 'intellettive', desc: 'Conti, bilanci, imbrogli sulla carta.' },
  { id: 'diritto', nome: 'Diritto', cat: 'intellettive', desc: 'Leggi, codici, cavilli.' },
  { id: 'persuasione', nome: 'Persuasione', cat: 'sociali', desc: 'Convincere, negoziare, vendere.' },
  { id: 'inganno', nome: 'Inganno', cat: 'sociali', desc: 'Mentire, recitare, bluffare.' },
  { id: 'intuito', nome: 'Intuito', cat: 'sociali', desc: 'Capire le intenzioni altrui, fiutare il pericolo.' },
  { id: 'osservazione', nome: 'Osservazione', cat: 'sociali', desc: 'Notare dettagli, ascoltare senza farsi notare.' },
  { id: 'psicologia', nome: 'Psicologia', cat: 'sociali', desc: 'Capire e manipolare la mente altrui.' },
  { id: 'investigazione', nome: 'Investigazione', cat: 'investigative', desc: 'Indagare, collegare indizi.' },
  { id: 'procedure_polizia', nome: 'Procedure di polizia', cat: 'investigative', desc: 'Conoscenza del lavoro delle forze dell\'ordine.' },
  { id: 'agricoltura', nome: 'Agricoltura', cat: 'manuali', desc: 'Coltivare campi e terreni.' },
  { id: 'pesca', nome: 'Pesca e marineria', cat: 'manuali', desc: 'Mare, reti, pescherecci.' },
  { id: 'cucina', nome: 'Cucina', cat: 'manuali', desc: 'Preparare cibo, gestire una cucina.' },
  { id: 'artigianato', nome: 'Artigianato', cat: 'manuali', desc: 'Lavorare legno, ferro, stoffa, cuoio.' },
  { id: 'musica', nome: 'Musica', cat: 'artistiche', desc: 'Suonare, cantare, intrattenere.' },
  { id: 'arte', nome: 'Arte', cat: 'artistiche', desc: 'Disegno, pittura, scrittura creativa.' },
];

GAME_DATA.SKILL_POINTS_POOL = 20;
GAME_DATA.SKILL_MIN = 1;
GAME_DATA.SKILL_MAX = 5;

/* ---------------------------------------------------------------------- */
/* OSCURI SEGRETI                                                         */
/* ---------------------------------------------------------------------- */
GAME_DATA.OSCURI_SEGRETI = [
  { id: 'nessuno', nome: 'Nessun segreto', desc: 'Una vita senza ombre particolari. Nessun effetto.', effetti: [] },
  { id: 'debito_mafia', nome: 'Debito con la mafia', desc: 'Devi del denaro a un uomo d\'onore locale, e prima o poi qualcuno verrà a riscuoterlo.', effetti: ['denaro_iniziale:-300', 'relazione:mafia:-10', 'flag:debito_mafia'] },
  { id: 'ex_infiltrato', nome: 'Ex informatore infiltrato', desc: 'Hai lavorato sotto copertura per le forze dell\'ordine. Qualcuno del giro criminale potrebbe riconoscerti.', effetti: ['skill:investigazione:+1', 'flag:identita_bruciata'] },
  { id: 'figlio_illegittimo', nome: 'Figlio illegittimo di un notabile', desc: 'Tuo padre è un uomo importante del paese che non ti ha mai riconosciuto.', effetti: ['flag:parente_segreto_notabile'] },
  { id: 'testimone_omicidio', nome: 'Testimone di un omicidio irrisolto', desc: 'Anni fa hai visto qualcosa che non avresti dovuto vedere, e non l\'hai mai raccontato a nessuno.', effetti: ['skill:osservazione:+1', 'flag:testimone_scomodo'] },
  { id: 'renitente_leva', nome: 'Renitente alla leva', desc: 'Non ti sei mai presentato al servizio militare. Sei ancora ricercato sulla carta.', effetti: ['flag:renitente', 'relazione:forze_ordine:-5'] },
  { id: 'ex_eversivo_pentito', nome: 'Ex militante estremista, ora "pentito"', desc: 'Hai fatto parte di un gruppo politico radicale e te ne sei allontanato. Vecchi compagni non l\'hanno presa bene.', effetti: ['flag:ex_estremista'] },
  { id: 'alcolizzato_in_cura', nome: 'Alcolizzato in cura', desc: 'Hai un problema con il bere che tieni sotto controllo a fatica.', effetti: ['skill:resistenza:-1', 'flag:vulnerabile_alcol'] },
  { id: 'doppia_identita', nome: 'Doppia identità', desc: 'Il nome con cui ti presenti non è quello con cui sei nato.', effetti: ['skill:inganno:+1', 'flag:identita_falsa'] },
  { id: 'malattia_nascosta', nome: 'Malattia nascosta', desc: 'Un problema di cuore che nessuno conosce, e che potrebbe manifestarsi nei momenti peggiori.', effetti: ['flag:cuore_debole'] },
  { id: 'malocchio', nome: 'Fama di malocchio', desc: 'In paese si dice tu porti sfortuna. Molti ti temono, pochi ti si avvicinano.', effetti: ['relazione:paese:-5', 'skill:intuito:+1'] },
  { id: 'faida_familiare', nome: 'Debito di sangue familiare', desc: 'La tua famiglia è coinvolta in una faida antica con un\'altra famiglia del circondario.', effetti: ['flag:faida_familiare'] },
  { id: 'prete_spretato', nome: 'Ex seminarista', desc: 'Hai lasciato il seminario poco prima dell\'ordinazione, per motivi che non racconti volentieri.', effetti: ['skill:psicologia:+1', 'relazione:chiesa:-5'] },
  { id: 'ricattatore', nome: 'Collezionista di segreti altrui', desc: 'Hai l\'abitudine di scoprire cose che gli altri vorrebbero nascondere, e qualche volta le usi.', effetti: ['skill:inganno:+1', 'flag:ricattatore'] },
  { id: 'ritorno_emigrazione', nome: 'Emigrato di ritorno', desc: 'Hai passato anni in Germania o in Svizzera a lavorare, e sei tornato con dei risparmi che preferisci non dichiarare.', effetti: ['denaro_iniziale:+400', 'flag:soldi_non_dichiarati'] },
  { id: 'informatore_carabinieri', nome: 'Informatore dei Carabinieri', desc: 'Passi voci alla caserma in cambio di favori. Se si scoprisse, sarebbe un problema serio.', effetti: ['relazione:forze_ordine:+10', 'flag:informatore'] },
  { id: 'amante_segreto', nome: 'Amante di una persona sposata e potente', desc: 'Una relazione clandestina con qualcuno che conta in paese, che dovrebbe restare segreta.', effetti: ['flag:amante_segreto'] },
  { id: 'debiti_gioco', nome: 'Debiti di gioco', desc: 'Le carte e le scommesse ti hanno lasciato più di un debito in sospeso.', effetti: ['denaro_iniziale:-200', 'flag:debiti_gioco'] },
  { id: 'erede_conteso', nome: 'Erede di un patrimonio conteso', desc: 'Un\'eredità di famiglia è ferma nelle carte bollate da anni, contesa da parenti che non ti vogliono bene.', effetti: ['flag:eredita_contesa'] },
  { id: 'contrabbandiere', nome: 'Contrabbandiere di sigarette', desc: 'Arrotondi con piccoli traffici che passano dal porto, lontano dagli occhi della finanza.', effetti: ['skill:persuasione:+1', 'relazione:forze_ordine:-5'] },
  { id: 'orfano_ignoto', nome: 'Cresciuto in orfanotrofio', desc: 'Non hai mai saputo chi siano davvero i tuoi genitori.', effetti: ['skill:resistenza:+1', 'flag:origini_ignote'] },
  { id: 'massone', nome: 'Membro di una loggia', desc: 'Fai parte di una loggia massonica discreta ma influente nella zona.', effetti: ['relazione:notabili:+10', 'flag:massone'] },
  { id: 'schedato_politico', nome: 'Schedato per le tue idee', desc: 'Le forze dell\'ordine ti tengono d\'occhio per le tue simpatie politiche giovanili.', effetti: ['relazione:forze_ordine:-10'] },
  { id: 'visionario_religioso', nome: 'Visionario religioso', desc: 'Dici di vedere segni che altri non vedono. C\'è chi ti crede un santo e chi un pazzo.', effetti: ['relazione:chiesa:+5', 'relazione:paese:-5'] },
  { id: 'gemello_scomparso', nome: 'Un gemello scomparso', desc: 'Avevi un fratello o una sorella gemella, sparita da bambini in circostanze mai chiarite.', effetti: ['flag:gemello_scomparso'] },
  { id: 'ex_manicomio', nome: 'Fuggito da un internamento ingiusto', desc: 'Sei stato internato per un periodo, forse ingiustamente. Il fascicolo esiste ancora.', effetti: ['skill:psicologia:+1', 'relazione:paese:-5'] },
  { id: 'debitore_banca', nome: 'Debitore della banca', desc: 'Un prestito mai ripagato pende sulla tua famiglia, con il rischio concreto di perdere la terra.', effetti: ['denaro_iniziale:-250', 'flag:rischio_pignoramento'] },
  { id: 'depistatore', nome: 'Hai mentito in un\'indagine passata', desc: 'Una tua falsa testimonianza anni fa ha coperto qualcuno. La verità potrebbe ancora venire a galla.', effetti: ['flag:falsa_testimonianza'] },
  { id: 'amico_boss', nome: 'Amico d\'infanzia di un uomo d\'onore', desc: 'Sei cresciuto in strada con chi oggi conta nella famiglia mafiosa locale.', effetti: ['relazione:mafia:+15'] },
  { id: 'cognome_maledetto', nome: 'Cognome segnato', desc: 'Il tuo cognome porta dietro una storia di sventure di cui la gente del paese ancora parla.', effetti: ['relazione:paese:-5'] },
  { id: 'ex_galeotto', nome: 'Ex detenuto', desc: 'Hai scontato una pena. Qualcuno non te lo lascerà mai dimenticare.', effetti: ['skill:corpo_a_corpo:+1', 'relazione:forze_ordine:-10'] },
  { id: 'tesoro_famiglia', nome: 'Un\'arma di famiglia nascosta', desc: 'In casa, ben nascosta, c\'è un\'arma con una storia che preferisci non raccontare.', effetti: ['flag:arma_nascosta'] },
  { id: 'fattucchiera', nome: 'Pratica riti popolari', desc: 'Conosci vecchie pratiche di magia contadina: scongiuri, erbe, riti che la gente teme e rispetta.', effetti: ['skill:psicologia:+1', 'relazione:chiesa:-5'] },
  { id: 'talpa_giornale', nome: 'Talpa per un giornale nazionale', desc: 'Passi informazioni riservate a un cronista di Palermo, per denaro o per convinzione.', effetti: ['skill:persuasione:+1', 'flag:talpa_giornale'] },
];

/* ---------------------------------------------------------------------- */
/* CITTÀ NATALI — elenco curato (non esaustivo) + campo libero sempre disponibile */
/* ---------------------------------------------------------------------- */
GAME_DATA.COMUNI = [
  'Villa Franca (paese natio)',
  // Sicilia — provincia di Palermo e dintorni
  'Palermo','Monreale','Bagheria','Partinico','Carini','Cinisi','Terrasini','Corleone','Misilmeri',
  'Villabate','Altofonte','Piana degli Albanesi','Belmonte Mezzagno','Marineo','Ficarazzi',
  'Termini Imerese','Cefalù','Caccamo','Trabia','Santa Flavia','Isola delle Femmine','Capaci',
  'Torretta','Montelepre','Borgetto','San Giuseppe Jato','San Cipirello','Camporeale','Roccamena',
  'Godrano','Mezzojuso','Cammarata','Lercara Friddi','Prizzi','Ustica',
  // Sicilia — altre province
  'Catania','Messina','Siracusa','Ragusa','Trapani','Agrigento','Caltanissetta','Enna',
  'Castellammare del Golfo','Alcamo','Castelvetrano','Mazara del Vallo','Marsala','Sciacca',
  'Ribera','Licata','Gela','Vittoria','Modica','Noto','Taormina','Milazzo','Lipari','Pantelleria',
  'Piazza Armerina','Caltagirone','Acireale','Barcellona Pozzo di Gotto','Patti',
  // Calabria
  'Reggio Calabria','Catanzaro','Cosenza','Crotone','Vibo Valentia',
  // Campania
  'Napoli','Salerno','Caserta','Avellino','Benevento',
  // Puglia e Basilicata
  'Bari','Taranto','Foggia','Lecce','Brindisi','Potenza','Matera',
  // Sardegna
  'Cagliari','Sassari','Nuoro','Oristano',
  // Centro Italia
  'Roma','Latina','Frosinone','Viterbo','Rieti','Perugia','Terni','Ancona','Pesaro',
  'Firenze','Pisa','Livorno','Siena','Arezzo','Grosseto','L\'Aquila','Pescara','Campobasso',
  // Nord Italia
  'Torino','Milano','Genova','Bologna','Modena','Parma','Reggio Emilia','Ferrara','Ravenna',
  'Venezia','Padova','Verona','Vicenza','Treviso','Trieste','Trento','Bolzano','Brescia',
  'Bergamo','Como','Aosta',
  // Estero (emigrazione)
  'Stoccarda (Germania)','Zurigo (Svizzera)','Bruxelles (Belgio)','New York (Stati Uniti)',
  'Buenos Aires (Argentina)','Toronto (Canada)',
];

/* ---------------------------------------------------------------------- */
/* LAVORI PRECEDENTI                                                       */
/* ---------------------------------------------------------------------- */
GAME_DATA.LAVORI_PRECEDENTI = [
  { id: 'bracciante', nome: 'Bracciante agricolo', bonus: ['agricoltura'] },
  { id: 'pescatore', nome: 'Pescatore', bonus: ['pesca'] },
  { id: 'pastore', nome: 'Pastore', bonus: ['agricoltura','resistenza'] },
  { id: 'muratore', nome: 'Muratore', bonus: ['forza','artigianato'] },
  { id: 'operaio', nome: 'Operaio (fabbrica/cantiere)', bonus: ['resistenza','meccanica'] },
  { id: 'meccanico', nome: 'Meccanico', bonus: ['meccanica'] },
  { id: 'fabbro', nome: 'Fabbro', bonus: ['artigianato','forza'] },
  { id: 'falegname', nome: 'Falegname', bonus: ['artigianato'] },
  { id: 'sarto', nome: 'Sarto/Sarta', bonus: ['artigianato'] },
  { id: 'barbiere', nome: 'Barbiere/Parrucchiera', bonus: ['persuasione'] },
  { id: 'panettiere', nome: 'Panettiere', bonus: ['cucina'] },
  { id: 'macellaio', nome: 'Macellaio', bonus: ['forza'] },
  { id: 'negoziante', nome: 'Negoziante', bonus: ['contabilita','persuasione'] },
  { id: 'cameriere', nome: 'Cameriere/Barista', bonus: ['persuasione'] },
  { id: 'cuoco', nome: 'Cuoco', bonus: ['cucina'] },
  { id: 'camionista', nome: 'Autista/Camionista', bonus: ['guida'] },
  { id: 'marittimo', nome: 'Marittimo', bonus: ['pesca','resistenza'] },
  { id: 'impiegato_comunale', nome: 'Impiegato comunale', bonus: ['diritto','contabilita'] },
  { id: 'maestro', nome: 'Maestro/Maestra elementare', bonus: ['psicologia'] },
  { id: 'infermiere', nome: 'Infermiere', bonus: ['medicina'] },
  { id: 'seminarista', nome: 'Ex seminarista', bonus: ['psicologia'] },
  { id: 'militare_congedato', nome: 'Militare di leva congedato', bonus: ['armi_fuoco','resistenza'] },
  { id: 'studente', nome: 'Studente universitario fuori sede', bonus: ['diritto','arte'] },
  { id: 'disoccupato', nome: 'Disoccupato', bonus: [] },
  { id: 'emigrato', nome: 'Emigrato di ritorno', bonus: ['meccanica','persuasione'] },
  { id: 'geometra', nome: 'Geometra', bonus: ['ingegneria'] },
  { id: 'praticante_giornalista', nome: 'Praticante giornalista', bonus: ['persuasione','osservazione'] },
];

/* ---------------------------------------------------------------------- */
/* FAZIONI                                                                 */
/* ---------------------------------------------------------------------- */
GAME_DATA.FAZIONI = [
  { id: 'forze_ordine', nome: 'Forze dell\'Ordine', desc: 'Carabinieri, Polizia e Guardia di Finanza di Villa Franca.' },
  { id: 'mafia', nome: 'Famiglia Scordato', desc: 'La cosca che controlla gli affari sporchi del circondario.' },
  { id: 'chiesa', nome: 'Chiesa Madre', desc: 'La parrocchia e il suo peso morale sul paese.' },
  { id: 'sindacato', nome: 'Camera del Lavoro', desc: 'Il sindacato che difende braccianti e operai.' },
  { id: 'sinistra_extra', nome: 'Circolo "Nuclei Operai Combattenti"', desc: 'Movimento di estrema sinistra, radicale e clandestino.' },
  { id: 'destra_extra', nome: 'Falange d\'Italia', desc: 'Movimento di estrema destra, nazionalista e violento.' },
  { id: 'notabili', nome: 'Notabili e proprietari', desc: 'Le famiglie che contano, la buona società di Villa Franca.' },
  { id: 'giornalismo', nome: 'La Voce di Villa Franca', desc: 'La redazione del giornale locale.' },
  { id: 'paese', nome: 'Gente del paese', desc: 'La reputazione generale presso la popolazione.' },
];

/* ---------------------------------------------------------------------- */
/* NPC — tutti personaggi di finzione                                     */
/* ---------------------------------------------------------------------- */
GAME_DATA.NPCS = [
  { id: 'sindaco', nome: 'Bernardo Alagna', ruolo: 'Sindaco', luogo: 'municipio', fazione: 'notabili', tratti: 'ambizioso, prudente, ama farsi vedere in chiesa la domenica' },
  { id: 'maresciallo', nome: 'Salvatore Ingrassia', ruolo: 'Maresciallo dei Carabinieri', luogo: 'caserma_cc', fazione: 'forze_ordine', tratti: 'metodico, sospettoso, non si fida di nessuno del tutto' },
  { id: 'commissario', nome: 'Nunzio Farina', ruolo: 'Commissario di Pubblica Sicurezza', luogo: 'commissariato', fazione: 'forze_ordine', tratti: 'ambizioso, vuole una promozione a Palermo' },
  { id: 'maggiore_finanza', nome: 'Ettore Bellavia', ruolo: 'Maggiore della Guardia di Finanza', luogo: 'caserma_gdf', fazione: 'forze_ordine', tratti: 'preciso, incorruttibile a parole' },
  { id: 'parroco', nome: 'Don Calogero Vitale', ruolo: 'Parroco', luogo: 'chiesa', fazione: 'chiesa', tratti: 'paziente, ascolta tutti, sa più segreti di chiunque altro' },
  { id: 'boss', nome: 'Don Peppino Scordato', ruolo: 'Capofamiglia', luogo: 'circolo_ricreativo', fazione: 'mafia', tratti: 'calmo, cortese, terribilmente pericoloso' },
  { id: 'meccanico_npc', nome: 'Turi Lo Cascio', ruolo: 'Meccanico', luogo: 'officina', fazione: 'paese', tratti: 'chiacchierone, sa tutto quello che succede sulle strade' },
  { id: 'barista', nome: 'Rosalia Bonsignore', ruolo: 'Proprietaria del Bar Centrale', luogo: 'bar_centrale', fazione: 'paese', tratti: 'materna, osservatrice, non giudica nessuno ad alta voce' },
  { id: 'maestra', nome: 'Nunzia Greco', ruolo: 'Maestra elementare', luogo: 'scuola', fazione: 'paese', tratti: 'severa ma giusta, crede nel progresso' },
  { id: 'medico', nome: 'Dott. Aurelio Sammartino', ruolo: 'Medico condotto', luogo: 'ambulatorio', fazione: 'paese', tratti: 'stanco, competente, beve un po\' troppo' },
  { id: 'sindacalista', nome: 'Ignazio Randazzo', ruolo: 'Segretario della Camera del Lavoro', luogo: 'sede_sindacato', fazione: 'sindacato', tratti: 'appassionato, oratore, ha molti nemici tra i notabili' },
  { id: 'capobarca', nome: 'Vito Cusumano', ruolo: 'Capobarca', luogo: 'porto', fazione: 'paese', tratti: 'burbero, leale con il suo equipaggio' },
  { id: 'giornalista', nome: 'Michele Trapani', ruolo: 'Direttore de "La Voce di Villa Franca"', luogo: 'redazione', fazione: 'giornalismo', tratti: 'curioso, testardo, convinto che la verità vada scritta comunque' },
  { id: 'panettiera', nome: 'Carmela Aiello', ruolo: 'Proprietaria del panificio', luogo: 'panificio', fazione: 'paese', tratti: 'generosa, gran pettegola' },
  { id: 'leader_sinistra', nome: 'Franco Butera', ruolo: 'Leader del circolo di sinistra', luogo: 'circolo_che_guevara', fazione: 'sinistra_extra', tratti: 'idealista, sempre più radicale, si sente osservato' },
  { id: 'leader_destra', nome: 'Aldo Ruvolo', ruolo: 'Leader della cellula di destra', luogo: 'sede_falange', fazione: 'destra_extra', tratti: 'rigido, nostalgico, cerca reclute tra i giovani delusi' },
  { id: 'notaio', nome: 'Gaetano Sorrentino', ruolo: 'Notaio e possidente', luogo: 'ville', fazione: 'notabili', tratti: 'formale, gestisce mezzo paese sulla carta' },
  { id: 'suora', nome: 'Suor Immacolata', ruolo: 'Responsabile dell\'opera pia', luogo: 'chiesa', fazione: 'chiesa', tratti: 'instancabile, protegge gli orfani del paese' },
  { id: 'balordo', nome: 'Peppe "\'u Zoppo" Calandra', ruolo: 'Uomo di piazza', luogo: 'piazza', fazione: 'paese', tratti: 'informato su tutto, si vende al miglior offerente' },
  { id: 'baronessa', nome: 'Eleonora Alliata', ruolo: 'Baronessa decaduta', luogo: 'ville', fazione: 'notabili', tratti: 'altera, nostalgica di un mondo che non esiste più' },
];

/* ---------------------------------------------------------------------- */
/* LUOGHI DI VILLA FRANCA                                                  */
/* Ogni luogo ha: id, nome, categoria, orario [apertura,chiusura] (24h,    */
/* null=sempre aperto), descrizione, azioni_uniche (oltre a quelle comuni  */
/* applicate a runtime dal motore).                                       */
/* ---------------------------------------------------------------------- */
GAME_DATA.CATEGORIE_LUOGHI = [
  { id: 'istituzioni', nome: 'Istituzioni' },
  { id: 'commercio', nome: 'Botteghe e commercio' },
  { id: 'ristoro', nome: 'Ristoro e ritrovi' },
  { id: 'lavoro', nome: 'Lavoro e mare' },
  { id: 'servizi', nome: 'Servizi' },
  { id: 'sociale', nome: 'Vita sociale e politica' },
  { id: 'residenze', nome: 'Residenze' },
  { id: 'campagna', nome: 'Campagna' },
];

GAME_DATA.LUOGHI = [
  { id: 'municipio', nome: 'Municipio', cat: 'istituzioni', orario: [8,14],
    desc: 'Il palazzo comunale, con la bandiera un po\' scolorita dal sole.',
    azioni: [
      { id: 'richiedi_documenti', nome: 'Richiedi documenti anagrafici', ore: 1, skill: null },
      { id: 'candidati_impiego_comune', nome: 'Fai domanda per un impiego comunale', ore: 2, skill: 'diritto', lavoro: 'Impiegato comunale' },
      { id: 'parla_sindaco', nome: 'Chiedi udienza al Sindaco', ore: 1, skill: 'persuasione', npc: 'sindaco' },
    ] },
  { id: 'caserma_cc', nome: 'Caserma dei Carabinieri', cat: 'istituzioni', orario: null,
    desc: 'Un edificio basso, l\'Arma sulla facciata, un\'Alfa Romeo parcheggiata davanti.',
    azioni: [
      { id: 'sporgi_denuncia', nome: 'Sporgi una denuncia', ore: 1, skill: null },
      { id: 'arruolati_cc', nome: 'Chiedi di arruolarti nell\'Arma', ore: 2, skill: 'procedure_polizia', lavoro: 'Carabiniere' },
      { id: 'informatore_cc', nome: 'Offriti come informatore', ore: 1, skill: 'inganno', npc: 'maresciallo' },
    ] },
  { id: 'commissariato', nome: 'Commissariato di Pubblica Sicurezza', cat: 'istituzioni', orario: null,
    desc: 'Uffici della Polizia di Stato, telefoni che squillano in continuazione.',
    azioni: [
      { id: 'arruolati_ps', nome: 'Chiedi di entrare in Polizia', ore: 2, skill: 'procedure_polizia', lavoro: 'Agente di Pubblica Sicurezza' },
      { id: 'consulta_schedario', nome: 'Chiedi di consultare lo schedario', ore: 1, skill: 'investigazione', npc: 'commissario' },
    ] },
  { id: 'caserma_gdf', nome: 'Caserma della Guardia di Finanza', cat: 'istituzioni', orario: null,
    desc: 'Presidio piccolo ma attento a tutto ciò che arriva dal porto.',
    azioni: [
      { id: 'arruolati_gdf', nome: 'Chiedi di arruolarti in Finanza', ore: 2, skill: 'contabilita', lavoro: 'Finanziere' },
      { id: 'segnala_contrabbando', nome: 'Segnala un traffico sospetto', ore: 1, skill: 'osservazione', npc: 'maggiore_finanza' },
    ] },
  { id: 'chiesa', nome: 'Chiesa Madre', cat: 'istituzioni', orario: null,
    desc: 'La chiesa più antica del paese, fresca anche ad agosto.',
    azioni: [
      { id: 'confessione', nome: 'Chiedi confessione a Don Calogero', ore: 1, skill: null, npc: 'parroco' },
      { id: 'chiedi_aiuto_parrocchia', nome: 'Chiedi aiuto all\'opera pia', ore: 1, skill: 'persuasione', npc: 'suora' },
      { id: 'suona_campane', nome: 'Offriti come sacrestano', ore: 2, skill: null },
    ] },
  { id: 'panificio', nome: 'Panificio "Il Grano d\'Oro"', cat: 'commercio', orario: [5,13],
    desc: 'Il profumo del pane appena sfornato invade la strada ogni mattina.',
    azioni: [
      { id: 'lavora_panificio', nome: 'Chiedi lavoro come garzone', ore: 3, skill: 'cucina', lavoro: 'Fornaio' },
      { id: 'compra_pane', nome: 'Compra il pane del giorno', ore: 1, skill: null },
    ] },
  { id: 'macelleria', nome: 'Macelleria', cat: 'commercio', orario: [7,13],
    desc: 'Ganci, coltelli affilati, e il macellaio che canta mentre lavora.',
    azioni: [
      { id: 'lavora_macelleria', nome: 'Chiedi lavoro in macelleria', ore: 3, skill: 'forza', lavoro: 'Macellaio' },
    ] },
  { id: 'mercato', nome: 'Mercato rionale', cat: 'commercio', orario: [6,13],
    desc: 'Bancarelle di verdura, pesce e stoffa, urla e contrattazioni.',
    azioni: [
      { id: 'vendi_al_mercato', nome: 'Allestisci una bancarella', ore: 4, skill: 'persuasione' },
      { id: 'ascolta_voci_mercato', nome: 'Ascolta le voci di piazza', ore: 1, skill: 'osservazione' },
    ] },
  { id: 'bar_centrale', nome: 'Bar Centrale "Bar Sport"', cat: 'ristoro', orario: [6,23],
    desc: 'Il bar dove si commenta la Gazzetta e si gioca a carte tutto il giorno.',
    azioni: [
      { id: 'gioca_carte', nome: 'Gioca a carte con gli avventori', ore: 2, skill: 'inganno' },
      { id: 'raccogli_pettegolezzi', nome: 'Raccogli pettegolezzi al bancone', ore: 1, skill: 'persuasione', npc: 'barista' },
      { id: 'lavora_bar', nome: 'Chiedi lavoro come cameriere', ore: 3, skill: null, lavoro: 'Cameriere' },
    ] },
  { id: 'trattoria', nome: 'Trattoria "Da Turi"', cat: 'ristoro', orario: [12,23],
    desc: 'Tavoli con la tovaglia a quadri, il menù cambia col pescato del giorno.',
    azioni: [
      { id: 'cena_trattoria', nome: 'Cena e osserva gli altri clienti', ore: 2, skill: 'osservazione' },
      { id: 'lavora_cucina', nome: 'Chiedi lavoro in cucina', ore: 3, skill: 'cucina', lavoro: 'Cuoco' },
    ] },
  { id: 'porto', nome: 'Porto peschereccio', cat: 'lavoro', orario: null,
    desc: 'Barche colorate, reti stese ad asciugare, l\'odore di salsedine e gasolio.',
    azioni: [
      { id: 'imbarca_pesca', nome: 'Imbarcati per la pesca notturna', ore: 8, skill: 'pesca', lavoro: 'Pescatore' },
      { id: 'ronda_porto', nome: 'Aggirati tra le banchine di notte', ore: 2, skill: 'osservazione' },
      { id: 'traffico_porto', nome: 'Cerca un contatto per un carico "particolare"', ore: 2, skill: 'inganno', npc: 'capobarca' },
    ] },
  { id: 'officina', nome: 'Autofficina "Lo Cascio"', cat: 'lavoro', orario: [8,19],
    desc: 'Odore di olio motore, un\'Alfasud sollevata sul ponte.',
    azioni: [
      { id: 'lavora_officina', nome: 'Chiedi lavoro come meccanico', ore: 4, skill: 'meccanica', lavoro: 'Meccanico' },
      { id: 'ripara_veicolo', nome: 'Ripara il tuo veicolo', ore: 2, skill: 'meccanica' },
    ] },
  { id: 'ufficio_postale', nome: 'Ufficio Postale', cat: 'servizi', orario: [8,13],
    desc: 'La fila per il vaglia e i pacchi dei parenti emigrati.',
    azioni: [
      { id: 'spedisci_lettera', nome: 'Spedisci una lettera', ore: 1, skill: null },
      { id: 'lavora_posta', nome: 'Chiedi lavoro come impiegato postale', ore: 2, skill: 'contabilita', lavoro: 'Impiegato postale' },
    ] },
  { id: 'banca', nome: 'Banca Popolare', cat: 'servizi', orario: [8,13],
    desc: 'Sportelli in legno scuro, un cassiere che conta le lire a mano.',
    azioni: [
      { id: 'apri_conto', nome: 'Apri un conto o chiedi un prestito', ore: 1, skill: 'contabilita' },
      { id: 'lavora_banca', nome: 'Fai domanda come impiegato', ore: 2, skill: 'contabilita', lavoro: 'Impiegato di banca' },
    ] },
  { id: 'ambulatorio', nome: 'Ambulatorio medico', cat: 'servizi', orario: [8,20],
    desc: 'La sala d\'attesa del dottor Sammartino, sempre piena.',
    azioni: [
      { id: 'curati', nome: 'Fatti visitare', ore: 1, skill: null, npc: 'medico' },
      { id: 'assisti_medico', nome: 'Offriti come assistente', ore: 3, skill: 'medicina', lavoro: 'Infermiere' },
    ] },
  { id: 'scuola', nome: 'Scuola elementare e media', cat: 'servizi', orario: [8,13],
    desc: 'Grembiuli neri, fiocchi, il ritratto del Presidente in aula.',
    azioni: [
      { id: 'lavora_scuola', nome: 'Chiedi supplenza come maestro', ore: 4, skill: 'psicologia', lavoro: 'Maestro elementare' },
    ] },
  { id: 'redazione', nome: 'Redazione de "La Voce di Villa Franca"', cat: 'sociale', orario: [9,19],
    desc: 'Una stanza piena di fumo, macchine da scrivere, ritagli di giornale ovunque.',
    azioni: [
      { id: 'lavora_giornale', nome: 'Proponiti come cronista', ore: 3, skill: 'persuasione', lavoro: 'Giornalista praticante', npc: 'giornalista' },
      { id: 'scrivi_articolo', nome: 'Scrivi un articolo', ore: 4, skill: 'arte' },
    ] },
  { id: 'sede_sindacato', nome: 'Sede della Camera del Lavoro', cat: 'sociale', orario: [15,20],
    desc: 'Manifesti alle pareti, un ciclostile che gira in continuazione.',
    azioni: [
      { id: 'iscriviti_sindacato', nome: 'Iscriviti alla Camera del Lavoro', ore: 1, skill: null, npc: 'sindacalista' },
      { id: 'organizza_sciopero', nome: 'Aiuta a organizzare una vertenza', ore: 3, skill: 'persuasione', npc: 'sindacalista' },
    ] },
  { id: 'circolo_ricreativo', nome: 'Circolo Ricreativo', cat: 'sociale', orario: [16,24],
    desc: 'Biliardo, carte, e uomini rispettati seduti sempre agli stessi tavoli.',
    azioni: [
      { id: 'biliardo', nome: 'Gioca a biliardo', ore: 2, skill: null },
      { id: 'avvicina_boss', nome: 'Cerca di farti notare da Don Peppino', ore: 2, skill: 'persuasione', npc: 'boss' },
    ] },
  { id: 'circolo_che_guevara', nome: 'Circolo "Nuclei Operai Combattenti"', cat: 'sociale', orario: [18,23],
    desc: 'Una sede informale sopra un garage, manifesti e volantini ciclostilati.',
    azioni: [
      { id: 'partecipa_assemblea_sx', nome: 'Partecipa a un\'assemblea', ore: 3, skill: 'persuasione', npc: 'leader_sinistra' },
    ] },
  { id: 'sede_falange', nome: 'Sede della Falange d\'Italia', cat: 'sociale', orario: [18,23],
    desc: 'Una sede defilata, bandiere e ritratti di un\'altra epoca.',
    azioni: [
      { id: 'partecipa_riunione_dx', nome: 'Partecipa a una riunione', ore: 3, skill: 'persuasione', npc: 'leader_destra' },
    ] },
  { id: 'piazza', nome: 'Piazza Umberto I', cat: 'sociale', orario: null,
    desc: 'Il cuore del paese, la fontana secca da anni, gli anziani sulle panchine.',
    azioni: [
      { id: 'passeggia_piazza', nome: 'Passeggia e osserva la gente', ore: 1, skill: 'osservazione' },
      { id: 'contatta_balordo', nome: 'Cerca Peppe \'u Zoppo per notizie', ore: 1, skill: 'persuasione', npc: 'balordo' },
    ] },
  { id: 'discoteca', nome: 'Discoteca "Blue Moon"', cat: 'sociale', orario: [22,4],
    desc: 'Luci colorate, un juke-box, i ragazzi del paese ballano fino a tardi.',
    azioni: [
      { id: 'balla', nome: 'Balla e socializza', ore: 3, skill: null },
      { id: 'affari_discoteca', nome: 'Fai due chiacchiere in un angolo appartato', ore: 2, skill: 'inganno' },
    ] },
  { id: 'cinema', nome: 'Cinema "Splendor"', cat: 'sociale', orario: [16,24],
    desc: 'L\'unica sala del paese, proietta ancora in pellicola.',
    azioni: [
      { id: 'guarda_film', nome: 'Guarda il film in programmazione', ore: 2, skill: null },
    ] },
  { id: 'edicola', nome: 'Edicola e Tabaccheria', cat: 'commercio', orario: [6,20],
    desc: 'Giornali nazionali con un giorno di ritardo, sigarette, il Totocalcio.',
    azioni: [
      { id: 'leggi_giornali', nome: 'Leggi i giornali nazionali', ore: 1, skill: null },
      { id: 'gioca_totocalcio', nome: 'Gioca la schedina', ore: 1, skill: null },
    ] },
  { id: 'ville', nome: 'Quartiere delle ville signorili', cat: 'residenze', orario: null,
    desc: 'Ville liberty un po\' decadenti, cancelli in ferro battuto, cani da guardia.',
    azioni: [
      { id: 'visita_notaio', nome: 'Fai visita al notaio Sorrentino', ore: 1, skill: 'persuasione', npc: 'notaio' },
      { id: 'visita_baronessa', nome: 'Fai visita alla baronessa Alliata', ore: 1, skill: 'persuasione', npc: 'baronessa' },
    ] },
  { id: 'case_popolari', nome: 'Case popolari', cat: 'residenze', orario: null,
    desc: 'Palazzine basse, panni stesi da un balcone all\'altro, bambini che giocano in strada.',
    azioni: [
      { id: 'chiacchiera_vicinato', nome: 'Chiacchiera con i vicini', ore: 1, skill: null },
    ] },
  { id: 'campagna', nome: 'Masserie e campagne', cat: 'campagna', orario: null,
    desc: 'Ulivi, vigne, il sole che spacca le pietre a mezzogiorno.',
    azioni: [
      { id: 'lavora_campagna', nome: 'Chiedi lavoro nei campi', ore: 6, skill: 'agricoltura', lavoro: 'Bracciante agricolo' },
      { id: 'esplora_campagna', nome: 'Esplora le campagne intorno', ore: 3, skill: 'osservazione' },
    ] },
  { id: 'cimitero', nome: 'Cimitero e Pompe Funebri', cat: 'servizi', orario: [8,18],
    desc: 'Cipressi alti, lapidi antiche, il custode che conosce ogni storia sepolta lì.',
    azioni: [
      { id: 'visita_tomba', nome: 'Visita una tomba di famiglia', ore: 1, skill: null },
      { id: 'lavora_pompe_funebri', nome: 'Chiedi lavoro alle pompe funebri', ore: 3, skill: null, lavoro: 'Impiegato pompe funebri' },
    ] },
];

/* ---------------------------------------------------------------------- */
/* CALENDARIO STORICO 1980 — fatti realmente accaduti                     */
/* ---------------------------------------------------------------------- */
GAME_DATA.STORIA_1980 = [
  { data: '1980-01-06', titolo: 'Omicidio a Palermo', testo: 'Il Presidente della Regione Siciliana Piersanti Mattarella viene ucciso a Palermo davanti alla famiglia. La notizia sconvolge l\'intera Sicilia.' },
  { data: '1980-04-30', titolo: 'Crisi internazionale a Londra', testo: 'Un gruppo armato occupa l\'ambasciata iraniana a Londra; l\'assedio tiene con il fiato sospeso l\'opinione pubblica internazionale.' },
  { data: '1980-05-04', titolo: 'Morto il Maresciallo Tito', testo: 'A Lubiana muore Josip Broz Tito, storico presidente della Jugoslavia. Si apre un\'incertezza sul futuro del paese balcanico.' },
  { data: '1980-06-27', titolo: 'Disastro aereo sul Tirreno', testo: 'Un aereo di linea partito da Bologna e diretto a Palermo scompare dai radar nei pressi di Ustica. Non ci sono superstiti: la notizia arriva anche a Villa Franca con enorme sgomento, essendo la rotta quella per la Sicilia.' },
  { data: '1980-07-19', titolo: 'Olimpiadi di Mosca', testo: 'Si aprono i Giochi Olimpici di Mosca, boicottati da diversi paesi occidentali per la guerra in Afghanistan.' },
  { data: '1980-08-02', titolo: 'Strage alla stazione di Bologna', testo: 'Una bomba esplode nella sala d\'aspetto della stazione ferroviaria di Bologna, causando decine di vittime. Il paese intero resta sconvolto dalla notizia.' },
  { data: '1980-09-22', titolo: 'Scoppia la guerra Iran-Iraq', testo: 'L\'Iraq attacca l\'Iran: inizia un conflitto che si preannuncia lungo e sanguinoso in Medio Oriente.' },
  { data: '1980-11-04', titolo: 'Elezioni presidenziali americane', testo: 'Ronald Reagan viene eletto Presidente degli Stati Uniti.' },
  { data: '1980-11-23', titolo: 'Terremoto nel Sud Italia', testo: 'Un violentissimo terremoto colpisce l\'Irpinia e la Basilicata, causando migliaia di vittime. La solidarietà si organizza in tutto il paese, anche a Villa Franca.' },
  { data: '1980-12-08', titolo: 'Ucciso un ex Beatle a New York', testo: 'John Lennon viene ucciso a colpi di arma da fuoco a New York. Anche i più giovani di Villa Franca, che ascoltano i suoi dischi di nascosto, ne restano segnati.' },
];

if (typeof module !== 'undefined') module.exports = GAME_DATA;
