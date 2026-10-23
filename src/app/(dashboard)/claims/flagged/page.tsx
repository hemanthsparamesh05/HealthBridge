import { ClaimsView } from "@/components/claims/claims-view";

export default function FlaggedClaimsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Flagged claims
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          High-risk or anomalous claims prioritized for specialist review.
        </p>
      </div>
      <ClaimsView filter="flagged" />
    </div>
  );
}
