"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export function ClaimClusterChart({
  data,
}: {
  data: { x: number; y: number; z: number; name: string }[];
}) {
  return (
    <div className="h-[280px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ScatterChart margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200/80 dark:stroke-slate-800" />
          <XAxis type="number" dataKey="x" name="Risk" unit="%" tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey="y" name="₹ Lakh" tick={{ fontSize: 11 }} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Claims" data={data} fill="#6366f1" isAnimationActive />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
