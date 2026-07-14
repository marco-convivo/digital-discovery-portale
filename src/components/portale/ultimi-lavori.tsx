import type { LucideIcon } from "lucide-react";
import { iconForChiave } from "@/lib/catalogo/service-icons";
import {
  DARK_CARD_STYLE,
  DARK_SPOTLIGHT_STYLE,
  ICON_GLOW,
} from "@/components/catalogo/card-style";
import type { LavoroItem } from "@/lib/catalogo/queries";

function LavoroGlyph({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="grid h-full w-full place-items-center text-white">
      <Icon size={46} strokeWidth={1.4} style={ICON_GLOW} aria-hidden />
    </span>
  );
}

function LavoroCard({ l }: { l: LavoroItem }) {
  const inner = (
    <>
      {/* spotlight viola dall'alto */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ ...DARK_SPOTLIGHT_STYLE, zIndex: 0 }}
      />
      <span className="relative z-10 block">
        <span className="block aspect-[16/10] overflow-hidden">
          {l.immagine_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.immagine_url}
              alt={l.titolo}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <LavoroGlyph Icon={iconForChiave(l.servizioChiave)} />
          )}
        </span>

        <span className="block p-5 text-left">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-semibold uppercase tracking-wide text-white/45">
            {l.settore && <span>{l.settore}</span>}
            {l.settore && l.servizioTitolo && <span aria-hidden>·</span>}
            {l.servizioTitolo && (
              <span className="text-[#a28ef9]">{l.servizioTitolo}</span>
            )}
          </span>
          <span className="mt-1.5 block text-[17px] font-bold leading-snug tracking-[-0.01em] text-white">
            {l.titolo}
          </span>
          {l.risultato && (
            <span className="mt-1.5 block text-[13.5px] font-semibold text-[#a4f5a6]">
              {l.risultato}
            </span>
          )}
          {l.descrizione && (
            <span className="mt-1.5 line-clamp-2 block text-[13.5px] leading-relaxed text-[#a7abbd]">
              {l.descrizione}
            </span>
          )}
          {(l.cliente || l.link_url) && (
            <span className="mt-3 flex items-center justify-between text-[12.5px]">
              {l.cliente ? (
                <span className="font-medium text-white/45">{l.cliente}</span>
              ) : (
                <span />
              )}
              {l.link_url && (
                <span className="font-semibold text-[#a28ef9] group-hover:underline">
                  Vedi il lavoro →
                </span>
              )}
            </span>
          )}
        </span>
      </span>
    </>
  );

  const cls =
    "group relative isolate block overflow-hidden rounded-[26px] transition-transform duration-200 ease-out hover:-translate-y-1";

  return l.link_url ? (
    <a
      href={l.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      style={DARK_CARD_STYLE}
    >
      {inner}
    </a>
  ) : (
    <div className={cls} style={DARK_CARD_STYLE}>
      {inner}
    </div>
  );
}

export function UltimiLavori({
  lavori,
  columns = 2,
}: {
  lavori: LavoroItem[];
  columns?: 2 | 3;
}) {
  if (lavori.length === 0) return null;
  const grid =
    columns === 3
      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : "grid gap-6 sm:grid-cols-2";
  return (
    <div className={grid}>
      {lavori.map((l) => (
        <LavoroCard key={l.id} l={l} />
      ))}
    </div>
  );
}
