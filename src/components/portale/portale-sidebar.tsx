"use client";

import { useState } from "react";
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
  { href: "/portale/lavori", label: "Lavori" },
  { href: "/portale/assistenza", label: "Assistenza" },
];

export function PortaleSidebar({ ragioneSociale }: { ragioneSociale: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = ragioneSociale
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );

  const brand = (
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
  );

  const signout = (
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
          <span className="block text-[11px] font-medium text-text-3">esci</span>
        </span>
      </button>
    </form>
  );

  return (
    <>
      {/* Desktop: sidebar fissa */}
      <aside className="hidden w-[250px] flex-none flex-col gap-6 p-4 lg:flex">
        {brand}
        {nav()}
        {signout}
      </aside>

      {/* Mobile: top bar con hamburger */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo className="size-9" />
          <span className="text-[15px] font-bold">Digital Discovery</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="grid size-10 place-items-center rounded-xl text-text-2 hover:bg-card"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile: drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col gap-6 bg-bg p-4 shadow-xl">
            <div className="flex items-start justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi"
                className="grid size-9 flex-none place-items-center rounded-xl text-text-2 hover:bg-card"
              >
                <CloseIcon />
              </button>
            </div>
            {nav(() => setOpen(false))}
            {signout}
          </div>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-6">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
