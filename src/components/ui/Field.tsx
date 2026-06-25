import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label block mb-2", className)} {...props} />;
}

const fieldBase =
  "w-full bg-surface border border-line rounded-[3px] px-3 py-2 text-sm text-ink " +
  "placeholder:text-muted/70 outline-none transition-colors " +
  "focus:border-terracotta focus:ring-2 focus:ring-terracotta/20";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />;
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
