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

1. Push the extracted project to a GitHub repository. Do not commit `.env` files or API keys.
2. In Render select **New → Blueprint**, connect the repository, and set the Blueprint file path to `backend/render.yaml`.
3. Render creates the backend service and a managed PostgreSQL database. This database plan is paid; review Render pricing before deployment.
4. Add the Groq key to the Render service environment as `GROQ_API_KEY`. Set `ALLOWED_ORIGINS` to your Vercel frontend URL after it exists. Add Twilio Verify credentials if you need production SMS OTP.
5. After deploy, open `https://<render-service>.onrender.com/api/health`; look for `status: "ok"`, `database: "postgresql"`, and `ai: "groq"`.

## Deploy frontend to Vercel

1. Import the same GitHub repository into Vercel and set **Root Directory** to `frontend`.
2. Set `VITE_API_URL` in Vercel to `https://<render-service>.onrender.com/api` for Production (and Preview if desired).
3. Deploy the frontend, copy its Vercel URL, then add that exact origin to Render's `ALLOWED_ORIGINS` and redeploy the backend if needed.
4. Redeploy Vercel after changing `VITE_API_URL`, because Vite embeds it during the build.

## Important behavior

- GPS sharing requires HTTPS (localhost works for development), browser location permission, and the provider dashboard open while sharing.
- Production phone OTP requires Twilio Verify credentials. Online UPI/card processing, provider payouts, identity/KYC checks, and official government scheme submissions are not integrated.
- PostgreSQL stores the current app state as one JSONB document. Keep one API instance for this version; migrate to separate relational tables and transaction/locking logic before scaling to multiple instances.

## Checks

Run `npm run type-check` and `npm run build` inside `frontend`; run `npm run check` inside `backend`.
