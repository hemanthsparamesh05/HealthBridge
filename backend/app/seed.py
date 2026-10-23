from __future__ import annotations

import json
from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import hash_password, role_display
from app.models import AuditEvent, Claim, Hospital, HospitalMembership, Notification, PolicyHolder, User
from app.schemas import ClaimOut, RiskLevel, UserRole
from ml import fraud_model

DEMO_USERS: list[dict[str, str]] = [
    {
        "email": "admin@healthbridge.in",
        "password": "admin123",
        "role": "insurance_admin",
    },
    {
        "email": "reviewer@healthbridge.in",
        "password": "reviewer123",
        "role": "claim_reviewer",
    },
    {
        "email": "hospital@healthbridge.in",
        "password": "hospital123",
        "role": "hospital_staff",
    },
    {
        "email": "compliance@healthbridge.in",
        "password": "compliance123",
        "role": "compliance_officer",
    },
    {
        "email": "auditor@healthbridge.in",
        "password": "auditor123",
        "role": "auditor",
    },
]

HOSPITALS = [
    ("HSP-001", "Narayana Health City, Bengaluru"),
    ("HSP-002", "Manipal Hospital, Old Airport Road, Bengaluru"),
    ("HSP-003", "Apollo Hospitals, Bannerghatta Road, Bengaluru"),
    ("HSP-004", "Fortis Hospital, Cunningham Road, Bengaluru"),
    ("HSP-005", "Columbia Asia Hospital, Whitefield, Bengaluru"),
]

PATIENTS = [
    ("PAT-IN-001", "Riya Sharma"),
    ("PAT-IN-002", "Arjun Mehta"),
    ("PAT-IN-003", "Kavitha Nair"),
    ("PAT-IN-004", "Vikram Singh"),
    ("PAT-IN-005", "Ananya Iyer"),
    ("PAT-IN-006", "Rahul Desai"),
    ("PAT-IN-007", "Priya Menon"),
    ("PAT-IN-008", "Suresh Reddy"),
    ("PAT-IN-009", "Neha Kapoor"),
    ("PAT-IN-010", "Aditya Joshi"),
    ("PAT-IN-011", "Divya Pillai"),
    ("PAT-IN-012", "Karan Malhotra"),
    ("PAT-IN-013", "Meera Krishnan"),
    ("PAT-IN-014", "Nikhil Bhatia"),
    ("PAT-IN-015", "Sneha Agarwal"),
    ("PAT-IN-016", "Rohan Varma"),
    ("PAT-IN-017", "Pooja Kulkarni"),
    ("PAT-IN-018", "Amit Ghosh"),
    ("PAT-IN-019", "Lakshmi Subramaniam"),
    ("PAT-IN-020", "Harsh Patel"),
]

TREATMENTS = [
    ("Laparoscopic cholecystectomy", "Cholelithiasis", ["Lap chole", "USG abdomen"]),
    ("Total knee replacement (TKR)", "Osteoarthritis knee", ["TKR implant", "Physio"]),
    ("MRI lumbar spine without contrast", "Lumbar disc disease", ["MRI LS spine"]),
    ("Coronary angioplasty with stent", "CAD — ACS", ["PTCA", "Drug-eluting stent"]),
    ("Caesarean section delivery", "Pregnancy — term", ["LSCS", "Neonatal care"]),
    ("Dialysis session (hemodialysis)", "ESRD", ["HD session", "Labs"]),
    ("Appendectomy (open)", "Acute appendicitis", ["Appendectomy"]),
    ("Cataract surgery (phaco + IOL)", "Senile cataract", ["Phaco", "IOL"]),
    ("Hernia repair (mesh)", "Inguinal hernia", ["Mesh hernioplasty"]),
    ("Chemotherapy day-care cycle", "Breast carcinoma", ["Chemo infusion"]),
    ("ACL reconstruction", "ACL tear", ["Arthroscopy", "Graft"]),
    ("Pneumonia — inpatient ward care", "CAP", ["IV antibiotics", "Oxygen"]),
    ("Thyroidectomy", "Multinodular goitre", ["Thyroidectomy"]),
    ("Fracture femur — ORIF", "Femur shaft fracture", ["ORIF", "Implants"]),
    ("Pacemaker dual-chamber implant", "Complete heart block", ["PPI dual chamber"]),
]

