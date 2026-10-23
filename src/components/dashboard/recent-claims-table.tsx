"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileQuestion,
  Flag,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateClaimStatus } from "@/lib/api";
import type { Claim, ClaimStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const statusTone: Record<ClaimStatus, "success" | "warning" | "danger" | "info" | "default"> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  flagged: "danger",
  documents_requested: "info",
};

function RiskBadge({ score, level }: { score: number; level: Claim["riskLevel"] }) {
  const tone =
    level === "high" ? "danger" : level === "medium" ? "warning" : "success";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-[var(--hb-ink)]">{score}%</span>
      <Badge tone={tone} className="w-fit capitalize">
        {level}
      </Badge>
    </div>
  );
}

function HeaderSortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: "asc" | "desc";
}) {
  if (!active) return null;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}

export function RecentClaimsTable({
  claims,
  filterStatus = "all",
}: {
  claims: Claim[];
  filterStatus?: ClaimStatus | "all";
}) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ClaimStatus | "all">(filterStatus);
  const [sortKey, setSortKey] = useState<"submittedAt" | "amount" | "riskScore">(
    "submittedAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function setClaimStatus(id: string, next: ClaimStatus) {
    try {
      await updateClaimStatus(id, next);
      await queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success(`${id} → ${next.replace("_", " ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  const filtered = useMemo(() => {
    let rows = claims.filter((c) => (status === "all" ? true : c.status === status));
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.id.toLowerCase().includes(s) ||
          c.patientId.toLowerCase().includes(s) ||
          c.hospital.toLowerCase().includes(s) ||
          c.treatmentType.toLowerCase().includes(s),
      );
    }
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const mul = sortDir === "asc" ? 1 : -1;
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * mul;
      }
      return ((av as number) - (bv as number)) * mul;
    });
    return rows;
  }, [claims, q, status, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
    setPage(1);
  };

  const exportCsv = () => {
    const header = [
      "Claim ID",
      "Patient ID",
      "Hospital",
      "Treatment",
      "Amount",
      "Submitted",
      "Risk",
      "Status",
    ];
    const lines = filtered.map((c) =>
      [
        c.id,
        c.patientId,
        `"${c.hospital.replace(/"/g, '""')}"`,
        `"${c.treatmentType.replace(/"/g, '""')}"`,
        c.amount,
        c.submittedAt,
        c.riskScore,
        c.status,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "healthbridge-claims.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200/70 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--hb-ink)]">
            Recent claims
          </h2>
          <p className="text-xs text-[var(--hb-ink-muted)]">
            Sort, filter, paginate, and export enterprise-grade claim queues.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search table…"
              className="pl-9"
              aria-label="Search claims in table"
            />
          </div>
          <select
            className="h-10 rounded-xl border border-slate-200/90 bg-white/90 px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ClaimStatus | "all");
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
            <option value="documents_requested">Documents requested</option>
          </select>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={exportCsv}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Claim ID</th>
              <th className="px-4 py-3">Patient ID</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Treatment</th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("amount")}
                >
                  Amount{" "}
                  <HeaderSortIcon active={sortKey === "amount"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("submittedAt")}
                >
                  Submitted{" "}
                  <HeaderSortIcon active={sortKey === "submittedAt"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort("riskScore")}
                >
                  AI risk{" "}
                  <HeaderSortIcon active={sortKey === "riskScore"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageRows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <Link href={`/claim/${c.id}`} className="hover:underline">
                    {c.id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.patientId}</td>
                <td className="px-4 py-3 text-[var(--hb-ink)]">{c.hospital}</td>
                <td className="max-w-[220px] truncate px-4 py-3 text-[var(--hb-ink-muted)]">
                  {c.treatmentType}
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(c.amount)}</td>
                <td className="px-4 py-3 text-[var(--hb-ink-muted)]">
                  {formatDate(c.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={c.riskScore} level={c.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[c.status]} className="capitalize">
                    {c.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconBtn label="View" href={`/claim/${c.id}`} icon={<Eye className="h-4 w-4" />} />
                    <IconBtn
                      label="Approve"
                      onClick={() => void setClaimStatus(c.id, "approved")}
                      icon={<Check className="h-4 w-4" />}
                    />
                    <IconBtn
                      label="Reject"
                      onClick={() => void setClaimStatus(c.id, "rejected")}
                      icon={<X className="h-4 w-4" />}
                    />
                    <IconBtn
                      label="Flag"
                      onClick={() => void setClaimStatus(c.id, "flagged")}
                      icon={<Flag className="h-4 w-4" />}
                    />
                    <IconBtn
                      label="Request documents"
                      onClick={() => void setClaimStatus(c.id, "documents_requested")}
                      icon={<FileQuestion className="h-4 w-4" />}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {pageRows.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/claim/${c.id}`} className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300">
                  {c.id}
                </Link>
                <p className="text-xs text-[var(--hb-ink-muted)]">{c.patientId}</p>
              </div>
              <Badge tone={statusTone[c.status]} className="capitalize">
                {c.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--hb-ink)]">{c.hospital}</p>
            <p className="text-xs text-[var(--hb-ink-muted)]">{c.treatmentType}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold dark:bg-slate-900">
                {formatCurrency(c.amount)}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-900">
                {formatDate(c.submittedAt)}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-900">
                AI {c.riskScore}% · {c.riskLevel}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/claim/${c.id}`}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                View
              </Link>
              <Button
                className="h-9 rounded-xl px-3 text-xs"
                type="button"
                onClick={() => void setClaimStatus(c.id, "approved")}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200/70 p-4 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <p className="text-[var(--hb-ink-muted)]">
          Page {page} of {pages} · {filtered.length} results
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function IconBtn({
  label,
  icon,
  href,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900";
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label} title={label}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={onClick}>
      {icon}
    </button>
  );
}
