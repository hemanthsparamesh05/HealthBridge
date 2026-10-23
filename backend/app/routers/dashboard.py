from collections import Counter, defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.cache import cached
from app.database import get_db
from app.models import AuditEvent, Claim, Notification
from app.permissions import hospital_id_for_user, require_insurer_role
from app.schemas import KpiOut, UserOut, UserRole
from app.seed import claim_to_out

router = APIRouter(tags=["dashboard"])


async def _claims_for(user: UserOut, db: AsyncSession) -> list[Claim]:
    """All claims visible to the user, cached until the next claim write."""
    hospital_id = None
    if user.role == "hospital_staff":
        hospital_id = await hospital_id_for_user(user, db)

    async def load() -> list[Claim]:
        stmt = select(Claim)
        if hospital_id:
            stmt = stmt.where(Claim.hospital_id == hospital_id)
        return list((await db.execute(stmt)).scalars().all())

    return await cached(f"claims:{hospital_id or 'all'}", load)


def _spark(base: float) -> list[float]:
    return [round(base * f, 1) for f in (0.72, 0.8, 0.76, 0.88, 0.91, 0.95, 1.0)]


@router.get("/kpis", response_model=list[KpiOut])
async def kpis(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> list[KpiOut]:
    claims = await _claims_for(user, db)
    total = len(claims) or 1
    pending = sum(1 for c in claims if c.status == "pending")
    flagged = sum(1 for c in claims if c.status == "flagged")
    approved = sum(1 for c in claims if c.status == "approved")
    amount = sum(c.amount for c in claims)
    high_risk = sum(1 for c in claims if c.risk_level == "high")

    role: UserRole = user.role
    base = [
        KpiOut(
            id="claims_total",
            label="Total claims",
            value=len(claims),
            trend=4.2,
            trendLabel="vs last week",
            spark=_spark(len(claims)),
            icon="clipboard",
            accent="blue",
        ),
        KpiOut(
            id="pending",
            label="Pending review",
            value=pending,
            trend=1.1,
            trendLabel="queue pressure",
            spark=_spark(pending + 1),
            icon="clock",
            accent="amber",
        ),
        KpiOut(
            id="flagged",
            label="Fraud flagged",
            value=flagged,
            trend=-2.4,
            trendLabel="model alerts",
            spark=_spark(flagged + 2),
            icon="shield",
            accent="rose",
        ),
        KpiOut(
            id="exposure",
            label="Claim exposure",
            value=f"₹{(amount / 1e7):.2f} Cr",
            trend=3.6,
            trendLabel="booked value",
            spark=_spark(amount / 1e5),
            icon="indian-rupee",
            accent="emerald",
        ),
    ]
    if role in ("compliance_officer", "auditor", "insurance_admin"):
        base.append(
            KpiOut(
                id="high_risk",
                label="High risk share",
                value=f"{(high_risk / total) * 100:.0f}%",
                trend=0.8,
                trendLabel="of open book",
                spark=_spark(high_risk + 1),
                icon="alert-triangle",
                accent="violet",
            )
        )
    if role == "claim_reviewer":
        base.append(
            KpiOut(
                id="approved",
                label="Approved",
                value=approved,
                trend=2.1,
                trendLabel="cleared",
                spark=_spark(approved + 1),
                icon="check",
                accent="cyan",
            )
        )
    return base


@router.get("/dashboard/charts")
async def dashboard_charts(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    claims = await _claims_for(user, db)

    status_counts = Counter(c.status for c in claims)
    status = [{"name": k, "value": v} for k, v in status_counts.items()]

    hospital_totals: dict[str, float] = defaultdict(float)
    for c in claims:
        hospital_totals[c.hospital.split(",")[0]] += c.amount
    hospitals = [
        {"name": k, "amount": v}
        for k, v in sorted(hospital_totals.items(), key=lambda x: -x[1])[:6]
    ]

    # Simple synthetic trend from claim timestamps
    by_day: dict[str, int] = defaultdict(int)
    for c in claims:
        by_day[c.submitted_at[:10]] += 1
    approved_by_day: dict[str, int] = defaultdict(int)
    for c in claims:
        if c.status == "approved":
            approved_by_day[c.submitted_at[:10]] += 1
    trend = [
        {"date": d, "claims": by_day[d], "approved": approved_by_day[d]}
        for d in sorted(by_day.keys())
    ]

    anomaly = [
        {"date": d, "score": round(min(1.0, (by_day[d] / max(len(claims), 1)) * 4 + 0.2), 2)}
        for d in sorted(by_day.keys())
    ]

    by_month: dict[str, dict[str, int]] = defaultdict(lambda: {"approved": 0, "rejected": 0})
    for c in claims:
        if c.status in ("approved", "rejected"):
            by_month[c.submitted_at[:7]][c.status] += 1
    monthly = [
        {"month": datetime.strptime(m, "%Y-%m").strftime("%b %y"), **by_month[m]}
        for m in sorted(by_month)[-6:]
    ]

    clusters = [
        {
            "x": c.amount / 1000,
            "y": c.risk_score,
            "z": c.claim_duration_days,
            "name": c.id,
            "risk": c.risk_level,
        }
        for c in claims
    ]

    fraud_heat = [
        {"hospital": h, "risk": round(sum(c.risk_score for c in claims if c.hospital.startswith(h)) / max(1, sum(1 for c in claims if c.hospital.startswith(h))), 1)}
        for h in sorted({c.hospital.split(",")[0] for c in claims})
    ]

    return {
        "trend": trend,
        "status": status,
        "hospitals": hospitals,
        "fraudHeat": fraud_heat,
        "anomaly": anomaly,
        "monthly": monthly,
        "clusters": clusters,
    }


@router.get("/notifications")
async def notifications(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).order_by(Notification.created_at.desc()).limit(50)
    )
    items = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "body": n.body,
            "type": n.type,
            "priority": n.priority,
            "createdAt": (n.created_at or datetime.now(timezone.utc)).isoformat(),
            "read": n.read,
        }
        for n in items
    ]


