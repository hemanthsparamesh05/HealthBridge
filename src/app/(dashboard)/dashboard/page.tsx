"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, ShieldAlert } from "lucide-react";
import { fetchClaims, fetchDashboardCharts, fetchKpis } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";
import { FraudHeatmap } from "@/components/dashboard/fraud-heatmap";
import { ClaimTrendChart } from "@/components/charts/claim-trend-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { HospitalBarChart } from "@/components/charts/hospital-bar-chart";
import { AnomalyAreaChart } from "@/components/charts/anomaly-area-chart";
import { ClaimClusterChart } from "@/components/charts/claim-cluster-chart";
import { MonthlyApprovalChart } from "@/components/charts/monthly-approval-chart";

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role) ?? "insurance_admin";

  const qKpi = useQuery({ queryKey: ["kpis", role], queryFn: () => fetchKpis(role) });
  const qCharts = useQuery({ queryKey: ["dash-charts"], queryFn: fetchDashboardCharts });
  const qClaims = useQuery({ queryKey: ["claims"], queryFn: () => fetchClaims() });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
            Operational pulse
          </h1>
          <p className="max-w-2xl text-sm text-[var(--hb-ink-muted)]">
            Monitor claim volume, AI risk, fraud signals, and hospital activity in one
            executive-grade workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--hb-ink-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 font-medium shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-950/60 dark:ring-slate-800">
            <Brain className="h-3.5 w-3.5 text-violet-600" aria-hidden />
            Models online
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 font-medium shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-950/60 dark:ring-slate-800">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            Zero-trust session
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {qKpi.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))
          : (qKpi.data ?? []).map((m) => <KpiCard key={m.id} metric={m} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Claim trend</CardTitle>
              <CardDescription>Submitted vs approved (rolling 14 days)</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[280px]" />
          ) : (
            <ClaimTrendChart data={qCharts.data?.trend ?? []} />
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status distribution</CardTitle>
              <CardDescription>Portfolio mix</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <StatusPieChart data={qCharts.data?.status ?? []} />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Hospital volume</CardTitle>
              <CardDescription>Claims by facility</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <HospitalBarChart data={qCharts.data?.hospitals ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Fraud heatmap</CardTitle>
              <CardDescription>Relative risk index by hospital and week</CardDescription>
            </div>
          </CardHeader>
          <div className="px-2 pb-4">
            {qCharts.isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <FraudHeatmap cells={qCharts.data?.fraudHeat ?? []} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>AI anomaly stream</CardTitle>
              <CardDescription>Model scoring volatility</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[240px]" />
          ) : (
            <AnomalyAreaChart data={qCharts.data?.anomaly ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly approvals</CardTitle>
              <CardDescription>First-pass approval rate</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[240px]" />
          ) : (
            <MonthlyApprovalChart data={qCharts.data?.monthly ?? []} />
          )}
        </Card>
      </div>

      <motion.div layout>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Claim clustering</CardTitle>
              <CardDescription>Risk score vs billed amount (₹ Lakh)</CardDescription>
            </div>
          </CardHeader>
          {qCharts.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <ClaimClusterChart data={qCharts.data?.clusters ?? []} />
          )}
        </Card>
      </motion.div>

      {qClaims.isLoading ? (
        <Skeleton className="h-[420px]" />
      ) : (
        <RecentClaimsTable claims={qClaims.data ?? []} />
      )}
    </div>
  );
}
