"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  creaCliente,
  cercaDuplicatiTelefono,
  type Duplicato,
} from "@/app/(app)/vendite/actions";

export function ClienteNuovoDrawer({
  label = "Nuovo cliente",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [referente, setReferente] = useState("");
  const [citta, setCitta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [showFatt, setShowFatt] = useState(false);
  const [pIva, setPIva] = useState("");
  const [cf, setCf] = useState("");
  const [sdi, setSdi] = useState("");
  const [pec, setPec] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [duplicati, setDuplicati] = useState<Duplicato[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty =
    !!nome || !!referente || !!citta || !!telefono || !!email ||
    !!pIva || !!cf || !!sdi || !!pec || !!indirizzo;

  // Controllo duplicati inline sul telefono (debounce ~400ms, non blocca).
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(async () => {
      const d = telefono.replace(/\D/g, "").length >= 6
        ? await cercaDuplicatiTelefono(telefono)
        : [];
      setDuplicati(d);
    }, 400);
    return () => clearTimeout(id);
  }, [telefono, open]);

  function reset() {
    setNome(""); setReferente(""); setCitta(""); setTelefono(""); setEmail("");
    setShowFatt(false); setPIva(""); setCf(""); setSdi(""); setPec(""); setIndirizzo("");
    setDuplicati([]); setError(null);
  }
  function chiudi() {
    if (dirty && !window.confirm("Chiudere senza salvare? Le modifiche andranno perse.")) return;
    setOpen(false);
    reset();
  }

  function salva(poi: "chiudi" | "preventivo") {
    setError(null);
    start(async () => {
      const res = await creaCliente({
        nome, referente, citta, telefono, email,
        fatturazione: showFatt
          ? { p_iva: pIva, codice_fiscale: cf, codice_sdi: sdi, pec, indirizzo }
          : null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const id = res.clientId;
      setOpen(false);
      reset();
      if (poi === "preventivo") router.push(`/vendite/clienti/${id}`);
      else router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {label}
      </Button>

      <Drawer
        open={open}
        onClose={chiudi}
        title="Nuovo cliente"
        subtitle="Servono solo nome e un contatto — il resto lo aggiungi quando serve."
        footer={
          <div className="flex items-center gap-2.5">
            <Button onClick={() => salva("chiudi")} disabled={pending}>
              {pending ? "Salvataggio…" : "Crea cliente"}
            </Button>
            <Button variant="secondary" onClick={() => salva("preventivo")} disabled={pending}>
              Crea e fai un preventivo
            </Button>
            <button
              type="button"
              onClick={chiudi}
              disabled={pending}
              className="ml-auto text-[13px] font-semibold text-text-3 hover:text-text-2"
            >
              Annulla
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input
            label="Nome attività"
            required
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Referente" value={referente} onChange={(e) => setReferente(e.target.value)} />
            <Input label="Città" value={citta} onChange={(e) => setCitta(e.target.value)} />
          </div>
          <Input
            label="Telefono"
            labelRight="è anche il WhatsApp per il portale"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

          {duplicati.length > 0 && (
            <div className="rounded-md bg-wait-bg px-3.5 py-2.5 text-[12.5px] text-wait-tx">
              <div className="font-bold">
                Forse esiste già un cliente con questo numero
              </div>
              <ul className="mt-1 flex flex-col gap-0.5">
                {duplicati.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{d.ragione_sociale}</span>
                    <Link
                      href={`/vendite/clienti/${d.id}`}
                      className="flex-none font-bold underline"
                    >
                      Apri
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          {/* Dati di fatturazione — rimandati */}
          {!showFatt ? (
            <button
              type="button"
              onClick={() => setShowFatt(true)}
              className="self-start text-[13px] font-semibold text-link hover:underline"
            >
              + Aggiungi dati di fatturazione
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-line p-3.5">
              <div className="text-[12.5px] font-semibold text-text-2">
                Dati di fatturazione
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="P. IVA" value={pIva} onChange={(e) => setPIva(e.target.value)} />
                <Input label="Cod. fiscale" value={cf} onChange={(e) => setCf(e.target.value)} />
                <Input label="Codice SDI" value={sdi} onChange={(e) => setSdi(e.target.value)} />
                <Input label="PEC" value={pec} onChange={(e) => setPec(e.target.value)} />
              </div>
              <Input label="Indirizzo" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
            </div>
          )}

          {/* Cosa succede quando salvi */}
          <Card dark className="mt-1">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-on-ink/60">
              Cosa succede quando salvi
            </div>
            <ul className="mt-2.5 flex flex-col gap-2 text-[13px]">
              <li className="flex items-center gap-2.5">
                <span className="grid size-4 flex-none place-items-center rounded-full bg-mint text-[#0f2e1e]">
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                </span>
                <span className="text-on-ink">Crea l&apos;opportunità in Pipeline</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-4 flex-none rounded-full border border-on-ink/30" />
                <span className="text-on-ink/70">
                  Invia l&apos;accesso al portale
                  <span className="text-on-ink/45"> — parte da solo alla firma</span>
                </span>
              </li>
            </ul>
          </Card>

          {error && (
            <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
              {error}
            </p>
          )}
        </div>
      </Drawer>
    </>
  );
}
