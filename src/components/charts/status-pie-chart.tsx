"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function StatusPieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="h-[260px] w-full flex-shrink-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={86}
            paddingAngle={3}
            isAnimationActive
          >
            {data.map((e) => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
