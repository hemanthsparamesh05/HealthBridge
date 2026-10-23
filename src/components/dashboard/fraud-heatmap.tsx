"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FraudHeatmap({
  cells,
}: {
  cells: { hospital: string; week: string; score: number }[];
}) {
  const hospitals = Array.from(new Set(cells.map((c) => c.hospital)));
  const weeks = Array.from(new Set(cells.map((c) => c.week))).sort();

  const get = (h: string, w: string) =>
    cells.find((c) => c.hospital === h && c.week === w)?.score ?? 0;

  const color = (s: number) => {
    if (s >= 0.55) return "bg-rose-500/90 text-white";
    if (s >= 0.4) return "bg-orange-400/90 text-slate-900";
    if (s >= 0.3) return "bg-amber-300/90 text-slate-900";
    return "bg-emerald-400/80 text-slate-900";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold text-[var(--hb-ink-muted)]">
              Hospital / Week
            </th>
            {weeks.map((w) => (
              <th key={w} className="p-2 text-center font-semibold text-[var(--hb-ink-muted)]">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hospitals.map((h, idx) => (
            <tr key={h} className="border-t border-slate-200/60 dark:border-slate-800">
              <td className="p-2 font-medium text-[var(--hb-ink)]">{h}</td>
              {weeks.map((w) => {
                const s = get(h, w);
                return (
                  <td key={w} className="p-1">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        "rounded-xl px-2 py-3 text-center font-semibold shadow-inner",
                        color(s),
                      )}
                      title={`Risk index ${(s * 100).toFixed(0)}%`}
                    >
                      {(s * 100).toFixed(0)}%
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
