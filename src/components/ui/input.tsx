import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Label secondaria a destra (es. "è anche il WhatsApp per il portale"). */
  labelRight?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, labelRight, id, error, required, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-field border bg-card px-3.5 py-2.5 text-sm text-text",
          "placeholder:text-faint transition-colors",
          "focus:border-ink focus:outline-none",
          "disabled:opacity-50 disabled:pointer-events-none",
          error ? "border-fail-tx" : "border-line-field",
          className,
        )}
        {...props}
      />
    );

    const err = error ? (
      <span className="text-[12px] font-medium text-fail-tx">{error}</span>
    ) : null;

    if (!label)
      return err ? (
        <div className="flex flex-col gap-1">
          {input}
          {err}
        </div>
      ) : (
        input
      );

    return (
      <label htmlFor={id} className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] font-semibold text-text-2">
            {label}
            {required && <span className="text-fail-tx"> *</span>}
          </span>
          {labelRight && (
            <span className="text-[11.5px] font-medium text-text-3">
              {labelRight}
            </span>
          )}
        </span>
        {input}
        {err}
      </label>
    );
  },
);
Input.displayName = "Input";
