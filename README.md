# Rakshak AI — Community Disaster Intelligence & Response

Rakshak AI is an offline-first final-year major project prototype for community-level disaster preparedness. It brings sensor telemetry, an explainable hazard score, citizen incident reports, response teams, and supply dispatch into a district command dashboard.

## What the demo can do

- **Situation dashboard:** district risk score, sensor readings, active incidents, resource counts, and a live-style operational map.
- **Explainable risk model:** flood score combines river level (55%), recent rainfall (30%), and soil saturation (15%). Heat score is derived from sensor temperature. The larger score sets the district alert level. The model runs locally and does not need an AI API key.
- **Scenario drills:** simulate flood, heatwave, and normal conditions; readings and incidents update together.
- **Incident command:** create community reports, search the queue, and advance each incident through New → Dispatched → Resolved.
- **Resource management:** dispatch available boats, emergency kits, water, or medical teams and see stock counts update.
- **Local response assistant:** ask questions by text or browser microphone; answers are grounded in current readings and inventory.
- **Offline-first workflow:** the current snapshot is cached on the device. Reports, scenarios, status changes, and dispatches made while offline enter a local outbox and are sent when the backend is reachable again.
- **Situation report:** export the current data and calculated risk as JSON.

The included locations and sensor readings are sample project data. Scenario controls simulate telemetry; this project does not connect to physical sensors, government warning feeds, or emergency dispatch services.

## Architecture

```text
React + TypeScript + Vite
        │ /api proxy
        ▼
Node.js HTTP API ───── local JSON persistence (default)
        │               PostgreSQL state store (optional)
        └── /api/ops/* command and data endpoints
```

The original SevaSetu source remains in the repository, but the active app entry point now launches Rakshak AI.

## Run locally (Windows PowerShell)

Use Node.js 22 or newer. Open two PowerShell terminals in the project folder.

**Terminal 1 — backend**

```powershell
cd .\backend
npm install
$env:DATABASE_URL = ""
npm run dev
```

The API listens on `http://localhost:3000` and stores project state in `backend/data/sevasetu.json` when PostgreSQL is not configured.

**Terminal 2 — frontend**

```powershell
cd .\frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite development server forwards `/api` requests to the backend.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/ops/snapshot` | Load sensors, incidents, responders, and resources |
| `POST` | `/api/ops/simulate` | Apply `flood`, `heat`, or `normal` demo readings |
| `POST` | `/api/ops/incidents` | Create a community incident report |
| `PATCH` | `/api/ops/incidents/:id` | Update incident response status |
| `POST` | `/api/ops/resources/:id/dispatch` | Decrement available resource stock |
| `GET` | `/api/health` | Backend and optional integrations status |

## Verification

From `frontend/`, run `npm run type-check` and `npm run build`. From `backend/`, run `npm run check`.
