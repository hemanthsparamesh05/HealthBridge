"""Download and map public fraud datasets (Kaggle) into HealthBridge schema.

Requires Kaggle API credentials:
  1. Create account at https://www.kaggle.com
  2. Account → Settings → API → Create New Token → kaggle.json
  3. Place at ~/.kaggle/kaggle.json (or set KAGGLE_USERNAME / KAGGLE_KEY)

Usage (from backend/):
  python -m scripts.download_kaggle
  python -m scripts.download_kaggle --dataset tejalaveti2306/health-insurance-claims-data-for-fraud-detection
"""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

import pandas as pd

from app.config import DATA_DIR

DEFAULT_DATASET = "tejalaveti2306/health-insurance-claims-data-for-fraud-detection"
# Stronger alternative (provider-level): rohitrox/healthcare-provider-fraud-detection-analysis


def download_kaggle_dataset(dataset: str, dest: Path) -> Path:
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError as exc:
        raise SystemExit(
            "kaggle package missing. Install backend requirements and configure credentials."
        ) from exc

    dest.mkdir(parents=True, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    print(f"Downloading {dataset} -> {dest}")
    api.dataset_download_files(dataset, path=str(dest), unzip=True)
    return dest


def map_synthetic_health_claims(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    cols = {c.lower(): c for c in df.columns}

    def col(*names: str) -> str | None:
        for n in names:
            if n.lower() in cols:
                return cols[n.lower()]
        return None

    amount_c = col("Claim_Amount", "claim_amount", "Amount")
    age_c = col("Patient_Age", "patient_age", "Age")
    gender_c = col("Patient_Gender", "patient_gender", "Gender")
    fraud_c = col("Fraudulent", "is_fraud", "Fraud", "fraudulent_claim", "Fraud_Label")

    if not amount_c:
        raise ValueError(f"Could not find claim amount column in {csv_path.name}")

    out = pd.DataFrame()
    out["amount"] = pd.to_numeric(df[amount_c], errors="coerce").fillna(0)
    out["patient_age"] = (
        pd.to_numeric(df[age_c], errors="coerce").fillna(40).astype(int) if age_c else 40
    )
    out["patient_gender"] = df[gender_c].astype(str) if gender_c else "Other"

    # Approximate duration / fee if missing
    out["claim_duration_days"] = 3
    if col("Service_Date", "Claim_Date"):
        out["claim_duration_days"] = 2
    out["doctor_fee"] = out["amount"] * 0.12

    hospital_c = col("Hospital_ID", "hospital_id", "Hospital_Code", "Provider")
    out["hospital_id"] = df[hospital_c].astype(str) if hospital_c else "HSP-001"

    treat_c = col("Treatment_Type", "treatment_type", "Treatment_Code", "Procedure")
    out["treatment_type"] = df[treat_c].astype(str) if treat_c else "General"

    diag_c = col("Diagnosis", "diagnosis", "Diagnosis_Code")
    out["diagnosis"] = df[diag_c].astype(str) if diag_c else "Unknown"

    if fraud_c:
        series = df[fraud_c]
        if series.dtype == object:
            out["is_fraud"] = series.astype(str).str.lower().isin(
                ["1", "true", "yes", "fraud", "fraudulent", "y"]
            ).astype(int)
        else:
            out["is_fraud"] = (pd.to_numeric(series, errors="coerce").fillna(0) > 0).astype(int)
    else:
        # Heuristic weak label if dataset has no fraud column
        q = out["amount"].quantile(0.92)
        out["is_fraud"] = (out["amount"] >= q).astype(int)

    out["claim_id"] = [f"CLM-KAG-{i + 1:06d}" for i in range(len(out))]
    return out.dropna(subset=["amount"])


def find_csv_files(folder: Path) -> list[Path]:
    return sorted(folder.rglob("*.csv"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--skip-download", action="store_true")
    args = parser.parse_args()

    raw = DATA_DIR / "raw" / "kaggle"
    if not args.skip_download:
        try:
            download_kaggle_dataset(args.dataset, raw)
        except Exception as exc:  # noqa: BLE001
            print(f"Download failed: {exc}")
            print(
                "Place kaggle.json in %USERPROFILE%\\.kaggle\\ and retry, "
                "or use bootstrap data via `python -m ml.train`."
            )
            raise SystemExit(1) from exc

    # Unzip leftover zips
    for zpath in raw.glob("*.zip"):
        with zipfile.ZipFile(zpath, "r") as zf:
            zf.extractall(raw)

    csvs = find_csv_files(raw)
    if not csvs:
        raise SystemExit(f"No CSV found under {raw}")

    # Prefer the largest CSV as primary table
    csv_path = max(csvs, key=lambda p: p.stat().st_size)
    print(f"Mapping {csv_path} ...")
    mapped = map_synthetic_health_claims(csv_path)
    out = DATA_DIR / "raw" / "kaggle_claims_mapped.csv"
    mapped.to_csv(out, index=False)
    print(f"Wrote {len(mapped)} rows -> {out}")
    print("Retrain with: python -m ml.train --csv data/raw/kaggle_claims_mapped.csv")


if __name__ == "__main__":
    main()
