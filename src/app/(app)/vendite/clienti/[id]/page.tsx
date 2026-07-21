import Link from "next/link";
import { notFound } from "next/navigation";
import { getClienteScheda } from "@/lib/clienti/scheda";
import { ClienteScheda } from "@/components/internal/cliente-scheda";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClienteScheda(id);
  if (!data) notFound();

  return (
    <div>
      <Link
        href="/vendite/clienti"
        className="mb-3 inline-block text-[13px] font-semibold text-text-2 hover:text-text lg:hidden"
      >
        ← Clienti
      </Link>
      <ClienteScheda data={data} />
    </div>
  );
}
