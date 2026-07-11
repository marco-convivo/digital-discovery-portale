// Illustrazione di servizio in puro CSS/SVG, stile "liquid glass" neon su fondo
// scuro: fondo blu-nero profondo, alone luminoso, e l'icona resa come tubo di
// vetro traslucido con bagliore (bloom) e riflesso speculare.

const DARK_BG =
  "radial-gradient(130% 120% at 50% 32%, #0c1f4a 0%, #06112c 48%, #020713 100%)";

// Accento neon per servizio (palette fredda, coerente e premium).
const ACCENT: Record<string, string> = {
  social: "#4f8cff",
  google: "#33b8ff",
  sito: "#2fd9c4",
  ecommerce: "#9a7bff",
  ads: "#41d0ff",
  brand: "#b98cff",
  shooting: "#6f8cff",
  video: "#5aa0ff",
  whatsapp: "#3fe0a0",
};

// Icone come tracciato singolo (outline), rese poi come tubo di vetro.
const PATH: Record<string, string> = {
  social:
    "M24 39C11 30 7 21 12.5 15.5 16 12 21 13 24 17 27 13 32 12 35.5 15.5 41 21 37 30 24 39Z",
  google:
    "M24 6c-7.2 0-13 5.6-13 12.6 0 8.6 13 22.4 13 22.4s13-13.8 13-22.4C37 11.6 31.2 6 24 6Z M24 14a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Z",
  sito: "M8 12h32a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z M6 20h36",
  ecommerce:
    "M15 18a9 9 0 0 1 18 0 M10.5 18h27l-1.6 20.2a2 2 0 0 1-2 1.8H14.1a2 2 0 0 1-2-1.8L10.5 18Z",
  ads: "M9 20.5h6l16.5-7.5v22l-16.5-7.5H9a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z M15.5 27.5l3 8",
  brand:
    "M24 5C25 17 27 19 43 24C27 29 25 31 24 43C23 31 21 29 5 24C21 19 23 17 24 5Z",
  shooting:
    "M10 17h6l2.2-3.2a1 1 0 0 1 .8-.4h10a1 1 0 0 1 .8.4L32 17h6a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V19a2 2 0 0 1 2-2Z M24 22a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z",
  video: "M18 11.5 39 24 18 36.5Z",
  whatsapp:
    "M11 12h26a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H22l-8 6v-6h-3a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2Z",
};

export function ServizioArt({ chiave }: { chiave: string }) {
  const accent = ACCENT[chiave] ?? "#4f8cff";
  const d = PATH[chiave] ?? PATH.sito;
  const gid = `svc-${chiave}`;
  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden"
      style={{ background: DARK_BG }}
    >
      {/* alone luminoso dietro l'icona (bloom) */}
      <div
        className="absolute left-1/2 top-1/2 size-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[38px]"
        style={{ background: `radial-gradient(circle, ${accent}59, transparent 68%)` }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-[38%] max-w-[128px]"
          style={{
            filter: `drop-shadow(0 0 3px ${accent}) drop-shadow(0 0 10px ${accent}cc) drop-shadow(0 0 24px ${accent}88)`,
          }}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#eef4ff" />
              <stop offset="0.5" stopColor={accent} />
              <stop offset="1" stopColor="#20408f" />
            </linearGradient>
          </defs>
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* corpo in vetro */}
            <path d={d} stroke={`url(#${gid})`} strokeWidth={3.4} opacity={0.95} />
            {/* riflesso speculare */}
            <path d={d} stroke="#ffffff" strokeWidth={1} opacity={0.8} />
          </g>
        </svg>
      </div>
    </div>
  );
}
