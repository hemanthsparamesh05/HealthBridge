import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.cache import invalidate_claims
from app.database import get_db
from app.models import AuditEvent, Claim, Hospital, Notification, PolicyHolder
from app.permissions import hospital_id_for_user, require_claim_access, require_decision_role
from app.schemas import ClaimCreate, ClaimOut, ClaimStatusUpdate, UserOut
from app.seed import claim_to_out, score_claim_fields

router = APIRouter(prefix="/claims", tags=["claims"])


@router.get("", response_model=list[ClaimOut])
async def list_claims(
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> list[ClaimOut]:
    stmt = select(Claim).order_by(Claim.submitted_at.desc())
    if user.role == "hospital_staff":
        stmt = stmt.where(Claim.hospital_id == await hospital_id_for_user(user, db))
    if status and status != "all":
        stmt = stmt.where(Claim.status == status)
    result = await db.execute(stmt)
    return [claim_to_out(c) for c in result.scalars().all()]


SUBMIT_ROLES = {"hospital_staff", "insurance_admin", "claim_reviewer"}


@router.get("/form-options")
async def claim_form_options(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    """Lightweight lookup data for the "Apply for claim" form."""
    if user.role not in SUBMIT_ROLES:
        raise HTTPException(status_code=403, detail="Your role cannot submit claims")
    holders = (
        await db.execute(
            select(
                PolicyHolder.policy_id,
                PolicyHolder.member_name,
                PolicyHolder.coverage_type,
                PolicyHolder.sum_insured,
                PolicyHolder.validity_end,
            )
            .where(PolicyHolder.status == "active")
            .order_by(PolicyHolder.member_name)
        )
    ).all()
    hosp_stmt = select(Hospital.id, Hospital.name).order_by(Hospital.name)
    fixed_hospital = None
    if user.role == "hospital_staff":
        fixed_hospital = await hospital_id_for_user(user, db)
        hosp_stmt = hosp_stmt.where(Hospital.id == fixed_hospital)
    hospitals = (await db.execute(hosp_stmt)).all()
    return {
        "policies": [
            {
                "policyId": h.policy_id,
                "memberName": h.member_name,
                "coverageType": h.coverage_type,
                "sumInsured": h.sum_insured,
                "validityEnd": h.validity_end,
            }
            for h in holders
        ],
        "hospitals": [{"id": h.id, "name": h.name} for h in hospitals],
        "fixedHospitalId": fixed_hospital,
    }


@router.post("", response_model=ClaimOut, status_code=201)
async def create_claim(
    body: ClaimCreate,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> ClaimOut:
    if user.role not in SUBMIT_ROLES:
        raise HTTPException(status_code=403, detail="Your role cannot submit claims")
    if body.discharge_date < body.admission_date:
        raise HTTPException(status_code=422, detail="Discharge date cannot be before admission date")

    if user.role == "hospital_staff":
        hospital_id = await hospital_id_for_user(user, db)
    elif body.hospital_id:
        hospital_id = body.hospital_id
    else:
        raise HTTPException(status_code=422, detail="Select the treating hospital")
    hospital = await db.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=403, detail="Linked hospital no longer exists")
    holder = await db.scalar(select(PolicyHolder).where(PolicyHolder.policy_id == body.policy_id))
    if not holder or holder.status != "active":
        raise HTTPException(status_code=422, detail="Active policy not found")
    if holder.validity_end and holder.validity_end < body.admission_date.isoformat():
        raise HTTPException(status_code=422, detail="Policy had expired before the admission date")
    if body.amount > holder.sum_insured:
        raise HTTPException(
            status_code=422,
            detail=f"Claim amount exceeds the policy sum insured (₹{holder.sum_insured:,.0f})",
        )

    duration = (body.discharge_date - body.admission_date).days + 1
    pred = score_claim_fields(
        amount=body.amount,
        patient_age=holder.age,
        patient_gender=holder.gender,
        claim_duration_days=duration,
        doctor_fee=body.doctor_fee,
        hospital_id=hospital_id,
        treatment_type=body.treatment_type,
        diagnosis=body.diagnosis,
    )
    submitted_at = datetime.now(timezone.utc)
    claim = Claim(
        id=f"CLM-IN-{submitted_at.strftime('%Y%m%d%H%M%S%f')}",
        patient_id=holder.patient_id,
        patient_name=holder.member_name,
        hospital=hospital.name,
        hospital_id=hospital_id,
        treatment_type=body.treatment_type,
        amount=body.amount,
        submitted_at=submitted_at.isoformat(),
        status="pending",
        risk_score=float(pred["risk_score"]),
        risk_level=str(pred["risk_level"]),
        policy_id=holder.policy_id,
        coverage_type=holder.coverage_type,
        validity_end=holder.validity_end,
        diagnosis=body.diagnosis,
        procedures=json.dumps(body.procedures),
        doctor=body.doctor,
        admission_date=body.admission_date.isoformat(),
        discharge_date=body.discharge_date.isoformat(),
        notes=body.notes,
        patient_age=holder.age,
        patient_gender=holder.gender,
        claim_duration_days=duration,
        doctor_fee=body.doctor_fee,
        ml_probability=float(pred["probability"]),
        ml_findings=json.dumps(pred["findings"]),
    )
    db.add(claim)
    db.add(
        AuditEvent(
            actor=user.email,
            action="claim_submitted",
            entity=claim.id,
            detail=f"Submitted by {hospital.name}; risk={pred['risk_score']}",
        )
    )
    if pred["risk_level"] == "high":
        db.add(
            Notification(
                title="High-risk claim submitted",
                body=f"{claim.id} requires reviewer attention.",
                type="fraud",
                priority="high",
            )
        )
    await db.commit()
    invalidate_claims()
    await db.refresh(claim)
    return claim_to_out(claim)


@router.get("/{claim_id}", response_model=ClaimOut)
async def get_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> ClaimOut:
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    await require_claim_access(claim, user, db)
    return claim_to_out(claim)


@router.patch("/{claim_id}/status", response_model=ClaimOut)
async def update_status(
    claim_id: str,
    body: ClaimStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> ClaimOut:
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    require_decision_role(user)
    if claim.status in ("approved", "rejected") and body.status != claim.status:
        raise HTTPException(status_code=409, detail=f"Claim is already {claim.status} and is closed")
    claim.status = body.status
    if body.notes:
        claim.notes = body.notes
    db.add(
        AuditEvent(
            actor=user.email,
            action=f"status:{body.status}",
            entity=claim_id,
            detail=body.notes or "",
        )
    )
    await db.commit()
    invalidate_claims()
    await db.refresh(claim)
    return claim_to_out(claim)


@router.post("/{claim_id}/rescore", response_model=ClaimOut)
async def rescore_claim(
    claim_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> ClaimOut:
    claim = await db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    require_decision_role(user)
    pred = score_claim_fields(
        amount=claim.amount,
        patient_age=claim.patient_age,
        patient_gender=claim.patient_gender,
        claim_duration_days=claim.claim_duration_days,
        doctor_fee=claim.doctor_fee,
        hospital_id=claim.hospital_id,
        treatment_type=claim.treatment_type,
        diagnosis=claim.diagnosis,
    )
    claim.risk_score = float(pred["risk_score"])
    claim.risk_level = str(pred["risk_level"])
    claim.ml_probability = float(pred["probability"])
    claim.ml_findings = json.dumps(pred["findings"])
    db.add(
        AuditEvent(
            actor=user.email,
            action="rescore",
            entity=claim_id,
            detail=f"probability={pred['probability']}",
        )
    )
    await db.commit()
    invalidate_claims()
    await db.refresh(claim)
    return claim_to_out(claim)
