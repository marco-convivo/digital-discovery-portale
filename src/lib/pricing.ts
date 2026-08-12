// Motore prezzi — UNICA fonte di verità.
//
// Prima: il contributo di un servizio al totale contratto era calcolato in 3
// posti (server action + 2 editor con lo stesso codice copiato) e il passaggio
// netto→lordo IVA in 4 (setup, activate ×2, recupero). Qualsiasi regola
// economica nuova si aggiunge qui. Il server ricalcola SEMPRE da questo modulo:
// il totale del client è solo anteprima.

import { CATALOG, type OrdineSelezione } from "@/lib/catalog";
import { addonContributo, type Addon } from "@/lib/addon";
import { ALIQUOTA_IVA } from "@/lib/config";

/** Durata (mesi) di un servizio ricorrente nell'ordine; default 12. */
export function durataServizio(key: string, ordine: OrdineSelezione): number {
  return ordine[key]?.durata ?? 12;
}

/**
 * Contributo al TOTALE contratto di un servizio, dal prezzo MENSILE:
 * ricorrente = mensile × mesi (durata); una tantum/progetto = prezzo una volta.
 */
export function contributoServizio(
  key: string,
  prezzoMensile: number,
  ordine: OrdineSelezione,
): number {
  const svc = CATALOG.find((c) => c.key === key);
  const p = Number(prezzoMensile) || 0;
  return svc?.ricorrente ? p * durataServizio(key, ordine) : p;
}

export interface TotaliContratto {
  /** Somma contributi servizi selezionati (senza addon, senza sconto). */
  totaleServizi: number;
  /** Somma contributi addon. */
  totaleAddon: number;
  /** Sconto applicato (≥ 0). */
  sconto: number;
  /** Totale contratto: servizi + addon − sconto, mai negativo. */
  totaleContratto: number;
  /** Solo display: impegno una tantum (servizi + addon non ricorrenti). */
  totaleUnaTantum: number;
  /** Solo display: impegno mensile ricorrente (somma prezzi mensili). */
  totaleRicorrenteMensile: number;
  /** Durata più lunga tra i ricorrenti selezionati (default 12). */
  mesiContratto: number;
}

/** Totali del contratto da ordine + prezzi mensili + addon + sconto. */
export function calcolaTotali(
  ordine: OrdineSelezione,
  prezzi: Record<string, number>,
  addons: Addon[] = [],
  sconto = 0,
): TotaliContratto {
  const prezzoDi = (k: string) => {
    const n = Number(prezzi[k]);
    return Number.isFinite(n) ? n : 0;
  };
  const selezionati = CATALOG.filter((c) => ordine[c.key]?.selected);

  const totaleServizi = selezionati.reduce(
    (s, c) => s + contributoServizio(c.key, prezzoDi(c.key), ordine),
    0,
  );
  const totaleAddon = addons.reduce((s, a) => s + addonContributo(a), 0);
  const scontoNum = Math.max(0, Number(sconto) || 0);
  const totaleContratto = Math.max(0, totaleServizi + totaleAddon - scontoNum);

  const totaleUnaTantum =
    selezionati
      .filter((c) => !c.ricorrente)
      .reduce((s, c) => s + prezzoDi(c.key), 0) +
    addons
      .filter((a) => a.tipo === "una_tantum")
      .reduce((s, a) => s + a.prezzo, 0);
  const totaleRicorrenteMensile =
    selezionati
      .filter((c) => c.ricorrente)
      .reduce((s, c) => s + prezzoDi(c.key), 0) +
    addons
      .filter((a) => a.tipo === "ricorrente")
      .reduce((s, a) => s + a.prezzo, 0);

  const durate = [
    ...selezionati
      .filter((c) => c.ricorrente)
      .map((c) => durataServizio(c.key, ordine)),
    ...addons.filter((a) => a.tipo === "ricorrente").map((a) => a.durata ?? 12),
  ];
  const mesiContratto = durate.length ? Math.max(...durate) : 12;

  return {
    totaleServizi,
    totaleAddon,
    sconto: scontoNum,
    totaleContratto,
    totaleUnaTantum,
    totaleRicorrenteMensile,
    mesiContratto,
  };
}

/**
 * Netto → lordo IVA in CENTESIMI (per gli addebiti Stripe).
 * Un solo arrotondamento: mai comporre con conIva() (che arrotonda in euro).
 */
export function lordoCent(netto: number): number {
  return Math.round(Number(netto || 0) * (1 + ALIQUOTA_IVA) * 100);
}
