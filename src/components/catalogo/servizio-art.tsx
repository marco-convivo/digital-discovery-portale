import { cn } from "@/lib/utils";

// Illustrazione di servizio in puro CSS/SVG: gradiente a tema + "app-icon"
// material (vetro smerigliato, gloss, ombra = effetto 3D) con un'icona di
// digital marketing per ciascun servizio. Sostituisce i placeholder a lettera.

interface Tema {
  from: string;
  to: string;
}

const TEMA: Record<string, Tema> = {
  social: { from: "#6d5cf0", to: "#a28ef9" },
  google: { from: "#2f9bff", to: "#59d3e6" },
  sito: { from: "#12b5a6", to: "#5fd39a" },
  ecommerce: { from: "#ff6fa1", to: "#ff9e73" },
  ads: { from: "#ff9426", to: "#ffcb5c" },
  brand: { from: "#c65cf0", to: "#8a7bff" },
  shooting: { from: "#556ae6", to: "#8ea6ff" },
  video: { from: "#ff5f6d", to: "#ffa05f" },
  whatsapp: { from: "#1fbf63", to: "#68e39a" },
};

const FALLBACK: Tema = { from: "#8a8f9a", to: "#c3c8d0" };

const cls = "relative size-[46%] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]";

const ICON: Record<string, React.ReactNode> = {
  // engagement / community
  social: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 20.5l-1.3-1.15C6.1 15.24 3 12.46 3 9.05 3 6.3 5.14 4.2 7.8 4.2c1.54 0 3.02.72 4.2 1.95 1.18-1.23 2.66-1.95 4.2-1.95 2.66 0 4.8 2.1 4.8 4.85 0 3.41-3.1 6.19-7.7 10.3L12 20.5z" />
    </svg>
  ),
  // local visibility
  google: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 2C7.9 2 4.6 5.3 4.6 9.4c0 5.05 6.2 11.7 6.47 11.98a1.28 1.28 0 0 0 1.86 0c.27-.28 6.47-6.93 6.47-11.98C19.4 5.3 16.1 2 12 2zm0 10.1a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4z" />
    </svg>
  ),
  // website
  sito: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4zM4 9v9.5h16V9H4zm2-2.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
    </svg>
  ),
  // shop
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M7 8V7a5 5 0 0 1 10 0v1h2.2a1 1 0 0 1 1 .93l.73 11A1 1 0 0 1 19.93 21H4.07a1 1 0 0 1-1-1.07l.73-11A1 1 0 0 1 4.8 8H7zm2 0h6V7a3 3 0 1 0-6 0v1z" />
    </svg>
  ),
  // advertising
  ads: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M4 9.5A1.5 1.5 0 0 0 2.5 11v2A1.5 1.5 0 0 0 4 14.5h1.2l1.9 4.35A1 1 0 0 0 8 19.5h1.3a1 1 0 0 0 .92-1.4L8.9 14.5h1.35l8.1 4.02A1 1 0 0 0 19.8 17.6V6.4a1 1 0 0 0-1.45-.9L10.25 9.5H4z" />
    </svg>
  ),
  // brand identity
  brand: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" />
      <path d="M19 3l.9 2.3L22 6l-2.1.7L19 9l-.9-2.3L16 6l2.1-.7L19 3z" opacity=".85" />
    </svg>
  ),
  // photo
  shooting: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M9.2 4l-1.1 1.9H4.5A2.5 2.5 0 0 0 2 8.4v9.1A2.5 2.5 0 0 0 4.5 20h15a2.5 2.5 0 0 0 2.5-2.5V8.4a2.5 2.5 0 0 0-2.5-2.5h-3.6L14.8 4H9.2zm2.8 4.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8z" />
    </svg>
  ),
  // video
  video: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M4 4.8A1.8 1.8 0 0 1 6.7 3.2l12.5 6.9a1.8 1.8 0 0 1 0 3.15L6.7 20.8A1.8 1.8 0 0 1 4 19.2V4.8z" />
    </svg>
  ),
  // whatsapp / direct chat
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 3a9 9 0 0 0-7.7 13.65L3 21l4.5-1.24A9 9 0 1 0 12 3zm4.4 11.7c-.2.55-1.16 1.05-1.6 1.1-.43.05-.86.23-2.9-.6-2.45-.98-4-3.44-4.12-3.6-.12-.16-.98-1.3-.98-2.48s.62-1.76.84-2c.22-.24.48-.3.64-.3l.46.01c.15 0 .35-.05.54.42.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4l-.36.42c-.12.12-.24.25-.1.49.14.24.62 1.02 1.32 1.65.9.8 1.66 1.05 1.9 1.17.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.13z" />
    </svg>
  ),
};

export function ServizioArt({
  chiave,
  className,
}: {
  chiave: string;
  className?: string;
}) {
  const tema = TEMA[chiave] ?? FALLBACK;
  const icon = ICON[chiave] ?? ICON.sito;
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${tema.from}, ${tema.to})` }}
    >
      {/* profondità: bagliori sfocati */}
      <div className="absolute -left-10 -top-12 size-44 rounded-full bg-white/25 blur-2xl" />
      <div className="absolute -bottom-14 -right-8 size-48 rounded-full bg-black/15 blur-2xl" />
      {/* gloss dall'alto */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
      {/* app-icon material + 3D */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid aspect-square w-[38%] max-w-[132px] place-items-center rounded-[26%] bg-white/15 shadow-[0_18px_38px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/25 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
          {icon}
        </div>
      </div>
    </div>
  );
}
