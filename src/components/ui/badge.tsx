import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const tones: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  success: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  danger: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-100",
  info: "bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  navy: "bg-[var(--hb-navy)] text-white",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
