import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-ink focus:ring-2 focus:ring-ink/10",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
