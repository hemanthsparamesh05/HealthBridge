import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800",
        className,
      )}
    />
  );
}
