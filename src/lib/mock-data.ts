import type { Claim, KpiMetric, NotificationItem, UserRole } from "@/types";
import { formatCurrencyCompact } from "@/lib/utils";

const HOSPITALS = [
  { id: "HSP-001", name: "Narayana Health City, Bengaluru" },
  { id: "HSP-002", name: "Manipal Hospital, Old Airport Road, Bengaluru" },
  { id: "HSP-003", name: "Apollo Hospitals, Bannerghatta Road, Bengaluru" },
  { id: "HSP-004", name: "Fortis Hospital, Cunningham Road, Bengaluru" },
  { id: "HSP-005", name: "Columbia Asia Hospital, Whitefield, Bengaluru" },
] as const;

const PATIENTS: { id: string; name: string }[] = [
  { id: "PAT-IN-001", name: "Riya Sharma" },
  { id: "PAT-IN-002", name: "Arjun Mehta" },
  { id: "PAT-IN-003", name: "Kavitha Nair" },
  { id: "PAT-IN-004", name: "Vikram Singh" },
  { id: "PAT-IN-005", name: "Ananya Iyer" },
  { id: "PAT-IN-006", name: "Rahul Desai" },
  { id: "PAT-IN-007", name: "Priya Menon" },
  { id: "PAT-IN-008", name: "Suresh Reddy" },
  { id: "PAT-IN-009", name: "Neha Kapoor" },
  { id: "PAT-IN-010", name: "Aditya Joshi" },
  { id: "PAT-IN-011", name: "Divya Pillai" },
  { id: "PAT-IN-012", name: "Karan Malhotra" },
  { id: "PAT-IN-013", name: "Meera Krishnan" },
  { id: "PAT-IN-014", name: "Nikhil Bhatia" },
  { id: "PAT-IN-015", name: "Sneha Agarwal" },
  { id: "PAT-IN-016", name: "Rohan Varma" },
  { id: "PAT-IN-017", name: "Pooja Kulkarni" },
  { id: "PAT-IN-018", name: "Amit Ghosh" },
  { id: "PAT-IN-019", name: "Lakshmi Subramaniam" },
  { id: "PAT-IN-020", name: "Harsh Patel" },
];

const COVERAGE = [
  "Family Floater Gold",
  "Corporate Group Mediclaim",
  "Senior Citizen Plan",
  "Individual Health Plus",
  "Employee Health Scheme",
] as const;

const STATUS_CYCLE: Claim["status"][] = [
  "approved",
  "pending",
  "approved",
  "flagged",
  "pending",
  "approved",
  "documents_requested",
  "rejected",
  "pending",
  "approved",
  "pending",
  "approved",
  "flagged",
  "approved",
  "pending",
  "approved",
  "pending",
  "approved",
  "rejected",
  "pending",
];

const AMOUNTS = [
  285000, 420000, 18500, 950000, 125000, 3100000, 67000, 145000, 890000, 220000, 15500,
  540000, 112000, 780000, 198000, 425000, 33000, 265000, 1520000, 98000,
];

const TREATMENTS = [
  "Laparoscopic cholecystectomy",
  "Total knee replacement (TKR)",
  "MRI lumbar spine without contrast",
  "Coronary angioplasty with stent",
  "Caesarean section delivery",
  "Dialysis session (hemodialysis)",
  "Appendectomy (open)",
  "Cataract surgery (phaco + IOL)",
  "Hernia repair (mesh)",
  "Chemotherapy day-care cycle",
  "OPD dengue panel + IV fluids",
  "ACL reconstruction + meniscus repair",
  "Pneumonia — inpatient ward care",
  "Thyroidectomy",
  "Fracture femur — ORIF",
  "Normal vaginal delivery",
  "Colonoscopy with polypectomy",
  "RT-PCR + chest CT screening",
  "Pacemaker dual-chamber implant",
  "Gastroscopy under sedation",
];

const DOCTORS = [
  "Dr. Sunita Rao, MS",
  "Dr. Rajesh Khanna, MS (Ortho)",
  "Dr. Anil Verma, MD (Radiology)",
  "Dr. Deepak Malhotra, DM (Cardiology)",
  "Dr. Lakshmi Narayanan, MD (O&G)",
  "Dr. Manoj Pillai, DM (Nephrology)",
  "Dr. Geeta Iyer, MS",
  "Dr. Vikas Bansal, MS (Ophthalmology)",
  "Dr. Suresh Nambiar, MS",
  "Dr. Kavita Deshmukh, MD (Medical Oncology)",
];

