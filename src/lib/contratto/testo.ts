// Testo del contratto (Modulo d'Ordine) — fonte di verità unica, allineata al
// PDF DocuSeal. Mostrato in chiaro al cliente su /firma prima della firma.
// Le Condizioni Particolari sono per-servizio: si mostrano solo quelle dei
// servizi effettivamente in ordine. Generali e DPA si mostrano sempre.

export interface Articolo {
  id: string; // es. "Art. 1"
  titolo: string;
  commi: string[];
}

export interface Sezione {
  titolo: string;
  articoli: Articolo[];
}

export type ParticolareKey = "social" | "web" | "content";

// Dichiarazione dei poteri di rappresentanza (premessa alla sottoscrizione).
export const PREMESSA_POTERI =
  "Il Cliente dichiara di essere a) legale rappresentante o b) procuratore della società/ditta Cliente (come individuata nel Modulo Ordine) e, in ogni caso, di essere munito dei poteri necessari per rappresentare la medesima società/ditta Cliente in materia pubblicitaria e di potere quindi legittimamente sottoscrivere, per conto della medesima Cliente, il presente Ordine, impegnando validamente la stessa Cliente nei confronti di Digital Discovery SRL con riferimento all'adempimento delle obbligazioni assunte con il presente Ordine.";

export const CONDIZIONI_GENERALI: Articolo[] = [
  {
    id: "Art. 1",
    titolo: "Conclusione del Contratto",
    commi: [
      "Il presente Ordine costituisce proposta contrattuale, subordinata all'accettazione da parte di Digital Discovery SRL (di seguito Digital Discovery).",
      "Digital Discovery manifesterà la propria accettazione con l'emissione della fattura ovvero con l'esecuzione dell'unica prestazione commissionata o di una delle singole prestazioni commissionate, senza necessità di avviso, in deroga all'art. 1327 comma II c.c.",
      "La proposta è irrevocabile per tre mesi dalla data di sottoscrizione.",
      "Decorso tale termine, il Cliente potrà revocare l'Ordine con invio di Raccomandata A.R. sino a quando non sia intervenuta l'accettazione di Digital Discovery. In tal caso, considerato anche che, non appena sottoscritto l'Ordine, Digital Discovery intraprende attività finalizzate al proprio adempimento, il Cliente dovrà corrispondere a Digital Discovery a titolo di indennizzo il 25% del valore annuale dell'Ordine non eseguito.",
    ],
  },
  {
    id: "Art. 2",
    titolo: "Durata del Contratto e Recesso",
    commi: [
      "2.1 Durata. Il Contratto, ove vi sia accettazione dell'Ordine, ha durata annuale decorrente, per espressa convenzione fra le parti (i) dalla data di sottoscrizione dell'Ordine, ovvero (ii) dall'attivazione dei servizi on-line. Per i contratti di durata annuale non è previsto tacito rinnovo del Contratto per successivi periodi di un anno.",
      "2.2 Recesso.",
      "2.2.1 Per i contratti di durata annuale, il Cliente non potrà recedere in alcun caso dal Contratto stesso.",
      "2.2.2 Per ogni tipologia di contratto Digital Discovery ha facoltà di recesso, da esercitare mediante semplice comunicazione al Cliente; la mancata esecuzione conseguente al recesso da parte di Digital Discovery comporterà, per il Cliente, il diritto al solo rimborso di quanto eventualmente corrisposto per la prestazione non eseguita, rimanendo Digital Discovery sollevata da qualsivoglia altra responsabilità verso il Cliente.",
    ],
  },
  {
    id: "Art. 3",
    titolo: "Responsabilità del Cliente",
    commi: [
      "Posto che Digital Discovery non è responsabile quanto al contenuto dei messaggi pubblicitari e - in riferimento ai mezzi prescelti - al loro posizionamento, alla loro forma ed alle chiavi di ricerca, tuttavia e in ogni caso il Cliente dichiara in merito di assumersi ogni responsabilità. Il Cliente attesta perciò la piena legittimità di quanto commissionato e dichiara di avere il diritto di utilizzare gli elementi che compongono il messaggio. Il Cliente dovrà fornire, ove richiesto, ogni documento che dimostri la legittima titolarità degli elementi che compongono il proprio messaggio, con riferimento, a solo titolo esemplificativo, a marchi, nomi a dominio, segni distintivi in genere, immagini fotografiche e video. In difetto, il Contratto, qualora già concluso, si intenderà risolto di diritto per inadempimento del Cliente, il quale si impegna a tenere indenne Digital Discovery da qualsiasi responsabilità che possa esserle contestata da terzi. In tutti i casi, l'esecuzione dell'Ordine non comporta corresponsabilità di Digital Discovery in relazione al suo contenuto.",
      "Con riferimento ai servizi on line di realizzazione di siti web, il Cliente prende atto e accetta che l'Authorization Code identificativo del dominio registrato è presupposto indispensabile per l'adempimento da parte di Digital Discovery alle obbligazioni derivanti dal Contratto. Pertanto, con riferimento al suddetto Authorization Code, il Cliente si obbliga, per tutta la durata del Contratto, a non porre in essere comportamenti che impediscano l'esecuzione del Contratto medesimo da parte di Digital Discovery.",
    ],
  },
  {
    id: "Art. 4",
    titolo: "Responsabilità di Digital Discovery e clausola penale",
    commi: [
      "Digital Discovery risponde unicamente per dolo o colpa grave e soltanto delle omissioni anche totali e degli errori relativi alla pubblicità ordinata che annullino o riducano gravemente l'efficacia della stessa e che le siano segnalati dal Cliente con Raccomandata A.R. entro 60 giorni dalla consultabilità della pubblicità ordinata sul mezzo prescelto.",
      "Sussistendo le condizioni di cui al comma 1 del presente articolo: (i) Digital Discovery riconoscerà una riduzione del corrispettivo relativo alla prestazione interessata per il valore stimato dalla Digital Discovery stessa nonché la correzione nei tempi tecnici necessari; (ii) ai sensi dell'art. 1382 c.c., il Cliente e Digital Discovery pattuiscono che quest'ultima, a seguito di richiesta risarcitoria del Cliente, sarà tenuta unicamente, riguardo ai servizi su mezzi on line, alla ripetizione gratuita della prestazione interessata per 60 giorni esclusa ogni altra forma di risarcimento.",
      "Il Cliente esonera Digital Discovery e chi compie attività per essa (stampatore, ecc.) da ogni responsabilità, anche riferibile a qualsiasi altra pubblicità commissionata da terzi ed anche con riferimento alla sua mancata o parziale esecuzione, all'anticipata o mancata distribuzione delle pubblicazioni, alla struttura e alle modalità di consultazione e all'erogazione dei servizi pubblicitari su mezzi on line.",
    ],
  },
  {
    id: "Art. 5",
    titolo: "Pagamento del corrispettivo – sconto finanziario - clausola penale",
    commi: [
      "5.1 Pagamento del corrispettivo. Digital Discovery a sua discrezione potrà richiedere al Cliente pagamenti anticipati mediante emissione di relativa fattura o prestazioni di garanzie sul pagamento.",
      "I Clienti che provvedono al pagamento del corrispettivo tramite addebito in conto corrente accettano l'invio della fattura a mezzo posta elettronica, mediante la compilazione del campo “E-mail per fatturazione” presente nel frontespizio dell'Ordine. Qualora il suddetto campo non sia stato compilato, la spedizione della fattura avverrà a mezzo posta, con addebito ai Clienti medesimi delle relative spese di spedizione. I suddetti Clienti si impegnano a comunicare tempestivamente a Digital Discovery ogni modifica dell'indirizzo email indicato per l'invio della fattura.",
      "Il Cliente si obbliga al pagamento a favore di Digital Discovery, alle scadenze stabilite, degli importi indicati nell'Ordine, come inizialmente riportati nel frontespizio dello stesso o registrati telefonicamente, ovvero, nel caso di modifiche intervenute in costanza di rapporto, come risultanti dalla somma degli importi indicati nei moduli contrattuali descrittivi degli oggetti e dei mezzi pubblicitari prescelti in corso di rapporto.",
      "In caso di pagamento mediante addebito diretto in conto corrente, il Cliente conferisce a Digital Discovery espresso mandato secondo quanto previsto nell'apposita sezione del frontespizio dell'Ordine. Inoltre, con riferimento a tale mandato, il Cliente riconosce ed accetta espressamente che Digital Discovery, prima di procedere all'addebito e, in ogni caso, entro il giorno antecedente ad esso, provvederà ad inviare al Cliente stesso, anche unitamente alla fattura e anche nei casi di pagamenti rateali, un unico preavviso di addebito contenente l'indicazione delle scadenze di pagamento e dei relativi importi. In caso di mancato addebito, il pagamento dovrà essere effettuato a Digital Discovery a cura del Cliente in altra forma.",
      "Il corrispettivo per le prestazioni pubblicitarie viene inizialmente determinato sulla base del listino in vigore al momento della sottoscrizione dell'Ordine ovvero della richiesta di eventuali successive modifiche degli oggetti pubblicitari ordinati in origine. Qualora l'Ordine sia stato concluso nell'interesse di terzi beneficiari, il Cliente rimane comunque obbligato, in solido con tali terzi, per il pagamento dell'intero corrispettivo indicato nello stesso.",
      "In costanza di Contratto, e con applicazione ai soli contratti annuali, il corrispettivo potrà subire incrementi in ragione dell'entrata in vigore di nuovi listini. Ove l'incremento sia compreso in una percentuale non superiore a 3 punti percentuali rispetto alla variazione annuale dell'indice dei prezzi al consumo per le famiglie di operai ed impiegati, accertata dall'ISTAT (con riferimento al terzo mese antecedente la data di decorrenza dell'aumento del listino), esso troverà automatica attuazione e si tradurrà in un'obbligazione di pagamento a carico del Cliente. In caso di superamento di tale limite, Digital Discovery provvederà ad informare il Cliente con un preavviso di 45 giorni dalla data di emissione della fattura portante il corrispettivo aggiornato, salva la facoltà per il Cliente di esercitare il recesso, anche parziale, da comunicarsi a mezzo di Raccomandata A.R. con un preavviso di 30 giorni dalla predetta comunicazione. In ogni caso, nelle ipotesi di applicazione di condizioni particolari (sconti, promozioni etc.) in occasione della sottoscrizione dell'Ordine, l'aumento del corrispettivo sarà conteggiato tenendo a riferimento l'originario valore a listino.",
      "5.2 Sconto finanziario. Qualora Digital Discovery – come stabilito al punto 5.1 – richieda al Cliente pagamenti anticipati (Acconto all'Ordine), al Cliente potrà essere concesso uno sconto finanziario fino a un massimo del 3% del valore dell'acconto riportato nel frontespizio. Il valore così determinato andrà in detrazione del valore netto ancora da corrispondere (Saldo dell'Ordine). L'applicazione dello sconto finanziario è subordinata all'incasso dell'Acconto all'Ordine. Lo sconto finanziario non si applica ai contratti non a tacito rinnovo, in presenza di terzi beneficiari paganti, ai Clienti con lettera di esenzione o gestiti con piani di fatturazione ad hoc ivi compresi i piani di accorpamento fatture.",
      "5.3 Clausola penale. In caso di mancato pagamento di fatture o anche di una sola rata relativa al presente Ordine o qualora il Cliente sia inadempiente, parzialmente o totalmente, per altri Ordini anche precedenti, Digital Discovery potrà considerare risolto di diritto il Contratto. Conseguentemente la risoluzione comporterà per il Cliente l'obbligo di corrispondere a titolo di penale il 40% del relativo corrispettivo limitatamente alla parte non eseguita.",
      "La presenza di situazione debitoria del Cliente può costituire elemento impeditivo per l'accettazione di nuovi Ordini. In tale caso, Digital Discovery si riserva la facoltà di chiedere al debitore adeguate garanzie a sostegno del pagamento del debito, maggiorato di interessi e spese.",
      "Il mancato e/o ritardato pagamento anche di una sola fattura e/o rata relativa al presente Ordine comporta, altresì, l'applicazione al debitore di una penale pari al 5% del valore dello scaduto che il Cliente si impegna a pagare a prima richiesta.",
    ],
  },
  {
    id: "Art. 6",
    titolo: "Materiale pubblicitario – Proprietà intellettuale",
    commi: [
      "Il Cliente è tenuto a consegnare a Digital Discovery, nei termini eventualmente fissati dalla stessa, il materiale esecutivo in originale e anche l'eventuale materiale digitale tale da consentirne la riproduzione sui mezzi cartacei e on line e l'invio ai consultatori via e-mail o SMS. In caso di mancata o ritardata consegna del materiale, Digital Discovery si riserva il diritto di addebitare al Cliente le spese di lavorazione e sarà esente da ogni responsabilità derivante dall'inesatta o imperfetta esecuzione. Ove, a causa del ritardo, non sia stato possibile eseguire in tutto o in parte l'Ordine, il Cliente dovrà corrispondere una somma pari al 25% del valore annuale della parte di Contratto non eseguita.",
      "Il materiale non si restituisce. Digital Discovery non risponde di eventuali difformità nella resa grafica della riproduzione degli oggetti pubblicitari commissionati e dell'imperfetta riproduzione delle immagini ricevute dal Cliente. Digital Discovery è l'esclusiva titolare dei diritti di proprietà intellettuale relativi alla realizzazione creativa degli spazi pubblicitari, ivi compresi i diritti relativi alla progettazione, architettura, configurazione tecnica e ai connessi codici sorgente, alla struttura, alla grafica e alla creatività dei siti web e applicazioni per smartphone e tablet realizzati, nonché relativi ai testi redazionali realizzati con riferimento ai servizi oggetto del Contratto. Il Cliente non potrà quindi in alcun modo copiare né riprodurre in tutto o in parte tali elementi identificativi dell'opera creativa realizzata da Digital Discovery in esecuzione del presente Contratto avente ad oggetto tutti i servizi pubblicitari, ivi compresi i siti web.",
    ],
  },
  {
    id: "Art. 7",
    titolo: "IVA",
    commi: [
      "Il Cliente che, con riferimento all'attività pubblicitaria sui mezzi Digital Discovery, risulta soggetto passivo ai fini IVA è tenuto a fornire a Digital Discovery all'atto della sottoscrizione dell'Ordine e sotto la propria responsabilità il proprio numero di partita IVA.",
    ],
  },
  {
    id: "Art. 8",
    titolo: "Foro Competente",
    commi: [
      "Per le controversie che potrebbero nascere dall'interpretazione e dall'applicazione del presente Ordine è esclusivamente competente il Foro di L'Aquila, salvo che per le controversie instaurate da Digital Discovery in relazione al pagamento di quanto dovuto dal debitore, per le quali in via alternativa al predetto Foro sono altresì competenti i seguenti Fori: Pescara, Roma.",
    ],
  },
  {
    id: "Art. 9",
    titolo: "Clausole aggiuntive – Contratti successivi",
    commi: [
      "9.1 Eventuali clausole aggiuntive e/o modificative del presente Contratto formulate dal Cliente, per essere efficaci, dovranno essere approvate ed accettate per iscritto da Digital Discovery.",
      "9.2 Il Cliente prende atto che gli agenti, che su incarico di Digital Discovery svolgono attività di promozione, acquisizione e trasmissione degli Ordini pubblicitari sottoscritti dallo stesso Cliente, non hanno potere di rappresentanza di Digital Discovery.",
    ],
  },
  {
    id: "Art. 10",
    titolo: "Tutela dei dati personali - Informativa ex art. 13 D.Lgs. 196/03",
    commi: [
      "Titolare del trattamento è Digital Discovery SRL, con sede legale in Piazzale Sant'Antonio 7 - 67100, L'Aquila (AQ).",
      "Ai sensi e per gli effetti dell'art. 13 del D.Lgs. n. 196 del 30 giugno 2003 “Codice in materia di protezione dei dati personali” e successive modifiche, La informiamo che i Suoi dati personali, a noi conferiti in occasione di rapporti commerciali finalizzati alla presentazione di offerte e/o nella formazione di rapporti contrattuali sono oggetto di trattamenti manuali e/o elettronici, nel rispetto di idonee misure di sicurezza e protezione dei dati medesimi, unicamente per le seguenti finalità:",
      "1. per finalità strettamente connesse alla gestione del rapporto contrattuale ed all'erogazione del/dei Servizi da Lei acquistati e degli adempimenti strettamente funzionali di natura amministrativa, produttiva, di assistenza al cliente, di organizzazione dei processi di vendita, di valutazione della solvibilità e di gestione del contenzioso attuati anche mediante trattamento da parte di terzi esercenti attività tipografico/editoriale, amministrativa, di gestione del credito, di agenzia e di studi legali. In caso di pagamento con addebito diretto in conto corrente, con riferimento al mandato conferito dal Cliente mediante compilazione e sottoscrizione dell'apposita sezione nel frontespizio dell'Ordine, i dati anagrafici, bancari e fiscali conferiti volontariamente nel rilasciare il medesimo mandato, saranno altresì trattati in forma automatizzata dalla Titolare Digital Discovery SRL e dalla stessa Titolare saranno comunicati all'Ente che allinea elettronicamente gli Archivi e alla Banca per l'attivazione delle richieste di incasso mediante addebito sul conto corrente. Le richieste di aggiornamento, cancellazione e opposizione al trattamento dei dati personali potranno essere rivolte alla Titolare al menzionato indirizzo mediante comunicazione scritta. I dati potranno essere trattati con la collaborazione di soggetti terzi espressamente nominati da Digital Discovery Responsabili o Incaricati del trattamento, nonché comunicati ai terzi che concorrono alla fornitura del Servizio. Il conferimento dei dati è obbligatorio, e l'eventuale rifiuto comporta l'impossibilità di eseguire il Contratto.",
      "2. per finalità funzionali ad attività commerciale/promozionale quali: a) ricerche di mercato e analisi statistiche; b) rilevazione del livello di soddisfazione; c) comunicazioni commerciali, attività promozionali, invio di materiale pubblicitario. Per attività promozionali di Digital Discovery si intendono quelle finalizzate al miglioramento della soddisfazione della clientela, nonché all'opportunità di ricevere proposte commerciali, alcune delle quali non disponibili sul mercato, che Digital Discovery riserva ai clienti che abbiano fornito il consenso al trattamento dei propri dati per finalità promozionali. Altre tipologie di attività promozionali potranno riguardare prodotti e servizi di nostri partner commerciali. Per tale finalità, nonché per finalità di marketing diretto, il Suo consenso verrà utilizzato per comunicazioni effettuate mediante: canali tradizionali (chiamate con operatore, posta cartacea), canali di comunicazione elettronica senza intervento di operatori (es. sms, mms, e-mail, messaggistica istantanea) e mediante l'utilizzo dei social network. Tali dati potranno essere comunicati a società esterne della cui collaborazione Digital Discovery si avvale e che li tratteranno in qualità di Responsabili del trattamento, espressamente nominati. Il conferimento di questi dati non è obbligatorio e non sussistono pertanto conseguenze in caso di un Suo rifiuto, se non l'impossibilità di assicurarle una maggiore informazione sugli sviluppi dei nostri Servizi e un maggiore adeguamento degli stessi alle Sue esigenze.",
      "I dati verranno trattati per tutta la durata dei rapporti contrattuali instaurati e anche successivamente per l'espletamento di tutti gli adempimenti di legge, per la difesa, anche in giudizio, degli interessi di Digital Discovery nonché, qualora vi sia il Suo consenso, per future finalità commerciali. La informiamo che i dati personali potranno essere diffusi nell'ambito del territorio nazionale ed eventualmente all'estero, all'interno e all'esterno dell'Unione Europea, sempre nel rispetto dei diritti e delle garanzie previsti dalla normativa vigente.",
      "Il Cliente gode dei diritti di cui all'art. 7 D.Lgs. 196/03, tra cui il diritto di ottenere dal titolare del trattamento la conferma dell'esistenza dei suoi dati personali e la loro comunicazione in forma intelligibile, di conoscere le modalità e le logiche del trattamento, di richiedere l'aggiornamento e l'integrazione dei dati stessi, la loro cancellazione o trasformazione in forma anonima, in caso di violazione di legge, nonché di opporsi al loro trattamento. Tali diritti potranno essere esercitati rivolgendosi per iscritto a Digital Discovery SRL - Ufficio del Responsabile del trattamento editoriale dei dati - Piazzale Sant'Antonio 7 - 67100 L'Aquila. L'elenco completo dei responsabili del trattamento è reperibile sul sito www.digital-discovery.it.",
    ],
  },
];

