import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserManager, type StaffMember } from "@/components/internal/user-manager";

export default async function UtentiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Solo admin: gli operatori non vedono questa sezione.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  const meProfile = me as { role: string; active: boolean } | null;
  if (!meProfile || !meProfile.active || meProfile.role !== "admin")
    redirect("/vendite");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active")
    .order("active", { ascending: false })
    .order("created_at", { ascending: true });
  const members = (data ?? []) as StaffMember[];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Utenti
        </h1>
        <p className="mt-0.5 max-w-[60ch] text-sm text-text-2">
          Chi entra con una mail <b>@convivostudio.it</b> compare qui in attesa:
          abilitalo per dargli accesso. Gli <b>operatori</b> gestiscono pipeline
          e preventivi; solo gli <b>amministratori</b> gestiscono il catalogo e
          gli utenti.
        </p>
      </header>

      <UserManager members={members} currentUserId={user.id} />
    </div>
  );
}
