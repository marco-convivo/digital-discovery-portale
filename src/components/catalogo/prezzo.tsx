import { euro } from "@/lib/format";
import type { CatalogService } from "@/lib/catalog";

// "a partire da €X" con suffisso derivato dalla struttura tecnica del servizio.
export function Prezzo({
  prezzo,
  service,
  size = "md",
}: {
  prezzo: number | null;
  service: CatalogService | null;
  size?: "sm" | "md";
}) {
  if (prezzo == null) return null;
  const suffisso = service?.ricorrente
    ? "/mese"
    : service?.unaTantum
      ? "una tantum"
      : null;
  return (
    <div className={size === "sm" ? "text-[13px]" : "text-[15px]"}>
      <span className="text-text-3">a partire da </span>
      <span className="font-extrabold text-text">{euro(prezzo)}</span>
      {suffisso && <span className="text-text-3"> {suffisso}</span>}
    </div>
  );
}
