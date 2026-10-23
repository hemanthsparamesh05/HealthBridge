from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Claim, HospitalMembership
from app.schemas import UserOut

DECISION_ROLES = {"insurance_admin", "claim_reviewer"}
INSURER_ROLES = DECISION_ROLES | {"compliance_officer", "auditor"}


async def hospital_id_for_user(user: UserOut, db: AsyncSession) -> str:
    membership = await db.scalar(
        select(HospitalMembership).where(HospitalMembership.user_id == int(user.id))
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hospital user is not linked to a hospital",
        )
    return membership.hospital_id


async def require_claim_access(claim: Claim, user: UserOut, db: AsyncSession) -> None:
    if user.role != "hospital_staff":
        return
    if claim.hospital_id != await hospital_id_for_user(user, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Claim access denied")


def require_decision_role(user: UserOut) -> None:
    if user.role not in DECISION_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only claim reviewers and insurance admins may make claim decisions",
        )


def require_insurer_role(user: UserOut) -> None:
    if user.role not in INSURER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This insurer workspace is not available to hospital users",
        )
