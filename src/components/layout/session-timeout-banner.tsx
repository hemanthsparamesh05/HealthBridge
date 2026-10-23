"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

export function SessionTimeoutBanner() {
  const warn = useUiStore((s) => s.sessionWarn);
  const setWarn = useUiStore((s) => s.setSessionWarn);
  if (!warn) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="border-b border-amber-200/70 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-50"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Session timeout warning</p>
            <p className="text-xs opacity-90">
              For your security, you will be signed out in{" "}
              <span className="font-semibold">02:00</span> unless you continue your
              session.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => setWarn(false)}
          >
            Sign out now
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => setWarn(false)}>
            Extend session
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