export const PARTICOLARI_INTRO =
  "Nel caso in cui tra i Servizi richiesti dal Cliente fosse ricompreso uno o più dei Servizi di seguito indicati, si applicano, rispettivamente, con riferimento al singolo servizio ricompreso nell'Ordine, anche le seguenti Condizioni Particolari; per quanto non espressamente previsto dalle seguenti Condizioni Particolari si applicano le sopraestese Condizioni Generali.";

export const PARTICOLARI: Record<ParticolareKey, Sezione> = {
  social: {
    titolo: "Servizio Gestione Social",
    articoli: [
      {
        id: "Art. 1",
        titolo: "Oggetto del Servizio",
        commi: [
          "1.1 Il Cliente richiede a Digital Discovery la realizzazione di un servizio volto alla promozione della propria attività di impresa nell'ambito del web e delle piattaforme digitali di Social Network, mediante la pubblicazione sul web e sulle citate piattaforme, sincronizzazione e aggiornamento, come di seguito descritto, delle informazioni di contatto e reperibilità del Cliente, oltre ad altri contenuti anche descrittivi di seguito individuati. In particolare, il Servizio prevede: a) Pubblicazione e aggiornamento dei dati sui principali social network, quali Facebook, Instagram, TikTok, LinkedIn. In particolare, fermo quanto previsto dal successivo art. 2, il Servizio prevede altresì la creazione e pubblicazione di una pagina dedicata al Cliente sui social network Facebook, Instagram, TikTok, LinkedIn (di seguito “Pagina Dedicata”) - o aggiornamento dei contenuti di tale Pagina Dedicata, qualora il Cliente ne abbia già una – ossia una pagina contenente i dati, contenuti ed immagini tratti dal Sito Web o da sistemi di posizionamento online già nella disponibilità del Cliente (di seguito “Dati”).",
          "1.2 Il Servizio prevede la manutenzione e l'aggiornamento periodico dei Dati del Cliente tramite recepimento sincronizzato e automatico, su tutte le piattaforme e portali web indicati nel precedente art. 1.1, delle modifiche ai Dati apportate dal Cliente o su indicazione del medesimo nel corso della durata del contratto.",
          "1.3 Digital Discovery non sarà in alcun modo responsabile delle modifiche e degli interventi nonché delle variazioni grafiche ed editoriali e di prodotto in genere, effettuati direttamente dai soggetti terzi titolari dei motori di ricerca, social network, siti e applicativi sui loro servizi, ivi comprese le modifiche della configurazione dei servizi di cui al presente art. 1 e al successivo art. 3.",
          "1.4 Digital Discovery garantisce la pubblicazione nell'ambito del network come sopra descritto senza garantire la pubblicazione su uno specifico publisher o motore di ricerca. Le tempistiche di pubblicazione potrebbero essere inoltre differenti a seconda del sito e/o del motore di ricerca.",
        ],
      },
      {
        id: "Art. 2",
        titolo:
          "Mandato – Esclusione di responsabilità per interventi del Cliente – Amministrazione della Pagina Dedicata",
        commi: [
          "2.1 Il Cliente prende atto e accetta che per eseguire il Servizio è necessario disporre di un profilo utente su Facebook, Instagram, TikTok, LinkedIn (di seguito “Account”) mediante il quale effettuare la compilazione iniziale e le successive modifiche ed aggiornamenti della propria Scheda e/o Pagina Dedicata. Pertanto: a) quanto ai social network Facebook e LinkedIn, il Cliente dovrà già disporre di un proprio Account personale, al quale Digital Discovery potrà associare l'amministrazione della Pagina Aziendale Dedicata dalla stessa creata, qualora il Cliente non abbia già una propria pagina sul social network. Qualora, invece, il Cliente abbia già una propria pagina su Facebook e LinkedIn, si applica l'art. 2.2 che segue. b) quanto ai social network Instagram e TikTok, il Cliente dovrà già disporre di un proprio Account e-mail aziendale, al quale Digital Discovery potrà associare l'amministrazione della Pagina Aziendale Dedicata dalla stessa creata, qualora il Cliente non abbia già una propria pagina sul social network. Qualora, invece, il Cliente abbia già una propria pagina su Instagram e TikTok, si applica l'art. 2.3 che segue.",
          "2.2 Il Cliente prende atto ed accetta che Digital Discovery sia Amministratore della Pagina Dedicata ai fini dell'esecuzione del Servizio. Pertanto, il Cliente si impegna a non estromettere Digital Discovery dall'amministrazione della Pagina Dedicata; diversamente Digital Discovery si troverà nell'impossibilità di adempiere alla prestazione ordinata con riferimento al social network Facebook e LinkedIn per fatto e colpa del Cliente stesso ed avrà comunque diritto a percepire il corrispettivo pattuito. Nel caso in cui il Cliente sia già titolare ed amministratore della pagina, lo stesso nomina Digital Discovery co-amministratore della pagina ai fini dell'esecuzione del presente contratto.",
          "2.3 Il Cliente prende atto ed accetta di fornire a Digital Discovery le credenziali di accesso alla Pagina Dedicata ai fini dell'esecuzione del Servizio. Pertanto, il Cliente si impegna a non modificare le credenziali di accesso della Pagina o, in tal caso fosse necessario la modifica per motivi di sicurezza, a darne comunicazione immediata a Digital Discovery; diversamente Digital Discovery si troverà nell'impossibilità di adempiere alla prestazione ordinata con riferimento al social network Instagram e LinkedIn per fatto e colpa del Cliente stesso ed avrà comunque diritto a percepire il corrispettivo pattuito. Nel caso in cui il Cliente sia già titolare della pagina, lo stesso fornirà a Digital Discovery le credenziali di accesso della pagina ai fini dell'esecuzione del presente contratto.",
          "2.4 Resta fermo che, in ogni caso, Digital Discovery non potrà essere considerata responsabile delle modifiche ed interventi effettuati direttamente dal Cliente sulla Scheda e/o Pagina Dedicata mediante l'utilizzo delle credenziali d'accesso all'Account.",
          "2.5 Con la sottoscrizione dell'Ordine, il Cliente nomina quindi Digital Discovery e i suoi mandatari responsabili del trattamento dei dati relativi alle suddette credenziali d'accesso, che verranno utilizzati dai responsabili medesimi esclusivamente ai fini di esecuzione del Servizio secondo quanto sopra indicato.",
        ],
      },
      {
        id: "Art. 3",
        titolo: "Condizioni del Servizio",
        commi: [
          "3.1 Il Cliente prende atto e accetta che la pubblicazione del Servizio è subordinata all'accettazione da parte di tutti i soggetti titolari dei siti web e piattaforme digitali aderenti al network ricompreso nel Servizio e descritto al precedente art. 1.1.",
          "3.2 Il Cliente prende atto e accetta che all'interno delle schede pubblicate sui suddetti siti web e piattaforme potranno essere visualizzate anche recensioni sull'attività inserite in autonomia dagli utenti utilizzatori dei medesimi. Il Cliente prende atto e accetta che tali recensioni sono del tutto estranee all'attività di Digital Discovery e che non è possibile rimuoverle; in caso di recensione ritenuta inappropriata, il Cliente potrà comunque segnalare la circostanza direttamente ai titolari dei siti web e piattaforme ricomprese nel citato network.",
        ],
      },
      {
        id: "Art. 4",
        titolo:
          "Contenuti del Servizio – esonero di responsabilità di Digital Discovery e manleva",
        commi: [
          "4.1 Digital Discovery fornisce unicamente una prestazione finalizzata alla realizzazione del Servizio, comprensiva della pubblicazione sul web e piattaforme digitali – come indicato al precedente art. 1 - di dati, contenuti ed immagini correlati all'attività del Cliente. Pertanto, il Cliente autorizza sin d'ora Digital Discovery a pubblicare i dati, contenuti e le immagini di cui al precedente art. 1 ed esonera pertanto Digital Discovery da ogni responsabilità in ordine al contenuto di quanto pubblicato.",
          "4.2 In caso di dati, contenuti, immagini e materiali forniti e/o caricati direttamente dal Cliente, fermo restando quanto previsto dal precedente art. 2.3, il Cliente medesimo si impegna a non pubblicare materiale illecito, contrario a norme di legge e buon costume e comunque lesivo di diritti altrui, nonché coperto da diritti d'autore o diritti di proprietà intellettuale, ivi compresi marchi e nomi a dominio di cui non sia autorizzato a disporre, ed immagini raffiguranti persone fisiche, in assenza di consenso scritto delle medesime. Digital Discovery non sarà in alcun modo responsabile delle modifiche e degli interventi effettuati direttamente dal Cliente.",
          "4.3 In relazione agli obblighi di cui al presente art. 4, il Cliente terrà comunque indenne e manlevata Digital Discovery da qualsiasi eventuale perdita, danno, costo o spesa, derivante da pretese di terzi, anche in sede giudiziaria, comunque riferibili all'uso di testi, immagini, fotografie e qualunque altra forma di riproduzione visiva e/o sonora e di ogni altro elemento.",
        ],
      },
      {
        id: "Art. 5",
        titolo: "Durata",
        commi: [
          "Il Servizio avrà durata di un anno dalla data di sottoscrizione del contratto.",
        ],
      },
    ],
  },
  web: {
    titolo: "Servizi Web",
    articoli: [
      {
        id: "Art. 1",
        titolo: "Oggetto dei Servizi",
        commi: [
          "1.1 Il Cliente richiede a Digital Discovery la realizzazione di uno spazio web appartenente ad una delle suddette tipologie, Google Local Presence, Landing Page, Sito Web, E-commerce unitamente alle applicazioni disponibili per tali siti. Il Servizio, limitatamente alla tipologia Google Local Presence, prevede: a) Pubblicazione e aggiornamento dei dati del Cliente su Google. In particolare il Servizio prevede altresì l'aggiornamento della scheda “Google My Business” riferita al Cliente (di seguito “Scheda”), qualora la stessa sia esistente e sia già stata verificata dal Cliente medesimo. La Scheda contiene una presentazione del Cliente e della sua attività, comprensiva dei dati, contenuti ed immagini tratti dalla scheda realizzata da Digital Discovery per il Cliente. Qualora invece il Cliente non abbia già creato e/o verificato una propria Scheda sul motore di ricerca, il Cliente può richiedere, nell'ambito del Servizio, la creazione, verifica e pubblicazione della Scheda medesima; b) Pubblicazione e aggiornamento dei Dati del Cliente su Google Maps e trasmissione dei medesimi ai seguenti sistemi di navigazione per auto: Tom Tom, Here e Waze. Digital Discovery non garantisce l'aggiornamento e la sincronizzazione dei Dati sui sistemi di navigazione per auto, in quanto tali operazioni dipendono direttamente dai soggetti terzi titolari dei sistemi medesimi. Il Servizio, in riferimento a Landing Page, Sito Web ed E-commerce, prevede: a) la registrazione del nome a dominio del sito tramite un operatore specializzato (Register.it S.p.A), la creazione – anche per il tramite di terzi - di una o più caselle posta elettronica connessa al dominio, la progettazione dell'architettura del sito, la sua erogazione, manutenzione e l'aggiornamento dei suoi contenuti. La casella di posta cesserà unitamente alla cessazione, per qualunque ragione, del Servizio; alla cessazione del Servizio, quindi, il contenuto della casella di posta non sarà più accessibile al Cliente, il quale pertanto prende atto e accetta di essere l'unico responsabile delle attività di archiviazione e “backup” dei messaggi di posta elettronica.",
          "1.2 Con riferimento al Servizio Sito Web e E-commerce, il Cliente ha la possibilità, a fronte del pagamento del relativo corrispettivo, di aggiungere o modificare 5 (o multipli di 5) pagine del sito web. Una volta acquisito, il pacchetto potrà essere utilizzato dal Cliente – in tutto o in parte – fino alla scadenza del contratto con cui è stato acquisito il sito a cui le pagine si riferiscono.",
          "1.3 Il Servizio prevede altresì la possibilità, a fronte del pagamento del relativo corrispettivo, di richiedere la traduzione dell'intero sito web o e-commerce nelle lingue straniere disponibili.",
        ],
      },
      {
        id: "Art. 2",
        titolo:
          "Mandato - Esclusione di responsabilità per interventi del Cliente - Amministrazione dell'account Google",
        commi: [
          "2.1 Il Cliente prende atto e accetta che per eseguire il Servizio è necessario disporre di un profilo utente su Google (di seguito “Account”) mediante il quale effettuare la compilazione iniziale e le successive modifiche ed aggiornamenti della propria Scheda. Pertanto, al fine di consentire l'esecuzione del Servizio, il Cliente conferisce espresso mandato a Digital Discovery per la creazione, anche per il tramite di terzi mandatari, di un profilo utente su Google associato al Cliente. Si precisa che Digital Discovery utilizzerà le credenziali di accesso al solo fine di creare il suddetto Account. Tali credenziali verranno successivamente comunicate al Cliente che ne potrà disporre in via esclusiva. Il Cliente autorizza quindi Digital Discovery e i suoi mandatari a gestire la Scheda. Qualora il cliente sia già in possesso della Scheda, si impegna a fornire gli accessi a Digital Discovery al fine di consentire l'esecuzione del servizio.",
        ],
      },
      {
        id: "Art. 3",
        titolo: "Registrazione del dominio",
        commi: [
          "3.1 Il Cliente prende atto che la registrazione del nome a dominio è disciplinata dai regolamenti delle Registration Authority competenti, disponibili sui rispettivi siti ufficiali (ICANN, IANA), e si impegna a rispettare quanto ivi previsto.",
          "3.2 Il Cliente si impegna a procedere alla validazione della registrazione del nome a dominio tramite conferma alla mail che riceverà al momento della richiesta di registrazione e/o in ogni caso di modifica dei dati inseriti in fase di registrazione medesima. Il Cliente si impegna ad effettuare tale validazione entro 15 giorni dalla ricezione della suddetta richiesta di registrazione. In difetto di validazione nei tempi suddetti, il Cliente prende atto che Digital Discovery potrebbe procedere alla sospensione dell'erogazione del Servizio. Pertanto, al fine di rispettare le tempistiche suindicate, per il caso in cui si trovi nell'impossibilità di procedere alla validazione, il Cliente autorizza e delega sin d'ora Digital Discovery ad effettuare tale validazione per suo conto per consentire il compimento della procedura di registrazione del nome a dominio e l'erogazione del Servizio nei tempi prescritti.",
          "3.3 In alcuni casi le regole stabilite dalle Registration Authority e sopra richiamate possono riservare la registrazione del nome a dominio solo ed esclusivamente a favore di soggetti dotati di una stabile rappresentanza locale costituita nelle forme richieste dalla normativa della giurisdizione ove ha sede la Registration Authority preposta alla registrazione o in presenza di determinati requisiti. A tal fine il Cliente si impegna a fornire tutte le informazioni relative alla propria organizzazione, con precisa indicazione delle eventuali sedi secondarie e/o rappresentanze locali legittimate alla registrazione.",
          "3.4 Il Cliente prende atto che è disponibile la policy privacy di Register.it S.p.A. con riferimento al Servizio. Register.it S.p.A. agisce come Titolare autonomo del trattamento, in virtù del proprio ruolo di fornitore del servizio di registrazione di nome a dominio (Registrar) e tenuto conto degli obblighi previsti in capo al Registrar nei regolamenti delle singole Registration Authority.",
        ],
      },
      {
        id: "Art. 4",
        titolo: "Manleva",
        commi: [
          "4.1 Il Cliente prende atto che Digital Discovery fornisce unicamente una prestazione di servizi finalizzata alla realizzazione del sito medesimo e delle sue eventuali applicazioni, e che, pertanto, non potrà mai essere ritenuta responsabile in relazione ai testi, alle fotografie, ai video e alle musiche fornitegli dal Cliente stesso che dovrà, di conseguenza, assumersene tutte le responsabilità. Pertanto, il Cliente si impegna a non trasmettere e/o comunque a non rendere disponibile a Digital Discovery testi il cui contenuto non sia in linea con le politiche etico-sociali del sito e di Digital Discovery e/o abbia contenuti vietati dalla legge e fotografie che ritraggono, anche solo parzialmente, persone fisiche riconoscibili che non abbiano espresso per iscritto la propria autorizzazione all'inserimento dell'immagine.",
          "4.2 Il Cliente si impegna, altresì, a non trasmettere e/o comunque a non rendere disponibile per la pubblicazione materiale illecito, pornografico, volgare, osceno, a sfondo erotico o a favore della pedofilia, calunnioso, diffamatorio, offensivo della morale corrente o, comunque, lesivo dei diritti altrui o di messaggi incitanti all'odio ed alla discriminazione sessuale, razziale o religiosa, nonché materiale coperto da diritti d'autore e/o ogni e qualsivoglia altro diritto tutelato, ivi compreso materiale in cui siano inclusi marchi e segni distintivi di cui il Cliente non sia autorizzato a disporre.",
          "4.3 Ancora, il Cliente si impegna a non trasmettere e/o comunque a non rendere disponibile a Digital Discovery fotografie, testi, documenti, video e/o musiche che possano violare i diritti di proprietà intellettuale o industriale di terzi e, quindi, non potranno essere utilizzate fotografie, video e/o musiche protette da copyright, se non dietro espressa autorizzazione del legittimo titolare, ovvero materiale detenuto illegalmente, informazioni o banche dati in contrasto con l'attuale normativa vigente in materia.",
          "4.4 In relazione agli impegni di cui ai precedenti paragrafi, il Cliente prende atto e accetta di essere l'esclusivo responsabile del materiale trasmesso per la pubblicazione a Digital Discovery, in qualunque modo e tramite qualunque canale di comunicazione, ivi comprese le comunicazioni a mezzo posta elettronica e la piattaforma di caricamento messa a disposizione dalla stessa Digital Discovery tramite link appositamente comunicati a mezzo posta elettronica. Analogamente, il Cliente sarà l'esclusivo responsabile qualora renda disponibili a Digital Discovery per la pubblicazione – anche mediante riferimento a specifici link - materiali già pubblicati su pagine web proprie o di terzi, con riferimento alle quali il Cliente si dichiara pienamente legittimato all'utilizzo e si assume pertanto ogni responsabilità. Pertanto, né Digital Discovery né i suoi terzi incaricati potranno essere ritenuti responsabili per la pubblicazione di materiali così reperiti.",
          "4.5 Con specifico riferimento al servizio di registrazione dei domini, inoltre, il Cliente si impegna a non utilizzare il servizio per finalità illecite, e a non violare in alcun modo tutte le norme nazionali ed internazionali, anche regolamentari, applicabili. Inoltre, il Cliente non dovrà immettere, e non dovrà fare immettere a terzi, contenuti in violazione della privacy, dei diritti d'autore e proprietà intellettuale, o contenuti pornografici, blasfemi o offensivi, o che possano in alcun modo ledere o mettere in pericolo l'immagine di terzi, di Digital Discovery o di Register.it S.p.A. Il Cliente, inoltre, non dovrà compiere attraverso il proprio accesso ad Internet atti di pirateria informatica (quali a titolo esemplificativo e non esaustivo: attività di phishing, spamming e/o ogni e qualsiasi altra attività che servendosi del servizio possa volontariamente od involontariamente ledere diritti di terzi).",
          "4.6 In relazione agli obblighi di cui sopra il Cliente si obbliga a tenere indenne e a manlevare Digital Discovery, le società ad essa consociate, controllate e partecipate, le filiali, i dipendenti e i collaboratori, da qualsiasi richiesta o controversia, comprensiva di ogni spesa o onere, ivi incluse eventuali spese legali, intentata da qualsiasi parte in merito all'uso di testi, marchi, segni distintivi in genere, fotografie, video e/o musiche vietati. La responsabilità civile e penale delle informazioni pubblicate tramite il sito predisposto con materiale del cliente da Digital Discovery rimarrà sempre ed in ogni caso a carico del Cliente. In ogni caso, Digital Discovery si riserva il diritto di sospendere immediatamente il Servizio qualora, a suo insindacabile giudizio o attraverso segnalazione di terzi, ritenga che il Cliente compia attività in contrasto con le obbligazioni previste nel presente contratto, con norme imperative o buon costume.",
          "4.7 Fermo restando tutto quanto sopra, il Cliente, come sopra individuato, autorizza in ogni caso la società Digital Discovery, anche per il tramite di terzi incaricati, a modificare di volta in volta e su sua richiesta, il contenuto del sito secondo le modalità e con i contenuti da lui indicati.",
        ],
      },
      {
        id: "Art. 5",
        titolo: "Pubblicazione on-line",
        commi: [
          "5.1 Il Cliente prende atto e accetta che la trasmissione del materiale da pubblicare sugli spazi on-line è necessaria al fine di consentire l'esecuzione del Servizio da parte di Digital Discovery. Il Cliente autorizza fin d'ora Digital Discovery a trasmettere per suo conto il materiale che vuole sia pubblicato. Qualora il Cliente non trasmetta a Digital Discovery il materiale per la pubblicazione nei tempi concordati o qualora il materiale non sia qualitativamente o quantitativamente idoneo, in tutto o in parte, alla pubblicazione sul sito web, il Cliente medesimo autorizza Digital Discovery a realizzare e pubblicare il sito con materiali professionali basati sulle informazioni fornite dal Cliente in precedenza o comunque coerenti con la categoria merceologica di riferimento del Cliente. Digital Discovery si riserva il diritto di richiedere al Cliente un apposito corrispettivo in caso di richiesta di modifiche che comportino una nuova produzione, in tutto o in parte, di una o più pagine del sito.",
          "5.2 Il Cliente prende atto e accetta che la scelta del nome a dominio per il sito web è necessaria al fine di consentire l'esecuzione del Servizio da parte di Digital Discovery. Pertanto, il Cliente si impegna ad effettuare la scelta del suddetto nome a dominio nei tempi stabiliti per la pubblicazione. In difetto di tale scelta, il Cliente medesimo autorizza Digital Discovery a realizzare e pubblicare il sito con un nome a dominio scelto da Digital Discovery attinente alla categoria merceologica o alla attività o denominazione del Cliente. Digital Discovery si riserva il diritto di richiedere al Cliente un apposito corrispettivo in caso di richiesta di modifiche che comportino una nuova produzione, in tutto o in parte, di una o più pagine del sito.",
          "5.3 Il Cliente si impegna a fornire a Digital Discovery i dati da pubblicare sul sito ai sensi dell'art. 2250 c.c. In difetto, il Cliente prende atto e accetta che Digital Discovery farà riferimento alle risultanze del Registro Imprese, esonerando quindi la stessa da ogni responsabilità in merito.",
        ],
      },
      {
        id: "Art. 6",
        titolo: "Trattamento dei dati personali - Informativa ex art. 13 D.Lgs. 196/03",
        commi: [
          "6.1 Fermo quanto previsto dall'art. 11 delle Condizioni Generali previste nel Modulo Ordine e dal precedente art. 2.4, Digital Discovery, in conformità alla normativa in materia di trattamento dei cookie, procederà alla pubblicazione sul sito del Cliente delle relative informative, breve ed estesa, in ragione della configurazione tecnica del Servizio.",
          "6.2 Fatto salvo quanto previsto nel precedente art. 5.1, nell'esecuzione dei servizi di erogazione e manutenzione del sito web, anche in ragione delle diverse funzionalità in esso attive, Digital Discovery potrebbe avere accesso – quale gestore del sito web - ad alcuni dati personali immessi da terzi nell'ambito del sito stesso. Con riferimento a tali dati, il Cliente, nella sua qualità di titolare del sito web e dei trattamenti dei dati che vengono effettuati tramite lo stesso, nomina Digital Discovery quale responsabile del trattamento dei dati suddetti. Pertanto, Digital Discovery potrà utilizzare tali dati per svolgere il servizio di manutenzione ed erogazione del sito e delle funzionalità su di esso attive, ricomprendendosi in tale servizio anche il supporto al Cliente nella fruizione delle funzionalità medesime.",
          "6.3 Ad integrazione dell'informativa prevista dall'art. 11 delle Condizioni Generali contenute nel Modulo Ordine, si precisa che, al fine di consentire l'esecuzione dei Servizi, il Cliente potrà fornire a Digital Discovery ulteriori dati di contatto – quali il numero di cellulare - per le comunicazioni relative all'esecuzione dei Servizi stessi, che potranno quindi avvenire anche tramite SMS. Il conferimento di tali dati è facoltativo e in ogni momento il Cliente potrà esercitare i diritti di cui all'art. 7 del D.Lgs 196/03. Tali diritti potranno essere esercitati rivolgendosi per iscritto a Digital Discovery SRL – Piazzale Sant'Antonio 7 - 67100, L'Aquila (AQ).",
        ],
      },
      {
        id: "Art. 7",
        titolo: "Durata",
        commi: [
          "7.1 I Servizi avranno la durata stabilita nel Modulo Ordine.",
          "7.2 Per tutto quanto non previsto nel presente articolo, si applica quanto stabilito in tema di recesso nelle Condizioni Generali del Modulo Ordine.",
          "7.3 Il Cliente prende atto e accetta che la pubblicazione della nuova offerta relativa al sito comporterà la decadenza della precedente senza alcun diritto a richiedere rimborsi per il periodo di tempo pagato ma eventualmente non usufruito.",
        ],
      },
    ],
  },
  content: {
    titolo: "Servizi Content & Media (Liberatoria)",
    articoli: [
      {
        id: "Art. 1",
        titolo: "Oggetto dei servizi",
        commi: [
          "Il Cliente autorizza la realizzazione di riprese video, fotografiche, creazioni grafiche e visual identity (di seguito “contenuti”) oggetto del contratto presso l'azienda sotto la sua supervisione e la pubblicazione dei contenuti, compresa la sua immagine personale nel caso del format Video Istituzionale (che comprende la realizzazione di un'intervista) e/o la realizzazione di un video digitale, utilizzando i contenuti (fotografie, filmati, cataloghi...) forniti direttamente dal Cliente medesimo o tratti dal repertorio di immagini pertinenti. Il Cliente, inoltre, autorizza Digital Discovery alla distribuzione dei contenuti sui propri media online e/o su media di terzi.",
          "Il Cliente dichiara altresì: - di acconsentire a che i contenuti realizzati vengano utilizzati da Digital Discovery per la realizzazione dei propri prodotti multimediali; - di accettare il livello qualitativo del video ottenibile mediante utilizzo di videocamera digitale; - di essere titolare o licenziatario dei diritti di proprietà industriale ed intellettuale inerenti il filmato, le immagini e tutti i contenuti da lui forniti, nonché di poterli liberamente cedere in uso a Digital Discovery; - che le persone eventualmente riprese e/o ritratte nelle fotografie e immagini fornite, informate dell'utilizzo delle riprese e delle fotografie e rese edotte dei diritti loro spettanti in relazione al diritto all'immagine ed ai sensi della vigente normativa a tutela dei dati personali, hanno espressamente prestato il proprio consenso alla ripresa.",
          "A fronte di quanto sopra, il Cliente assume l'impegno a manlevare Digital Discovery da ogni eventuale danno, onere o spesa, ed a sostituirla in giudizio, nell'eventualità di contestazioni avanzate da terzi in merito alla libera utilizzabilità delle immagini contenute nelle riprese fornite dal Cliente stesso, del testo delle interviste, della didascalia descrittiva del video relativamente ai loro contenuti, nonché per qualsivoglia altro pregiudizio lamentato da terzi in conseguenza della diffusione da parte di Digital Discovery di tutti i contenuti del video forniti dal Cliente medesimo, comprese musiche, fotografie e riprese di persone fisiche.",
        ],
      },
      {
        id: "Art. 2",
        titolo: "Trasferte e Rimborsi",
        commi: [
          "Per i servizi di Creazione Video e Shooting Fotografico, le trasferte entro 30 km dalla sede del Prestatore sono incluse. Oltre tale distanza è dovuto un rimborso chilometrico calcolato secondo le tabelle ACI vigenti, oltre agli eventuali costi vivi documentati (vitto, alloggio, pedaggi) preventivamente concordati.",
        ],
      },
    ],
  },
};

