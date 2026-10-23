import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--hb-accent)] text-white hover:brightness-110 shadow-sm shadow-sky-900/10",
  secondary:
    "bg-white/80 text-[var(--hb-ink)] border border-slate-200/80 hover:bg-white dark:bg-slate-900/60 dark:border-slate-700 dark:hover:bg-slate-900",
  ghost:
    "bg-transparent text-[var(--hb-ink-muted)] hover:bg-slate-100 dark:hover:bg-slate-800",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700",
  navy: "bg-[var(--hb-navy)] text-white hover:bg-[var(--hb-navy-2)]",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
