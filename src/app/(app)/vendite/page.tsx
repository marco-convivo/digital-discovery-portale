import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddLeadDialog } from "@/components/internal/add-lead-dialog";
import { FocusTiles } from "@/components/internal/home/focus-tiles";
import { DaGestire } from "@/components/internal/home/da-gestire";
import { getHomeData } from "@/lib/home/queries";
import { euro } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tone } from "@/components/ui/status-pill";

const DOT: Record<Tone, string> = {
  paid: "bg-paid-dot",
  info: "bg-info-dot",
  wait: "bg-wait-dot",
  fail: "bg-fail-dot",
  draft: "bg-draft-dot",
};

function saluto(): string {
  const h = new Date().getHours();
  if (h < 13) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function oggiLabel(): string {
  const s = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: prof } = user
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const nome = ((prof as { full_name: string | null } | null)?.full_name ?? "")
    .split(" ")[0];

  const home = await getHomeData();
  const n = home.focus.taskCount;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-[-0.03em] text-text">
            {saluto()}
            {nome ? `, ${nome}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-2">
            {oggiLabel()} ·{" "}
            {n === 0
              ? "nessuna cosa urgente da gestire."
              : `${n} ${n === 1 ? "cosa richiede" : "cose richiedono"} la tua attenzione oggi.`}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/vendite/clienti"
            className="rounded-pill border border-line bg-card px-4 py-2.5 text-[13px] font-bold text-text transition-colors hover:bg-card-2"
          >
            Clienti
          </Link>
          <AddLeadDialog />
        </div>
      </header>

      <FocusTiles focus={home.focus} />

      <DaGestire tasks={home.tasks} />

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-text">
                Pipeline
              </h2>
              <Link
                href="/vendite/pipeline"
                className="text-[12.5px] font-bold text-violet hover:underline"
              >
                Apri board
              </Link>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {home.pipeline.map((col) => (
                <Link
                  key={col.key}
                  href="/vendite/pipeline"
                  className="min-w-[104px] flex-1 rounded-md bg-card-2 p-3.5 transition-colors hover:bg-line/50"
                >
                  <div className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-text">
                    {col.count}
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-bold text-text-2">
                    <span className={cn("size-[7px] rounded-full", DOT[col.tone])} />
                    {col.label}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-card border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-text">
                Preventivi da seguire
              </h2>
              <span className="text-[12px] font-bold text-text-3">
                {home.preventivi.length} aperti
              </span>
            </div>
            {home.preventivi.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-3">
                Nessun preventivo in attesa di risposta.
              </p>
            ) : (
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {home.preventivi.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className={cn("size-2 flex-none rounded-full", DOT[p.tone])} />
                    <Link href={p.href} className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-text hover:text-violet">
                        {p.cliente}
                      </span>
                      <span className="block truncate text-[12px] text-text-3">
                        {p.ctx}
                      </span>
                    </Link>
                    <span className="flex-none text-[12.5px] font-bold text-text-2">
                      {p.importo != null ? euro(p.importo) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-card border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-text">
                Scadenze del mese
              </h2>
              <Link
                href="/vendite/scadenze"
                className="text-[12.5px] font-bold text-violet hover:underline"
              >
                Tutte
              </Link>
            </div>
            {home.scadenze.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-3">
                Nessuna scadenza in vista.
              </p>
            ) : (
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {home.scadenze.map((s, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "size-2 flex-none rounded-full",
                        s.giorni <= 7 ? "bg-wait-dot" : "bg-draft-dot",
                      )}
                    />
                    <Link href={s.href} className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-text hover:text-violet">
                        {s.cliente}
                      </span>
                      <span className="block truncate text-[12px] text-text-3">
                        {s.servizio}
                      </span>
                    </Link>
                    <span className="flex-none text-[12.5px] font-bold text-text-2">
                      {s.giorni < 0 ? `−${-s.giorni} gg` : `${s.giorni} gg`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-card border border-line bg-card p-5">
            <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-text">
              Attività recente
            </h2>
            {home.attivita.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-3">
                Ancora nessuna attività.
              </p>
            ) : (
              <ul className="mt-2.5 flex flex-col">
                {home.attivita.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span className={cn("size-2 flex-none rounded-full", DOT[a.tone])} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
                      {a.testo}
                    </span>
                    <span className="flex-none text-[11.5px] text-text-3">
                      {a.quando}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
