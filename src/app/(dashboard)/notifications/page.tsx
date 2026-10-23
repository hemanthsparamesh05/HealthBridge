"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const q = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Notifications
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Priority-coded system for claims, fraud, documents, and policy events.
        </p>
      </div>
      <div className="grid gap-3">
        {q.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : (q.data ?? []).map((n) => (
              <Card key={n.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <Badge
                      tone={
                        n.priority === "high"
                          ? "danger"
                          : n.priority === "medium"
                            ? "warning"
                            : "default"
                      }
                    >
                      {n.priority} priority
                    </Badge>
                  </div>
                  <CardDescription>{new Date(n.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <p className="px-5 pb-5 text-sm text-[var(--hb-ink-muted)]">{n.body}</p>
              </Card>
            ))}
      </div>
    </div>
  );
}
