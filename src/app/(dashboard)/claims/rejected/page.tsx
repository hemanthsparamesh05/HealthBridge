import { ClaimsView } from "@/components/claims/claims-view";

export default function RejectedClaimsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Rejected claims
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Denials, eligibility failures, and policy conflicts.
        </p>
      </div>
      <ClaimsView filter="rejected" />
    </div>
  );
}
