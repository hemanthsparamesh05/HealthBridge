from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
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
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.config import ARTIFACTS_DIR, settings

NUMERIC_FEATURES = [
    "amount",
    "patient_age",
    "claim_duration_days",
    "doctor_fee",
    "amount_per_day",
    "fee_ratio",
]

CATEGORICAL_FEATURES = [
    "patient_gender",
    "hospital_id",
    "treatment_type",
    "diagnosis_group",
]

FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def diagnosis_group(diagnosis: str) -> str:
    d = (diagnosis or "unknown").lower()
    if any(k in d for k in ("cardio", "heart", "coronary", "angio", "pacemaker")):
        return "cardiac"
    if any(k in d for k in ("ortho", "knee", "fracture", "acl", "hernia", "spine")):
        return "ortho"
    if any(k in d for k in ("cancer", "chemo", "onco", "tumor")):
        return "oncology"
    if any(k in d for k in ("pregnan", "caesarean", "delivery", "obstetric")):
        return "maternity"
    if any(k in d for k in ("dialysis", "renal", "kidney", "nephro")):
        return "renal"
    if any(k in d for k in ("infect", "pneumonia", "dengue", "covid", "fever")):
        return "infectious"
    return "general"


def enrich_frame(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["claim_duration_days"] = out["claim_duration_days"].clip(lower=1)
    out["amount_per_day"] = out["amount"] / out["claim_duration_days"]
    out["fee_ratio"] = np.where(out["amount"] > 0, out["doctor_fee"] / out["amount"], 0.0)
    if "diagnosis_group" not in out.columns:
        out["diagnosis_group"] = out.get("diagnosis", pd.Series(["unknown"] * len(out))).map(
            diagnosis_group
        )
    out["patient_gender"] = out["patient_gender"].fillna("Other").astype(str)
    out["hospital_id"] = out["hospital_id"].fillna("UNKNOWN").astype(str)
    out["treatment_type"] = out["treatment_type"].fillna("General").astype(str)
    return out


def build_pipeline(algorithm: str = "gradient_boosting") -> Pipeline:
    categorical = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )
    if algorithm == "random_forest":
        clf = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
    else:
        clf = GradientBoostingClassifier(
            n_estimators=180,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
        )
    return Pipeline([("preprocess", categorical), ("clf", clf)])


def train_from_csv(
    csv_path: Path,
    algorithm: str = "gradient_boosting",
    test_size: float = 0.2,
) -> dict[str, Any]:
    df = pd.read_csv(csv_path)
    required = {
        "amount",
        "patient_age",
        "patient_gender",
        "claim_duration_days",
        "doctor_fee",
        "hospital_id",
        "treatment_type",
        "diagnosis",
        "is_fraud",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Training CSV missing columns: {sorted(missing)}")

    df = enrich_frame(df)
    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    pipe = build_pipeline(algorithm)
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

    version = datetime.now(timezone.utc).strftime("v%Y%m%d%H%M%S")
    meta = {
        "model_version": version,
        "algorithm": algorithm,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "feature_columns": FEATURE_COLUMNS,
        "source_csv": str(csv_path),
        "feature_count": len(FEATURE_COLUMNS),
    }

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, settings.model_path)
    settings.meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


class FraudModelService:
    def __init__(self) -> None:
        self._pipe: Pipeline | None = None
        self._meta: dict[str, Any] = {}
        self._cache: dict[tuple, dict[str, Any]] = {}
        self.reload()

    def reload(self) -> None:
        self._cache = {}
        if settings.model_path.exists():
            self._pipe = joblib.load(settings.model_path)
        else:
            self._pipe = None
        if settings.meta_path.exists():
            self._meta = json.loads(settings.meta_path.read_text(encoding="utf-8"))
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
            raise RuntimeError("Fraud model is not trained. Run `python -m ml.train`.")

        key = tuple(sorted((k, str(v)) for k, v in row.items()))
        hit = self._cache.get(key)
        if hit is not None:
            return dict(hit)

        frame = enrich_frame(pd.DataFrame([row]))
        X = frame[FEATURE_COLUMNS]
        probability = float(self._pipe.predict_proba(X)[0, 1])
        risk_score = round(probability * 100, 1)
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"

        findings = self._build_findings(frame.iloc[0], probability)
        result = {
            "probability": round(probability, 4),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "label": "fraud" if probability >= 0.5 else "legitimate",
            "findings": findings,
            "model_version": self._meta.get("model_version", "unknown"),
        }
        if len(self._cache) > 2048:
            self._cache.clear()
        self._cache[key] = result
        return dict(result)

    def _build_findings(self, row: pd.Series, probability: float) -> list[str]:
        findings: list[str] = []
        if row["amount"] > 500_000:
            findings.append("Claim amount is unusually high versus typical inpatient patterns.")
        if row["amount_per_day"] > 80_000:
            findings.append("Cost per day exceeds peer hospital norms for this treatment group.")
        if row["fee_ratio"] > 0.35:
            findings.append("Doctor fee share of total bill is elevated.")
        if row["claim_duration_days"] <= 1 and row["amount"] > 200_000:
            findings.append("High-value day-care claim - review for upcoding risk.")
        if row["patient_age"] >= 70 and row["amount"] > 400_000:
            findings.append("Senior patient with high reimbursement - verify medical necessity.")
        if probability >= 0.7:
            findings.append("Model confidence high for fraud-like pattern.")
        elif probability >= 0.4:
            findings.append("Moderate anomaly score - recommend manual review.")
        if not findings:
            findings.append("No strong fraud indicators; claim pattern looks typical.")
        return findings[:5]


fraud_model = FraudModelService()
