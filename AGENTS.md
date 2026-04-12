# PumpSense — Agent Context File

> Rename this file to `CLAUDE.md` before starting a session with Claude Code.
> This file gives the AI agent full context to continue building PumpSense without re-explanation.

---

## What This Project Is

PumpSense is an AI-powered predictive maintenance platform for municipal water pumps, built as a hackathon prototype for a software company. It is **not** a hardware project — the value is in the software pipeline: telemetry ingestion, ML inference, risk scoring, dashboarding, and agentic maintenance decisions.

**One-line pitch:** PumpSense ingests pump telemetry, detects bearing faults early, assesses risk, and helps maintenance teams act before failure occurs.

---

## Repository Structure

```
pumpsense/                        ← monorepo root (this folder)
├── frontend/                     ← Next.js dashboard (main product)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          ← renders <Dashboard />
│   │   │   ├── layout.tsx
│   │   │   └── globals.css       ← shimmer, spin, fade-in, pulse-bar animations
│   │   ├── components/pumpsense/
│   │   │   ├── Dashboard.tsx     ← main client component, all state lives here
│   │   │   ├── PumpAsset.tsx     ← SVG pump visual, responds to severity/classId
│   │   │   ├── SignalChart.tsx   ← FFT frequency spectrum chart (Recharts)
│   │   │   ├── ConfidenceChart.tsx ← horizontal bar chart, per-class confidence
│   │   │   ├── TrendChart.tsx    ← health score over time (last 20 readings)
│   │   │   ├── MaintenanceSupervisor.tsx ← agentic decision panel (right column)
│   │   │   └── EventLog.tsx      ← session event history table (bottom)
│   │   └── lib/
│   │       ├── sampleData.ts     ← 10 real CSV-derived samples, 4 fault classes
│   │       ├── analysisEngine.ts ← mock analysis + optional FastAPI call with fallback
│   │       └── utils.ts          ← cn() utility
│   ├── next.config.ts            ← has turbopack.root set to fix workspace root warning
│   └── package.json
└── backend/                      ← FastAPI ML service (optional)
    ├── app.py                    ← /predict endpoint
    ├── train_multiclass_model.py
    └── extract_features.py
```

---

## How to Run

**Frontend (required):**
```bash
cd pumpsense/frontend
npm install
npm run dev
```
Opens at http://localhost:3000

**Backend (optional — dashboard works without it via mock fallback):**
```bash
cd pumpsense/backend
uvicorn app:app --reload
```
Runs at http://127.0.0.1:8000

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.3, React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Components | shadcn/ui + Base UI |
| Charts | Recharts v3 |
| Icons | lucide-react |
| Backend | FastAPI + Python |
| ML | Scikit-learn multiclass classifier |

---

## Data Model

### Fault Classes (4 total)
| classId | Label | Severity | Health Score Range |
|---|---|---|---|
| 0 | Healthy Operation | Healthy | 82–96 |
| 1 | Inner Race Defect | Watch | 42–62 |
| 2 | Outer Race Defect | Critical | 22–44 |
| 3 | Combination Defect (Severe) | Severe | 4–18 |

### VibrationFeatures (9 spectral features per reading)
```ts
max_amp, mean_mag, var_mag, spectral_energy,
spectral_centroid, spectral_spread, peak_f1, peak_f2, peak_f3
```

### Sample Readings (10 total in sampleData.ts)
- `h1`, `h2`, `h3` — Healthy
- `ir1`, `ir2`, `ir3` — Inner Race Defect
- `or1`, `or2`, `or3` — Outer Race Defect
- `cd1`, `cd2` — Combination Defect

### Live Feed Sequence (LIVE_FEED_SEQUENCE)
Ordered escalation scenario: `h2 → h1 → h3 → ir1 → h1 → ir2 → ir3 → or1 → or2 → or3 → cd1 → cd2`

---

## Application Modes

### Manual Analysis Mode
1. User selects a sample from grouped dropdown (grouped by fault class)
2. Clicks **Analyze Reading**
3. 600ms artificial delay simulates ML inference
4. Results update all panels: status banner, metric cards, FFT chart, confidence chart, AI diagnosis, trend chart, maintenance supervisor, event log

