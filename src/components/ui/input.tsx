import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-text",
          "placeholder:text-text-3 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text-2">{label}</span>
        {input}
      </label>
    );
  },
);
Input.displayName = "Input";
