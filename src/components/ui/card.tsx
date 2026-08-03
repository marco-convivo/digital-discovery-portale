import { cn } from "@/lib/utils";

/**
 * Superficie base. Raggio per densità: `crm` (12px, default) · `portale` (24px).
 * Variante `dark` = blocco denaro / assistenza (inchiostro, testo chiaro).
 * Ombre quasi assenti in v0.4: conta il bordo.
 */
export function Card({
  className,
  radius = "crm",
  dark = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  radius?: "crm" | "portale";
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "border p-[18px]",
        radius === "portale" ? "rounded-card" : "rounded-crm",
        dark
          ? "bg-ink text-on-ink border-[#2c2e31]"
          : "bg-card border-line shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex items-center justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[14px] font-bold tracking-[-0.01em] text-text",
        className,
      )}
      {...props}
    />
  );
}