### Live Monitoring Mode
1. User clicks **Start Live Feed**
2. Readings replay every 3.5 seconds via `setInterval`
3. Each tick calls `runAnalysis()` with the next reading in `LIVE_FEED_SEQUENCE`
4. Dashboard updates continuously; event log grows; trend chart fills

---

## Dashboard Layout (3-column grid)

```
[Header: PumpSense branding, station info, API toggle, LIVE indicator]

LEFT (260px)           CENTER (flex-1)              RIGHT (280px)
─────────────          ──────────────────────        ─────────────────
Pump Asset SVG         Status banner                 AI Maintenance
Health score           Metric cards (4)              Supervisor panel
                       FFT signal chart
Mode toggle            Confidence + Diagnosis        (urgency, action,
(Manual / Live)        Trend chart                    team, risk, next)

Controls panel
Sample selector
Analyze button
Upload (stub)

Pipeline status
(5 ingestion steps)

[Bottom: Event History table — full width]
```

---

## Key Component Details

### Dashboard.tsx
- All state lives here: `result`, `trendHistory`, `eventLog`, `isLive`, `liveRunning`, `apiMode`, `mode`
- `runAnalysis()` is the core function — calls `analyzeMock()` or `analyzeWithApi()` and updates all state
- `SEVERITY_STYLES` maps severity string to Tailwind classes for header bg, icon, dot color
- Live feed uses `setInterval` in a `useEffect` with `liveIntervalRef` and `readingIndexRef`

### analysisEngine.ts
- `analyzeMock(reading)` — deterministic + noise, always available
- `analyzeWithApi(reading)` — POSTs features to `http://127.0.0.1:8000/predict`, falls back to mock on failure
- `AnalysisResult` interface has all display fields: `healthScore`, `primaryFault`, `classId`, `severity`, `confidence[]`, `fftData[]`, `explanation`, `recommendedAction`, `urgency`, `assignedTeam`, `riskIfDelayed`, `workflowState`, `nextAction`, `apiMode`
- `BASE_CONFIDENCE` — realistic RF model outputs per class
- `SUPERVISOR_CONFIG` — maintenance decisions per fault class
- `EXPLANATIONS` — plain-English AI diagnosis per class (uses actual feature values)
- `generateFftData()` — synthetic FFT spectrum from feature values with Gaussian peaks at dominant frequencies

### PumpAsset.tsx
- SVG pump visual with spinning impeller
- Color (ring, fill, stroke, glow) changes by `classId`
- Warning overlay appears for classId >= 2
- Vibration bar animation shows when live or faulted

### MaintenanceSupervisor.tsx
- Right panel, framed as "PumpSense AI Maintenance Supervisor" / "PumpSense Agentic Layer"
- Shows: urgency badge, recommended action, assigned team, risk if delayed, next action (blue CTA card)
- 4 urgency levels: Routine / Monitor / Urgent / Immediate

---

## Architecture Story (for judges/demo)

1. Pump sensor / Raspberry Pi captures vibration data
2. Data sent via MQTT / AWS IoT ingestion
3. Readings stored in DynamoDB
4. Backend analysis service processes the reading
5. ML model predicts fault type and confidence
6. Decision engine marks severity: Healthy / Watch / Critical / Severe
7. Dashboard shows state, trend, history, alerts
8. AI Maintenance Supervisor recommends next action and team assignment

---

## GitHub
- Repo: `https://github.com/krishpinto/Pumpsense2`
- Monorepo with `frontend/` and `backend/` subfolders

---

## Demo Sequence (for live presentation)

1. Open dashboard at http://localhost:3000
2. Select **Healthy — Reading H-03** → Analyze → show green status, health score ~88
3. Select **Outer Race Defect — F-100 (Severe)** → Analyze → show Critical alert + maintenance assignment
4. Select **Combination Defect — F-034 (Catastrophic)** → Analyze → show Severe/Emergency state
5. Switch to **Live Feed** tab → Start Live Feed → watch readings stream, trend degrade, alerts fire

---

## Known Issues / Notes

- `node_modules` should not be copied between machines — always run `npm install` fresh
- The `turbopack.root` fix in `next.config.ts` is required when running from inside a monorepo subfolder on Windows (prevents Next.js from walking up to `C:\Users\krish\package.json` as workspace root)
- Upload `.xlsx` button is currently a stub (UI exists, functionality not yet implemented)
- Backend is optional — all mock data is production-quality for demo purposes
