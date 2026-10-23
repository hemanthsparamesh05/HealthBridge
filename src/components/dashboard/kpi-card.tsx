"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { KpiMetric } from "@/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { SparkMini } from "@/components/charts/spark-mini";

const accent: Record<
  KpiMetric["accent"],
  { spark: string; chip: string }
> = {
  blue: { spark: "#38bdf8", chip: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-200" },
  emerald: { spark: "#22c55e", chip: "text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-100" },
  amber: { spark: "#f59e0b", chip: "text-amber-900 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-100" },
  rose: { spark: "#fb7185", chip: "text-rose-800 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-100" },
  violet: { spark: "#a78bfa", chip: "text-violet-900 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-100" },
  cyan: { spark: "#22d3ee", chip: "text-cyan-900 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-100" },
};

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const a = accent[metric.accent];
  const up = metric.trend >= 0;

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <Card className="relative overflow-hidden p-4 lg:p-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:from-sky-400/5 dark:to-indigo-400/5" />
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--hb-ink-muted)]">
              {metric.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
              {metric.value}
            </p>
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                a.chip,
              )}
            >
              {up ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {Math.abs(metric.trend)}% {metric.trendLabel}
            </div>
          </div>
          <SparkMini data={metric.spark} color={a.spark} />
        </div>
      </Card>
    </motion.div>
  );
}
