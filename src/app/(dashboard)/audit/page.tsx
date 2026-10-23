"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchAudit } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditPage() {
  const q = useQuery({ queryKey: ["audit"], queryFn: fetchAudit });
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const d = q.data ?? [];
    if (!search.trim()) return d;
    const s = search.toLowerCase();
    return d.filter(
      (e) =>
        e.action.toLowerCase().includes(s) ||
        e.actor.toLowerCase().includes(s) ||
        e.entity.toLowerCase().includes(s) ||
        e.detail.toLowerCase().includes(s),
    );
  }, [q.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
            Audit logs
          </h1>
          <p className="text-sm text-[var(--hb-ink-muted)]">
            Immutable timeline for approvals, AI runs, documents, and security events.
          </p>
        </div>
        <Input
          className="max-w-sm"
          placeholder="Search actor, action, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search audit events"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity stream</CardTitle>
          <CardDescription>UTC timestamps · sub-minute precision</CardDescription>
        </CardHeader>
        <div className="px-5 pb-6">
          {q.isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <ol className="space-y-4 border-l border-slate-200/80 pl-4 dark:border-slate-800">
              {rows.map((e) => (
                <li key={e.id} className="relative pl-4">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-950" />
                  <p className="text-sm font-semibold text-[var(--hb-ink)]">{e.action}</p>
                  <p className="text-xs text-[var(--hb-ink-muted)]">
                    {e.actor} · {e.category} · {new Date(e.at).toISOString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}
