"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClaims } from "@/lib/api";
import type { ClaimStatus } from "@/types";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";
import { Skeleton } from "@/components/ui/skeleton";

export function ClaimsView({ filter = "all" }: { filter?: ClaimStatus | "all" }) {
  const { data, isLoading } = useQuery({ queryKey: ["claims"], queryFn: () => fetchClaims() });
  if (isLoading) return <Skeleton className="h-[480px]" />;
  return <RecentClaimsTable claims={data ?? []} filterStatus={filter} />;
}
