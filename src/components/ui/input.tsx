import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, error, required, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-md border bg-card px-3.5 py-2.5 text-sm text-text",
          "placeholder:text-text-3 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet",
          "disabled:opacity-50 disabled:pointer-events-none",
          error ? "border-fail-tx" : "border-line",
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
        <span className="text-[13px] font-semibold text-text-2">
          {label}
          {required && <span className="text-fail-tx"> *</span>}
        </span>
        {input}
        {err}
      </label>
    );
  },
);
Input.displayName = "Input";
