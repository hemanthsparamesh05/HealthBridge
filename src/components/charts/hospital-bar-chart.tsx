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

export function HospitalBarChart({
  data,
}: {
  data: { name: string; claims: number }[];
}) {
  return (
    <div className="h-[260px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={54} />
          <YAxis tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={{ borderRadius: 12 }} />
          <Bar dataKey="claims" fill="#2563eb" radius={[10, 10, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
