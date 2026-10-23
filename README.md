# HealthBridge

AI-assisted health insurance claims console (Next.js) + FastAPI fraud-scoring backend.

## Run locally

Open two PowerShell terminals from the repository root.

### 1. Backend (terminal 1)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m ml.train
python -m uvicorn app.main:app --reload --reload-dir app --reload-dir ml --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend (terminal 2, from the repository root)

```powershell
npm ci
npm run dev
```

App: http://localhost:3000 (proxies `/api/*` to the backend)

### Demo login

| Field | Value |
|-------|-------|
| Email | `admin@healthbridge.in` |
| Password | `admin123` |
| MFA | any 6 digits |

## Optional: Kaggle dataset

1. Download API token from Kaggle → Account → Settings → API  
2. Save as `%USERPROFILE%\.kaggle\kaggle.json`  
3. Run:

```bash
cd backend
python -m scripts.download_kaggle
python -m ml.train --csv data/raw/kaggle_claims_mapped.csv
```

Without Kaggle credentials, training uses a generated 20k-row bootstrap claims dataset.
