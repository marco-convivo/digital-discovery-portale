import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listInsoluti } from "@/lib/insoluti/queries";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";
import { PIPELINE_COLUMNS, columnForStato, STATO_META } from "@/lib/stati";
import { euro, dataIt, conIva } from "@/lib/format";
import type { Tone } from "@/components/ui/status-pill";
import type { OrdineSelezione } from "@/lib/catalog";
import type { ClientStato } from "@/lib/types";

export type HomeTone = "fail" | "wait" | "info";
export type HomeIcon = "alert" | "bank" | "clock" | "card" | "doc";
export type HomeTaskTipo =
  | "insoluto"
  | "bonifico"
  | "scadenza"
  | "pagamento"
  | "preventivo"
  | "preventivo_scaduto";
/** Raggruppamento per i filtri del box "Da gestire". */
export type HomeGruppo = "insoluti" | "scadenze" | "pagamenti" | "preventivi";

/** Una voce sfogliabile del box "Da gestire". */
export interface HomeTask {
  id: string;
  chiave: string; // identificatore stabile per ignora/rimanda
  tone: HomeTone;
  icon: HomeIcon;
  tipo: HomeTaskTipo;
  gruppo: HomeGruppo;
  pill: string;
  cliente: string;
  hero: string;
  ctx: string;
  dismissable: boolean; // se è consentito "Fatto" (insoluti = no)
  actions: { label: string; href: string; primary: boolean }[];
}

export interface HomeFocus {
  daRecuperare: number;
  insolutiCount: number;
  taskCount: number;
  scadenzeVicine: number;
}

export interface HomePipeline {
  key: string;
  label: string;
  tone: Tone;
  count: number;
}

export interface HomePreventivo {
  id: string;
  cliente: string;
  importo: number | null;
  ctx: string;
  tone: Tone;
  href: string;
}

export interface HomeScadenza {
  cliente: string;
  servizio: string;
  giorni: number;
  scadenzaIso: string;
  href: string;
}

export interface HomeAttivita {
  id: string;
  testo: string;
  quando: string;
  tone: Tone;
}

export interface HomeData {
  tasks: HomeTask[];
  focus: HomeFocus;
  pipeline: HomePipeline[];
  preventivi: HomePreventivo[];
  scadenze: HomeScadenza[];
  attivita: HomeAttivita[];
}

function giorniFa(iso: string): string {
  const g = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (g <= 0) return "oggi";
  if (g === 1) return "ieri";
  return `${g} giorni fa`;
}

function oggiIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addGiorniIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Aggrega tutto ciò che serve alla Home operativa (RLS: scope dello staff). */
export async function getHomeData(): Promise<HomeData> {
  const sb = await createClient();
  const oggi = oggiIso();

  const [insoluti, contrRes, clientiRes, quotesRes, logRes, avvisiRes] =
    await Promise.all([
      listInsoluti(),
      sb
        .from("contracts")
        .select(
          "signed_at, quote:quotes!contracts_quote_id_fkey(ordine), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
        )
        .eq("stato", "firmato"),
      sb.from("clients").select("id, ragione_sociale, stato"),
      sb
        .from("quotes")
        .select(
          "id, numero, importo_totale, stato, created_at, valido_fino, client:clients!quotes_client_id_fkey(id, ragione_sociale)",
        )
        .in("stato", ["inviato", "visto"])
        .order("created_at", { ascending: true }),
      sb
        .from("activity_log")
        .select(
          "id, a_stato, created_at, client:clients!activity_log_client_id_fkey(ragione_sociale)",
        )
        .order("created_at", { ascending: false })
        .limit(6),
      sb.from("avviso_stato").select("chiave, stato, snooze_until"),
    ]);

  // ---- Avvisi chiusi/rimandati → chiavi da nascondere ----
  type AvvisoRow = {
    chiave: string;
    stato: string;
    snooze_until: string | null;
  };
  const nowMs = Date.now();
  const nascosti = new Set<string>();
  for (const a of (avvisiRes.data ?? []) as AvvisoRow[]) {
    if (a.stato === "ignorato") nascosti.add(a.chiave);
    else if (
      a.stato === "rimandato" &&
      a.snooze_until &&
      new Date(a.snooze_until).getTime() > nowMs
    )
      nascosti.add(a.chiave);
  }

  // ---- Scadenze servizi (contratti firmati) ----
  type ContrRow = {
    signed_at: string | null;
    quote: { ordine: OrdineSelezione | null } | null;
    client: { id: string; ragione_sociale: string } | null;
  };
  type ScadItem = HomeScadenza & { clientId: string };
  const scadenzeAll: ScadItem[] = [];
  for (const c of (contrRes.data ?? []) as unknown as ContrRow[]) {
    if (!c.client || !c.signed_at) continue;
    for (const s of scadenzeServizi(c.quote?.ordine ?? null, c.signed_at)) {
      if (s.unaTantum || !s.scadenzaIso) continue;
      scadenzeAll.push({
        clientId: c.client.id,
        cliente: c.client.ragione_sociale,
        servizio: s.label,
        scadenzaIso: s.scadenzaIso,
        giorni: giorniAllaScadenza(s.scadenzaIso),
        href: `/vendite/clienti/${c.client.id}`,
      });
    }
  }
  scadenzeAll.sort((a, b) => a.giorni - b.giorni);

  // ---- Pipeline + pagamenti da completare ----
  type CliRow = { id: string; ragione_sociale: string; stato: ClientStato };
  const clienti = (clientiRes.data ?? []) as unknown as CliRow[];
  const pipeline: HomePipeline[] = PIPELINE_COLUMNS.filter(
    (c) => c.key !== "persi",
  ).map((col) => ({
    key: col.key,
    label: col.label,
    tone: col.tone,
    count: clienti.filter((c) => columnForStato(c.stato) === col.key).length,
  }));
  const daCompletare = clienti.filter((c) => c.stato === "pagamento_setup");

  // ---- Preventivi (da seguire / scaduti recuperabili / scaduti da chiudere) ----
  type QuoteRow = {
    id: string;
    numero: string | null;
    importo_totale: number | null;
    stato: string;
    created_at: string;
    valido_fino: string | null;
    client: { id: string; ragione_sociale: string } | null;
  };
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
  const daSeguire: QuoteRow[] = [];
  const scadutiRecuperabili: QuoteRow[] = [];
  const daChiudere: string[] = []; // oltre la finestra di recupero → stato scaduto
  for (const q of quotes) {
    if (!q.client) continue;
    const vf = q.valido_fino;
    if (!vf || vf >= oggi) {
      daSeguire.push(q);
    } else if (oggi <= addGiorniIso(vf, 7)) {
      scadutiRecuperabili.push(q);
    } else {
      daChiudere.push(q.id);
    }
  }
  // Marca "scaduto" i preventivi oltre la finestra di recupero (idempotente).
  if (daChiudere.length) {
    await sb.from("quotes").update({ stato: "scaduto" }).in("id", daChiudere);
  }

  const preventivi: HomePreventivo[] = daSeguire.map((q) => ({
    id: q.id,
    cliente: q.client!.ragione_sociale,
    importo: q.importo_totale,
    tone: (q.stato === "visto" ? "wait" : "info") as Tone,
    ctx:
      q.stato === "visto"
        ? "Visto · in attesa di risposta"
        : `Inviato ${giorniFa(q.created_at)} · non ancora aperto`,
    href: `/vendite/preventivi/${q.id}`,
  }));

  // ---- Attività recente ----
  type LogRow = {
    id: string;
    a_stato: ClientStato | null;
    created_at: string;
    client: { ragione_sociale: string } | null;
  };
  const attivita: HomeAttivita[] = (
    (logRes.data ?? []) as unknown as LogRow[]
  ).map((l) => ({
    id: l.id,
    testo: `${l.a_stato ? STATO_META[l.a_stato].label : "Aggiornato"} — ${l.client?.ragione_sociale ?? "cliente"}`,
    quando: giorniFa(l.created_at),
    tone: (l.a_stato ? STATO_META[l.a_stato].tone : "draft") as Tone,
  }));

  // ---- Da gestire (coda unificata) ----
  const tasks: HomeTask[] = [];

  for (const ins of insoluti) {
    const verifica = ins.recovery_stato === "bonifico_in_verifica";
    tasks.push({
      id: `ins-${ins.id}`,
      chiave: `ins:${ins.id}`,
      tone: "fail",
      icon: verifica ? "bank" : "alert",
      tipo: verifica ? "bonifico" : "insoluto",
      gruppo: "insoluti",
      pill: verifica ? "Da verificare" : "Insoluto",
      cliente: ins.client?.ragione_sociale ?? "Cliente",
      hero: euro(ins.importo),
      ctx: verifica
        ? "Bonifico dichiarato dal cliente · da controllare in banca"
        : `Rata ${ins.numero_rata ?? "—"} · ${ins.failure_reason ?? "addebito non riuscito"}`,
      dismissable: false, // gli insoluti si chiudono incassando, non ignorando
      actions: [
        { label: "Gestisci", href: `/vendite/insoluti?p=${ins.id}`, primary: true },
        ...(ins.client
          ? [{ label: "Cliente", href: `/vendite/clienti/${ins.client.id}`, primary: false }]
          : []),
      ],
    });
  }

  for (const s of scadenzeAll.filter((x) => x.giorni >= -14 && x.giorni <= 30)) {
    tasks.push({
      id: `sca-${s.clientId}-${s.scadenzaIso}`,
      chiave: `sca:${s.clientId}:${s.servizio}:${s.scadenzaIso.slice(0, 10)}`,
      tone: "wait",
      icon: "clock",
      tipo: "scadenza",
      gruppo: "scadenze",
      pill: "Scadenza",
      cliente: s.cliente,
      hero: s.giorni < 0 ? `scaduto da ${-s.giorni} gg` : `tra ${s.giorni} giorni`,
      ctx: `${s.servizio} in scadenza il ${dataIt(s.scadenzaIso)}`,
      dismissable: true,
      actions: [{ label: "Apri cliente", href: s.href, primary: true }],
    });
  }

  for (const c of daCompletare) {
    tasks.push({
      id: `pay-${c.id}`,
      chiave: `pay:${c.id}`,
      tone: "info",
      icon: "card",
      tipo: "pagamento",
      gruppo: "pagamenti",
      pill: "Pagamento",
      cliente: c.ragione_sociale,
      hero: "da attivare",
      ctx: "Contratto firmato · manca l'attivazione del pagamento",
      dismissable: true,
      actions: [
        { label: "Apri cliente", href: `/vendite/clienti/${c.id}`, primary: true },
      ],
    });
  }

  for (const q of scadutiRecuperabili) {
    const vf = q.valido_fino!;
    tasks.push({
      id: `qtx-${q.id}`,
      chiave: `qt:${q.id}`,
      tone: "fail",
      icon: "doc",
      tipo: "preventivo_scaduto",
      gruppo: "preventivi",
      pill: "Scaduto",
      cliente: q.client!.ragione_sociale,
      hero: euro(q.importo_totale),
      ctx: `Scaduto il ${dataIt(vf)} · recuperabile entro il ${dataIt(addGiorniIso(vf, 7))}`,
      dismissable: true,
      actions: [
        { label: "Ri-proponi", href: `/vendite/preventivi/${q.id}`, primary: true },
      ],
    });
  }

  for (const q of daSeguire) {
    tasks.push({
      id: `qt-${q.id}`,
      chiave: `qt:${q.id}`,
      tone: "info",
      icon: "doc",
      tipo: "preventivo",
      gruppo: "preventivi",
      pill: "Da seguire",
      cliente: q.client!.ragione_sociale,
      hero: euro(q.importo_totale),
      ctx:
        q.stato === "visto"
          ? "Preventivo visto · in attesa di risposta"
          : `Preventivo inviato ${giorniFa(q.created_at)} · non ancora aperto`,
      dismissable: true,
      actions: [
        { label: "Apri preventivo", href: `/vendite/preventivi/${q.id}`, primary: true },
      ],
    });
  }

  // Filtra gli avvisi chiusi/rimandati e ordina per urgenza.
  const rank: Record<HomeTone, number> = { fail: 0, wait: 1, info: 2 };
  const visibili = tasks
    .filter((t) => !nascosti.has(t.chiave))
    .sort((a, b) => rank[a.tone] - rank[b.tone]);

  const daRecuperare = insoluti.reduce(
    (t, i) => t + conIva(Number(i.importo ?? 0)),
    0,
  );
  const scadenzeVicine = scadenzeAll.filter(
    (s) => s.giorni >= 0 && s.giorni <= 7,
  ).length;

  return {
    tasks: visibili,
    focus: {
      daRecuperare,
      insolutiCount: insoluti.length,
      taskCount: visibili.length,
      scadenzeVicine,
    },
    pipeline,
    preventivi,
    scadenze: scadenzeAll.slice(0, 4),
    attivita,
  };
}
