"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
} from "recharts";

export function SparkMini({
  data,
  color = "#38bdf8",
}: {
  data: number[];
  color?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const gradId = `spark-${gid}`;
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-[104px] flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
