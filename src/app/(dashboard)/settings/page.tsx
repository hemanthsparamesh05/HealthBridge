"use client";

import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, useUiStore } from "@/stores/ui-store";
import type { UserRole } from "@/types";

const roles: { id: UserRole; label: string; desc: string }[] = [
  {
    id: "insurance_admin",
    label: "Insurance Admin",
    desc: "Full navigation, fraud tools, and reporting.",
  },
  {
    id: "claim_reviewer",
    label: "Claim Reviewer",
    desc: "Operational dashboards with triage-first widgets.",
  },
  {
    id: "hospital_staff",
    label: "Hospital Staff",
    desc: "Limited analytics, communications, and claims views.",
  },
  {
    id: "compliance_officer",
    label: "Compliance Officer",
    desc: "Audit-heavy navigation with fraud and policy oversight.",
  },
  {
    id: "auditor",
    label: "Auditor",
    desc: "Read-focused experience with fraud and audit emphasis.",
  },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const dark = useThemeStore((s) => s.dark);
  const toggleDark = useThemeStore((s) => s.toggleDark);
  const setSessionWarn = useUiStore((s) => s.setSessionWarn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Settings & roles
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Your role is set by your account. Sign in as another demo user to see a different workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signed in as</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <div className="space-y-3 px-5 pb-5">
          {roles.map((r) => (
            <div
              key={r.id}
              aria-current={user?.role === r.id ? "true" : undefined}
              className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left ${
                user?.role === r.id
                  ? "border-sky-400/70 bg-sky-50 dark:border-sky-500/60 dark:bg-sky-500/10"
                  : "border-slate-200/70 opacity-70 dark:border-slate-800"
              }`}
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--hb-ink)]">{r.label}</span>
                <span className="text-xs text-[var(--hb-ink-muted)]">{r.desc}</span>
              </span>
              {user?.role === r.id && (
                <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-sky-500">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Professional dark theme tuned for long reviews</CardDescription>
          </CardHeader>
          <div className="flex items-center justify-between px-5 pb-5">
            <div className="flex items-center gap-2 text-sm text-[var(--hb-ink)]">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Dark mode
            </div>
            <Button type="button" variant="secondary" className="rounded-xl" onClick={toggleDark}>
              Toggle
            </Button>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Session controls</CardTitle>
            <CardDescription>Security UX patterns</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <Button
              type="button"
              className="rounded-xl"
              variant="secondary"
              onClick={() => {
                setSessionWarn(true);
                toast.message("Session banner shown");
              }}
            >
              Preview session timeout banner
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