DOCTORS = [
    "Dr. Sunita Rao, MS",
    "Dr. Rajesh Khanna, MS (Ortho)",
    "Dr. Anil Verma, MD (Radiology)",
    "Dr. Deepak Malhotra, DM (Cardiology)",
    "Dr. Lakshmi Narayanan, MD (O&G)",
    "Dr. Manoj Pillai, DM (Nephrology)",
    "Dr. Farah Khan, MS",
    "Dr. Vivek Nair, MS (Ophthal)",
]

COVERAGE = [
    "Family Floater Gold",
    "Corporate Group Mediclaim",
    "Senior Citizen Plan",
    "Individual Health Plus",
    "Employee Health Scheme",
]

STATUSES = [
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
]


def claim_to_out(c: Claim) -> ClaimOut:
    procedures: list[str]
    try:
        procedures = json.loads(c.procedures or "[]")
    except json.JSONDecodeError:
        procedures = []
    findings: list[str]
    try:
        findings = json.loads(c.ml_findings or "[]")
    except json.JSONDecodeError:
        findings = []
    return ClaimOut(
        id=c.id,
        patientId=c.patient_id,
        patientName=c.patient_name,
        hospital=c.hospital,
        hospitalId=c.hospital_id,
        treatmentType=c.treatment_type,
        amount=c.amount,
        submittedAt=c.submitted_at,
        status=c.status,  # type: ignore[arg-type]
        riskScore=c.risk_score,
        riskLevel=c.risk_level,  # type: ignore[arg-type]
        policyId=c.policy_id,
        coverageType=c.coverage_type,
        validityEnd=c.validity_end,
        diagnosis=c.diagnosis,
        procedures=procedures,
        doctor=c.doctor,
        admissionDate=c.admission_date,
        dischargeDate=c.discharge_date,
        notes=c.notes,
        mlProbability=c.ml_probability,
        mlFindings=findings,
    )


def score_claim_fields(
    *,
    amount: float,
    patient_age: int,
    patient_gender: str,
    claim_duration_days: int,
    doctor_fee: float,
    hospital_id: str,
    treatment_type: str,
    diagnosis: str,
) -> dict[str, Any]:
    if not fraud_model.loaded:
        # Fallback heuristic until model is trained
        score = min(95.0, max(5.0, (amount / 50_000) + (doctor_fee / amount * 40 if amount else 0)))
        level: RiskLevel = "high" if score >= 70 else "medium" if score >= 40 else "low"
        probability = score / 100
        return {
            "probability": probability,
            "risk_score": round(score, 1),
            "risk_level": level,
            "label": "fraud" if probability >= 0.5 else "legitimate",
            "findings": ["Heuristic score — train ML model for production predictions."],
            "model_version": "heuristic",
        }
    return fraud_model.predict_row(
        {
            "amount": amount,
            "patient_age": patient_age,
            "patient_gender": patient_gender,
            "claim_duration_days": claim_duration_days,
            "doctor_fee": doctor_fee,
            "hospital_id": hospital_id,
            "treatment_type": treatment_type,
            "diagnosis": diagnosis,
        }
    )


