import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracotta text-white hover:bg-terracotta-dark",
  ink: "bg-ink text-paper hover:bg-black",
  outline: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink-soft hover:bg-beige-soft",
  danger: "border border-terracotta/40 text-terracotta hover:bg-terracotta hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-10 px-4 text-xs",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[3px] font-bold uppercase tracking-[0.1em]",
    "transition-colors duration-150 cursor-pointer select-none",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta",
    SIZES[size],
    VARIANTS[variant],
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant, size, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonClasses(variant, size), className)}
        {...props}
      />
    );
  },
);
