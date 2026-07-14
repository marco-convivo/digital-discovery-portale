import { Logo, LogoMark } from "@/components/ui/logo";

type Variant = "staff" | "cliente";

const COPY: Record<
  Variant,
  { eyebrow: string; titolo: string; sottotitolo: string; punti: string[] }
> = {
  staff: {
    eyebrow: "Area vendite",
    titolo: "La tua pipeline, sempre sotto controllo.",
    sottotitolo:
      "Preventivi, contratti e pagamenti in un unico posto — il sistema avanza da solo mentre il cliente agisce.",
    punti: [
      "Pipeline e preventivi",
      "Contratti firmati online",
      "Pagamenti che si aggiornano da soli",
    ],
  },
  cliente: {
    eyebrow: "Area clienti",
    titolo: "La tua presenza digitale, gestita da noi.",
    sottotitolo:
      "Piano pagamenti, servizi attivi e contratti sempre a portata, con un unico referente.",
    punti: [
      "Piano pagamenti sempre chiaro",
      "Contratti e servizi a portata",
      "Un unico referente",
    ],
  },
};

// Fondo scuro con glow del brand (violet + mint) — coerente con la vetrina.
const DARK_BG =
  "radial-gradient(120% 120% at 18% 12%, #2b2552 0%, #191830 46%, #0c0c16 100%)";

function AuthVisual({ variant }: { variant: Variant }) {
  const c = COPY[variant];
  return (
    <aside
      className="relative hidden overflow-hidden lg:flex lg:w-[54%] lg:flex-col lg:justify-between lg:p-12 xl:p-14"
      style={{ background: DARK_BG }}
    >
      {/* glow del brand */}
      <div
        aria-hidden
        className="absolute -left-24 -top-24 size-[26rem] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, #a28ef955, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-28 -right-16 size-[24rem] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, #a4f5a644, transparent 70%)" }}
      />

      {/* brand */}
      <div className="relative flex items-center gap-3 text-white">
        <LogoMark className="h-8 w-auto" />
        <span className="text-[17px] font-bold tracking-[-0.01em]">
          Digital Discovery
        </span>
      </div>

      {/* headline */}
      <div className="relative max-w-md">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/50">
          {c.eyebrow}
        </p>
        <h2 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-balance text-white xl:text-[2.75rem]">
          {c.titolo}
        </h2>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
          {c.sottotitolo}
        </p>
        <ul className="mt-7 flex flex-col gap-2.5">
          {c.punti.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-[14px] text-white/80">
              <span className="grid size-5 flex-none place-items-center rounded-full bg-white/10 text-mint">
                <CheckIcon />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* footer */}
      <p className="relative text-[12px] text-white/35">
        Digital Discovery S.r.l. · L&apos;Aquila
      </p>
    </aside>
  );
}

export function AuthShell({
  variant,
  children,
}: {
  variant: Variant;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      <AuthVisual variant={variant} />
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm">
          {/* logo per mobile (il pannello sinistro è nascosto) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="size-11" />
            <span className="text-[17px] font-bold tracking-[-0.01em] text-text">
              Digital Discovery
            </span>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
