import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Sidebar } from "@/components/internal/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // is_staff() = esiste una riga in profiles per questo utente.
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = data as Profile | null;

  if (!profile || !profile.active) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-text">Accesso non abilitato</h1>
          <p className="mt-2 text-sm text-text-2">
            L&apos;account <b>{user.email}</b> non è tra lo staff di Digital
            Discovery. Chiedi a un amministratore di abilitarti.
          </p>
          <form action={signOut} className="mt-6">
            <Button type="submit" variant="outline" className="w-full">
              Esci
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
    </div>
  );
}
