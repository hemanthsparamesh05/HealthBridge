import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-[var(--hb-ink)] shadow-inner shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/60 dark:focus:border-sky-600 dark:focus:ring-sky-900/40",
        className,
      )}
      {...props}
    />
  );
}
