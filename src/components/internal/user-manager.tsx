"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserActive, setUserRole } from "@/lib/staff/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { ProfileRole } from "@/lib/types";

export interface StaffMember {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  active: boolean;
}

function initials(m: StaffMember) {
  return (m.full_name ?? m.email ?? "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Row({
  m,
  isSelf,
  onChanged,
}: {
  m: StaffMember;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(p: Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    start(async () => {
      const res = await p;
      if (!res.ok) setError(res.error);
      else onChanged();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line/60 px-5 py-4 last:border-b-0">
      <span className="grid size-10 flex-none place-items-center rounded-[12px] bg-violet text-[13px] font-bold text-on-violet">
        {initials(m)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-text">
            {m.full_name ?? m.email ?? "—"}
          </span>
          {isSelf && (
            <span className="rounded-pill bg-card-2 px-2 py-0.5 text-[11px] font-semibold text-text-3">
              tu
            </span>
          )}
        </div>
        {m.full_name && (
          <div className="truncate text-[12.5px] text-text-3">{m.email}</div>
        )}
      </div>

      {m.active ? (
        <StatusPill tone="paid">Attivo</StatusPill>
      ) : (
        <StatusPill tone="wait">In attesa</StatusPill>
      )}

      {/* Ruolo */}
      <select
        value={m.role}
        disabled={pending || isSelf}
        title={isSelf ? "Non puoi cambiare il tuo ruolo" : "Cambia ruolo"}
        onChange={(e) => run(setUserRole(m.id, e.target.value as ProfileRole))}
        className="rounded-sm border border-line bg-card px-2.5 py-1.5 text-[13px] font-semibold text-text outline-none focus:border-violet disabled:opacity-50"
      >
        <option value="admin">Amministratore</option>
        <option value="commerciale">Operatore</option>
      </select>

      {/* Abilita / Disabilita */}
      <Button
        size="sm"
        variant={m.active ? "ghost" : "primary"}
        disabled={pending || (isSelf && m.active)}
        title={
          isSelf && m.active ? "Non puoi disattivare il tuo account" : undefined
        }
        onClick={() => run(setUserActive(m.id, !m.active))}
      >
        {pending ? "…" : m.active ? "Disabilita" : "Abilita"}
      </Button>

      {error && (
        <p className="w-full text-[12.5px] font-medium text-fail-tx">{error}</p>
      )}
    </div>
  );
}

export function UserManager({
  members,
  currentUserId,
}: {
  members: StaffMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const onChanged = () => router.refresh();
  const inAttesa = members.filter((m) => !m.active).length;

  return (
    <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      {inAttesa > 0 && (
        <p className="border-b border-line/60 bg-wait-bg/50 px-5 py-2.5 text-[12.5px] font-medium text-wait-tx">
          {inAttesa === 1
            ? "1 persona in attesa di abilitazione."
            : `${inAttesa} persone in attesa di abilitazione.`}
        </p>
      )}
      {members.map((m) => (
        <Row
          key={m.id}
          m={m}
          isSelf={m.id === currentUserId}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
