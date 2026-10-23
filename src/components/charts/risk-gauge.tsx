"use client";

import { motion } from "framer-motion";

const stroke: Record<"low" | "medium" | "high", string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export function RiskGauge({
  value,
  level,
}: {
  value: number;
  level: "low" | "medium" | "high";
}) {
  const pct = Math.min(100, Math.max(0, value));
  const arc = (pct / 100) * 150.8;
  return (
    <div className="relative mx-auto grid w-full max-w-[220px] place-items-center">
      <svg viewBox="0 0 120 72" className="w-full">
        <path
          d="M 12 72 A 54 54 0 0 1 108 72"
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          d="M 12 72 A 54 54 0 0 1 108 72"
          fill="none"
          stroke={stroke[level]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arc} 150.8`}
          initial={{ strokeDasharray: `0 150.8` }}
          animate={{ strokeDasharray: `${arc} 150.8` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <motion.p
          className="text-3xl font-semibold tracking-tight text-[var(--hb-ink)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {pct}%
        </motion.p>
        <p className="text-xs font-medium capitalize text-[var(--hb-ink-muted)]">
          {level} risk
        </p>
      </div>
    </div>
  );
}
