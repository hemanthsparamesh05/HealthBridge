"""Train provider-level fraud model.

Usage:
  python -m ml.train_provider
  python -m ml.train_provider --csv data/raw/rohitrox_provider_mapped.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

from app.config import DATA_DIR
from ml.provider_bootstrap import ensure_provider_training_csv
from ml.provider_model import train_provider_from_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Train provider fraud model")
    parser.add_argument("--csv", type=Path, default=None)
    parser.add_argument(
        "--algorithm",
        choices=["gradient_boosting", "random_forest"],
        default="gradient_boosting",
    )
    args = parser.parse_args()
    csv_path = args.csv or ensure_provider_training_csv(DATA_DIR)
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")
    print(f"Training provider model on {csv_path} ({args.algorithm})...")
    meta = train_provider_from_csv(csv_path, algorithm=args.algorithm)
    m = meta["metrics"]
    print("Done.")
    print(f"  version : {meta['model_version']}")
    print(f"  accuracy: {m['accuracy']:.3f}")
    print(f"  precision: {m['precision']:.3f}")
    print(f"  recall  : {m['recall']:.3f}")
    print(f"  f1      : {m['f1']:.3f}")
    print(f"  roc_auc : {m['roc_auc']:.3f}")


if __name__ == "__main__":
    main()
