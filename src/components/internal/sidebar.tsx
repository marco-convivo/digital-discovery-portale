"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";
import { Logo } from "@/components/ui/logo";

// Rail a icone v0.5 (1a). 5 voci + admin. Su desktop è una colonna stretta di
// 76px; su mobile diventa una tab bar in basso. "Cassa" porta l'insoluto come
// badge. Landing = "Oggi".
interface Voce {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  adminOnly?: boolean;
  badge?: number;
  exact?: boolean;
}

export function Sidebar({
  profile,
  insolutiCount = 0,
}: {
  profile: Profile;
  insolutiCount?: number;
}) {
  const pathname = usePathname();
  const [altro, setAltro] = useState(false);
  const isAdmin = profile.role === "admin";
  const initials = (profile.full_name ?? profile.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const VOCI: Voce[] = [
    { href: "/vendite", label: "Oggi", icon: OggiIcon, exact: true },
    { href: "/vendite/pipeline", label: "Pipeline", icon: PipelineIcon },
    { href: "/vendite/clienti", label: "Clienti", icon: UsersIcon },
    { href: "/vendite/pagamenti", label: "Cassa", icon: CardIcon, badge: insolutiCount },
    { href: "/vendite/catalogo", label: "Catalogo", icon: GridIcon, adminOnly: true },
    { href: "/vendite/utenti", label: "Team", icon: ShieldIcon, adminOnly: true },
  ];
  const voci = VOCI.filter((v) => !v.adminOnly || isAdmin);
  const attiva = (v: Voce) =>
    v.exact ? pathname === v.href : pathname.startsWith(v.href);

  // 5 principali per la tab bar mobile; il resto sotto "Altro".
  const primarie = voci.slice(0, 4);
  const secondarie = voci.slice(4);

  return (
    <>
      {/* Desktop: rail a icone */}
      <aside className="hidden w-[76px] flex-none flex-col items-center gap-1.5 border-r border-line-field bg-sidebar py-3.5 lg:flex">
        <div className="mb-2.5 grid size-10 place-items-center rounded-md bg-ink text-on-ink">
          <Logo className="size-[54%]" />
        </div>
        {voci.map((v) => (
          <RailItem key={v.href} v={v} active={attiva(v)} />
        ))}
        <form action={signOut} className="mt-auto">
          <button
            type="submit"
            title={`${profile.full_name ?? profile.email} · esci`}
            className="grid size-9 place-items-center rounded-btn bg-violet text-[12px] font-bold text-on-violet"
          >
            {initials}
          </button>
        </form>
      </aside>

      {/* Mobile: barra brand snella in alto */}
      <div className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="grid size-8 place-items-center rounded-md bg-ink text-on-ink">
          <Logo className="size-[54%]" />
        </div>
        <span className="text-[15px] font-bold">Digital Discovery</span>
      </div>

      {/* Mobile: tab bar in basso */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {primarie.map((v) => {
          const active = attiva(v);
          const Icon = v.icon;
          return (
            <Link
              key={v.href}
              href={v.href}
              className={cn(
                "relative flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors",
                active ? "text-text" : "text-text-3",
              )}
            >
              <Icon className="size-[22px]" />
              {v.label}
              {!!v.badge && v.badge > 0 && (
                <span className="absolute right-[22%] top-1.5 grid min-w-[15px] place-items-center rounded-pill bg-fail-dot px-1 text-[9px] font-bold text-white">
                  {v.badge}
                </span>
              )}
            </Link>
          );
        })}
        {secondarie.length > 0 && (
          <button
            type="button"
            onClick={() => setAltro(true)}
            className="flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold text-text-3"
          >
            <DotsIcon className="size-[22px]" />
            Altro
          </button>
        )}
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
              {secondarie.map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  onClick={() => setAltro(false)}
                  className={cn(
                    "rounded-md px-4 py-3 text-[14px] font-semibold transition-colors",
                    attiva(v) ? "bg-ink text-on-ink" : "bg-card text-text-2",
                  )}
                >
                  {v.label}
                </Link>
              ))}
            </div>
            <form action={signOut} className="mt-3 border-t border-line pt-3">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left"
              >
                <span className="grid size-9 flex-none place-items-center rounded-btn bg-violet text-[12px] font-bold text-on-violet">
                  {initials}
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold">
                    {profile.full_name ?? profile.email}
                  </span>
                  <span className="block text-[11px] font-medium text-text-3">esci</span>
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function RailItem({ v, active }: { v: Voce; active: boolean }) {
  const Icon = v.icon;
  return (
    <Link
      href={v.href}
      title={v.label}
      className={cn(
        "relative flex w-[60px] flex-col items-center gap-1 rounded-md py-2.5 text-[10px] font-semibold transition-colors",
        active ? "bg-ink text-on-ink" : "text-text-2 hover:bg-card hover:text-text",
      )}
    >
      <Icon className="size-5" />
      {v.label}
      {!!v.badge && v.badge > 0 && (
        <span className="absolute right-2 top-1.5 grid min-w-[17px] place-items-center rounded-pill bg-fail-dot px-1 text-[10px] font-bold text-white">
          {v.badge}
        </span>
      )}
    </Link>
  );
}

/* --- icone --- */
const S = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
function OggiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M3 12h6M3 6h12M3 18h9" />
    </svg>
  );
}
function PipelineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="3" y="3" width="6" height="18" rx="1.5" />
      <rect x="10" y="3" width="6" height="12" rx="1.5" />
      <rect x="17" y="3" width="4" height="8" rx="1.5" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}
function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9.5 12l2 2 3.5-3.5" />
    </svg>
  );
}
function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...S}>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  );
}
