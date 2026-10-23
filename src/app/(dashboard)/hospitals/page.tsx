"use client";

import { Building2, MapPin, Phone } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchHospitals } from "@/lib/api";

export default function HospitalsPage() {
  const q = useQuery({ queryKey: ["hospitals"], queryFn: fetchHospitals, staleTime: 5 * 60_000 });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Hospitals
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Empanelled network across metros — utilization and SLA tracking.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {q.isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        {(q.data ?? []).map((h) => (
          <Card key={h.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 transition-transform duration-200 ease-out hover:scale-105 dark:text-sky-300">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{h.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {h.city}
                    </CardDescription>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {h.tier}
                </span>
              </div>
            </CardHeader>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--hb-ink-muted)]">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {h.phone}
              </span>
              <span>{h.claimCount} claims</span>
              <span>{h.beds} beds</span>
              <span>Provider risk {h.providerRiskScore.toFixed(0)}/100</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
