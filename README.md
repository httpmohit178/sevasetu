# SevaSetu — split frontend and backend

The ZIP root contains independent `frontend` and `backend` folders. Use Node.js 22 or newer.

## Run locally on Windows

Open two PowerShell windows in the extracted `SevaSetu-Project` folder.

**PowerShell window 1 — backend:**

```powershell
cd .\backend
npm ci
Copy-Item .env.example .env
npm run dev
```

The API runs at `http://localhost:3000` and restarts automatically when backend files change. You can also use `npm start` to run it without watch mode. In development, OTP API responses include a `developmentCode`; use it to sign in. For persistent local data, the backend creates `backend/data/sevasetu.json`.

**PowerShell window 2 — frontend:**

```powershell
cd .\frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the backend at port 3000.

## Groq AI

Create a key at [Groq API Keys](https://console.groq.com/keys). Put it in `backend/.env` as `GROQ_API_KEY=gsk_...`, restart the backend, and ask the assistant a question. The default `GROQ_MODEL` is `openai/gpt-oss-120b`. The backend asks the model for English and Hindi text in a JSON response. Never put the Groq key in the frontend or in a `VITE_*` variable. If no AI key is configured, built-in bilingual assistant answers remain available.

## PostgreSQL

Locally, the backend uses `backend/data/sevasetu.json` unless `DATABASE_URL` is set. Set a PostgreSQL connection URL in `backend/.env` to use PostgreSQL. The API creates its `sevasetu_state` JSONB table automatically. If the database is empty and the JSON file exists, it imports that file on startup. `/api/health` reports the active persistence mode and checks the database connection.

## Deploy backend + database to Render

For a no-cost college demo, the included Blueprint uses Render's free web service and an external Neon free Postgres database. Render's own free Postgres is not used because Render says those databases expire after 30 days. Check current quotas before deploying: Render free services sleep after 15 idle minutes, Neon Free has monthly compute/storage/network caps, and Vercel Hobby is for noncommercial projects. Free plans and their limits can change.

1. Create a free Neon project at [Neon](https://console.neon.tech/). Choose a region close to Render Singapore, open the **Connect** panel, choose the pooled connection option, and copy the connection string. It should begin with `postgresql://` and include `sslmode=require`; keep it secret.
2. Push the extracted project to a GitHub repository. Do not commit `.env` files or API keys.
3. In Render select **New → Blueprint**, connect the repository, and set the Blueprint file path to `backend/render.yaml`.
4. During Blueprint setup, enter the prompted values:
   - `DATABASE_URL`: the Neon pooled connection string from step 1.
   - `ALLOWED_ORIGINS`: initially `http://localhost:5173`; replace it with your Vercel URL after the frontend deploys.
   - `GROQ_API_KEY`: create a key at [Groq API Keys](https://console.groq.com/keys). Keep it only in Render.
   - Render generates `SESSION_SECRET`. The Blueprint sets `NODE_ENV=production`, `GROQ_MODEL`, and `DEMO_OTP=true` automatically. The backend upgrades Neon’s `sslmode=require` URL parameter to `sslmode=verify-full` for certificate verification.
5. Deploy the Blueprint. The API creates its PostgreSQL table automatically. Open `https://<render-service>.onrender.com/api/health`; expect `status: "ok"`, `database: "postgresql"`, and `ai: "groq"`.

**Demo sign-in:** `DEMO_OTP=true` shows the one-time code in the login page instead of sending SMS. Anyone requesting a code can see it. Use fictional/test data only. Turn `DEMO_OTP` off and configure Twilio Verify before accepting real accounts; SMS is not part of the no-cost setup.

## Deploy frontend to Vercel

1. Use Vercel's free Hobby plan for a personal, noncommercial college demo. Import the same GitHub repository and set **Root Directory** to `frontend`.
2. Set `VITE_API_URL` in Vercel to `https://<render-service>.onrender.com/api` for Production (and Preview if desired).
3. Deploy the frontend, copy its Vercel URL, then add that exact origin to Render's `ALLOWED_ORIGINS` and redeploy the backend if needed.
4. Redeploy Vercel after changing `VITE_API_URL`, because Vite embeds it during the build.

## Important behavior

- GPS sharing requires HTTPS (localhost works for development), browser location permission, and the provider dashboard open while sharing.
- The free Render API sleeps after 15 minutes idle; its first request after sleep can take about a minute. Neon Free and Groq Free enforce quotas; database/AI use may pause when limits are reached. Online UPI/card processing, provider payouts, identity/KYC checks, and official government scheme submissions are not integrated.
- PostgreSQL stores the current app state as one JSONB document. Keep one API instance for this version; migrate to separate relational tables and transaction/locking logic before scaling to multiple instances.

## Checks

Run `npm run type-check` and `npm run build` inside `frontend`; run `npm run check` inside `backend`.
