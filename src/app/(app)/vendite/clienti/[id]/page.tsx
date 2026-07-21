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
    <div className="mx-auto max-w-6xl">
      <Link
        href="/vendite/clienti"
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Clienti
      </Link>
      <div className="mt-3">
        <ClienteScheda data={data} layout="page" />
      </div>
    </div>
  );
}
