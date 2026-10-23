"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Scan,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClaim, fetchMessages, rescoreClaim, updateClaimStatus } from "@/lib/api";
import { AUDIT_EVENTS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskGauge } from "@/components/charts/risk-gauge";
import type { ClaimStatus } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tabs = ["Overview", "AI analysis", "Communications"] as const;
type Tab = (typeof tabs)[number];

export function ClaimDetailClient({ claimId }: { claimId: string }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["claim", claimId], queryFn: () => fetchClaim(claimId) });
  const mq = useQuery({ queryKey: ["messages"], queryFn: fetchMessages });

  async function setStatus(next: ClaimStatus) {
    try {
      await updateClaimStatus(claimId, next);
      await queryClient.invalidateQueries({ queryKey: ["claim", claimId] });
      await queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success(`Claim ${next.replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function runRescore() {
    try {
      await rescoreClaim(claimId);
      await queryClient.invalidateQueries({ queryKey: ["claim", claimId] });
      toast.success("ML rescore complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rescore failed");
    }
  }

  const costCompare = useMemo(() => {
    const lakh = (q.data?.amount ?? 0) / 100000;
    return [
      { name: "Submitted", k: Math.round(lakh * 100) / 100 },
      { name: "Regional avg", k: Math.round(lakh * 0.91 * 100) / 100 },
      { name: "Similar claims", k: Math.round(lakh * 0.88 * 100) / 100 },
    ];
  }, [q.data?.amount]);

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  if (!q.data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--hb-ink-muted)]">Claim not found.</p>
        <Link
          href="/claims"
          className="mt-4 inline-flex rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          Back to claims
        </Link>
      </Card>
    );
  }

  const c = q.data;
  const findings = [
    {
      ok: c.riskLevel !== "high",
      text: "Procedure cost within modeled tolerance",
    },
    { ok: c.riskScore < 70, text: "No duplicate CPT pair detected in this episode" },
    {
      ok: true,
      text: "Policy eligibility confirmed for dates of service",
    },
    {
      ok: c.amount < 800000,
      text:
        c.amount >= 800000
          ? "Cost materially exceeds regional average for similar procedure (India TPA benchmark)"
          : "Cost delta vs regional benchmark within acceptable band",
    },
    {
      ok: true,
      text: "Attending physician credentials verified",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            Claim workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
            {c.id}
          </h1>
          <p className="text-sm text-[var(--hb-ink-muted)]">
            {c.patientName} · {c.hospital}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" type="button" onClick={() => void setStatus("approved")}>
            Approve
          </Button>
          <Button variant="danger" className="rounded-xl" type="button" onClick={() => void setStatus("rejected")}>
            Reject
          </Button>
          <Button variant="secondary" className="rounded-xl" type="button" onClick={() => void setStatus("flagged")}>
            Flag
          </Button>
          <Button variant="secondary" className="rounded-xl" type="button" onClick={() => void runRescore()}>
            Rescore (ML)
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-slate-800 dark:bg-slate-950/50">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "text-[var(--hb-ink)]"
                : "text-[var(--hb-ink-muted)] hover:text-[var(--hb-ink)]"
            }`}
          >
            {tab === t ? (
              <motion.span
                layoutId="claimTab"
                className="absolute inset-0 rounded-xl bg-slate-100 shadow-sm dark:bg-slate-900"
              />
            ) : null}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Patient & policy</CardTitle>
              <CardDescription>Structured intake for clinical and financial reviewers</CardDescription>
            </CardHeader>
            <dl className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
              <Field label="Patient" value={c.patientName} />
              <Field label="Patient ID" value={c.patientId} mono />
              <Field label="Policy" value={c.policyId} mono />
              <Field label="Coverage" value={c.coverageType} />
              <Field label="Validity" value={`Through ${formatDate(c.validityEnd)}`} />
              <Field label="Hospital" value={c.hospital} />
              <Field label="Admission" value={formatDate(c.admissionDate)} />
              <Field label="Discharge" value={formatDate(c.dischargeDate)} />
              <Field label="Diagnosis" value={c.diagnosis} wide />
              <Field label="Doctor" value={c.doctor} wide />
              <Field label="Medical notes" value={c.notes} wide />
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treatment</CardTitle>
              <CardDescription>Episode summary</CardDescription>
            </CardHeader>
            <div className="space-y-3 px-5 pb-5 text-sm">
              <div className="flex items-start gap-2">
                <Stethoscope className="mt-0.5 h-4 w-4 text-sky-600" />
                <div>
                  <p className="font-semibold text-[var(--hb-ink)]">{c.treatmentType}</p>
                  <p className="text-xs text-[var(--hb-ink-muted)]">Primary procedure</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--hb-ink-muted)]">
                  Procedures
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[var(--hb-ink)]">
                  {c.procedures.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-[var(--hb-ink-muted)] dark:bg-slate-900/50">
                Claim amount{" "}
                <span className="font-semibold text-[var(--hb-ink)]">
                  {formatCurrency(c.amount)}
                </span>{" "}
                · submitted {formatDate(c.submittedAt)}
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Uploaded documents</CardTitle>
              <CardDescription>Preview, download, and verify authenticity</CardDescription>
            </CardHeader>
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-5">
              <DocCard
                title="Facility bill"
                icon={<FileText className="h-5 w-5" />}
              />
              <DocCard title="Prescriptions" icon={<FileText className="h-5 w-5" />} />
              <DocCard title="Lab reports" icon={<Activity className="h-5 w-5" />} />
              <DocCard title="Discharge summary" icon={<ShieldCheck className="h-5 w-5" />} />
              <DocCard title="Imaging" icon={<Scan className="h-5 w-5" />} />
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "AI analysis" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>AI risk score</CardTitle>
              <CardDescription>Calibrated ensemble model</CardDescription>
            </CardHeader>
            <div className="px-4 pb-6">
              <RiskGauge value={c.riskScore} level={c.riskLevel} />
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Findings checklist</CardTitle>
              <CardDescription>Explainable signals powering the score</CardDescription>
            </CardHeader>
            <ul className="space-y-2 px-5 pb-5">
              {findings.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                      f.ok
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-100"
                    }`}
                  >
                    {f.ok ? "✓" : "!"}
                  </span>
                  <span className="text-[var(--hb-ink)]">{f.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cost comparison</CardTitle>
              <CardDescription>Submitted vs benchmarks (₹ Lakh)</CardDescription>
            </CardHeader>
            <div className="h-[260px] w-full px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costCompare} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Legend />
                  <Bar dataKey="k" name="Amount (₹ Lakh)" fill="#2563eb" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mx-5 mb-5 rounded-2xl border border-amber-200/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-50">
              <p className="font-semibold">Recommendation</p>
              <p className="mt-1 text-[var(--hb-ink-muted)] dark:text-amber-100/90">
                {c.riskLevel === "high"
                  ? "Hold for specialist review and request itemized implant invoices."
                  : "Proceed with standard review — attach AI report to audit trail."}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk badges</CardTitle>
              <CardDescription>Operational tags</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              <Badge tone="warning" className="capitalize">
                {c.riskLevel} risk
              </Badge>
              <Badge tone="info">{c.status.replace("_", " ")}</Badge>
              <Badge tone="default">HIPAA-controlled view</Badge>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "Communications" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-600" />
                <div>
                  <CardTitle>Secure channel</CardTitle>
                  <CardDescription>Insurer ↔ hospital ↔ auditor</CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="space-y-3 px-5 pb-5">
              {(mq.data ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "insurer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.from === "insurer"
                        ? "bg-sky-600 text-white"
                        : m.ai
                          ? "bg-violet-50 text-violet-950 dark:bg-violet-950/40 dark:text-violet-50"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="text-[11px] font-semibold opacity-80">{m.name}</p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-2 text-[10px] opacity-70">
                      {new Date(m.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="rounded-xl" type="button" onClick={() => toast.message("Attachment (demo)")}>
                  Attach file
                </Button>
                <Button className="rounded-xl" type="button" onClick={() => toast.success("Suggested reply inserted (demo)")}>
                  Insert AI reply
                </Button>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <div>
                  <CardTitle>Activity log</CardTitle>
                  <CardDescription>Immutable audit trail</CardDescription>
                </div>
              </div>
            </CardHeader>
            <ol className="space-y-4 border-l border-slate-200/80 pl-4 pr-4 pb-5 dark:border-slate-800">
              {AUDIT_EVENTS.map((e) => (
                <li key={e.id} className="relative pl-4 text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-950" />
                  <p className="font-medium text-[var(--hb-ink)]">{e.action}</p>
                  <p className="text-xs text-[var(--hb-ink-muted)]">
                    {e.actor} · {new Date(e.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--hb-ink-muted)]">
        {label}
      </dt>
      <dd className={`mt-1 text-sm text-[var(--hb-ink)] ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function DocCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
      <div className="wm-doc pointer-events-none absolute inset-0" />
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--hb-ink)]">{title}</p>
          <p className="text-xs text-[var(--hb-ink-muted)]">PDF · e-signed</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="h-9 flex-1 rounded-xl text-xs" type="button" onClick={() => toast.message("Preview (demo)")}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button variant="secondary" className="h-9 flex-1 rounded-xl text-xs" type="button" onClick={() => toast.success("Marked verified (demo)")}>
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Verify
        </Button>
        <Button variant="secondary" className="h-9 flex-1 rounded-xl text-xs" type="button" onClick={() => toast.message("Download started (demo)")}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Get
        </Button>
      </div>
    </div>
  );
}
