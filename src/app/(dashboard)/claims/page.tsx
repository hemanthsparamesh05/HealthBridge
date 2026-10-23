import Link from "next/link";
import { Plus } from "lucide-react";
import { ClaimsView } from "@/components/claims/claims-view";

export default function ClaimsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Claims
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Enterprise queue with sorting, filters, and exports.
        </p>
        </div>
        <Link
          href="/claims/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--hb-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:brightness-110"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Apply for claim
        </Link>
      </div>
      <ClaimsView filter="all" />
    </div>
  );
}
