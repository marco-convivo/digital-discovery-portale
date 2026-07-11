// Illustrazione di servizio in puro CSS/SVG, stile "liquid glass" neon su fondo
// scuro (ispirazione AI/Framer): un unico blu elettrico, icona a filo di vetro
// sottile e molto luminosa (bloom marcato) su fondo quasi nero — alto contrasto.

const DARK_BG =
  "radial-gradient(125% 120% at 50% 30%, #0a1a3d 0%, #050d24 42%, #010409 100%)";

// Blu unico per tutti i servizi (come la reference).
const ACCENT = "#3f82ff";
const ACCENT_SOFT = "#8fb6ff";

// Icone come tracciato singolo (outline), rese come filo di vetro luminoso.
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
  const d = PATH[chiave] ?? PATH.sito;
  const gid = `svc-${chiave}`;
  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden"
      style={{ background: DARK_BG }}
    >
      {/* bloom largo + hotspot luminoso al centro (alto contrasto) */}
      <div
        className="absolute left-1/2 top-1/2 size-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[48px]"
        style={{ background: `radial-gradient(circle, ${ACCENT}55, transparent 68%)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[26px]"
        style={{ background: `radial-gradient(circle, ${ACCENT_SOFT}66, transparent 70%)` }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-[36%] max-w-[120px]"
          style={{
            filter: `drop-shadow(0 0 2px ${ACCENT_SOFT}) drop-shadow(0 0 10px ${ACCENT}) drop-shadow(0 0 26px ${ACCENT}cc) drop-shadow(0 0 54px ${ACCENT}80)`,
          }}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#eaf1ff" />
              <stop offset="0.55" stopColor={ACCENT_SOFT} />
              <stop offset="1" stopColor={ACCENT} />
            </linearGradient>
          </defs>
          <g strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* filo di vetro sottile */}
            <path d={d} stroke={`url(#${gid})`} strokeWidth={2.1} opacity={0.92} />
            {/* riflesso speculare */}
            <path d={d} stroke="#ffffff" strokeWidth={0.8} opacity={0.85} />
          </g>
        </svg>
      </div>
    </div>
  );
}
