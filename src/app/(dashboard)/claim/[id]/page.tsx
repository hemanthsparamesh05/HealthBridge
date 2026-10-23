import { ClaimDetailClient } from "@/components/claims/claim-detail-client";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClaimDetailClient claimId={id} />;
}
