// Catalogo servizi Digital Discovery (dal Modulo d'Ordine). Guida sia l'editor
// preventivo sia le checkbox del contratto DocuSeal (via docuseal_field).

export type OptionKind = "channels" | "durata" | "sito_tipo" | "quantita";

export interface CatalogService {
  key: string; // chiave interna (salvata in quotes.ordine)
  label: string;
  ricorrente: boolean; // true = piano mensile (social, ads)
  // una tantum: deliverable singolo, nessuna scadenza (anche se rateizzato)
  unaTantum?: boolean;
  docusealField: string; // nome checkbox nel template DocuSeal
  option?: {
    kind: OptionKind;
    label: string;
    // per channels/durata/sito_tipo: valori selezionabili con relativo campo DocuSeal
    choices?: { value: string; label: string; docusealField: string }[];
  };
}

const chan = (svc: string, v: string, label: string) => ({
  value: v,
  label,
  docusealField: `${svc}_${v}`,
});

export const CATALOG: CatalogService[] = [
  {
    key: "social",
    label: "Gestione Social",
    ricorrente: true,
    docusealField: "svc_social",
    option: {
      kind: "channels",
      label: "Canali",
      choices: [
        chan("social", "facebook", "Facebook"),
        chan("social", "instagram", "Instagram"),
        chan("social", "tiktok", "TikTok"),
        chan("social", "linkedin", "LinkedIn"),
      ],
    },
  },
  {
    key: "google",
    label: "Google Presence (GMB)",
    ricorrente: false,
    docusealField: "svc_google",
  },
  {
    key: "sito",
    label: "Sito Web",
    ricorrente: false,
    docusealField: "svc_sito",
    option: {
      kind: "sito_tipo",
      label: "Tipo",
      choices: [
        { value: "one_page", label: "One Page", docusealField: "sito_onepage" },
        { value: "completo", label: "Completo", docusealField: "sito_completo" },
      ],
    },
  },
  {
    key: "ecommerce",
    label: "E-commerce",
    ricorrente: false,
    docusealField: "svc_ecommerce",
  },
  {
    key: "ads",
    label: "Pubblicità",
    ricorrente: true,
    docusealField: "svc_ads",
    option: {
      kind: "channels",
      label: "Canali",
      choices: [
        chan("ads", "facebook", "Facebook"),
        chan("ads", "google", "Google"),
        chan("ads", "instagram", "Instagram"),
        chan("ads", "tiktok", "TikTok"),
        chan("ads", "linkedin", "LinkedIn"),
      ],
    },
  },
  {
    key: "brand",
    label: "Brand Identity",
    ricorrente: false,
    docusealField: "svc_brand",
  },
  {
    key: "shooting",
    label: "Shooting Foto",
    ricorrente: false,
    unaTantum: true,
    docusealField: "svc_shooting",
  },
  {
    key: "video",
    label: "Video Reel",
    ricorrente: false,
    unaTantum: true,
    docusealField: "svc_video",
    option: { kind: "quantita", label: "N. reel" },
  },
  {
    key: "whatsapp",
    label: "WhatsApp Business",
    ricorrente: false,
    docusealField: "svc_whatsapp",
  },
];

// Riepilogo leggibile dei servizi selezionati (per liste/contratti).
// Es: ["Gestione Social · Facebook, Instagram · 12 mesi", "Sito Web · Completo"]
export function serviziDaOrdine(ordine: OrdineSelezione | null): string[] {
  if (!ordine) return [];
  const out: string[] = [];
  for (const svc of CATALOG) {
    const sel = ordine[svc.key];
    if (!sel?.selected) continue;
    const extra: string[] = [];
    if (svc.option?.choices) {
      const labels = svc.option.choices
        .filter((c) => sel.channels?.includes(c.value) || sel.tipo === c.value)
        .map((c) => c.label);
      if (labels.length) extra.push(labels.join(", "));
    }
    if (sel.durata) extra.push(`${sel.durata} mesi`);
    if (sel.quantita) extra.push(`n. ${sel.quantita}`);
    out.push(extra.length ? `${svc.label} · ${extra.join(" · ")}` : svc.label);
  }
  return out;
}

// Dettaglio servizi con durata e flag una tantum (per calcolare le scadenze).
export interface ServizioDett {
  label: string;
  durataMesi: number | null; // mesi indicati (social/ads); null se non specificato
  unaTantum: boolean;
}
export function serviziDettaglio(ordine: OrdineSelezione | null): ServizioDett[] {
  if (!ordine) return [];
  const out: ServizioDett[] = [];
  for (const svc of CATALOG) {
    const sel = ordine[svc.key];
    if (!sel?.selected) continue;
    const extra: string[] = [];
    if (svc.option?.choices) {
      const labels = svc.option.choices
        .filter((c) => sel.channels?.includes(c.value) || sel.tipo === c.value)
        .map((c) => c.label);
      if (labels.length) extra.push(labels.join(", "));
    }
    if (sel.quantita) extra.push(`n. ${sel.quantita}`);
    out.push({
      label: extra.length ? `${svc.label} · ${extra.join(" · ")}` : svc.label,
      durataMesi: sel.durata ?? null,
      unaTantum: !!svc.unaTantum,
    });
  }
  return out;
}

// Forma della selezione salvata in quotes.ordine (JSONB).
export interface OrdineSelezione {
  [serviceKey: string]: {
    selected: boolean;
    channels?: string[]; // per social/ads
    tipo?: string; // per sito (one_page/completo)
    durata?: number; // mesi, per social
    quantita?: number; // per video
  };
}
