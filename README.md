<div align="center">
  <img src="assets/github-banner.gif" alt="Animated SevaSetu banner: Connecting Bharat, गांव से शहर तक" width="100%" />

  <h1>SevaSetu — Connecting Bharat</h1>
  <p><strong>AI-powered local services for rural and urban India</strong><br/>गांव से शहर तक · Hindi + English · Frontend + Backend</p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" />
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-supported-4169e1?logo=postgresql&logoColor=white" />
    <img alt="Hindi and English" src="https://img.shields.io/badge/language-Hindi%20%7C%20English-orange" />
  </p>
</div>

---

## About

SevaSetu is a college major project that connects people with local services and providers. The web app includes service discovery, booking, provider tools, booking tracking, a bilingual AI assistant, and government scheme information. The frontend and backend live in separate folders so they can be developed and deployed independently.

## Features

- Browse and search the service catalogue; review provider availability and starting prices.
- Request a service booking and follow its status in the tracker.
- Use the provider dashboard and location sharing features where browser permissions and HTTPS are available.
- Ask the AI assistant questions in Hindi or English. Configure Groq for AI responses; built-in responses remain available without an AI key.
- Explore scheme information and eligibility guidance.
- Choose Hindi or English in supported screens.
- Run with a local JSON data file, or connect PostgreSQL for persistent hosted storage.
- Responsive interface with external CDN photos, animated loading states, and image fallbacks.

## Access and sign-in

Home, services, schemes, and the AI assistant are available from the site navigation without signing in. Service browsing also falls back to a built-in catalogue if the API is temporarily offline. Sign-in is needed to create a booking or view personal booking and location details in the tracker. The tracker shows a sign-in prompt to guests instead of failing silently.

The login page supports **phone OTP** and **email/password**. Email accounts can be created in the app; passwords are salted and hashed by the backend. Phone OTP codes are generated for local development and the Render demo. Real SMS delivery requires Twilio Verify. Google sign-in is not shown because it needs a separately configured OAuth client and callback.

## Project layout

```text
SevaSetu/
├── frontend/       # React, TypeScript, Vite, Tailwind; deploy to Vercel
├── backend/        # Node.js API; deploy to Render
├── assets/         # README artwork
└── README.md
```

## Run locally (Windows PowerShell)

