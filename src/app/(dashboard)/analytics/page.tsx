"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardCharts } from "@/lib/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaimTrendChart } from "@/components/charts/claim-trend-chart";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { HospitalBarChart } from "@/components/charts/hospital-bar-chart";
import { MonthlyApprovalChart } from "@/components/charts/monthly-approval-chart";

export default function AnalyticsPage() {
  const q = useQuery({ queryKey: ["dash-charts"], queryFn: fetchDashboardCharts });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Analytics
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Drill into operational performance with interactive, animated charts.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Approval trends</CardTitle>
            <CardDescription>Submitted vs approved</CardDescription>
          </CardHeader>
          {q.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[280px]" />
          ) : (
            <ClaimTrendChart data={q.data?.trend ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <CardDescription>Portfolio segmentation</CardDescription>
          </CardHeader>
          {q.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <StatusPieChart data={q.data?.status ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hospital performance</CardTitle>
            <CardDescription>Volume lens</CardDescription>
          </CardHeader>
          {q.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[260px]" />
          ) : (
            <HospitalBarChart data={q.data?.hospitals ?? []} />
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly approvals</CardTitle>
            <CardDescription>Quality throughput</CardDescription>
          </CardHeader>
          {q.isLoading ? (
            <Skeleton className="mx-4 mb-4 h-[240px]" />
          ) : (
            <MonthlyApprovalChart data={q.data?.monthly ?? []} />
          )}
        </Card>
      </div>
    </div>
  );
}
