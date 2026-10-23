"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/stores/ui-store";

export function AiAssistantPanel() {
  const open = useUiStore((s) => s.assistantOpen);
  const setOpen = useUiStore((s) => s.setAssistantOpen);
  const [text, setText] = useState("");

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close assistant backdrop"
            className="fixed inset-0 z-[55] bg-slate-950/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="AI assistant"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-[56] w-full max-w-md border-l border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-200/70 px-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600/10 text-violet-700 dark:text-violet-300">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--hb-ink)]">
                    HealthBridge Copilot
                  </p>
                  <p className="text-xs text-[var(--hb-ink-muted)]">
                    Claim risk explanations · summaries · next steps
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100dvh-64px)] flex flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="font-medium text-[var(--hb-ink)]">
                    Suggested decision
                  </p>
                  <p className="mt-1 text-[var(--hb-ink-muted)]">
                    For medium-risk orthopedic claims with complete operative notes,
                    proceed to human review and request implant invoice line-items.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <p className="font-medium">Explain this claim&apos;s risk drivers</p>
                  <p className="mt-1 text-sm opacity-90">
                    Ask me about CLM-240891: elevated risk is driven by cost delta vs
                    regional benchmark and same-day imaging cadence.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200/70 p-3 dark:border-slate-800">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!text.trim()) return;
                    toast.message("Copilot (demo)", {
                      description:
                        "This UI is wired for production integration. Your prompt was captured locally only.",
                    });
                    setText("");
                  }}
                >
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ask about a claim, policy, or anomaly…"
                    aria-label="Ask the assistant"
                  />
                  <Button type="submit" className="shrink-0 px-3">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
