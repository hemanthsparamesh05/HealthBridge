from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User
from app.cache import TTLCache
from app.schemas import UserOut, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)
ALGORITHM = "HS256"
_user_cache = TTLCache(ttl_seconds=60)


def _prep(password: str) -> str:
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_prep(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prep(plain), hashed)


def create_access_token(
    subject: str,
    role: str,
    expires_minutes: Optional[int] = None,
    stage: str = "access",
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "role": role, "exp": expire, "stage": stage}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str, expected_stage: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if payload.get("stage", "access") != expected_stage or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = credentials.credentials
    cached_user = _user_cache.get(token)
    if cached_user is not None:
        return cached_user
    payload = decode_token(token, expected_stage="access")
    email: str = payload["sub"]

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    out = UserOut(id=str(user.id), name=user.name, email=user.email, role=user.role)  # type: ignore[arg-type]
    _user_cache.set(token, out)
    return out


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[UserOut]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def role_display(role: UserRole) -> str:
    return {
        "insurance_admin": "Insurance Admin",
        "claim_reviewer": "Claim Reviewer",
        "hospital_staff": "Hospital Staff",
        "compliance_officer": "Compliance Officer",
        "auditor": "Auditor",
    }[role]
