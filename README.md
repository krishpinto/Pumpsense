# PumpSense

> AI-powered predictive maintenance platform that ingests pump telemetry, detects bearing faults early, assesses risk, and helps maintenance teams act before failure occurs.

Built for a software-company hackathon. The focus is on the **software pipeline** — telemetry ingestion, ML inference, risk scoring, dashboarding, and agentic maintenance decisions.

---

## Architecture

```
Pump Sensor / Pi
      ↓
MQTT / AWS IoT Ingestion
      ↓
Storage (DynamoDB)
      ↓
Backend Analysis Service  ←── FastAPI (backend/)
      ↓
ML Fault Classification
      ↓
Decision Engine (Healthy / Watch / Critical)
      ↓
Dashboard + Alerts + Maintenance Agent  ←── Next.js (frontend/)
```

---

## Features

- **Manual Analysis Mode** — select or upload an `.xlsx` vibration reading, analyze it end-to-end
- **Live Monitoring Mode** — replay sequential readings in real time with live alerts and trend updates
- **Fault Classification** — multiclass ML model detecting bearing fault types with confidence scores
- **Severity Engine** — Healthy / Watch / Critical labels with health score
- **PumpSense AI Maintenance Supervisor** — agentic layer that assigns teams and recommends next actions
- **Event Log** — full history of analyzed readings and triggered alerts

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui |
| Charts | Recharts |
| Icons | lucide-react |
| Backend | FastAPI, Python |
| ML | Scikit-learn (multiclass vibration fault classifier) |

---

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Backend (optional)

The frontend works with mock data by default. Start the backend only if you want live ML predictions.

```bash
cd backend
pip install -r requirements.txt   # if available, else: pip install fastapi uvicorn pandas scikit-learn openpyxl
uvicorn app:app --reload
```

Runs at http://127.0.0.1:8000

---

## Demo Flow

1. Open the dashboard at http://localhost:3000
2. Select a **healthy** sample → click **Analyze Reading** → see green status
3. Select a **faulty** sample → click **Analyze Reading** → see fault classification + alert + maintenance assignment
4. Click **Start Live Feed** → watch readings stream, trend degrade, and alerts fire

---

## Project Structure

```
pumpsense-repo/
├── frontend/               # Next.js dashboard
│   └── src/
│       ├── lib/
│       │   ├── sampleData.ts       # real CSV-derived sample readings
│       │   └── analysisEngine.ts   # mock analysis + optional FastAPI call
│       └── components/pumpsense/
│           ├── Dashboard.tsx
│           ├── PumpAsset.tsx
│           ├── SignalChart.tsx
│           ├── ConfidenceChart.tsx
│           ├── TrendChart.tsx
│           ├── MaintenanceSupervisor.tsx
│           └── EventLog.tsx
└── backend/                # FastAPI ML service
    ├── app.py
    ├── train_multiclass_model.py
    └── extract_features.py
```
