import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Claim, Hospital
from app.permissions import require_insurer_role
from app.schemas import HospitalOut, UserOut

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


def _hospital_out(h: Hospital, claim_count: int = 0) -> HospitalOut:
    try:
        specialties = json.loads(h.specialties or "[]")
    except json.JSONDecodeError:
        specialties = []
    return HospitalOut(
        id=h.id,
        name=h.name,
        city=h.city,
        state=h.state,
        phone=h.phone,
        tier=h.tier,
        networkStatus=h.network_status,
        beds=h.beds,
        specialties=specialties,
        avgClaimAmount=h.avg_claim_amount,
        fraudRate=h.fraud_rate,
        providerRiskScore=h.provider_risk_score,
        claimCount=claim_count,
    )


@router.get("", response_model=list[HospitalOut])
async def list_hospitals(
    q: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> list[HospitalOut]:
    require_insurer_role(user)
    stmt = select(Hospital).order_by(Hospital.name)
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Hospital.name.ilike(like)) | (Hospital.city.ilike(like)))
    result = await db.execute(stmt)
    hospitals = list(result.scalars().all())

    counts: dict[str, int] = {}
    count_rows = await db.execute(
        select(Claim.hospital_id, func.count()).group_by(Claim.hospital_id)
    )
    for hid, cnt in count_rows.all():
        counts[str(hid)] = int(cnt)

    return [_hospital_out(h, counts.get(h.id, 0)) for h in hospitals]


@router.get("/{hospital_id}", response_model=HospitalOut)
async def get_hospital(
    hospital_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> HospitalOut:
    require_insurer_role(user)
    hospital = await db.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    claim_count = await db.scalar(
        select(func.count()).select_from(Claim).where(Claim.hospital_id == hospital_id)
    )
    return _hospital_out(hospital, int(claim_count or 0))
