"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutCliente } from "@/lib/actions/auth";
import { Logo } from "@/components/ui/logo";

// 4 voci principali (tab bar mobile) + il resto dietro "Altro".
const PRIMARY = [
  { href: "/portale", label: "Home", icon: HomeIcon },
  { href: "/portale/pagamenti", label: "Pagamenti", icon: CardIcon },
  { href: "/portale/servizi", label: "Servizi", icon: StarIcon },
  { href: "/portale/assistenza", label: "Assistenza", icon: ChatIcon },
];
const SECONDARY = [
  { href: "/portale/fatture", label: "Fatture" },
  { href: "/portale/contratti", label: "Contratti" },
  { href: "/portale/catalogo", label: "Catalogo" },
  { href: "/portale/lavori", label: "Lavori" },
];
const NAV_DESKTOP = [
  { href: "/portale", label: "Home" },
  { href: "/portale/pagamenti", label: "Piano pagamenti" },
  { href: "/portale/fatture", label: "Fatture" },
  { href: "/portale/servizi", label: "Servizi" },
  { href: "/portale/contratti", label: "Contratti" },
  { href: "/portale/catalogo", label: "Catalogo" },
  { href: "/portale/lavori", label: "Lavori" },
  { href: "/portale/assistenza", label: "Assistenza" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/portale" ? pathname === href : pathname.startsWith(href);
}

export function PortaleSidebar({ ragioneSociale }: { ragioneSociale: string }) {
  const pathname = usePathname();
  const [altro, setAltro] = useState(false);
  const initials = ragioneSociale
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
      {/* Desktop: sidebar fissa (tutte le voci) */}
      <aside className="hidden w-[250px] flex-none flex-col gap-6 p-4 lg:flex">
        {brand}
        <nav className="flex flex-col gap-0.5">
          {NAV_DESKTOP.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold transition-colors",
                isActive(pathname, href)
                  ? "bg-ink text-on-ink"
                  : "text-text-2 hover:bg-card hover:text-text",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        {signout}
      </aside>

      {/* Mobile: barra brand snella in alto (senza hamburger) */}
      <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Logo className="size-9" />
        <span className="text-[15px] font-bold">Digital Discovery</span>
      </div>

      {/* Mobile: tab bar in basso (52px + safe-area) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors",
                active ? "text-text" : "text-text-3",
              )}
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAltro(true)}
          className="flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold text-text-3"
        >
          <DotsIcon />
          Altro
        </button>
      </nav>

      {/* Mobile: sheet "Altro" */}
      {altro && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi"
            onClick={() => setAltro(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-card border-t border-line bg-bg p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAltro(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors",
                    isActive(pathname, href)
                      ? "bg-ink text-on-ink"
                      : "bg-card text-text-2 hover:text-text",
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-line pt-3">{signout}</div>
          </div>
        </div>
      )}
    </>
  );
}

/* --- icone tab bar --- */
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}
