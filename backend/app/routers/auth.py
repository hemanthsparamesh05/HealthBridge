from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, decode_token, get_current_user, verify_password
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, MfaRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    pending = create_access_token(user.email, user.role, expires_minutes=10, stage="mfa")
    return TokenResponse(access_token=pending, mfa_required=True)


@router.post("/mfa", response_model=TokenResponse)
async def verify_mfa(body: MfaRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    if not body.code.isdigit() or len(body.code) != 6:
        raise HTTPException(status_code=400, detail="Enter a 6-digit code")
    # The password step must have succeeded: require its short-lived MFA token.
    pending = decode_token(body.mfa_token, expected_stage="mfa")
    if pending["sub"].lower() != str(body.email).lower():
        raise HTTPException(status_code=401, detail="MFA session does not match this user")
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    token = create_access_token(user.email, user.role)
    return TokenResponse(access_token=token, mfa_required=False)


@router.get("/me", response_model=UserOut)
async def me(user: UserOut = Depends(get_current_user)) -> UserOut:
    return user
