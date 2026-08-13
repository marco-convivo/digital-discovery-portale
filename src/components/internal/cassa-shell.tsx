import Link from "next/link";
import { cn } from "@/lib/utils";

type CassaVista = "calendario" | "insoluti" | "scadenze";

const TAB: { key: CassaVista; label: string; href: string }[] = [
  { key: "calendario", label: "Calendario", href: "/vendite/pagamenti" },
  { key: "insoluti", label: "Insoluti", href: "/vendite/insoluti" },
  { key: "scadenze", label: "Scadenze", href: "/vendite/scadenze" },
];

/**
 * Testata unica della sezione Cassa (unifica Pagamenti + Insoluti + Scadenze):
 * titolo + tab. Ogni pagina passa la vista attiva e il proprio contenuto.
 */
export function CassaShell({
  active,
  insolutiCount = 0,
  children,
}: {
  active: CassaVista;
  insolutiCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1720px]">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Cassa
        </h1>
        <nav className="mt-3 flex gap-1 border-b border-line">
          {TAB.map((t) => {
            const on = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-[13.5px] font-semibold transition-colors",
                  on
                    ? "border-ink text-text"
                    : "border-transparent text-text-3 hover:text-text-2",
                )}
              >
                {t.label}
                {t.key === "insoluti" && insolutiCount > 0 && (
                  <span className="grid min-w-[18px] place-items-center rounded-pill bg-fail-dot px-1 text-[10px] font-bold text-white">
                    {insolutiCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
