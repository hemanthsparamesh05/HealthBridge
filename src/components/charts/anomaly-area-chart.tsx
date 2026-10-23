"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnomalyAreaChart({
  data,
}: {
  data: { i: number; score: number }[];
}) {
  return (
    <div className="h-[280px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="anom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" />
          <XAxis dataKey="i" hide />
          <YAxis tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={{ borderRadius: 12 }} />
          <Area type="monotone" dataKey="score" stroke="#f97316" fill="url(#anom)" strokeWidth={2} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