function riskFrom(status: Claim["status"], amount: number): { score: number; level: Claim["riskLevel"] } {
  if (status === "flagged" || status === "rejected") return { score: 78 + (amount % 15), level: "high" };
  if (status === "documents_requested" || amount > 800000)
    return { score: 42 + (amount % 20), level: "medium" };
  if (status === "pending") return { score: 35 + (amount % 25), level: "medium" };
  return { score: 12 + (amount % 18), level: "low" };
}

function buildClaim(i: number): Claim {
  const h = HOSPITALS[i % HOSPITALS.length];
  const p = PATIENTS[i];
  const status = STATUS_CYCLE[i];
  const amount = AMOUNTS[i];
  const { score, level } = riskFrom(status, amount);
  const day = 20 - Math.floor(i / 2);
  return {
    id: `CLM-IN-2026-${String(i + 1).padStart(3, "0")}`,
    patientId: p.id,
    patientName: p.name,
    hospital: h.name,
    hospitalId: h.id,
    treatmentType: TREATMENTS[i],
    amount,
    submittedAt: `2026-05-${String(Math.max(1, day)).padStart(2, "0")}T${String(10 + (i % 8)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
    status,
    riskScore: Math.min(95, score),
    riskLevel: level,
    policyId: `POL-IN-${2024 + (i % 3)}-${String(1000 + i * 17).slice(0, 6)}`,
    coverageType: COVERAGE[i % COVERAGE.length],
    validityEnd: `2027-${String(((i % 9) + 1)).padStart(2, "0")}-28`,
    diagnosis:
      i % 3 === 0
        ? "Acute surgical abdomen — evaluation complete"
        : i % 3 === 1
          ? "Chronic condition — under specialist follow-up"
          : "Elective procedure — pre-anaesthesia check cleared",
    procedures: [TREATMENTS[i], i % 2 === 0 ? "Pre-op investigations" : "Post-op monitoring"].slice(
      0,
      1 + (i % 2),
    ),
    doctor: DOCTORS[i % DOCTORS.length],
    admissionDate: `2026-05-${String(Math.max(1, day - 2)).padStart(2, "0")}`,
    dischargeDate: `2026-05-${String(Math.max(1, day - 1)).padStart(2, "0")}`,
    notes:
      "Cashless authorization reference on file. Discharge summary and final bill attached for TPA review.",
  };
}

export const MOCK_CLAIMS: Claim[] = Array.from({ length: 20 }, (_, i) => buildClaim(i));

const TOTAL_RUPEES = MOCK_CLAIMS.reduce((s, c) => s + c.amount, 0);

export const TREND_SERIES = [
  { day: "Mon", submitted: 4, approved: 3 },
  { day: "Tue", submitted: 5, approved: 4 },
  { day: "Wed", submitted: 3, approved: 3 },
  { day: "Thu", submitted: 6, approved: 5 },
  { day: "Fri", submitted: 5, approved: 4 },
  { day: "Sat", submitted: 2, approved: 2 },
  { day: "Sun", submitted: 2, approved: 1 },
];

const approved = MOCK_CLAIMS.filter((c) => c.status === "approved").length;
const pending = MOCK_CLAIMS.filter((c) => c.status === "pending").length;
const flagged = MOCK_CLAIMS.filter((c) => c.status === "flagged").length;
const rejected = MOCK_CLAIMS.filter((c) => c.status === "rejected").length;

export const STATUS_DISTRIBUTION = [
  { name: "Approved", value: approved, color: "#22c55e" },
  { name: "Pending", value: pending, color: "#f59e0b" },
  { name: "Flagged", value: flagged, color: "#ef4444" },
  { name: "Rejected", value: rejected, color: "#64748b" },
];

export const HOSPITAL_BAR = [
  { name: "Narayana Blr", claims: 5 },
  { name: "Manipal Blr", claims: 4 },
  { name: "Apollo Blr", claims: 4 },
  { name: "Fortis Blr", claims: 4 },
  { name: "Columbia Blr", claims: 3 },
];

export const FRAUD_HEATMAP = [
  { hospital: "Narayana Blr", week: "W1", score: 0.24 },
  { hospital: "Narayana Blr", week: "W2", score: 0.31 },
  { hospital: "Manipal Blr", week: "W1", score: 0.44 },
  { hospital: "Manipal Blr", week: "W2", score: 0.52 },
  { hospital: "Apollo Blr", week: "W1", score: 0.28 },
  { hospital: "Apollo Blr", week: "W2", score: 0.26 },
  { hospital: "Fortis Blr", week: "W1", score: 0.33 },
  { hospital: "Fortis Blr", week: "W2", score: 0.29 },
];

export const ANOMALY_SERIES = [
  { i: 0, score: 18 },
  { i: 1, score: 22 },
  { i: 2, score: 31 },
  { i: 3, score: 28 },
  { i: 4, score: 35 },
  { i: 5, score: 40 },
  { i: 6, score: 33 },
  { i: 7, score: 27 },
];

export const CLUSTER_POINTS = MOCK_CLAIMS.map((c, idx) => ({
  x: c.riskScore + (idx % 2),
  y: Math.round((c.amount / 100000) * 10) / 10,
  z: 80 + (idx % 5) * 40,
  name: c.id,
}));

export const MONTHLY_APPROVALS = [
  { month: "Mar", rate: 0.81 },
  { month: "Apr", rate: 0.84 },
  { month: "May", rate: 0.83 },
];

export function buildKpis(role: UserRole): KpiMetric[] {
  const spark = (pts: number[]) => pts;
  const totalClaims = MOCK_CLAIMS.length;
  const base: KpiMetric[] = [
    {
      id: "total",
      label: "Total Claims",
      value: totalClaims,
      trend: 4.2,
      trendLabel: "vs last month",
      spark: spark([14, 15, 16, 17, 18, 19, 20]),
      icon: "layers",
      accent: "blue",
    },
    {
      id: "approved",
      label: "Claims Approved",
      value: approved,
      trend: 2.8,
      trendLabel: "vs last month",
      spark: spark([6, 7, 8, 8, 9, 9, approved]),
      icon: "circle-check",
      accent: "emerald",
    },
    {
      id: "pending",
      label: "Claims Pending",
      value: pending,
      trend: -1.5,
      trendLabel: "vs last month",
      spark: spark([8, 7, 7, 6, 6, 5, pending]),
      icon: "clock",
      accent: "amber",
    },
    {
      id: "fraud",
      label: "Fraud Alerts",
      value: 3,
      trend: 0,
      trendLabel: "this week",
      spark: spark([1, 2, 2, 2, 3, 3, 3]),
      icon: "shield-alert",
      accent: "rose",
    },
    {
      id: "avgTime",
      label: "Avg. Approval Time",
      value: "1.4 days",
      trend: -6.2,
      trendLabel: "faster",
      spark: spark([2.1, 2.0, 1.9, 1.7, 1.6, 1.5, 1.4]),
      icon: "timer",
      accent: "violet",
    },
    {
      id: "amount",
      label: "Total Claim Amount",
      value: formatCurrencyCompact(TOTAL_RUPEES),
      trend: 3.1,
      trendLabel: "paid + reserved",
      spark: spark([82, 85, 88, 90, 92, 94, 96]),
      icon: "banknote",
      accent: "cyan",
    },
    {
      id: "aiRisk",
      label: "AI Risk Cases",
      value: flagged + pending,
      trend: 1.2,
      trendLabel: "open reviews",
      spark: spark([5, 6, 6, 7, 7, 8, flagged + pending]),
      icon: "brain",
      accent: "rose",
    },
    {
      id: "hosp",
      label: "Hospital Activity",
      value: "Moderate",
      trend: 0.8,
      trendLabel: "network index",
      spark: spark([58, 59, 60, 61, 61, 62, 63]),
      icon: "activity",
      accent: "blue",
    },
  ];

  if (role === "hospital_staff") {
    return base.filter((b) =>
      ["total", "pending", "approved", "amount"].includes(b.id),
    );
  }
  if (role === "auditor") {
    return base.filter((b) =>
      ["fraud", "aiRisk", "avgTime", "pending"].includes(b.id),
    );
  }
  if (role === "compliance_officer") {
    return base.filter((b) =>
      ["fraud", "aiRisk", "approved", "pending"].includes(b.id),
    );
  }
  return base;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "New claim submitted",
    body: "CLM-IN-2026-020 from Narayana Bengaluru — cashless pending.",
    type: "claim",
    priority: "medium",
    createdAt: "2026-05-12T14:24:00Z",
    read: false,
  },
  {
    id: "n2",
    title: "Fraud alert detected",
    body: "Unusual duplicate investigation codes at Manipal Bengaluru.",
    type: "fraud",
    priority: "high",
    createdAt: "2026-05-12T13:02:00Z",
    read: false,
  },
  {
    id: "n3",
    title: "Missing documents",
    body: "Discharge summary needed for CLM-IN-2026-007.",
    type: "docs",
    priority: "high",
    createdAt: "2026-05-11T11:40:00Z",
    read: true,
  },
  {
    id: "n4",
    title: "Approval completed",
    body: "CLM-IN-2026-001 cleared with low AI risk.",
    type: "approval",
    priority: "low",
    createdAt: "2026-05-11T16:10:00Z",
    read: true,
  },
];

export const AUDIT_EVENTS = [
  {
    id: "a1",
    at: "2026-05-12T14:30:00Z",
    actor: "Neha Kapoor",
    action: "Viewed claim CLM-IN-2026-001",
    category: "claim",
  },
  {
    id: "a2",
    at: "2026-05-12T14:12:00Z",
    actor: "System",
    action: "AI risk analysis completed — score 28%",
    category: "ai",
  },
  {
    id: "a3",
    at: "2026-05-12T13:55:00Z",
    actor: "Rahul Desai",
    action: "Uploaded discharge_summary.pdf",
    category: "document",
  },
  {
    id: "a4",
    at: "2026-05-12T09:10:00Z",
    actor: "Ananya Iyer",
    action: "Login from Chrome · Bengaluru, KA",
    category: "security",
  },
];

export const CHAT_THREAD: {
  id: string;
  from: "hospital" | "insurer" | "auditor";
  name: string;
  body: string;
  at: string;
  ai?: boolean;
}[] = [
  {
    id: "m1",
    from: "hospital",
    name: "Manipal Bengaluru — TPA Desk",
    body: "Please confirm medical necessity for same-day MRI lumbar along with ED visit.",
    at: "2026-05-12T15:01:00Z",
  },
  {
    id: "m2",
    from: "insurer",
    name: "Vikram Singh · Claim Reviewer",
    body: "Clinical notes show chronic low back pain > 6 months — aligns with policy. Proceeding with document verification.",
    at: "2026-05-12T15:18:00Z",
  },
  {
    id: "m3",
    from: "auditor",
    name: "Compliance Copilot",
    body: "Suggested reply: Request consultant radiologist attestation for emergency indication.",
    at: "2026-05-12T15:19:00Z",
    ai: true,
  },
];

export const FRAUD_RANKING = [
  { name: "Manipal Hospital, Old Airport Road, Bengaluru", score: 0.52, claims: 4 },
  { name: "Apollo Hospitals, Bannerghatta Road, Bengaluru", score: 0.38, claims: 4 },
  { name: "Narayana Health City, Bengaluru", score: 0.27, claims: 5 },
  { name: "Fortis Hospital, Cunningham Road, Bengaluru", score: 0.31, claims: 4 },
];

export const HIGH_RISK_DOCTORS = [
  { name: "Dr. Anil Verma, MD (Radiology)", flags: 3, specialty: "Radiology" },
  { name: "Dr. Manoj Pillai, DM (Nephrology)", flags: 2, specialty: "Nephrology" },
  { name: "Dr. Deepak Malhotra, DM (Cardiology)", flags: 2, specialty: "Cardiology" },
];

export const SEARCH_INDEX = [
  ...MOCK_CLAIMS.slice(0, 8).map((c) => ({
    type: "claim" as const,
    title: c.id,
    subtitle: `${c.patientName} · ${c.hospital.split(",")[0]}`,
    href: `/claim/${c.id}`,
  })),
  {
    type: "patient" as const,
    title: "PAT-IN-001",
    subtitle: "Riya Sharma",
    href: "/claims",
  },
  {
    type: "hospital" as const,
    title: "Narayana Health City",
    subtitle: "Bengaluru, Karnataka",
    href: "/hospitals",
  },
  {
    type: "policy" as const,
    title: "POL-IN-2024-100017",
    subtitle: "Family Floater Gold · Active",
    href: "/policy-holders",
  },
];

export const NETWORK_HOSPITALS = [
  {
    name: "Narayana Health City, Bengaluru",
    city: "Bengaluru, Karnataka",
    phone: "+91 80 7122 2222",
    tier: "Empanelled T1",
  },
  {
    name: "Manipal Hospital, Old Airport Road, Bengaluru",
    city: "Bengaluru, Karnataka",
    phone: "+91 80 2502 4444",
    tier: "Empanelled T2",
  },
  {
    name: "Apollo Hospitals, Bannerghatta Road, Bengaluru",
    city: "Bengaluru, Karnataka",
    phone: "+91 80 4630 5000",
    tier: "Empanelled T1",
  },
  {
    name: "Fortis Hospital, Cunningham Road, Bengaluru",
    city: "Bengaluru, Karnataka",
    phone: "+91 80 4199 4444",
    tier: "Empanelled T1",
  },
  {
    name: "Columbia Asia Hospital, Whitefield, Bengaluru",
    city: "Bengaluru, Karnataka",
    phone: "+91 80 3989 8989",
    tier: "Empanelled T2",
  },
];
