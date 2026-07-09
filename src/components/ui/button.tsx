import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Primario azione: charcoal pieno.
  primary: "bg-ink text-on-ink hover:bg-ink/90",
  // Secondario tenue su superficie salvia.
  ghost: "bg-card-2 text-text hover:bg-line/60",
  // Contorno su card bianca.
  outline: "bg-card text-text border border-line hover:bg-card-2",
};

const SIZES: Record<Size, string> = {
  sm: "px-[13px] py-[7px] text-[12.5px] gap-1.5",
  md: "px-[18px] py-[11px] text-[13.5px] gap-2",
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
        "inline-flex items-center justify-center rounded-pill font-bold leading-none",
        "cursor-pointer transition-colors select-none",
        "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-violet",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