export const DPA: Sezione = {
  titolo: "Accordo DPA",
  articoli: [
    {
      id: "DPA",
      titolo: "Trattamento dei dati per conto del Cliente (art. 28 GDPR)",
      commi: [
        "Ove, nell'esecuzione dei servizi, il Prestatore tratti dati personali per conto del Cliente (ad esempio nella gestione social, nelle campagne o nei form del sito), il Cliente riveste la qualità di Titolare del trattamento e il Prestatore quella di Responsabile del trattamento ai sensi dell'art. 28 del Regolamento (UE) 2016/679; a tal fine le Parti sottoscrivono separato accordo (DPA). Ciascuna Parte si impegna a rispettare la normativa vigente in materia di protezione dei dati personali.",
      ],
    },
  ],
};

// --- Clausole vessatorie (artt. 1341 e 1342 c.c.) da approvare specificamente
export interface BloccoVessatorie {
  titolo: string;
  voci: string[];
}

export const VESSATORIE_INTRO =
  "Il Cliente dichiara infine di approvare specificamente, ai sensi degli artt. 1341 e 1342 c.c., le clausole di cui ai seguenti articoli delle Condizioni Generali e Particolari:";

const VESSATORIE_GENERALI: BloccoVessatorie = {
  titolo: "Condizioni Generali del Modulo Ordine",
  voci: [
    "Art. 1 — Irrevocabilità della proposta per 3 mesi dalla sottoscrizione – Indennizzo per la revoca",
    "Art. 2 — Impossibilità del Cliente di recedere - Limiti alla facoltà di recesso del Cliente - Rinnovo tacito – Ripetizione annuale - Facoltà di Digital Discovery SRL di recedere – Pagamenti anticipati e conseguenze del recesso",
    "Art. 3 — Esonero di Digital Discovery SRL da responsabilità da contenuto, posizionamento e chiavi di accesso richieste dal Cliente - Esonero da addebito responsabilità di terzi - Clausola risolutiva espressa - Authorization Code",
    "Art. 4 — Limitazione risarcimento per omissioni ed errori - Limitazione facoltà di opporre eccezioni per anticipata o mancata distribuzione delle pubblicazioni, struttura e modalità di consultazione ed erogazione dei servizi su mezzi online e on voice",
    "Art. 5 — Termine di decadenza per recesso dal Contratto in caso di applicazione di nuovi listini - Inadempienza del Cliente - Penale",
    "Art. 6 — Esonero di Digital Discovery SRL da responsabilità per riproduzione immagini e per differenze di qualità grafica",
    "Art. 8 — Foro competente",
    "Art. 9 — Clausole aggiuntive – Contratti successivi",
  ],
};

