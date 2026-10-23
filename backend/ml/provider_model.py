"""Provider-level fraud detection (rohitrox-style aggregated features)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.config import ARTIFACTS_DIR, settings

PROVIDER_FEATURES = [
    "claim_count",
    "total_reimbursement",
    "avg_reimbursement",
    "inpatient_ratio",
    "unique_beneficiaries",
    "unique_physicians",
    "avg_claim_days",
    "chronic_condition_rate",
    "diagnosis_diversity",
]


def build_provider_pipeline(algorithm: str = "gradient_boosting") -> Pipeline:
    if algorithm == "random_forest":
        clf = RandomForestClassifier(
            n_estimators=250,
            max_depth=10,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
    else:
        clf = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.07,
            max_depth=3,
            random_state=42,
        )
    return Pipeline([("scale", StandardScaler()), ("clf", clf)])


def train_provider_from_csv(
    csv_path: Path,
    algorithm: str = "gradient_boosting",
    test_size: float = 0.2,
) -> dict[str, Any]:
    df = pd.read_csv(csv_path)
    required = set(PROVIDER_FEATURES) | {"is_fraud"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Provider CSV missing columns: {sorted(missing)}")

    X = df[PROVIDER_FEATURES]
    y = df["is_fraud"].astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    pipe = build_provider_pipeline(algorithm)
    pipe.fit(X_train, y_train)
    proba = pipe.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision": float(precision_score(y_test, pred, zero_division=0)),
        "recall": float(recall_score(y_test, pred, zero_division=0)),
        "f1": float(f1_score(y_test, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, proba)),
        "fraud_rate_train": float(y_train.mean()),
        "n_train": int(len(y_train)),
        "n_test": int(len(y_test)),
    }

    from datetime import datetime, timezone

    version = datetime.now(timezone.utc).strftime("provider-v%Y%m%d%H%M%S")
    meta = {
        "model_version": version,
        "model_type": "provider",
        "algorithm": algorithm,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "feature_columns": PROVIDER_FEATURES,
        "source_csv": str(csv_path),
        "feature_count": len(PROVIDER_FEATURES),
    }
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, settings.provider_model_path)
    settings.provider_meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


class ProviderFraudModelService:
    def __init__(self) -> None:
        self._pipe: Pipeline | None = None
        self._meta: dict[str, Any] = {}
        self.reload()

    def reload(self) -> None:
        if settings.provider_model_path.exists():
            self._pipe = joblib.load(settings.provider_model_path)
        else:
            self._pipe = None
        if settings.provider_meta_path.exists():
            self._meta = json.loads(settings.provider_meta_path.read_text(encoding="utf-8"))
        else:
            self._meta = {}

    @property
    def loaded(self) -> bool:
        return self._pipe is not None

    @property
    def meta(self) -> dict[str, Any]:
        return self._meta

    def predict_row(self, row: dict[str, Any]) -> dict[str, Any]:
        if self._pipe is None:
            raise RuntimeError("Provider model not trained. Run `python -m ml.train_provider`.")
        frame = pd.DataFrame([{k: float(row.get(k, 0)) for k in PROVIDER_FEATURES}])
        probability = float(self._pipe.predict_proba(frame)[0, 1])
        risk_score = round(probability * 100, 1)
        risk_level = "high" if risk_score >= 70 else "medium" if risk_score >= 40 else "low"
        findings: list[str] = []
        if frame["avg_reimbursement"].iloc[0] > 50_000:
            findings.append("Average reimbursement elevated versus peer providers.")
        if frame["inpatient_ratio"].iloc[0] > 0.7:
            findings.append("High inpatient claim mix may indicate upcoding.")
        if frame["unique_physicians"].iloc[0] / max(frame["claim_count"].iloc[0], 1) < 0.05:
            findings.append("Very few attending physicians relative to claim volume.")
        if probability >= 0.7:
            findings.append("Provider-level model flags elevated fraud risk.")
        if not findings:
            findings.append("Provider billing pattern within normal peer range.")
        return {
            "provider_id": row.get("provider_id", "unknown"),
            "probability": round(probability, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "label": "fraud" if probability >= 0.5 else "legitimate",
            "findings": findings[:5],
            "model_version": self._meta.get("model_version", "unknown"),
        }


provider_fraud_model = ProviderFraudModelService()
