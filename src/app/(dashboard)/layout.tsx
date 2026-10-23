import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
