"use client";

import { MOCK_CLAIMS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const holders = Array.from(
  new Map(MOCK_CLAIMS.map((c) => [c.policyId, c])).entries(),
).map(([policyId, c]) => ({
  policyId,
  holder: c.patientName,
  coverage: c.coverageType,
  renewal: c.validityEnd,
}));

export default function PolicyHoldersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Policy holders
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Snapshot of active policies referenced in the mock claim feed.
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Policy</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Coverage</th>
                <th className="px-4 py-3">Renewal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {holders.map((h) => (
                <tr key={h.policyId}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {h.policyId}
                  </td>
                  <td className="px-4 py-3">{h.holder}</td>
                  <td className="px-4 py-3 text-[var(--hb-ink-muted)]">{h.coverage}</td>
                  <td className="px-4 py-3">{formatDate(h.renewal)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
