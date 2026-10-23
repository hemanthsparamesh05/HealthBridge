from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_ROOT / "data"
MODELS_DIR = BACKEND_ROOT / "models"
ARTIFACTS_DIR = MODELS_DIR / "artifacts"
UPLOADS_DIR = DATA_DIR / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "HealthBridge API"
    api_prefix: str = "/api"
    secret_key: str = "healthbridge-dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 12
    database_url: str = f"sqlite+aiosqlite:///{BACKEND_ROOT / 'data' / 'healthbridge.db'}"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    model_path: Path = ARTIFACTS_DIR / "fraud_model.joblib"
    meta_path: Path = ARTIFACTS_DIR / "fraud_meta.json"
    provider_model_path: Path = ARTIFACTS_DIR / "provider_fraud_model.joblib"
    provider_meta_path: Path = ARTIFACTS_DIR / "provider_fraud_meta.json"
    max_upload_mb: int = 15
    allowed_upload_types: list[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]


settings = Settings()
DATA_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
