from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Claim, PolicyHolder
from app.permissions import require_insurer_role
from app.schemas import PolicyHolderOut, UserOut

router = APIRouter(prefix="/policy-holders", tags=["policy-holders"])


def _holder_out(h: PolicyHolder, claim_count: int = 0) -> PolicyHolderOut:
    return PolicyHolderOut(
        id=h.id,
        policyId=h.policy_id,
        memberName=h.member_name,
        patientId=h.patient_id,
        coverageType=h.coverage_type,
        sumInsured=h.sum_insured,
        validityStart=h.validity_start,
        validityEnd=h.validity_end,
        status=h.status,
        age=h.age,
        gender=h.gender,
        city=h.city,
        phone=h.phone,
        email=h.email,
        claimCount=claim_count,
    )


@router.get("", response_model=list[PolicyHolderOut])
async def list_policy_holders(
    q: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> list[PolicyHolderOut]:
    require_insurer_role(user)
    stmt = select(PolicyHolder).order_by(PolicyHolder.member_name)
    if status:
        stmt = stmt.where(PolicyHolder.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (PolicyHolder.member_name.ilike(like))
            | (PolicyHolder.policy_id.ilike(like))
            | (PolicyHolder.patient_id.ilike(like))
        )
    result = await db.execute(stmt)
    holders = list(result.scalars().all())

    counts: dict[str, int] = {}
    count_rows = await db.execute(select(Claim.policy_id, func.count()).group_by(Claim.policy_id))
    for pid, cnt in count_rows.all():
        counts[str(pid)] = int(cnt)

    return [_holder_out(h, counts.get(h.policy_id, 0)) for h in holders]


@router.get("/{holder_id}", response_model=PolicyHolderOut)
async def get_policy_holder(
    holder_id: str,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> PolicyHolderOut:
    require_insurer_role(user)
    holder = await db.get(PolicyHolder, holder_id)
    if not holder:
        # also allow lookup by policy id
        result = await db.execute(select(PolicyHolder).where(PolicyHolder.policy_id == holder_id))
        holder = result.scalar_one_or_none()
    if not holder:
        raise HTTPException(status_code=404, detail="Policy holder not found")
    claim_count = await db.scalar(
        select(func.count()).select_from(Claim).where(Claim.policy_id == holder.policy_id)
    )
    return _holder_out(holder, int(claim_count or 0))
