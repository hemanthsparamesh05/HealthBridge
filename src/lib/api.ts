import axios, { type AxiosError } from "axios";
import type { AuditEvent, Claim, KpiMetric, NotificationItem, UserRole } from "@/types";

type DashboardCharts = {
  trend: { day: string; submitted: number; approved: number }[];
  status: { name: string; value: number; color: string }[];
  hospitals: { name: string; claims: number }[];
  fraudHeat: { hospital: string; week: string; score: number }[];
  anomaly: { i: number; score: number }[];
  monthly: { month: string; rate: number }[];
  clusters: { x: number; y: number; z: number; name: string }[];
};

type Message = {
  id: string;
  from: "hospital" | "insurer" | "ai";
  name: string;
  body: string;
  at: string;
  ai: boolean;
};

type FraudInsights = {
  probability: number;
  ranking: { name: string; claims: number; score: number }[];
  doctors: { name: string; specialty: string; flags: number }[];
  duplicates: { pair: string; reason: string }[];
};

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("hb-auth");
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore malformed persist blob
    }
  }
  return config;
});

function asError(err: unknown): Error {
  const ax = err as AxiosError<{ detail?: string }>;
  const detail = ax.response?.data?.detail;
  return new Error(typeof detail === "string" ? detail : ax.message || "Request failed");
}

export async function apiLogin(email: string, password: string, role: UserRole) {
  try {
    const { data } = await api.post<{
      access_token: string;
      mfa_required: boolean;
    }>("/auth/login", { email, password, role });
    return data;
  } catch (err) {
    throw asError(err);
  }
}

export async function apiMfa(email: string, code: string, mfaToken: string) {
  try {
    const { data } = await api.post<{ access_token: string; mfa_required: boolean }>(
      "/auth/mfa",
      { email, code, mfa_token: mfaToken },
    );
    return data;
  } catch (err) {
    throw asError(err);
  }
}

export async function apiMe(token: string) {
  try {
    const { data } = await api.get<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
    }>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    throw asError(err);
  }
}

export async function fetchClaims(status?: string): Promise<Claim[]> {
  const { data } = await api.get<Claim[]>("/claims", {
    params: status && status !== "all" ? { status } : undefined,
  });
  return data;
}

export async function fetchClaim(id: string): Promise<Claim | null> {
  try {
    const { data } = await api.get<Claim>(`/claims/${id}`);
    return data;
  } catch {
    return null;
  }
}

export async function updateClaimStatus(id: string, status: Claim["status"], notes?: string) {
  const { data } = await api.patch<Claim>(`/claims/${id}/status`, { status, notes });
  return data;
}

export async function rescoreClaim(id: string) {
  const { data } = await api.post<Claim>(`/claims/${id}/rescore`);
  return data;
}

export async function fetchKpis(_role: UserRole): Promise<KpiMetric[]> {
  void _role;
  const { data } = await api.get<KpiMetric[]>("/kpis");
  return data;
}

export async function fetchDashboardCharts(): Promise<DashboardCharts> {
  const { data } = await api.get<{
    trend: { date: string; claims: number; approved?: number }[];
    status: { name: string; value: number }[];
    hospitals: { name: string; amount: number }[];
    fraudHeat: { hospital: string; risk: number }[];
    anomaly: { score: number }[];
    monthly: { month: string; approved: number; rejected: number }[];
    clusters: { x: number; y: number; z: number; name: string }[];
  }>("/dashboard/charts");
  const statusColors = ["#38bdf8", "#22c55e", "#f97316", "#fb7185", "#a78bfa"];
  return {
    trend: data.trend.map((row) => ({
      day: row.date,
      submitted: row.claims,
      approved: row.approved ?? 0,
    })),
    status: data.status.map((row, index) => ({
      ...row,
      color: statusColors[index % statusColors.length],
    })),
    hospitals: data.hospitals.map((row) => ({
      name: row.name,
      claims: Math.round(row.amount),
    })),
    fraudHeat: data.fraudHeat.map((row) => ({
      hospital: row.hospital,
      week: "Current",
      score: row.risk / 100,
    })),
    anomaly: data.anomaly.map((row, index) => ({ i: index + 1, score: row.score })),
    monthly: data.monthly.map((row) => ({
      month: row.month,
      rate: row.approved / Math.max(1, row.approved + row.rejected),
    })),
    clusters: data.clusters,
  };
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<NotificationItem[]>("/notifications");
  return data;
}

export async function fetchAudit(): Promise<AuditEvent[]> {
  const { data } = await api.get<AuditEvent[]>("/audit");
  return data.map((event) => ({
    ...event,
    category: event.entity,
    at: event.createdAt,
  }));
}

export async function fetchMessages(): Promise<Message[]> {
  const { data } = await api.get<{
    id: string;
    from: "hospital" | "insurer" | "ai";
    author: string;
    body: string;
    at: string;
  }[]>("/messages");
  return data.map((message) => ({
    id: message.id,
    from: message.from,
    name: message.author,
    body: message.body,
    at: message.at,
    ai: message.from === "ai",
  }));
}

export async function fetchFraudInsights(): Promise<FraudInsights> {
  const { data } = await api.get<{
    probability: number;
    ranking: { hospital: string; riskScore: number }[];
    doctors: { doctor: string; avgRisk: number; claims: number }[];
    duplicates: { pair: string; reason: string }[];
  }>("/fraud/insights");
  return {
    probability: data.probability,
    ranking: data.ranking.map((row) => ({
      name: row.hospital,
      claims: 1,
      score: row.riskScore / 100,
    })),
    doctors: data.doctors.map((row) => ({
      name: row.doctor,
      specialty: `${row.claims} claims analysed`,
      flags: Math.max(1, Math.round(row.avgRisk / 20)),
    })),
    duplicates: data.duplicates,
  };
}

export async function predictFraud(claimId: string) {
  const { data } = await api.post("/fraud/predict", { claim_id: claimId });
  return data;
}

export async function fetchModelInfo() {
  const { data } = await api.get("/fraud/model");
  return data;
}

export type ClaimFormOptions = {
  policies: {
    policyId: string;
    memberName: string;
    coverageType: string;
    sumInsured: number;
    validityEnd: string;
  }[];
  hospitals: { id: string; name: string }[];
  fixedHospitalId: string | null;
};

export type NewClaimInput = {
  policy_id: string;
  hospital_id?: string;
  treatment_type: string;
  diagnosis: string;
  procedures: string[];
  doctor: string;
  admission_date: string;
  discharge_date: string;
  amount: number;
  doctor_fee: number;
  notes: string;
};

export async function fetchClaimFormOptions(): Promise<ClaimFormOptions> {
  try {
    const { data } = await api.get<ClaimFormOptions>("/claims/form-options");
    return data;
  } catch (err) {
    throw asError(err);
  }
}

export async function createClaim(input: NewClaimInput): Promise<Claim> {
  try {
    const { data } = await api.post<Claim>("/claims", input);
    return data;
  } catch (err) {
    throw asError(err);
  }
}

export type Hospital = {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  tier: string;
  networkStatus: string;
  beds: number;
  specialties: string[];
  avgClaimAmount: number;
  fraudRate: number;
  providerRiskScore: number;
  claimCount: number;
};

export async function fetchHospitals(): Promise<Hospital[]> {
  const { data } = await api.get<Hospital[]>("/hospitals");
  return data;
}

export { api };
