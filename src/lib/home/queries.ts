import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listInsoluti } from "@/lib/insoluti/queries";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";
import {
  PIPELINE_COLUMNS,
  columnForStato,
  STATO_META,
} from "@/lib/stati";
import { euro, dataIt, conIva } from "@/lib/format";
import type { Tone } from "@/components/ui/status-pill";
import type { OrdineSelezione } from "@/lib/catalog";
import type { ClientStato } from "@/lib/types";

export type HomeTone = "fail" | "wait" | "info";
export type HomeIcon = "alert" | "bank" | "clock" | "card" | "doc";

/** Una voce sfogliabile del box "Da gestire". */
export interface HomeTask {
  id: string;
  tone: HomeTone;
  icon: HomeIcon;
  pill: string;
  cliente: string;
  hero: string; // il dato che conta: importo, "tra 3 giorni", "da attivare"…
  ctx: string;
  actions: { label: string; href: string; primary: boolean }[];
}

export interface HomeFocus {
  daRecuperare: number; // € lordo insoluti aperti
  insolutiCount: number;
  taskCount: number;
  scadenzeVicine: number; // servizi in scadenza entro 7 giorni
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
  telefono: string | null;
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

/** Aggrega tutto ciò che serve alla Home operativa (RLS: scope dello staff). */
export async function getHomeData(): Promise<HomeData> {
  const sb = await createClient();

  const [insoluti, contrRes, clientiRes, quotesRes, logRes] = await Promise.all([
    listInsoluti(),
    sb
      .from("contracts")
      .select(
        "signed_at, quote:quotes!contracts_quote_id_fkey(ordine), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
      )
      .eq("stato", "firmato"),
    sb
      .from("clients")
      .select("id, ragione_sociale, stato, referente, created_at"),
    sb
      .from("quotes")
      .select(
        "id, numero, importo_totale, stato, created_at, viewed_at, client:clients!quotes_client_id_fkey(id, ragione_sociale, telefono)",
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
  ]);

  // ---- Scadenze servizi (contratti firmati) ----
  type ContrRow = {
    signed_at: string | null;
    quote: { ordine: OrdineSelezione | null } | null;
    client: { id: string; ragione_sociale: string } | null;
  };
  const scadenze: HomeScadenza[] = [];
  for (const c of (contrRes.data ?? []) as unknown as ContrRow[]) {
    if (!c.client || !c.signed_at) continue;
    for (const s of scadenzeServizi(c.quote?.ordine ?? null, c.signed_at)) {
      if (s.unaTantum || !s.scadenzaIso) continue;
      scadenze.push({
        cliente: c.client.ragione_sociale,
        servizio: s.label,
        scadenzaIso: s.scadenzaIso,
        giorni: giorniAllaScadenza(s.scadenzaIso),
        href: `/vendite/clienti/${c.client.id}`,
      });
    }
  }
  scadenze.sort((a, b) => a.giorni - b.giorni);

  // ---- Pipeline + pagamenti da completare ----
  type CliRow = {
    id: string;
    ragione_sociale: string;
    stato: ClientStato;
    referente: string | null;
  };
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

  // ---- Preventivi da seguire ----
  type QuoteRow = {
    id: string;
    numero: string | null;
    importo_totale: number | null;
    stato: string;
    created_at: string;
    viewed_at: string | null;
    client: {
      id: string;
      ragione_sociale: string;
      telefono: string | null;
    } | null;
  };
  const quotes = (quotesRes.data ?? []) as unknown as QuoteRow[];
  const preventivi: HomePreventivo[] = quotes
    .filter((q) => q.client)
    .map((q) => ({
      id: q.id,
      cliente: q.client!.ragione_sociale,
      importo: q.importo_totale,
      tone: (q.stato === "visto" ? "wait" : "info") as Tone,
      ctx:
        q.stato === "visto"
          ? `Visto · in attesa di risposta`
          : `Inviato ${giorniFa(q.created_at)} · non ancora aperto`,
      href: `/vendite/preventivi/${q.id}`,
      telefono: q.client!.telefono,
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

  // ---- Da gestire (coda unificata, ordinata per urgenza) ----
  const tasks: HomeTask[] = [];

  for (const ins of insoluti) {
    const verifica = ins.recovery_stato === "bonifico_in_verifica";
    tasks.push({
      id: `ins-${ins.id}`,
      tone: "fail",
      icon: verifica ? "bank" : "alert",
      pill: verifica ? "Da verificare" : "Insoluto",
      cliente: ins.client?.ragione_sociale ?? "Cliente",
      hero: euro(ins.importo),
      ctx: verifica
        ? "Bonifico dichiarato dal cliente · da controllare in banca"
        : `Rata ${ins.numero_rata ?? "—"} · ${ins.failure_reason ?? "addebito non riuscito"}`,
      actions: [
        { label: "Gestisci", href: `/vendite/insoluti?p=${ins.id}`, primary: true },
        ...(ins.client
          ? [{ label: "Cliente", href: `/vendite/clienti/${ins.client.id}`, primary: false }]
          : []),
      ],
    });
  }

  for (const s of scadenze.filter((x) => x.giorni <= 30)) {
    tasks.push({
      id: `sca-${s.href}-${s.scadenzaIso}`,
      tone: "wait",
      icon: "clock",
      pill: "Scadenza",
      cliente: s.cliente,
      hero: s.giorni < 0 ? `scaduto da ${-s.giorni} gg` : `tra ${s.giorni} giorni`,
      ctx: `${s.servizio} in scadenza il ${dataIt(s.scadenzaIso)}`,
      actions: [{ label: "Apri cliente", href: s.href, primary: true }],
    });
  }

  for (const c of daCompletare) {
    tasks.push({
      id: `pay-${c.id}`,
      tone: "info",
      icon: "card",
      pill: "Pagamento",
      cliente: c.ragione_sociale,
      hero: "da attivare",
      ctx: "Contratto firmato · manca l'attivazione del pagamento",
      actions: [
        { label: "Apri cliente", href: `/vendite/clienti/${c.id}`, primary: true },
      ],
    });
  }

  for (const q of quotes.filter((x) => x.client)) {
    tasks.push({
      id: `qt-${q.id}`,
      tone: "info",
      icon: "doc",
      pill: "Da seguire",
      cliente: q.client!.ragione_sociale,
      hero: euro(q.importo_totale),
      ctx:
        q.stato === "visto"
          ? "Preventivo visto · in attesa di risposta"
          : `Preventivo inviato ${giorniFa(q.created_at)} · non ancora aperto`,
      actions: [
        { label: "Apri preventivo", href: `/vendite/preventivi/${q.id}`, primary: true },
      ],
    });
  }

  // Ordine: prima gli insoluti (fail), poi scadenze (wait), poi info.
  const rank: Record<HomeTone, number> = { fail: 0, wait: 1, info: 2 };
  tasks.sort((a, b) => rank[a.tone] - rank[b.tone]);

  const daRecuperare = insoluti.reduce(
    (t, i) => t + conIva(Number(i.importo ?? 0)),
    0,
  );
  const scadenzeVicine = scadenze.filter(
    (s) => s.giorni >= 0 && s.giorni <= 7,
  ).length;

  return {
    tasks,
    focus: {
      daRecuperare,
      insolutiCount: insoluti.length,
      taskCount: tasks.length,
      scadenzeVicine,
    },
    pipeline,
    preventivi,
    scadenze: scadenze.slice(0, 4),
    attivita,
  };
}
