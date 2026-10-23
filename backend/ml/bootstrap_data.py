"""Generate a bootstrap claim-level fraud dataset for local training.

Mirrors columns expected by the ML pipeline and HealthBridge claim schema.
When a Kaggle dataset is downloaded later, map it into the same schema.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

HOSPITALS = [f"HSP-{i:03d}" for i in range(1, 21)]
TREATMENTS = [
    "Laparoscopic cholecystectomy",
    "Total knee replacement (TKR)",
    "MRI lumbar spine without contrast",
    "Coronary angioplasty with stent",
    "Caesarean section delivery",
    "Dialysis session (hemodialysis)",
    "Appendectomy (open)",
    "Cataract surgery (phaco + IOL)",
    "Hernia repair (mesh)",
    "Chemotherapy day-care cycle",
    "ACL reconstruction + meniscus repair",
    "Pneumonia — inpatient ward care",
    "Thyroidectomy",
    "Fracture femur — ORIF",
    "Pacemaker dual-chamber implant",
]
DIAGNOSES = [
    "Cholelithiasis",
    "Osteoarthritis knee",
    "Lumbar disc disease",
    "CAD — acute coronary syndrome",
    "Pregnancy — term",
    "ESRD — chronic kidney disease",
    "Acute appendicitis",
    "Senile cataract",
    "Inguinal hernia",
    "Breast carcinoma",
    "ACL tear",
    "Community-acquired pneumonia",
    "Multinodular goitre",
    "Femur shaft fracture",
    "Complete heart block",
]
GENDERS = ["Male", "Female", "Other"]


def generate_claims(n: int = 20000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows: list[dict] = []

    for i in range(n):
        hospital_id = HOSPITALS[int(rng.integers(0, len(HOSPITALS)))]
        treatment = TREATMENTS[int(rng.integers(0, len(TREATMENTS)))]
        diagnosis = DIAGNOSES[int(rng.integers(0, len(DIAGNOSES)))]
        age = int(rng.integers(18, 90))
        gender = GENDERS[int(rng.integers(0, len(GENDERS)))]
        duration = int(rng.choice([1, 1, 2, 3, 4, 5, 7, 10, 14], p=None))
        base = float(rng.lognormal(mean=11.2, sigma=0.55))  # ~ INR-like scale
        doctor_fee = base * float(rng.uniform(0.05, 0.25))

        # Inject fraud-like patterns (~12%)
        is_fraud = 0
        if rng.random() < 0.12:
            is_fraud = 1
            pattern = int(rng.integers(0, 4))
            if pattern == 0:
                base *= float(rng.uniform(2.5, 4.5))  # upcoding / inflated bill
            elif pattern == 1:
                duration = 1
                base *= float(rng.uniform(2.0, 3.5))  # high day-care
            elif pattern == 2:
                doctor_fee = base * float(rng.uniform(0.4, 0.7))  # fee padding
            else:
                age = int(rng.integers(72, 92))
                base *= float(rng.uniform(2.2, 3.8))

        # Mild noise on labels so model isn't perfect
        if is_fraud == 0 and rng.random() < 0.03:
            base *= float(rng.uniform(1.8, 2.4))
        if is_fraud == 1 and rng.random() < 0.08:
            base *= float(rng.uniform(0.6, 0.9))

        rows.append(
            {
                "claim_id": f"CLM-TRAIN-{i + 1:06d}",
                "amount": round(base, 2),
                "patient_age": age,
                "patient_gender": gender,
                "claim_duration_days": max(1, duration),
                "doctor_fee": round(doctor_fee, 2),
                "hospital_id": hospital_id,
                "treatment_type": treatment,
                "diagnosis": diagnosis,
                "is_fraud": is_fraud,
            }
        )

    return pd.DataFrame(rows)


def ensure_training_csv(data_dir: Path, n: int = 20000) -> Path:
    raw = data_dir / "raw"
    raw.mkdir(parents=True, exist_ok=True)

    # Prefer mapped Kaggle / external file if present
    preferred = [
        raw / "claims_train.csv",
        raw / "synthetic_health_claims_mapped.csv",
        raw / "kaggle_claims_mapped.csv",
    ]
    for path in preferred:
        if path.exists():
            return path

    bootstrap = raw / "bootstrap_claims.csv"
    if not bootstrap.exists():
        print(f"Generating bootstrap training set ({n} rows) -> {bootstrap}")
        df = generate_claims(n=n)
        df.to_csv(bootstrap, index=False)
    return bootstrap


if __name__ == "__main__":
    from app.config import DATA_DIR

    path = ensure_training_csv(DATA_DIR)
    print(f"Ready: {path}")
