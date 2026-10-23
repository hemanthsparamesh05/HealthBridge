"""Download rohitrox Healthcare Provider Fraud Detection Analysis and map to provider features.

Requires Kaggle credentials at %USERPROFILE%\\.kaggle\\kaggle.json

Usage:
  python -m scripts.download_rohitrox
  python -m ml.train_provider --csv data/raw/rohitrox_provider_mapped.csv
"""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

from app.config import DATA_DIR

DATASET = "rohitrox/healthcare-provider-fraud-detection-analysis"


def download(dest: Path) -> None:
    from kaggle.api.kaggle_api_extended import KaggleApi

    dest.mkdir(parents=True, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    print(f"Downloading {DATASET} -> {dest}")
    api.dataset_download_files(DATASET, path=str(dest), unzip=True)
    for zpath in dest.glob("*.zip"):
        with zipfile.ZipFile(zpath, "r") as zf:
            zf.extractall(dest)


def _find(folder: Path, *names: str) -> Path | None:
    lower_map = {p.name.lower(): p for p in folder.rglob("*.csv")}
    for name in names:
        if name.lower() in lower_map:
            return lower_map[name.lower()]
    # fuzzy contains
    for name in names:
        key = name.lower().replace(".csv", "")
        for fname, path in lower_map.items():
            if key in fname:
                return path
    return None


def map_rohitrox(folder: Path) -> pd.DataFrame:
    labels = _find(folder, "Train-1542865627584.csv", "Train.csv")
    bene = _find(folder, "Train_Beneficiarydata-1542865627584.csv", "Train_Beneficiarydata.csv")
    inp = _find(folder, "Train_Inpatientdata-1542865627584.csv", "Train_Inpatientdata.csv")
    outp = _find(folder, "Train_Outpatientdata-1542865627584.csv", "Train_Outpatientdata.csv")
    if not labels:
        raise FileNotFoundError("Could not find provider label CSV in rohitrox download")

    label_df = pd.read_csv(labels)
    provider_col = "Provider" if "Provider" in label_df.columns else label_df.columns[0]
    fraud_col = "PotentialFraud" if "PotentialFraud" in label_df.columns else label_df.columns[1]
    label_df = label_df.rename(columns={provider_col: "Provider", fraud_col: "PotentialFraud"})
    label_df["is_fraud"] = (
        label_df["PotentialFraud"].astype(str).str.lower().isin(["yes", "y", "1", "true"]).astype(int)
    )

    claims_parts: list[pd.DataFrame] = []
    if inp and inp.exists():
        idf = pd.read_csv(inp)
        idf["_inpatient"] = 1
        claims_parts.append(idf)
    if outp and outp.exists():
        odf = pd.read_csv(outp)
        odf["_inpatient"] = 0
        claims_parts.append(odf)
    if not claims_parts:
        raise FileNotFoundError("No inpatient/outpatient claim files found")

    claims = pd.concat(claims_parts, ignore_index=True, sort=False)
    if "Provider" not in claims.columns:
        raise ValueError("Claims missing Provider column")

    # Reimbursement
    reimb_cols = [c for c in claims.columns if "Reimbursement" in c or "Amount" in c]
    if reimb_cols:
        claims["_reimb"] = pd.to_numeric(claims[reimb_cols[0]], errors="coerce").fillna(0)
    else:
        claims["_reimb"] = 0.0

    # Claim days
    if "ClaimStartDt" in claims.columns and "ClaimEndDt" in claims.columns:
        start = pd.to_datetime(claims["ClaimStartDt"], errors="coerce")
        end = pd.to_datetime(claims["ClaimEndDt"], errors="coerce")
        claims["_days"] = (end - start).dt.days.fillna(1).clip(lower=1)
    else:
        claims["_days"] = 1

    phys_cols = [c for c in claims.columns if "Physician" in c]
    diag_cols = [c for c in claims.columns if c.startswith("ClmDiagnosisCode")]

    bene_chronic_rate: dict[str, float] = {}
    if bene and bene.exists():
        bdf = pd.read_csv(bene)
        chronic_cols = [c for c in bdf.columns if c.startswith("ChronicCond_")]
        if "BeneID" in bdf.columns and chronic_cols:
            bdf["_chronic"] = bdf[chronic_cols].apply(
                lambda r: (pd.to_numeric(r, errors="coerce").fillna(2) == 1).mean(), axis=1
            )
            bene_chronic_rate = bdf.set_index("BeneID")["_chronic"].to_dict()

    if "BeneID" in claims.columns:
        claims["_chronic"] = claims["BeneID"].map(bene_chronic_rate).fillna(0.2)
    else:
        claims["_chronic"] = 0.2

    rows = []
    for provider, g in claims.groupby("Provider"):
        claim_count = float(len(g))
        total = float(g["_reimb"].sum())
        avg = float(g["_reimb"].mean()) if claim_count else 0.0
        inpatient_ratio = float(g["_inpatient"].mean()) if "_inpatient" in g else 0.0
        unique_ben = float(g["BeneID"].nunique()) if "BeneID" in g.columns else claim_count
        if phys_cols:
            phys_vals = pd.concat([g[c] for c in phys_cols], ignore_index=True).dropna().astype(str)
            unique_phys = float(phys_vals.nunique())
        else:
            unique_phys = 1.0
        avg_days = float(g["_days"].mean())
        chronic = float(g["_chronic"].mean())
        if diag_cols:
            diag_vals = pd.concat([g[c] for c in diag_cols], ignore_index=True).dropna().astype(str)
            diag_div = float(diag_vals.nunique())
        else:
            diag_div = 1.0
        rows.append(
            {
                "provider_id": str(provider),
                "claim_count": claim_count,
                "total_reimbursement": round(total, 2),
                "avg_reimbursement": round(avg, 2),
                "inpatient_ratio": round(inpatient_ratio, 4),
                "unique_beneficiaries": unique_ben,
                "unique_physicians": unique_phys,
                "avg_claim_days": round(avg_days, 2),
                "chronic_condition_rate": round(chronic, 4),
                "diagnosis_diversity": diag_div,
            }
        )

    feat = pd.DataFrame(rows)
    merged = feat.merge(
        label_df[["Provider", "is_fraud"]].rename(columns={"Provider": "provider_id"}),
        on="provider_id",
        how="inner",
    )
    return merged


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-download", action="store_true")
    args = parser.parse_args()
    dest = DATA_DIR / "raw" / "rohitrox"
    if not args.skip_download:
        try:
            download(dest)
        except Exception as exc:  # noqa: BLE001
            print(f"Download failed: {exc}")
            print("Configure Kaggle credentials, or use bootstrap via python -m ml.train_provider")
            raise SystemExit(1) from exc
    mapped = map_rohitrox(dest)
    out = DATA_DIR / "raw" / "rohitrox_provider_mapped.csv"
    mapped.to_csv(out, index=False)
    print(f"Wrote {len(mapped)} providers -> {out}")
    print(f"Fraud rate: {mapped['is_fraud'].mean():.3f}")
    print("Retrain: python -m ml.train_provider --csv data/raw/rohitrox_provider_mapped.csv")


if __name__ == "__main__":
    main()
