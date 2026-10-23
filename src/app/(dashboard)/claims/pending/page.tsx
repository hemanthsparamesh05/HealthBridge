import { ClaimsView } from "@/components/claims/claims-view";

export default function PendingClaimsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Pending reviews
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Claims awaiting clinical and financial validation.
        </p>
      </div>
      <ClaimsView filter="pending" />
    </div>
  );
}
