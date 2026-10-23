"use client";

import { motion } from "framer-motion";
import { HeartPulse, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

const roles: { id: UserRole; label: string }[] = [
  { id: "insurance_admin", label: "Insurance Admin" },
  { id: "claim_reviewer", label: "Claim Reviewer" },
  { id: "hospital_staff", label: "Hospital Staff" },
  { id: "compliance_officer", label: "Compliance Officer" },
  { id: "auditor", label: "Auditor" },
];

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("admin@healthbridge.in");
  const [password, setPassword] = useState("admin123");
  const [role, setRole] = useState<UserRole>("insurance_admin");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.25),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-0">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-xl space-y-6 text-[var(--hb-ink)] lg:pr-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm ring-1 ring-sky-200/60 dark:bg-slate-950/60 dark:text-sky-200 dark:ring-sky-900/50">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            HIPAA-conscious design system
          </div>
          <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
            HealthBridge
            <span className="block text-lg font-normal text-[var(--hb-ink-muted)] lg:text-xl">
              Claims intelligence for modern insurers.
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-[var(--hb-ink-muted)]">
            A premium workspace for claim review, AI risk scoring, fraud analytics, and
            secure hospital collaboration — inspired by Stripe, Linear, and Fluent.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["AI anomaly models", "Real-time audit trails", "Role-based access", "Encrypted documents"].map(
              (t) => (
                <div
                  key={t}
                  className="rounded-2xl border border-white/60 bg-white/50 p-3 text-sm font-medium shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40"
                >
                  {t}
                </div>
              ),
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-sky-400/40 via-indigo-400/30 to-emerald-300/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-[0_30px_80px_rgba(15,39,68,0.18)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--hb-navy)] text-white shadow-lg shadow-sky-900/20">
                <HeartPulse className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--hb-ink)]">Secure sign in</p>
                <p className="text-xs text-[var(--hb-ink-muted)]">
                  MFA enforced for privileged roles
                </p>
              </div>
            </div>

            <label className="text-xs font-semibold text-[var(--hb-ink-muted)]">
              Work email
              <Input
                className="mt-1"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="mt-4 block text-xs font-semibold text-[var(--hb-ink-muted)]">
              Password
              <Input
                className="mt-1"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 text-[var(--hb-ink-muted)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Remember this device
              </label>
              <Link href="/forgot-password" className="font-semibold text-sky-700 hover:underline dark:text-sky-300">
                Forgot password
              </Link>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-ink-muted)]">
                Role
              </p>
              <div className="mt-2 grid gap-2">
                {roles.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                      role === r.id
                        ? "border-sky-400/70 bg-sky-50/80 dark:border-sky-700 dark:bg-sky-950/40"
                        : "border-slate-200/70 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="h-4 w-4"
                      checked={role === r.id}
                      onChange={() => setRole(r.id)}
                    />
                    <span className="font-medium text-[var(--hb-ink)]">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              className="mt-6 w-full rounded-2xl py-3 text-sm font-semibold"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await login(email, password, role);
                  void remember;
                  router.push("/mfa");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Login failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Lock className="h-4 w-4" aria-hidden />
              {busy ? "Signing in…" : "Continue to MFA"}
            </Button>

            <p className="mt-4 text-center text-[11px] text-[var(--hb-ink-muted)]">
              By continuing you agree to monitoring for security and compliance.
            </p>
          </div>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-10 hidden opacity-70 lg:block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="220" height="220" viewBox="0 0 220 220" className="text-sky-500/35">
              <defs>
                <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r="90" fill="url(#glow)" />
              <path
                d="M70 140c20-40 60-60 90-50-10 35-40 60-90 50z"
                fill="currentColor"
                opacity="0.35"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