async def seed_if_empty(db: AsyncSession) -> None:
    user_count = await db.scalar(select(func.count()).select_from(User))
    if not user_count:
        for u in DEMO_USERS:
            db.add(
                User(
                    email=u["email"],
                    name=role_display(u["role"]),  # type: ignore[arg-type]
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                )
            )
        await db.commit()

    hospital_count = await db.scalar(select(func.count()).select_from(Hospital))
    if not hospital_count:
        for index, (hospital_id, name) in enumerate(HOSPITALS):
            db.add(
                Hospital(
                    id=hospital_id,
                    name=name,
                    city="Bengaluru",
                    state="Karnataka",
                    phone=f"+91-80-4000-{1000 + index}",
                    tier="Tier A" if index < 3 else "Tier B",
                    beds=220 + index * 40,
                    specialties=json.dumps(["Cardiology", "Orthopaedics", "General surgery"]),
                    avg_claim_amount=260000 + index * 18000,
                    fraud_rate=0.04 + index * 0.01,
                    provider_risk_score=18 + index * 7,
                )
            )
        await db.commit()

    holder_count = await db.scalar(select(func.count()).select_from(PolicyHolder))
    if not holder_count:
        today = date.today()
        for index, (patient_id, patient_name) in enumerate(PATIENTS):
            db.add(
                PolicyHolder(
                    id=f"HOLDER-IN-{index + 1:03d}",
                    policy_id=f"POL-IN-{1000 + index}",
                    member_name=patient_name,
                    patient_id=patient_id,
                    coverage_type=COVERAGE[index % len(COVERAGE)],
                    sum_insured=500000 + (index % 4) * 250000,
                    validity_start=(today - timedelta(days=180)).isoformat(),
                    validity_end=(today + timedelta(days=180 + index * 10)).isoformat(),
                    age=25 + (index * 3 % 55),
                    gender=["Female", "Male", "Other"][index % 3],
                    city="Bengaluru",
                    phone=f"+91-90000-{10000 + index}",
                    email=f"member{index + 1}@example.test",
                )
            )
        await db.commit()

    hospital_user = await db.scalar(select(User).where(User.email == "hospital@healthbridge.in"))
    membership = await db.scalar(
        select(HospitalMembership).where(HospitalMembership.user_id == hospital_user.id)
    ) if hospital_user else None
    if hospital_user and not membership:
        db.add(HospitalMembership(user_id=hospital_user.id, hospital_id="HSP-001"))
        await db.commit()

    claim_count = await db.scalar(select(func.count()).select_from(Claim))
    if claim_count:
        return

    today = date.today()
    for i in range(20):
        patient_id, patient_name = PATIENTS[i]
        hospital_id, hospital = HOSPITALS[i % len(HOSPITALS)]
        treatment, diagnosis, procedures = TREATMENTS[i % len(TREATMENTS)]
        amount = [
            285000,
            420000,
            18500,
            950000,
            125000,
            3100000,
            67000,
            145000,
            890000,
            220000,
            15500,
            540000,
            112000,
            780000,
            198000,
            425000,
            33000,
            265000,
            1520000,
            98000,
        ][i]
        duration = [3, 7, 1, 4, 5, 1, 3, 1, 2, 4, 1, 6, 3, 8, 5, 3, 1, 2, 4, 1][i]
        age = [34, 58, 41, 62, 29, 67, 25, 71, 45, 52, 38, 33, 49, 56, 44, 31, 27, 60, 73, 39][i]
        gender = ["Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male"][
            i % 10
        ]
        doctor_fee = round(amount * (0.1 + (i % 5) * 0.03), 2)
        admission = today - timedelta(days=30 - i)
        discharge = admission + timedelta(days=max(1, duration) - 1)
        submitted = discharge + timedelta(days=1)

        pred = score_claim_fields(
            amount=amount,
            patient_age=age,
            patient_gender=gender,
            claim_duration_days=duration,
            doctor_fee=doctor_fee,
            hospital_id=hospital_id,
            treatment_type=treatment,
            diagnosis=diagnosis,
        )
        status = STATUSES[i % len(STATUSES)]
        if pred["risk_level"] == "high" and status == "approved":
            status = "flagged"

        db.add(
            Claim(
                id=f"CLM-IN-2026-{i + 1:03d}",
                patient_id=patient_id,
                patient_name=patient_name,
                hospital=hospital,
                hospital_id=hospital_id,
                treatment_type=treatment,
                amount=float(amount),
                submitted_at=submitted.isoformat(),
                status=status,
                risk_score=float(pred["risk_score"]),
                risk_level=str(pred["risk_level"]),
                policy_id=f"POL-IN-{1000 + i}",
                coverage_type=COVERAGE[i % len(COVERAGE)],
                validity_end=(today + timedelta(days=180 + i * 10)).isoformat(),
                diagnosis=diagnosis,
                procedures=json.dumps(procedures),
                doctor=DOCTORS[i % len(DOCTORS)],
                admission_date=admission.isoformat(),
                discharge_date=discharge.isoformat(),
                notes="Seeded operational claim for HealthBridge demo.",
                patient_age=age,
                patient_gender=gender,
                claim_duration_days=duration,
                doctor_fee=doctor_fee,
                ml_probability=float(pred["probability"]),
                ml_findings=json.dumps(pred["findings"]),
            )
        )

    db.add(
        Notification(
            title="High-risk claim queued",
            body="ML model flagged CLM-IN-2026-006 for elevated dialysis billing.",
            type="fraud",
            priority="high",
        )
    )
    db.add(
        Notification(
            title="Documents requested",
            body="Hospital response pending for CLM-IN-2026-007.",
            type="docs",
            priority="medium",
        )
    )
    db.add(
        AuditEvent(
            actor="system",
            action="seed",
            entity="database",
            detail="Initial users, claims, and notifications seeded.",
        )
    )
    await db.commit()