const VESSATORIE_PARTICOLARI: Record<ParticolareKey | "dpa", BloccoVessatorie> = {
  social: {
    titolo: "Condizioni Particolari — Servizi Social",
    voci: [
      "Art. 2 — Mandato – Esclusione di responsabilità per interventi del Cliente",
      "Art. 4 — Contenuti del Servizio – esonero di responsabilità di Digital Discovery e manleva",
    ],
  },
  web: {
    titolo: "Condizioni Particolari — Servizi Web",
    voci: [
      "Art. 2 — Esonero responsabilità - Esonero di responsabilità per interventi del cliente - Amministrazione dell'account Google",
    ],
  },
  content: {
    titolo: "Condizioni Particolari — Servizi Content & Media",
    voci: ["Art. 1 — Oggetto dei servizi"],
  },
  dpa: {
    titolo: "Accordo DPA",
    voci: ["Approvazione dell'Accordo DPA (art. 28 GDPR)"],
  },
};

// --- Selezione delle Condizioni Particolari in base ai servizi in ordine ------
const KEY_TO_PARTICOLARE: Record<string, ParticolareKey> = {
  social: "social",
  google: "web",
  sito: "web",
  ecommerce: "web",
  shooting: "content",
  video: "content",
};

/** Quali sezioni Particolari mostrare, dati i servizi effettivamente in ordine. */
export function sezioniParticolari(serviceKeys: string[]): ParticolareKey[] {
  const set = new Set<ParticolareKey>();
  for (const k of serviceKeys) {
    const p = KEY_TO_PARTICOLARE[k];
    if (p) set.add(p);
  }
  // ordine stabile
  return (["social", "web", "content"] as ParticolareKey[]).filter((p) =>
    set.has(p),
  );
}

/** Elenco vessatorie (Generali sempre + Particolari dei servizi in ordine + DPA). */
export function vessatoriePerServizi(serviceKeys: string[]): BloccoVessatorie[] {
  const blocchi: BloccoVessatorie[] = [VESSATORIE_GENERALI];
  for (const p of sezioniParticolari(serviceKeys)) {
    blocchi.push(VESSATORIE_PARTICOLARI[p]);
  }
  blocchi.push(VESSATORIE_PARTICOLARI.dpa);
  return blocchi;
}
