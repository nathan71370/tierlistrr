import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracotta text-white hover:bg-terracotta-dark shadow-[0_1px_2px_rgba(26,22,20,0.08)]",
  ink: "bg-ink text-paper hover:bg-black",
  secondary: "bg-surface text-ink border border-line hover:border-ink/30 shadow-[0_1px_2px_rgba(26,22,20,0.04)]",
  ghost: "text-ink-soft hover:bg-cream-deep",
  danger: "text-terracotta hover:bg-terracotta hover:text-white border border-terracotta/30",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
    "transition-colors duration-150 cursor-pointer select-none whitespace-nowrap",
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
