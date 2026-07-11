import { serviziDettaglio, type OrdineSelezione } from "@/lib/catalog";
import { dataIt } from "@/lib/format";

export interface ScadenzaServizio {
  label: string;
  unaTantum: boolean;
  mesi: number; // durata effettiva (durata indicata o 12); ignorato se una tantum
  scadenzaIso: string | null; // firma + mesi; null se una tantum o non ancora firmato
}

function addMesi(iso: string, m: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + m);
  return d.toISOString();
}

/** Servizi di un contratto con la relativa scadenza calcolata dalla firma. */
export function scadenzeServizi(
  ordine: OrdineSelezione | null,
  signedAt: string | null,
): ScadenzaServizio[] {
  return serviziDettaglio(ordine).map((s) => {
    if (s.unaTantum) {
      return { label: s.label, unaTantum: true, mesi: 0, scadenzaIso: null };
    }
    const mesi = s.durataMesi ?? 12;
    return {
      label: s.label,
      unaTantum: false,
      mesi,
      scadenzaIso: signedAt ? addMesi(signedAt, mesi) : null,
    };
  });
}

/** Etichetta leggibile della scadenza di un servizio. */
export function labelScadenza(s: ScadenzaServizio): string {
  if (s.unaTantum) return "una tantum";
  if (s.scadenzaIso) return `scade il ${dataIt(s.scadenzaIso)}`;
  return `${s.mesi} mesi dalla firma`;
}

/** Giorni mancanti alla scadenza (negativo = già scaduto). */
export function giorniAllaScadenza(iso: string): number {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const s = new Date(iso);
  s.setHours(0, 0, 0, 0);
  return Math.round((s.getTime() - oggi.getTime()) / 86_400_000);
}
