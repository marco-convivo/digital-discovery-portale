"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreaClienteResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string };

export interface NuovoClienteInput {
  nome: string;
  referente?: string | null;
  citta?: string | null;
  telefono?: string | null;
  email?: string | null;
  fatturazione?: {
    p_iva?: string | null;
    codice_fiscale?: string | null;
    codice_sdi?: string | null;
    pec?: string | null;
    indirizzo?: string | null;
  } | null;
}

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/** Chiave telefono per il match duplicati: ultime 9 cifre (ignora prefisso). */
function telKey(s?: string | null): string {
  const d = (s ?? "").replace(/\D/g, "");
  return d.length > 9 ? d.slice(-9) : d;
}

export interface Duplicato {
  id: string;
  ragione_sociale: string;
}

/** Clienti esistenti con lo stesso telefono (controllo inline in 7a). */
export async function cercaDuplicatiTelefono(
  telefono: string,
): Promise<Duplicato[]> {
  const key = telKey(telefono);
  if (key.length < 6) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("clients")
    .select("id, ragione_sociale, telefono")
    .not("telefono", "is", null);
  return ((data ?? []) as { id: string; ragione_sociale: string; telefono: string | null }[])
    .filter((c) => telKey(c.telefono) === key)
    .map((c) => ({ id: c.id, ragione_sociale: c.ragione_sociale }));
}

/** 7a — crea un cliente (opportunità in Pipeline, stato lead, assegnata a me). */
export async function creaCliente(
  input: NuovoClienteInput,
): Promise<CreaClienteResult> {
  const nome = input.nome.trim();
  if (!nome) return { ok: false, error: "Il nome attività è obbligatorio." };

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const f = input.fatturazione ?? {};
  const { data, error } = await sb
    .from("clients")
    .insert({
      ragione_sociale: nome,
      referente: clean(input.referente),
      email: clean(input.email),
      telefono: clean(input.telefono),
      indirizzo: clean(f.indirizzo) ?? clean(input.citta),
      p_iva: clean(f.p_iva),
      codice_fiscale: clean(f.codice_fiscale),
      codice_sdi: clean(f.codice_sdi),
      pec: clean(f.pec),
      owner_id: user.id, // "mia" trattativa → modifica consentita al commerciale
    })
    .select("id")
    .single();

  if (error || !data)
    return { ok: false, error: error?.message ?? "Errore creazione cliente." };

  revalidatePath("/vendite");
  revalidatePath("/vendite/clienti");
  return { ok: true, clientId: (data as { id: string }).id };
}
