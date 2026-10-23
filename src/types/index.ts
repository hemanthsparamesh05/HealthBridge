export type UserRole =
  | "insurance_admin"
  | "claim_reviewer"
  | "hospital_staff"
  | "compliance_officer"
  | "auditor";

export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged"
  | "documents_requested";

export type RiskLevel = "low" | "medium" | "high";

export interface Claim {
  id: string;
  patientId: string;
  patientName: string;
  hospital: string;
  hospitalId: string;
  treatmentType: string;
  amount: number;
  submittedAt: string;
  status: ClaimStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  policyId: string;
  coverageType: string;
  validityEnd: string;
  diagnosis: string;
  procedures: string[];
  doctor: string;
  admissionDate: string;
  dischargeDate: string;
  notes: string;
  mlProbability?: number | null;
  mlFindings?: string[];
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  trend: number;
  trendLabel: string;
  spark: number[];
  icon: string;
  accent: "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan";
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: { label: string; href: string }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "claim" | "fraud" | "docs" | "approval" | "policy" | "system";
  priority: "low" | "medium" | "high";
  createdAt: string;
  read: boolean;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  createdAt: string;
  category: string;
  at: string;
}
