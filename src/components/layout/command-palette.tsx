"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { SEARCH_INDEX } from "@/lib/mock-data";
import { useUiStore } from "@/stores/ui-store";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const [q, setQ] = useState("");

  const close = () => {
    setQ("");
    setOpen(false);
  };

  const results = SEARCH_INDEX.filter(
    (r) =>
      r.title.toLowerCase().includes(q.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(q.toLowerCase()),
  ).slice(0, 8);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/50 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onMouseDown={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-200/70 px-3 py-2 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search claims, patients, hospitals, policies…"
                className="border-0 bg-transparent shadow-none focus:ring-0"
              />
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Close"
                onClick={close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {results.length ? (
                results.map((r) => (
                  <button
                    key={`${r.type}-${r.title}`}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    onClick={() => {
                      router.push(r.href);
                      close();
                    }}
                  >
                    <span className="mt-0.5 rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {r.type}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--hb-ink)]">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-[var(--hb-ink-muted)]">
                        {r.subtitle}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-8 text-center text-sm text-[var(--hb-ink-muted)]">
                  No matches. Try “CLM”, “Pacific”, or a policy number.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
