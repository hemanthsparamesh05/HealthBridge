from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, get_optional_user
from app.database import get_db
from app.models import Claim
from app.permissions import require_claim_access
from app.schemas import FraudPredictRequest, FraudPredictResponse, ModelInfo, UserOut
from app.seed import score_claim_fields
from ml import fraud_model

router = APIRouter(prefix="/fraud", tags=["fraud"])


@router.get("/model", response_model=ModelInfo)
async def model_info(_: UserOut | None = Depends(get_optional_user)) -> ModelInfo:
    meta = fraud_model.meta
    return ModelInfo(
        loaded=fraud_model.loaded,
        model_version=meta.get("model_version"),
        trained_at=meta.get("trained_at"),
        algorithm=meta.get("algorithm"),
        metrics=meta.get("metrics"),
        feature_count=meta.get("feature_count"),
    )


@router.post("/predict", response_model=FraudPredictResponse)
async def predict(
    body: FraudPredictRequest,
    db: AsyncSession = Depends(get_db),
    user: UserOut = Depends(get_current_user),
) -> FraudPredictResponse:
    amount = body.amount
    patient_age = body.patient_age
    patient_gender = body.patient_gender
    claim_duration_days = body.claim_duration_days
    doctor_fee = body.doctor_fee
    hospital_id = body.hospital_id
    treatment_type = body.treatment_type
    diagnosis = body.diagnosis

    if body.claim_id:
        claim = await db.get(Claim, body.claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        await require_claim_access(claim, user, db)
        amount = claim.amount
        patient_age = claim.patient_age
        patient_gender = claim.patient_gender
        claim_duration_days = claim.claim_duration_days
        doctor_fee = claim.doctor_fee
        hospital_id = claim.hospital_id
        treatment_type = claim.treatment_type
        diagnosis = claim.diagnosis

    if amount is None:
        raise HTTPException(status_code=400, detail="Provide claim_id or amount")

    pred = score_claim_fields(
        amount=amount,
        patient_age=patient_age,
        patient_gender=patient_gender,
        claim_duration_days=claim_duration_days,
        doctor_fee=doctor_fee,
        hospital_id=hospital_id,
        treatment_type=treatment_type,
        diagnosis=diagnosis,
    )
    return FraudPredictResponse(
        probability=float(pred["probability"]),
        risk_score=float(pred["risk_score"]),
        risk_level=pred["risk_level"],  # type: ignore[arg-type]
        label=pred.get("label", "fraud" if pred["probability"] >= 0.5 else "legitimate"),  # type: ignore[arg-type]
        findings=list(pred["findings"]),
        model_version=str(pred.get("model_version", "unknown")),
    )


@router.post("/reload", response_model=ModelInfo)
async def reload_model(user: UserOut = Depends(get_current_user)) -> ModelInfo:
    if user.role != "insurance_admin":
        raise HTTPException(status_code=403, detail="Only insurance admins can reload the model")
    fraud_model.reload()
    return await model_info(None)
