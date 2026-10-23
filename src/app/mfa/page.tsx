"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

export default function MfaPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const mfaPending = useAuthStore((s) => s.mfaPending);
  const completeMfa = useAuthStore((s) => s.completeMfa);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
    else if (!mfaPending) router.replace("/login");
  }, [user, mfaPending, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[24px] border border-slate-200/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-[var(--hb-ink)]">Verify it&apos;s you</h1>
            <p className="text-xs text-[var(--hb-ink-muted)]">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>
        </div>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center font-mono text-lg tracking-[0.4em]"
          aria-label="One-time passcode"
        />
        <Button
          className="mt-4 w-full rounded-2xl py-3"
          type="button"
          disabled={busy}
          onClick={async () => {
            if (code.length < 6) {
              toast.error("Enter a 6-digit code (demo accepts any).");
              return;
            }
            setBusy(true);
            try {
              await completeMfa(code);
              toast.success("MFA verified");
              router.replace("/dashboard");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "MFA failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Verifying…" : "Verify & continue"}
        </Button>
        <button
          type="button"
          className="mt-3 w-full text-center text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
          onClick={() => router.push("/login")}
        >
          Back to login
        </button>
      </motion.div>
    </div>
  );
}
