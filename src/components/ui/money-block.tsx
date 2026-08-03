import { cn } from "@/lib/utils";

/**
 * Blocco denaro: superficie scura riutilizzata in 7b (preventivo), 3a e 3b
 * (portale). Composabile: MoneyBlock (contenitore) + MoneyAmount (cifra display,
 * mai tabular-nums) + MoneyRow (riga label/valore, tone `mint` per il positivo).
 */
export function MoneyBlock({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-crm border border-[#2c2e31] bg-ink p-[18px] text-on-ink",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MoneyAmount({
  label,
  amount,
  unit,
  note,
}: {
  label?: React.ReactNode;
  amount: React.ReactNode;
  unit?: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <div className="text-[13px] font-semibold text-on-ink/60">{label}</div>
      )}
      <div className="mt-1 flex items-end gap-1.5">
        <span className="text-[26px] font-extrabold leading-none tracking-[-0.02em]">
          {amount}
        </span>
        {unit && (
          <span className="mb-0.5 text-[14px] font-semibold text-on-ink/70">
            {unit}
          </span>
        )}
      </div>
      {note && <div className="mt-1 text-[12px] text-on-ink/55">{note}</div>}
    </div>
  );
}

export function MoneyRow({
  label,
  value,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "mint";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-on-ink/60">{label}</span>
      <span className={cn("font-semibold", tone === "mint" ? "text-mint" : "text-on-ink")}>
        {value}
      </span>
    </div>
  );
}
