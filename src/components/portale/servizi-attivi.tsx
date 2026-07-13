import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { dataIt } from "@/lib/format";
import type { ServizioAttivo } from "@/lib/portale/home";

function stato(s: ServizioAttivo): { tone: Tone; label: string } {
  if (s.unaTantum || s.giorni == null) return { tone: "paid", label: "attivo" };
  if (s.giorni < 0) return { tone: "fail", label: "scaduto" };
  if (s.giorni <= 30) return { tone: "wait", label: `scade tra ${s.giorni} gg` };
  return { tone: "paid", label: "attivo" };
}

// Card dettagliata di un servizio attivo: cosa ha acquistato + di cosa ci
// occupiamo (attività dal catalogo). Usata in home portale e pagina Servizi.
export function ServiziAttivi({ servizi }: { servizi: ServizioAttivo[] }) {
  return (
    <div className="flex flex-col gap-3">
      {servizi.map((s, i) => {
        const st = stato(s);
        return (
          <article
            key={i}
            className="rounded-card border border-line/60 bg-card p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-text">{s.titolo}</h3>
                {s.dettaglio && (
                  <p className="mt-0.5 text-[12.5px] font-semibold text-violet">
                    {s.dettaglio}
                  </p>
                )}
              </div>
              <StatusPill tone={st.tone}>{st.label}</StatusPill>
            </div>

            {s.descrizione && (
              <p className="mt-2 text-[13.5px] leading-relaxed text-text-2">
                {s.descrizione}
              </p>
            )}

            {s.attivita.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">
                  Cosa seguiamo per te
                </p>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {s.attivita.map((a, j) => (
                    <li
                      key={j}
                      className="flex gap-2 text-[13px] leading-snug text-text-2"
                    >
                      <span className="flex-none font-bold text-on-mint">✓</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-[12.5px] text-text-3">
              {s.unaTantum
                ? "Servizio una tantum"
                : s.scadenzaIso
                  ? `Rinnovo il ${dataIt(s.scadenzaIso)}`
                  : "Attivo"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
