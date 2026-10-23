"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ClaimTrendChart({
  data,
}: {
  data: { day: string; submitted: number; approved: number }[];
}) {
  return (
    <div className="h-[280px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="submitted" stroke="#38bdf8" strokeWidth={2} dot={false} name="Submitted" isAnimationActive />
          <Line type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} dot={false} name="Approved" isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
