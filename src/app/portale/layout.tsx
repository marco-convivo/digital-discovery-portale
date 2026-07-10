import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPortalClient } from "@/lib/portale/client";
import { signOutCliente } from "@/lib/actions/auth";
import { PortaleSidebar } from "@/components/portale/portale-sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function PortaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/accedi");

  const client = await getPortalClient();

  if (!client) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-lg font-bold text-text">Nessun account cliente</h1>
          <p className="mt-2 text-sm text-text-2">
            L&apos;email <b>{user.email}</b> non è collegata a nessun cliente
            Digital Discovery. Contattaci se pensi sia un errore.
          </p>
          <form action={signOutCliente} className="mt-6">
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
      <PortaleSidebar ragioneSociale={client.ragione_sociale} />
      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">{children}</main>
    </div>
  );
}