Install [Node.js 22 or newer](https://nodejs.org/). Extract the repository, then open two PowerShell terminals in the project root.

**Terminal 1 — API:**

```powershell
cd .\backend
npm ci
Copy-Item .env.example .env
npm run dev
```

The API starts at `http://localhost:3000`. For local persistent data it creates `backend/data/sevasetu.json`. OTP responses include a development code for local sign-in.

**Terminal 2 — web app:**

```powershell
cd .\frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>. Vite forwards `/api` calls to the local API.

## Environment variables

Keep secrets in `backend/.env` or the hosting provider's secret settings. Never commit `.env` files or put private keys in `VITE_*` variables.

| Variable | Where | Purpose |
|---|---|---|
| `SESSION_SECRET` | Backend | Long random secret used to sign sessions. |
| `DATABASE_URL` | Backend | Optional PostgreSQL URL. If omitted, local JSON storage is used. |
| `GROQ_API_KEY` | Backend | Optional Groq key for AI answers and fallback microphone transcription when browser speech recognition cannot connect. Obtain it from [Groq Console](https://console.groq.com/keys). |
| `GROQ_MODEL` | Backend | Groq model name; default is `openai/gpt-oss-120b`. |
| `ALLOWED_ORIGINS` | Backend | Comma-separated list of frontend origins allowed to call the API. |
| `DEMO_OTP` | Backend | Enables visible one-time codes for a public demo. Do not use for real accounts. |
| `VITE_API_URL` | Frontend build | Public API base URL, such as `https://your-api.onrender.com/api`. |

For production SMS verification, configure Twilio Verify using `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID`. The demo OTP option is for demonstrations only.

### SMS booking and rural/offline use

The app caches its shell and service catalogue after its first online visit. A signed-in customer can save a booking request while offline; it stays on that device and syncs when connectivity returns. It is not sent to a provider until it syncs. Do not clear browser storage before sync completes. This does not make a first visit or first sign-in available offline.

For booking by SMS without mobile data, configure a Twilio number with inbound SMS enabled. Set `TWILIO_SMS_NUMBER`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SMS_WEBHOOK_URL` in the backend host, with the webhook URL set to the exact public URL `https://your-api.example.com/api/sms/inbound`. In Twilio Console, set the number's **A MESSAGE COMES IN** webhook to that same URL with HTTP POST. The backend verifies Twilio's signed webhook, creates a customer account from the sender number if needed, and stores SMS bookings in the same booking database shown by the web portal. Use persistent PostgreSQL (`DATABASE_URL`) for production so portal updates survive server restarts. Twilio calls a public webhook and expects a TwiML reply; see [Twilio's inbound SMS guide](https://www.twilio.com/docs/messaging/tutorials/how-to-receive-and-reply/node-js).

Text `HELP` for the syntax, `STATUS` for the latest request, or `BOOK <service-id> | <village and landmark>` (example: `BOOK pump | Rampur, near school`). The customer portal needs an internet connection to fetch updated booking status. SMS replies confirm receipt only; the provider must still accept the request.

## Database options

For local development, no database setup is required; the backend stores app data in a JSON file. For PostgreSQL, create a database and set `DATABASE_URL` in `backend/.env`. The backend initializes its app-state table on startup. The included Render Blueprint supports connecting an external Neon PostgreSQL database.

## Free-tier deployment overview

Free plans and quotas can change. Review current limits before deploying. Render free web services sleep after inactivity, and the first request after sleep can be slow. Neon and Groq have usage quotas. Vercel Hobby is intended for personal, noncommercial projects.

### 1. Push to GitHub

Create an empty GitHub repository, then run these commands from the extracted SevaSetu project root:

```powershell
git init
git add .
git commit -m "Initial SevaSetu project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. Confirm `.env` files and API keys are not staged.

### 2. Create the database

Create a PostgreSQL project in [Neon](https://console.neon.tech/), copy its pooled connection string, and keep it private. The connection string is entered as the Render `DATABASE_URL` value.

### 3. Deploy the backend on Render

1. In Render choose **New → Blueprint**, connect the GitHub repository, and use Blueprint path `backend/render.yaml`.
2. Enter `DATABASE_URL` from Neon and enter `GROQ_API_KEY` if you want Groq AI. The Blueprint allows `https://sevasetu-nu.vercel.app` as the production frontend origin.
3. Let Render generate `SESSION_SECRET`. The Blueprint configures the service and demo OTP setting.
4. Deploy, then check `https://YOUR-RENDER-SERVICE.onrender.com/api/health`.

### 4. Deploy the frontend on Vercel

1. Import the same repository in Vercel and set **Root Directory** to `frontend`.
2. The committed `frontend/.env.production` points to `https://sevasetu-api-7oj0.onrender.com/api`. In Vercel, set `VITE_API_URL` to that same value if a dashboard variable already overrides it.
3. In Render's Environment page confirm `ALLOWED_ORIGINS=https://sevasetu-nu.vercel.app`; redeploy the backend after changing it.
4. Redeploy Vercel after changing `VITE_API_URL`, since Vite embeds it during the build.

If login or account creation shows **“Failed to fetch”**, check [the API health endpoint](https://sevasetu-api-7oj0.onrender.com/api/health) first. Vercel `VITE_API_URL` must be `https://sevasetu-api-7oj0.onrender.com/api`, and Render `ALLOWED_ORIGINS` must be exactly `https://sevasetu-nu.vercel.app` (no trailing slash or path). Save and redeploy both services after changing the variables. Preview deployments need their own allowed origin if you test from a preview URL.

## Checks

```powershell
# frontend
cd .\frontend
npm run type-check
npm run build

# backend (from project root in another terminal)
cd .\backend
npm run check
```

## Notes

- Location access requires HTTPS on deployed sites and permission from the browser. The provider must keep location sharing active for updates to be sent.
- Booking status tracking works through the API; location updates depend on the provider sharing location.
- External photos need an internet connection; the UI shows a fallback if a remote image is unavailable.
- The current PostgreSQL persistence stores app state in one JSONB document. Keep one backend instance for this version; use relational tables and transaction handling before scaling to multiple instances.
- Payment processing, provider payouts, identity verification, and official government scheme submissions are not integrated.

---

<div align="center">
  <sub>Built as a student project to make local services more accessible across Bharat. · बनाया गया भारत में स्थानीय सेवाओं को सुलभ बनाने के लिए।</sub>
</div>
