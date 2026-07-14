import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { euro } from "@/lib/format";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";
const ADMIN = "marco@convivostudio.it";

/** Avvisa admin + operatore owner di un insoluto. Best-effort. */
export async function inviaAlertInsoluto(paymentId: string): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: p } = await db
      .from("payments")
      .select(
        "numero_rata, importo, failure_reason, client:clients!payments_client_id_fkey(ragione_sociale, owner_id)",
      )
      .eq("id", paymentId)
      .maybeSingle();
    if (!p) return;
    const row = p as unknown as {
      numero_rata: number | null;
      importo: number | null;
      failure_reason: string | null;
      client: { ragione_sociale: string; owner_id: string | null } | null;
    };
    const cli = row.client;
    if (!cli) return;

    const dest = new Set<string>([ADMIN]);
    if (cli.owner_id) {
      const { data: owner } = await db
        .from("profiles")
        .select("email")
        .eq("id", cli.owner_id)
        .maybeSingle();
      const oe = (owner as { email: string | null } | null)?.email;
      if (oe) dest.add(oe);
    }

    const link = `${SITE}/vendite/insoluti?p=${paymentId}`;
    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1e1e22;max-width:480px">
        <h2 style="margin:0 0 8px;font-size:18px">Addebito non riuscito</h2>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#55555e">
          <b>${cli.ragione_sociale}</b> — rata ${row.numero_rata ?? "—"} ·
          ${euro(Number(row.importo ?? 0))}<br>
          Motivo: ${row.failure_reason ?? "Addebito non riuscito."}
        </p>
        <a href="${link}" style="display:inline-block;background:#222;color:#fff;
          text-decoration:none;border-radius:999px;padding:11px 22px;font-weight:700;font-size:14px">
          Gestisci l'insoluto</a>
      </div>`;

    await sendEmail({
      to: [...dest],
      subject: `Insoluto: ${cli.ragione_sociale} — rata ${row.numero_rata ?? ""}`,
      html,
    });
  } catch {
    // best-effort: non deve mai far fallire il webhook
  }
}
