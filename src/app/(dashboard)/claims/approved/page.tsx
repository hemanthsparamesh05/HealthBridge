import { ClaimsView } from "@/components/claims/claims-view";

export default function ApprovedClaimsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hb-ink)]">
          Approved claims
        </h1>
        <p className="text-sm text-[var(--hb-ink-muted)]">
          Recently cleared claims with favorable AI posture.
        </p>
      </div>
      <ClaimsView filter="approved" />
    </div>
  );
}
