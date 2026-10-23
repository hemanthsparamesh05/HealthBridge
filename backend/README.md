# HealthBridge Backend

FastAPI + SQLite + scikit-learn fraud model.

## Quick start

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m ml.train
python -m uvicorn app.main:app --reload --reload-dir app --reload-dir ml --port 8000
```

API docs: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/health

Run the frontend from a second terminal opened at the repository root:

```powershell
npm ci
npm run dev
```

## Demo users

| Email | Password | Role |
|-------|----------|------|
| admin@healthbridge.in | admin123 | insurance_admin |
| reviewer@healthbridge.in | reviewer123 | claim_reviewer |
| hospital@healthbridge.in | hospital123 | hospital_staff |
| compliance@healthbridge.in | compliance123 | compliance_officer |
| auditor@healthbridge.in | auditor123 | auditor |

MFA accepts any 6-digit code.

## Kaggle dataset (optional)

1. Download `kaggle.json` from Kaggle → Account → API
2. Place at `%USERPROFILE%\.kaggle\kaggle.json`
3. Run:

```bash
python -m scripts.download_kaggle
python -m ml.train --csv data/raw/kaggle_claims_mapped.csv
```

Without Kaggle credentials, `python -m ml.train` generates a 20k-row bootstrap dataset automatically.
