import type { UserRole } from "@/types";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileWarning,
  Flag,
  Gauge,
  Home,
  Hospital,
  LineChart,
  MessageSquare,
  Plus,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

export type NavDef = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly (UserRole | "*")[];
  badgeKey?: "notifications";
};

export const NAV_PRIMARY: NavDef[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home, roles: ["*"] },
  {
    label: "Claims",
    href: "/claims",
    icon: ClipboardList,
    roles: ["*"],
  },
  {
    label: "Apply for Claim",
    href: "/claims/new",
    icon: Plus,
    roles: ["hospital_staff", "insurance_admin", "claim_reviewer"],
  },
  {
    label: "Pending Reviews",
    href: "/claims/pending",
    icon: FileWarning,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer"],
  },
  {
    label: "Approved Claims",
    href: "/claims/approved",
    icon: ShieldCheck,
    roles: ["insurance_admin", "claim_reviewer", "hospital_staff", "compliance_officer"],
  },
  {
    label: "Rejected Claims",
    href: "/claims/rejected",
    icon: Shield,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer", "auditor"],
  },
  {
    label: "Flagged Claims",
    href: "/claims/flagged",
    icon: Flag,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer", "auditor"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: LineChart,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer", "auditor"],
  },
  {
    label: "Hospitals",
    href: "/hospitals",
    icon: Hospital,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer", "auditor"],
  },
  {
    label: "Policy Holders",
    href: "/policy-holders",
    icon: Users,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer"],
  },
  {
    label: "Fraud Detection",
    href: "/fraud",
    icon: ShieldAlert,
    roles: ["insurance_admin", "claim_reviewer", "compliance_officer", "auditor"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["insurance_admin", "compliance_officer", "auditor"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["*"],
    badgeKey: "notifications",
  },
  {
    label: "Audit Logs",
    href: "/audit",
    icon: ScrollText,
    roles: ["insurance_admin", "compliance_officer", "auditor"],
  },
  {
    label: "Communications",
    href: "/communications",
    icon: MessageSquare,
    roles: ["insurance_admin", "claim_reviewer", "hospital_staff", "compliance_officer", "auditor"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["*"],
  },
];

export function navForRole(role: UserRole | undefined): NavDef[] {
  if (!role) return [];
  return NAV_PRIMARY.filter(
    (n) => n.roles.includes("*") || n.roles.includes(role),
  );
}

export const SECONDARY_ICONS = {
  search: Search,
  activity: Activity,
  gauge: Gauge,
  building: Building2,
};
