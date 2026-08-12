import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Card unica (v0.5, 1e). Raggio per densità: `crm` (14px, default) ·
 * `portale` (20px). Variante `dark` = blocco denaro / assistenza.
 * Regola: header 22px con titolo 13/700 a sinistra e UNA sola azione a destra
 * (12/600, via CardHeader+CardTitle+CardAction), corpo 14px sotto. Ombre quasi
 * assenti: conta il bordo.
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
      className={cn(
        "mb-3 flex min-h-[22px] items-center justify-between gap-3",
        className,
      )}
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
      className={cn("text-[13px] font-bold text-text", className)}
      {...props}
    />
  );
}

/**
 * L'unica azione dell'header (destra), 12/600. Passa `href` per un Link, oppure
 * `onClick` per un bottone. Mai due CardAction nello stesso header.
 */
export function CardAction({
  href,
  className,
  children,
  ...props
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(
    "flex-none text-[12px] font-semibold text-link transition-colors hover:text-on-violet",
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
