import { createClient } from "@/lib/supabase/server";
import { listInsoluti } from "@/lib/insoluti/queries";
import { getAppSettings } from "@/lib/settings/app-settings";
import { InsolutiList } from "@/components/internal/insoluti-list";
import { ImpostazioniInsoluti } from "@/components/internal/impostazioni-insoluti";

export default async function InsolutiPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data: me } = user
    ? await sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = (me as { role: string } | null)?.role === "admin";

  const [insoluti, settings] = await Promise.all([
    listInsoluti(),
    getAppSettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Insoluti
        </h1>
        <p className="mt-0.5 max-w-[60ch] text-sm text-text-2">
          Addebiti rifiutati da recuperare. Genera un link di pagamento carta
          (rata + spese di insoluto, IVA inclusa), invialo al cliente o segna
          pagato un bonifico ricevuto.
        </p>
      </header>

      {isAdmin && (
        <div className="mb-5">
          <ImpostazioniInsoluti initial={settings} />
        </div>
      )}

      <InsolutiList insoluti={insoluti} settings={settings} highlightId={p} />
    </div>
  );
}
