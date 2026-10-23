"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, Flame, Radar } from "lucide-react";
import { toast } from "sonner";
import { fetchDashboardCharts, fetchFraudInsights } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FraudHeatmap } from "@/components/dashboard/fraud-heatmap";
import { AnomalyAreaChart } from "@/components/charts/anomaly-area-chart";
import { ClaimClusterChart } from "@/components/charts/claim-cluster-chart";

export default function FraudPage() {
  const q = useQuery({ queryKey: ["fraud"], queryFn: fetchFraudInsights });
  const c = useQuery({ queryKey: ["dash-charts"], queryFn: fetchDashboardCharts });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
            Fraud intelligence
          </h1>
          <p className="max-w-2xl text-sm text-[var(--hb-ink-muted)]">
            Probabilistic scoring, suspicious provider networks, duplicate episodes, and
            clustering for SIU prioritization.
          </p>
        </div>
        <Button
          className="rounded-2xl"
          type="button"
          onClick={() =>
            toast.message("Fraud notification", {
              description: "Synthetic spike detected in cardiology claims at Northlake.",
            })
          }
        >
          Simulate live alert
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-rose-200/70 bg-gradient-to-br from-rose-50 to-white dark:border-rose-900/40 dark:from-rose-950/30 dark:to-slate-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-900 dark:text-rose-50">
                <Flame className="h-5 w-5" />
                Fraud probability
              </CardTitle>
              <CardDescription>Ensemble of graph + rules + billing NLP</CardDescription>
            </CardHeader>
            <p className="px-5 pb-5 text-4xl font-semibold tracking-tight text-rose-700 dark:text-rose-200">
              {q.isLoading ? "—" : `${Math.round((q.data?.probability ?? 0) * 100)}%`}
            </p>
          </Card>
        </motion.div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Suspicious hospitals</CardTitle>
            <CardDescription>Ranked by composite anomaly index</CardDescription>
          </CardHeader>
          <div className="divide-y divide-slate-100 px-5 pb-4 dark:divide-slate-800">
            {q.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-3 h-10" />)
              : (q.data?.ranking ?? []).map((r) => (
                  <div key={r.name} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold text-[var(--hb-ink)]">{r.name}</p>
                      <p className="text-xs text-[var(--hb-ink-muted)]">{r.claims} claims / 90d</p>
                    </div>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-100">
                      {(r.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>High-risk clinicians</CardTitle>
            <CardDescription>Behavioral outliers vs peer cohorts</CardDescription>
          </CardHeader>
          <div className="space-y-3 px-5 pb-5">
            {(q.data?.doctors ?? []).map((d) => (
              <div
                key={d.name}
                className="flex items-start justify-between rounded-2xl border border-slate-200/70 p-3 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--hb-ink)]">{d.name}</p>
                  <p className="text-xs text-[var(--hb-ink-muted)]">{d.specialty}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <AlertTriangle className="h-3 w-3" />
                  {d.flags} flags
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Duplicate claim signals</CardTitle>
            <CardDescription>Deterministic + fuzzy matchers</CardDescription>
          </CardHeader>
          <ul className="space-y-3 px-5 pb-5 text-sm">
            {(q.data?.duplicates ?? []).map((d) => (
              <li
                key={d.pair}
                className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-3 text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-50"
              >
                <p className="font-mono text-xs font-semibold">{d.pair}</p>
                <p className="mt-1 text-xs opacity-90">{d.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-sky-600" />
              <div>
                <CardTitle>Pattern recognition</CardTitle>
                <CardDescription>Anomaly stream (global)</CardDescription>
              </div>
            </div>
          </CardHeader>
          {c.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[240px]" />
          ) : (
            <AnomalyAreaChart data={c.data?.anomaly ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claim clustering</CardTitle>
            <CardDescription>Unsupervised projection for SIU triage</CardDescription>
          </CardHeader>
          {c.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <ClaimClusterChart data={c.data?.clusters ?? []} />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regional heat surface</CardTitle>
          <CardDescription>Hospital × week risk index</CardDescription>
        </CardHeader>
        <div className="px-2 pb-4">
          {c.isLoading ? (
            <Skeleton className="h-[200px]" />
          ) : (
            <FraudHeatmap cells={c.data?.fraudHeat ?? []} />
          )}
        </div>
      </Card>
    </div>
  );
}
