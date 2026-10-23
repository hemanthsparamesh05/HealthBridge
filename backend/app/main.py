from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import settings
from app.database import SessionLocal, init_db
from app.routers import auth, claims, dashboard, documents, fraud, hospitals, policy_holders
from app.seed import seed_if_empty
from ml import fraud_model


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    async with SessionLocal() as db:
        await seed_if_empty(db)
    if not fraud_model.loaded:
        fraud_model.reload()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = settings.api_prefix
app.include_router(auth.router, prefix=api)
app.include_router(claims.router, prefix=api)
app.include_router(documents.router, prefix=api)
app.include_router(fraud.router, prefix=api)
app.include_router(dashboard.router, prefix=api)
app.include_router(hospitals.router, prefix=api)
app.include_router(policy_holders.router, prefix=api)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": fraud_model.loaded,
        "model_version": fraud_model.meta.get("model_version"),
    }
