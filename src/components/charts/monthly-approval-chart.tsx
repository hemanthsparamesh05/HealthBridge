"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MonthlyApprovalChart({
  data,
}: {
  data: { month: string; rate: number }[];
}) {
  const rows = data.map((d) => ({ ...d, pct: Math.round(d.rate * 100) }));
  return (
    <div className="h-[260px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={36} domain={[70, 90]} />
          <Tooltip contentStyle={{ borderRadius: 12 }} />
          <Bar dataKey="pct" fill="#10b981" radius={[10, 10, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
