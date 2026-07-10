import type { Tone } from "@/components/ui/status-pill";
import type { ClientStato } from "@/lib/types";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

// Stato delle rate (piano pagamenti) → linguaggio di stato.
export const PAYMENT_STATO_META: Record<
  PaymentStato,
  { label: string; tone: Tone }
> = {
  scheduled: { label: "Programmata", tone: "draft" },
  pending: { label: "In corso", tone: "wait" },
  paid: { label: "Pagata", tone: "paid" },
  failed: { label: "Fallita", tone: "fail" },
};

// Mappatura stato-di-dominio → linguaggio di stato dell'interfaccia.
// Vive qui (non nel componente) così StatusPill resta condiviso CRM/portale.
export const STATO_META: Record<ClientStato, { label: string; tone: Tone }> = {
  lead: { label: "Lead", tone: "draft" },
  preventivo_inviato: { label: "Preventivo inviato", tone: "wait" },
  preventivo_visto: { label: "Preventivo visto", tone: "wait" },
  preventivo_accettato: { label: "Preventivo accettato", tone: "info" },
  contratto_inviato: { label: "Contratto da firmare", tone: "info" },
  contratto_firmato: { label: "Contratto firmato", tone: "info" },
  pagamento_setup: { label: "Setup pagamento", tone: "wait" },
  pagamento_attivo: { label: "Pagamento attivo", tone: "paid" },
  cliente_attivo: { label: "Cliente attivo", tone: "paid" },
  rifiutato: { label: "Rifiutato", tone: "fail" },
  cessato: { label: "Cessato", tone: "fail" },
};

// Le colonne della board = raggruppamento degli 11 stati (mockup pipeline-board).
// 5 colonne della macchina a stati + "Persi" (decisione confermata).
export interface PipelineColumn {
  key: string;
  label: string;
  tone: Tone; // colore del pallino di colonna
  stati: ClientStato[];
}

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: "lead", label: "Lead", tone: "draft", stati: ["lead"] },
  {
    key: "preventivo",
    label: "Preventivo",
    tone: "wait",
    stati: ["preventivo_inviato", "preventivo_visto", "preventivo_accettato"],
  },
  {
    key: "contratto",
    label: "Contratto",
    tone: "info",
    stati: ["contratto_inviato", "contratto_firmato"],
  },
  {
    key: "pagamento",
    label: "Pagamento",
    tone: "info",
    stati: ["pagamento_setup", "pagamento_attivo"],
  },
  { key: "attivo", label: "Attivo", tone: "paid", stati: ["cliente_attivo"] },
  {
    key: "persi",
    label: "Persi",
    tone: "fail",
    stati: ["rifiutato", "cessato"],
  },
];

/** Colonna di appartenenza di uno stato (per smistare i clienti). */
export function columnForStato(stato: ClientStato): string {
  return (
    PIPELINE_COLUMNS.find((c) => c.stati.includes(stato))?.key ?? "lead"
  );
}
