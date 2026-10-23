"use client";

import { Lock, ShieldCheck } from "lucide-react";

export function SecurityTrustStrip() {
  return (
    <div className="border-b border-slate-200/60 bg-white/50 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 lg:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          HIPAA-ready architecture
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <Lock className="h-3.5 w-3.5 text-sky-600" aria-hidden />
          AES-256 encryption in transit & at rest
        </span>
        <span className="text-[var(--hb-ink-muted)]">
          Activity monitoring enabled · role-based document access
        </span>
      </div>
    </div>
  );
}
