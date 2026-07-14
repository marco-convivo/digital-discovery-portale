import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Il catalogo (contenuti, prezzi, portfolio, creazione/rimozione servizi) è
// interamente riservato all'admin. Gli operatori consultano i servizi dalla
// vetrina pubblica; qui vengono reindirizzati alla pipeline.
export default async function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { role: string; active: boolean } | null;
  if (!p || !p.active || p.role !== "admin") redirect("/vendite");
  return <>{children}</>;
}
