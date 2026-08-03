import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "dashed" | "outline";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Primario azione: inchiostro pieno (hover verso il nero).
  primary: "bg-ink text-on-ink hover:bg-black",
  // Secondario: bianco + bordo (hover bordo più forte).
  secondary:
    "bg-card text-text border border-line hover:bg-card-2 hover:border-line-strong",
  // Alias storico di secondary (compat coi chiamanti esistenti).
  outline:
    "bg-card text-text border border-line hover:bg-card-2 hover:border-line-strong",
  // Testo: nessun riempimento.
  ghost: "text-text hover:bg-card-2",
  // Slot "aggiungi": contorno tratteggiato.
  dashed:
    "border border-dashed border-line-dashed bg-transparent text-text-2 hover:border-line-strong hover:text-text",
};

const SIZES: Record<Size, string> = {
  sm: "rounded-badge px-[13px] py-[7px] text-[12.5px] gap-1.5",
  md: "rounded-btn px-[18px] py-[11px] text-[13.5px] gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-bold leading-none",
        "cursor-pointer transition-colors select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        "disabled:opacity-50 disabled:pointer-events-none",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