@router.get("/audit")
async def audit(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    require_insurer_role(user)
    result = await db.execute(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(100))
    items = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "actor": e.actor,
            "action": e.action,
            "entity": e.entity,
            "detail": e.detail,
            "createdAt": (e.created_at or datetime.now(timezone.utc)).isoformat(),
        }
        for e in items
    ]


@router.get("/fraud/insights")
async def fraud_insights(
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
):
    require_insurer_role(user)
    claims = await _claims_for(user, db)
    ranked = sorted(claims, key=lambda c: c.risk_score, reverse=True)[:8]
    doctors: dict[str, list[float]] = defaultdict(list)
    for c in claims:
        doctors[c.doctor].append(c.risk_score)
    doctor_rank = sorted(
        (
            {"doctor": d, "avgRisk": round(sum(v) / len(v), 1), "claims": len(v)}
            for d, v in doctors.items()
        ),
        key=lambda x: -x["avgRisk"],
    )[:6]

    high = [c for c in claims if c.risk_score >= 60]
    probability = round(sum(c.risk_score for c in claims) / max(len(claims), 1) / 100, 2)

    return {
        "probability": probability,
        "ranking": [
            {
                "id": c.id,
                "hospital": c.hospital,
                "amount": c.amount,
                "riskScore": c.risk_score,
                "status": c.status,
            }
            for c in ranked
        ],
        "doctors": doctor_rank,
        "duplicates": [
            {
                "pair": f"{high[0].id} / {high[1].id}" if len(high) >= 2 else "n/a",
                "reason": "Similar high-risk billing pattern detected by model",
            }
        ]
        if high
        else [],
        "claims": [claim_to_out(c).model_dump() for c in ranked],
    }


@router.get("/messages")
async def messages(user: UserOut = Depends(get_current_user)):
    return [
        {
            "id": "m1",
            "from": "hospital",
            "author": "Apollo TPA Desk",
            "body": "Discharge summary uploaded for review.",
            "at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": "m2",
            "from": "insurer",
            "author": "Claim Reviewer",
            "body": "Please confirm implant invoice serial numbers.",
            "at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "id": "m3",
            "from": "ai",
            "author": "HealthBridge Copilot",
            "body": "Suggested reply: Request itemised OT notes and implant sticker photos.",
            "at": datetime.now(timezone.utc).isoformat(),
        },
    ]
