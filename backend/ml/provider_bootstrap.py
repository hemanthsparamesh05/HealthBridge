"""Bootstrap provider-level training data (rohitrox-compatible feature schema)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd


def generate_providers(n: int = 5400, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows: list[dict] = []
    for i in range(n):
        claim_count = float(rng.integers(5, 400))
        avg_reimb = float(rng.lognormal(9.5, 0.6))
        inpatient_ratio = float(rng.beta(2, 5))
        unique_ben = float(max(1, int(claim_count * rng.uniform(0.3, 0.95))))
        unique_phys = float(max(1, int(rng.integers(1, max(2, int(claim_count / 8))))))
        avg_days = float(rng.uniform(1, 12))
        chronic = float(rng.beta(2, 5))
        diag_div = float(rng.integers(2, 40))
        total = claim_count * avg_reimb
        is_fraud = 0
        if rng.random() < 0.094:
            is_fraud = 1
            pattern = int(rng.integers(0, 4))
            if pattern == 0:
                avg_reimb *= float(rng.uniform(2.0, 4.0))
            elif pattern == 1:
                inpatient_ratio = float(rng.uniform(0.75, 0.98))
            elif pattern == 2:
                unique_phys = max(1.0, unique_phys * 0.2)
                claim_count *= float(rng.uniform(1.5, 2.5))
            else:
                chronic = float(rng.uniform(0.55, 0.95))
                avg_reimb *= float(rng.uniform(1.5, 2.5))
            total = claim_count * avg_reimb
        rows.append(
            {
                "provider_id": f"PRV{i + 1:05d}",
                "claim_count": claim_count,
                "total_reimbursement": round(total, 2),
                "avg_reimbursement": round(avg_reimb, 2),
                "inpatient_ratio": round(inpatient_ratio, 4),
                "unique_beneficiaries": unique_ben,
                "unique_physicians": unique_phys,
                "avg_claim_days": round(avg_days, 2),
                "chronic_condition_rate": round(chronic, 4),
                "diagnosis_diversity": diag_div,
                "is_fraud": is_fraud,
            }
        )
    return pd.DataFrame(rows)


def ensure_provider_training_csv(data_dir: Path, n: int = 5400) -> Path:
    raw = data_dir / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    preferred = [
        raw / "provider_train.csv",
        raw / "rohitrox_provider_mapped.csv",
    ]
    for path in preferred:
        if path.exists():
            return path
    bootstrap = raw / "bootstrap_providers.csv"
    if not bootstrap.exists():
        print(f"Generating bootstrap provider set ({n} rows) -> {bootstrap}")
        generate_providers(n=n).to_csv(bootstrap, index=False)
    return bootstrap
