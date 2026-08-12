import { createClient } from "@/lib/supabase/server";
import { listServiziInterni } from "@/lib/catalogo/queries";
import { CatalogoOrdinabile } from "@/components/internal/catalogo-ordinabile";
import { NuovoServizio } from "@/components/internal/nuovo-servizio";

export default async function CatalogoAdminPage() {
  const supabase = await createClient();
  const [servizi, { data: userData }] = await Promise.all([
    listServiziInterni(),
    supabase.auth.getUser(),
  ]);
  let isAdmin = false;
  const uid = userData.user?.id;
  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", uid)
      .maybeSingle();
    const p = prof as { role: string; active: boolean } | null;
    isAdmin = !!p && p.active && p.role === "admin";
  }

  const inVetrina = servizi.filter((s) => s.in_vetrina);
  const nascosti = servizi.filter((s) => !s.in_vetrina);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Catalogo servizi
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            {isAdmin
              ? "Trascina (o usa le frecce) per l'ordine in vetrina. In vetrina = lo vede il cliente; vendibile = lo puoi mettere in preventivo."
              : "Ordine di vetrina, visibilità e disponibilità nei preventivi di ciascun servizio."}
          </p>
        </div>
        <NuovoServizio />
      </header>

      <CatalogoOrdinabile inVetrina={inVetrina} nascosti={nascosti} isAdmin={isAdmin} />
    </div>
  );
}
