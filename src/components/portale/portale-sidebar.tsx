"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutCliente } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "/portale", label: "Home" },
  { href: "/portale/pagamenti", label: "Piano pagamenti" },
  { href: "/portale/fatture", label: "Fatture" },
  { href: "/portale/servizi", label: "Servizi" },
  { href: "/portale/contratti", label: "Contratti" },
  { href: "/portale/catalogo", label: "Catalogo" },
];

export function PortaleSidebar({ ragioneSociale }: { ragioneSociale: string }) {
  const pathname = usePathname();
  const initials = ragioneSociale
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex w-[250px] flex-none flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Logo className="size-[38px]" />
        <div className="leading-tight">
          <div className="text-[17px] font-bold tracking-[-0.01em]">
            Digital Discovery
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-text-3">
            Portale
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold transition-colors",
                active
                  ? "bg-ink text-on-ink"
                  : "text-text-2 hover:bg-card hover:text-text",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOutCliente} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-card"
        >
          <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-mint text-[12px] font-bold text-on-mint">
            {initials}
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-bold">{ragioneSociale}</span>
            <span className="block text-[11px] font-medium text-text-3">
              esci
            </span>
          </span>
        </button>
      </form>
    </aside>
  );
}
