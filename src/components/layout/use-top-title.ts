"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function useTopTitle(): string {
  const pathname = usePathname();
  return useMemo(() => {
    if (pathname.startsWith("/claim/")) return "Claim Details";
    const map: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/claims": "Claims",
      "/claims/pending": "Pending Reviews",
      "/claims/approved": "Approved Claims",
      "/claims/rejected": "Rejected Claims",
      "/claims/flagged": "Flagged Claims",
      "/analytics": "Analytics",
      "/hospitals": "Hospitals",
      "/policy-holders": "Policy Holders",
      "/fraud": "Fraud Detection",
      "/reports": "Reports & Analytics",
      "/notifications": "Notifications",
      "/audit": "Audit Logs",
      "/communications": "Communications",
      "/settings": "Settings",
    };
    return map[pathname] ?? "HealthBridge";
  }, [pathname]);
}
