import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("kicker block mb-2", className)} {...props} />;
}

const fieldBase =
  "w-full bg-paper border border-line rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-muted/70 outline-none transition-colors " +
  "focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 focus:bg-surface";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-20 resize-y", className)}
      {...props}
    />
  );
});
