"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import { Logo } from "@/components/ui/logo";

// In FASE 1 solo "Pipeline" è collegata; le altre voci restano visibili ma
// disabilitate (i pattern esistono nei mockup, le pagine arrivano dopo).
const NAV = [
  { href: "/vendite", label: "Pipeline", icon: PipelineIcon, ready: true },
  { href: "/vendite/clienti", label: "Clienti", icon: UsersIcon, ready: true },
  { href: "/vendite/preventivi", label: "Preventivi", icon: DocIcon, ready: true },
  { href: "/vendite/contratti", label: "Contratti", icon: DocCheckIcon, ready: true },
  { href: "/vendite/pagamenti", label: "Pagamenti", icon: CardIcon, ready: true },
  { href: "/vendite/scadenze", label: "Scadenze", icon: ClockIcon, ready: true },
  { href: "/vendite/catalogo", label: "Catalogo", icon: GridIcon, ready: true },
];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = (profile.full_name ?? profile.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon, ready }) => {
        const active =
          ready &&
          (href === "/vendite" ? pathname === href : pathname.startsWith(href));
        const base =
          "flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold transition-colors";
        if (!ready) {
          return (
            <span
              key={href}
              aria-disabled
              className={cn(base, "cursor-not-allowed text-text-3/70")}
              title="In arrivo"
            >
              <Icon />
              {label}
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              base,
              active
                ? "bg-ink text-on-ink"
                : "text-text-2 hover:bg-card hover:text-text",
            )}
          >
            <Icon />
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
          Vendite
        </div>
      </div>
    </div>
  );

  const signout = (
    <form action={signOut} className="mt-auto">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-card"
      >
        <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-violet text-[12px] font-bold text-on-violet">
          {initials}
        </span>
        <span className="leading-tight">
          <span className="block text-[13px] font-bold">
            {profile.full_name ?? profile.email}
          </span>
          <span className="block text-[11px] font-medium capitalize text-text-3">
            {profile.role} · esci
          </span>
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

/* --- icone (stroke, coerenti coi mockup) --- */
const svg = "size-[19px] flex-none";
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
function PipelineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <rect x="3" y="3" width="6" height="18" rx="1.5" />
      <rect x="10" y="3" width="6" height="12" rx="1.5" />
      <rect x="17" y="3" width="4" height="8" rx="1.5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}
function DocCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={svg}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
