from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

UserRole = Literal[
    "insurance_admin",
    "claim_reviewer",
    "hospital_staff",
    "compliance_officer",
    "auditor",
]

ClaimStatus = Literal[
    "pending",
    "approved",
    "rejected",
    "flagged",
    "documents_requested",
]

RiskLevel = Literal["low", "medium", "high"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    mfa_required: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MfaRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    mfa_token: str = Field(min_length=10)


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole


class ClaimOut(BaseModel):
    id: str
    patientId: str
    patientName: str
    hospital: str
    hospitalId: str
    treatmentType: str
    amount: float
    submittedAt: str
    status: ClaimStatus
    riskScore: float
    riskLevel: RiskLevel
    policyId: str
    coverageType: str
    validityEnd: str
    diagnosis: str
    procedures: list[str]
    doctor: str
    admissionDate: str
    dischargeDate: str
    notes: str
    mlProbability: Optional[float] = None
    mlFindings: list[str] = []


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus
    notes: Optional[str] = None


class ClaimCreate(BaseModel):
    policy_id: str = Field(min_length=3, max_length=64)
    treatment_type: str = Field(min_length=2, max_length=255)
    amount: float = Field(gt=0, le=10_000_000)
    diagnosis: str = Field(min_length=2, max_length=255)
    procedures: list[str] = Field(min_length=1, max_length=30)
    doctor: str = Field(min_length=2, max_length=255)
    admission_date: date
    discharge_date: date
    notes: str = Field(default="", max_length=4000)
    doctor_fee: float = Field(default=0, ge=0)
    hospital_id: Optional[str] = Field(default=None, max_length=64)  # admins choose; staff use their own


class FraudPredictRequest(BaseModel):
    claim_id: Optional[str] = None
    amount: Optional[float] = None
    patient_age: int = 40
    patient_gender: str = "Other"
    claim_duration_days: int = 1
    doctor_fee: float = 0.0
    hospital_id: str = "HSP-001"
    treatment_type: str = "General"
    diagnosis: str = "Unknown"


class FraudPredictResponse(BaseModel):
    probability: float
    risk_score: float
    risk_level: RiskLevel
    label: Literal["fraud", "legitimate"]
    findings: list[str]
    model_version: str


class ProviderPredictRequest(BaseModel):
    provider_id: str
    claim_count: float = 10
    total_reimbursement: float = 100000
    avg_reimbursement: float = 10000
    inpatient_ratio: float = 0.3
    unique_beneficiaries: float = 8
    unique_physicians: float = 3
    avg_claim_days: float = 3
    chronic_condition_rate: float = 0.2
    diagnosis_diversity: float = 5


class HospitalOut(BaseModel):
    id: str
    name: str
    city: str
    state: str
    phone: str
    tier: str
    networkStatus: str
    beds: int
    specialties: list[str]
    avgClaimAmount: float
    fraudRate: float
    providerRiskScore: float
    claimCount: int = 0


class PolicyHolderOut(BaseModel):
    id: str
    policyId: str
    memberName: str
    patientId: str
    coverageType: str
    sumInsured: float
    validityStart: str
    validityEnd: str
    status: str
    age: int
    gender: str
    city: str
    phone: str
    email: str
    claimCount: int = 0


class DocumentOut(BaseModel):
    id: int
    claimId: str
    filename: str
    contentType: str
    sizeBytes: int
    docType: str
    verified: bool
    uploadedBy: str
    createdAt: str
    downloadUrl: str


class KpiOut(BaseModel):
    id: str
    label: str
    value: float | str
    trend: float
    trendLabel: str
    spark: list[float]
    icon: str
    accent: str


class ModelInfo(BaseModel):
    loaded: bool
    model_version: str | None = None
    trained_at: str | None = None
    algorithm: str | None = None
    metrics: dict | None = None
    feature_count: int | None = None
    model_type: str | None = None
