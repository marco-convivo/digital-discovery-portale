import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portale/client";
import { AssistenzaForm } from "@/components/portale/assistenza-form";

export default async function AssistenzaPage() {
  const client = await getPortalClient();
  if (!client) redirect("/accedi");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Assistenza
        </h1>
        <p className="mt-1 max-w-[60ch] text-[15px] text-text-2">
          Hai una richiesta, una modifica o un&apos;idea? Scrivici: ti risponde il
          tuo referente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        <section className="rounded-card border border-line/60 bg-card p-6 shadow-card">
          <AssistenzaForm />
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-card border border-line/60 bg-card-2/60 p-5">
            <h2 className="text-[15px] font-bold text-text">Il tuo referente</h2>
            <p className="mt-1 text-[14px] text-text-2">
              {client.referente
                ? `${client.referente} segue il tuo account.`
                : "Un contatto dedicato segue il tuo account."}
            </p>
          </div>
          <div className="rounded-card border border-line/60 bg-card-2/60 p-5">
            <h2 className="text-[15px] font-bold text-text">Altri modi</h2>
            <p className="mt-1 text-[14px] text-text-2">
              Email:{" "}
              <a
                href="mailto:info@digital-discovery.it"
                className="font-semibold text-violet hover:underline"
              >
                info@digital-discovery.it
              </a>
            </p>
            <p className="mt-1 text-[13px] text-text-3">
              Rispondiamo nei giorni lavorativi, di solito in poche ore.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
