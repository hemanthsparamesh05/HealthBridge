"""Train the HealthBridge fraud detection model.

Usage (from backend/):
  python -m ml.train
  python -m ml.train --csv data/raw/claims_train.csv
  python -m ml.train --algorithm random_forest
"""

from __future__ import annotations

import argparse
from pathlib import Path

from app.config import DATA_DIR
from ml import train_from_csv
from ml.bootstrap_data import ensure_training_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Train HealthBridge fraud model")
    parser.add_argument(
        "--csv",
        type=Path,
        default=None,
        help="Path to training CSV (default: bootstrap or downloaded dataset)",
    )
    parser.add_argument(
        "--algorithm",
        choices=["gradient_boosting", "random_forest"],
        default="gradient_boosting",
    )
    args = parser.parse_args()

    csv_path = args.csv
    if csv_path is None:
        csv_path = ensure_training_csv(DATA_DIR)
    elif not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    print(f"Training on {csv_path} with {args.algorithm}...")
    meta = train_from_csv(csv_path, algorithm=args.algorithm)
    metrics = meta["metrics"]
    print("Training complete.")
    print(f"  version : {meta['model_version']}")
    print(f"  accuracy: {metrics['accuracy']:.3f}")
    print(f"  precision: {metrics['precision']:.3f}")
    print(f"  recall  : {metrics['recall']:.3f}")
    print(f"  f1      : {metrics['f1']:.3f}")
    print(f"  roc_auc : {metrics['roc_auc']:.3f}")


if __name__ == "__main__":
    main()
