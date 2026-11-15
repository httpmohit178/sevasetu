import "dotenv/config";
import { createServer } from "node:http";
import { randomInt, randomUUID, randomBytes, scryptSync, createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import pg from "pg";

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = resolve(process.env.DATA_FILE || "./data/sevasetu.json");
const ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const TWILIO = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID;
const DEMO_OTP = process.env.DEMO_OTP === "true";
const { Pool } = pg;
function secureDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode")?.toLowerCase() === "require") url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
const database = process.env.DATABASE_URL ? new Pool({ connectionString: secureDatabaseUrl(process.env.DATABASE_URL) }) : null;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const transcriptionRequests = new Map();
const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "local-development-secret");
const seed = { users: [], providers: [], bookings: [], otp: [], sessions: [], reviews: [], schemeApplications: [], smsMessages: [] };
const opsSeed = {
  sensors: [
    { id: 's1', name: 'River gauge · Ghaghara', area: 'Bahraich, Uttar Pradesh', kind: 'river', value: 68, unit: '% bank-full', state: 'Monitoring', updatedAt: new Date().toISOString() },
    { id: 's2', name: 'Rainfall · Nanpara', area: 'Bahraich, Uttar Pradesh', kind: 'rain', value: 42, unit: 'mm / 3h', state: 'Elevated', updatedAt: new Date().toISOString() },
    { id: 's3', name: 'Soil moisture · Kaiserganj', area: 'Bahraich, Uttar Pradesh', kind: 'soil', value: 71, unit: '% saturation', state: 'Elevated', updatedAt: new Date().toISOString() },
    { id: 's4', name: 'Temperature · Gonda', area: 'Gonda, Uttar Pradesh', kind: 'temperature', value: 34, unit: '°C', state: 'Normal', updatedAt: new Date().toISOString() },
    { id: 's5', name: 'River gauge · Rapti', area: 'Balrampur, Uttar Pradesh', kind: 'river', value: 49, unit: '% bank-full', state: 'Normal', updatedAt: new Date().toISOString() },
    { id: 's6', name: 'Rainfall · Tulsipur', area: 'Balrampur, Uttar Pradesh', kind: 'rain', value: 19, unit: 'mm / 3h', state: 'Normal', updatedAt: new Date().toISOString() },
  ],
  incidents: [
    { id: 'INC-2048', title: 'Water entering low-lying homes', area: 'Nanpara · Bahraich', kind: 'Flood', severity: 'High', status: 'Dispatched', time: '8 min ago', detail: 'Community report: water rising near the eastern embankment.' },
    { id: 'INC-2047', title: 'Road access disrupted', area: 'Kaiserganj · Bahraich', kind: 'Access', severity: 'Moderate', status: 'New', time: '21 min ago', detail: 'Two-wheeler access only; bridge approach is waterlogged.' },
    { id: 'INC-2046', title: 'Drinking water needed', area: 'Tulsipur · Balrampur', kind: 'Supply', severity: 'Moderate', status: 'New', time: '43 min ago', detail: 'Village shelter requests clean water and ORS.' },
  ],
  responders: [ { id: 'r1', name: 'Asha response team', role: 'Field response', area: 'Nanpara', status: 'On route' }, { id: 'r2', name: 'PHC mobile unit', role: 'Medical', area: 'Bahraich', status: 'Available' }, { id: 'r3', name: 'Panchayat volunteers', role: 'Community', area: 'Kaiserganj', status: 'Available' } ],
  resources: [ { id: 'w1', name: 'Rescue boats', available: 4, unit: 'boats' }, { id: 'w2', name: 'Emergency kits', available: 86, unit: 'kits' }, { id: 'w3', name: 'Drinking water', available: 240, unit: 'cases' }, { id: 'w4', name: 'Medical teams', available: 3, unit: 'teams' } ],
};

let store;
if (database) {
  await database.query("CREATE TABLE IF NOT EXISTS sevasetu_state (id SMALLINT PRIMARY KEY CHECK (id = 1), payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  const result = await database.query("SELECT payload FROM sevasetu_state WHERE id = 1");
  let initialData = result.rows[0]?.payload;
  if (!initialData) {
    try { initialData = JSON.parse(await readFile(DATA_FILE, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  store = { ...seed, ...(initialData || {}) };
} else {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  try { store = { ...seed, ...JSON.parse(await readFile(DATA_FILE, "utf8")) }; }
  catch (error) { if (error.code !== "ENOENT") throw error; store = structuredClone(seed); }
}
store.ops ||= structuredClone(opsSeed);
function ensureRewards(user) {
  user.points ??= 0;
  user.rewardHistory ??= [];
  user.lastCheckIn ??= null;
  user.serviceCredits ??= [];
  if (!user.welcomeGranted && user.points === 0 && user.rewardHistory.length === 0) {
    user.points = 100;
    user.welcomeGranted = true;
    user.rewardHistory.unshift({ id: randomUUID(), points: 100, label: "Welcome bonus", labelHi: "स्वागत बोनस", createdAt: new Date().toISOString() });
  }
  return user;
}
for (const user of store.users) ensureRewards(user);
let writeQueue = Promise.resolve();
async function persist() {
  const snapshot = JSON.stringify(store, null, 2);
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    if (database) await database.query("INSERT INTO sevasetu_state (id, payload, updated_at) VALUES (1, $1::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()", [snapshot]);
    else {
      const temp = `${DATA_FILE}.${randomUUID()}.tmp`;
      await writeFile(temp, snapshot, { mode: 0o600 });
      await rename(temp, DATA_FILE);
    }
  });
  return writeQueue;
}
if (database && !(await database.query("SELECT 1 FROM sevasetu_state WHERE id = 1")).rowCount) await persist();
function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}
async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 1_000_000) throw Object.assign(new Error("Request body is too large"), { status: 413 }); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw Object.assign(new Error("Invalid JSON"), { status: 400 }); }
}
async function rawBody(req, maxBytes = 10_000_000) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error("Audio file is too large (10 MB limit)"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
const phoneNumber = (value) => String(value || "").replace(/[^\d+]/g, "");
const normalizePhone = (value) => {
  const phone = phoneNumber(value); const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+")) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};
function tokenFor(userId) {
  const value = `${userId}.${randomUUID()}`;
  return `${value}.${createHmac("sha256", SESSION_SECRET).update(value).digest("hex")}`;
}
function passwordDigest(password, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password, digest) {
  if (typeof password !== "string" || password.length < 8 || password.length > 200) return false;
  if (typeof digest !== "string" || !digest.includes(":")) return false;
  const [salt, expectedHex] = digest.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return { ...safe, role: safe.role === "provider" ? "provider" : "customer" };
}
async function createSession(user) {
  const token = tokenFor(user.id);
  store.sessions = store.sessions.filter((item) => item.userId !== user.id);
  store.sessions.push({ id: token, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60_000 });
  await persist();
  return token;
}
function currentUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !SESSION_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const value = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
  const a = Buffer.from(parts[2]); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const session = store.sessions.find((item) => item.id === token && item.expiresAt > Date.now());
  return session ? store.users.find((user) => user.id === session.userId) || null : null;
}
function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) json(res, 401, { error: "Sign in to continue" });
  return user;
}
function requireRole(req, res, role) {
  const user = requireUser(req, res);
  if (!user) return null;
  const actualRole = user.role === "provider" ? "provider" : "customer";
  if (actualRole !== role) { json(res, 403, { error: role === "provider" ? "Sign in with a provider account to continue" : "Sign in with a customer account to continue" }); return null; }
  return user;
}
async function sendTwilioCode(phone) {
  const url = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ To: phone, Channel: "sms" });
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error("SMS provider could not send the verification code");
}
async function checkTwilioCode(phone, code) {
  const url = `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;
  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ To: phone, Code: code });
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) return false;
  return (await response.json()).status === "approved";
}
const services = [
  { id: "crop", name: "Crop Advisory", startingPrice: 199, category: "agri", area: "rural" },
  { id: "soil", name: "Soil Testing", startingPrice: 249, category: "agri", area: "rural" },
  { id: "tractor", name: "Tractor & Equipment", startingPrice: 499, category: "agri", area: "rural" },
  { id: "dairy", name: "Dairy Support", startingPrice: 249, category: "agri", area: "rural" },
  { id: "veterinary", name: "Veterinary Visit", startingPrice: 399, category: "agri", area: "rural" },
  { id: "pump", name: "Water Pump Repair", startingPrice: 349, category: "home", area: "rural" },
  { id: "solar", name: "Solar Setup", startingPrice: 799, category: "home", area: "rural" },
  { id: "handicraft", name: "Handicrafts", startingPrice: 299, category: "craft", area: "rural" },
  { id: "biogas", name: "Biogas Service", startingPrice: 449, category: "agri", area: "rural" },
  { id: "gardening", name: "Gardening", startingPrice: 249, category: "agri", area: "rural" },
  { id: "plumbing", name: "Plumbing", startingPrice: 299, category: "home", area: "urban" },
  { id: "electrical", name: "Electrical", startingPrice: 349, category: "home", area: "urban" },
  { id: "cleaning", name: "Cleaning", startingPrice: 249, category: "home", area: "urban" },
  { id: "painting", name: "Painting", startingPrice: 499, category: "home", area: "urban" },
  { id: "carpentry", name: "Carpentry", startingPrice: 399, category: "home", area: "urban" },
  { id: "cooking", name: "Cooking", startingPrice: 299, category: "food", area: "urban" },
  { id: "tutoring", name: "Tutoring", startingPrice: 399, category: "edu", area: "urban" },
  { id: "driving", name: "Driving", startingPrice: 299, category: "transport", area: "urban" },
  { id: "beauty", name: "Beauty & Salon", startingPrice: 299, category: "beauty", area: "urban" },
  { id: "ac", name: "AC Repair", startingPrice: 499, category: "home", area: "urban" },
  { id: "security", name: "Security", startingPrice: 499, category: "home", area: "urban" },
];
const serviceHindi = { crop: "फसल सलाह", soil: "मिट्टी जांच", tractor: "ट्रैक्टर और उपकरण", dairy: "डेयरी सहायता", veterinary: "पशु चिकित्सा", pump: "पानी पंप मरम्मत", solar: "सोलर सेटअप", handicraft: "हस्तशिल्प", biogas: "बायोगैस सेवा", gardening: "बागवानी", plumbing: "प्लंबिंग", electrical: "इलेक्ट्रिकल", cleaning: "सफाई", painting: "पेंटिंग", carpentry: "बढ़ईगीरी", cooking: "खाना पकाना", tutoring: "ट्यूटरिंग", driving: "ड्राइविंग", beauty: "ब्यूटी और सैलून", ac: "AC मरम्मत", security: "सुरक्षा" };
const staleDemoProviders = store.providers.some((provider) => String(provider.id).startsWith("demo-"));
store.providers = store.providers.filter((provider) => !String(provider.id).startsWith("demo-"));
if (staleDemoProviders || store.users.length) await persist();
function bookingView(booking, viewerId) {
  const provider = store.providers.find((item) => item.userId === booking.providerUserId);
  return { ...booking, providerName: provider?.name || null, providerPhone: provider && viewerId === booking.customerId ? provider.phone : null };
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/\/$/, "") || "/";
  try {
    if (req.method === "POST" && path === "/api/sms/inbound") {
      const respondSms = (message, status = 200) => { const xml = `<Response><Message>${String(message).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message></Response>`; res.writeHead(status, { "Content-Type": "text/xml; charset=utf-8" }); res.end(xml); };
      if (!process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_SMS_WEBHOOK_URL) return respondSms("SMS booking is not configured. Please contact SevaSetu support.", 503);
      const contentType = req.headers["content-type"] || "";
      if (!contentType.startsWith("application/x-www-form-urlencoded")) return respondSms("Invalid message format.", 400);
      const raw = await rawBody(req, 16_000);
      const params = new URLSearchParams(raw.toString("utf8"));
      const signature = String(req.headers["x-twilio-signature"] || "");
      const signedPayload = process.env.TWILIO_SMS_WEBHOOK_URL + [...params.keys()].sort().map((key) => `${key}${params.getAll(key).join("")}`).join("");
      const expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN).update(signedPayload).digest("base64");
      const receivedBytes = Buffer.from(signature); const expectedBytes = Buffer.from(expected);
      if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) return respondSms("Could not verify this SMS request.", 403);
      if (process.env.TWILIO_SMS_NUMBER && normalizePhone(params.get("To")) !== normalizePhone(process.env.TWILIO_SMS_NUMBER)) return respondSms("This SMS destination is not configured for SevaSetu.", 403);
      const sender = normalizePhone(params.get("From"));
      const sid = String(params.get("MessageSid") || "").slice(0, 80);
      if (!sid || !sender) return respondSms("Missing sender details. Try again.", 400);
      store.smsMessages ||= [];
      if (store.smsMessages.includes(sid)) {
        const previous = store.bookings.find((item) => item.smsMessageSid === sid);
        return respondSms(previous ? `SevaSetu: request ${previous.id} already received. Check the app tracker for updates.` : "SevaSetu: message already received.");
      }
      store.smsMessages.push(sid);
      const text = String(params.get("Body") || "").trim();
      const customer = store.users.find((item) => item.phone === sender);
      if (/^(help|मदद|सहायता)$/i.test(text)) {
        await persist();
        return respondSms("SevaSetu: BOOK <service> | <village, landmark> (बुक <सेवा> | <गांव, पहचान>). Example: BOOK pump | Rampur, near school. Send STATUS for your latest booking.");
      }
      if (/^(status|स्थिति)$/i.test(text)) {
        await persist();
        if (!customer) return respondSms("No customer account found for this number. Sign in once on SevaSetu with this phone number, then text STATUS.");
        const latest = store.bookings.find((item) => item.customerId === customer.id);
        const hindiStatus = { confirmed: "पुष्टि की गई, प्रदाता की स्वीकृति बाकी", assigned: "प्रदाता नियुक्त", en_route: "प्रदाता रास्ते में", arrived: "प्रदाता पहुंच गए", in_progress: "सेवा जारी", completed: "सेवा पूरी", cancelled: "रद्द" };
        return respondSms(latest ? (/स्थिति/.test(text) ? `आपका अनुरोध ${latest.id}: ${hindiStatus[latest.status] || latest.status}। इंटरनेट मिलने पर सेवा सेतु ट्रैकर देखें।` : `Latest request ${latest.id}: ${latest.status}. Open SevaSetu Tracker when internet is available.`) : "No booking requests found. Text HELP for booking instructions.");
      }
      const match = text.match(/^(?:book|बुक)\s+([^|]+)\|\s*(.{3,300})$/i);
      if (!match) { await persist(); return respondSms("Use BOOK/बुक <service/सेवा> | <village and landmark/गांव और पहचान>. Send HELP/मदद for an example."); }
      const serviceKey = match[1].trim().toLowerCase();
      const aliases = { plumber: "plumbing", electrician: "electrical", cleaner: "cleaning", carpenter: "carpentry", veterinary: "veterinary", vet: "veterinary", tractor: "tractor", "crop advice": "crop", "soil test": "soil", "pump repair": "pump" };
      const serviceId = aliases[serviceKey] || serviceKey;
      const service = services.find((item) => item.id === serviceId || item.name.toLowerCase() === serviceKey || serviceHindi[item.id] === match[1].trim());
      if (!service) { await persist(); return respondSms("Service not found. Text the service id, like pump, plumbing, veterinary, or crop. Send HELP for instructions."); }
      if (customer?.role === "provider") { await persist(); return respondSms("Provider accounts cannot place customer bookings. Use a separate customer account."); }
      const bookingCustomer = customer || ensureRewards({ id: randomUUID(), phone: sender, name: "SMS customer", city: "", role: "customer", createdAt: new Date().toISOString() });
      if (!customer) store.users.push(bookingCustomer);
      const booking = { id: `SVS-${randomUUID().slice(0, 8).toUpperCase()}`, customerId: bookingCustomer.id, serviceId: service.id, serviceName: service.name, scheduledAt: null, address: match[2].trim(), originalAmount: service.startingPrice, creditDiscount: 0, amount: service.startingPrice, paymentMethod: "cod", paymentStatus: "pending", status: "confirmed", providerUserId: null, preferredProviderId: null, providerLocation: null, source: "sms", smsMessageSid: sid, events: [{ status: "confirmed", at: new Date().toISOString() }], createdAt: new Date().toISOString() };
      store.bookings.unshift(booking); await persist();
      return respondSms(/बुक/.test(text) ? `सेवा सेतु अनुरोध ${booking.id} प्राप्त। ${serviceHindi[service.id] || service.name} की शुरुआती कीमत ₹${service.startingPrice}। सेवा के बाद प्रदाता को भुगतान करें। प्रदाता की स्वीकृति बाकी है; STATUS से स्थिति देखें।` : `SevaSetu booking request ${booking.id} received for ${service.name}. Starting at Rs ${service.startingPrice}; pay provider after service. Provider acceptance is still required. Text STATUS for updates.`);
    }
    if (req.method === "GET" && path === "/api/health") {
      if (database) await database.query("SELECT 1");
      return json(res, 200, { status: "ok", database: database ? "postgresql" : "local-file", ai: GROQ_API_KEY ? "groq" : process.env.OPENAI_API_KEY ? "openai" : "builtin", smsBooking: Boolean(process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_NUMBER && process.env.TWILIO_SMS_WEBHOOK_URL), smsNumber: process.env.TWILIO_SMS_NUMBER || null, time: new Date().toISOString() });
    }
    if (req.method === "GET" && path === "/api/ops/snapshot") {
      return json(res, 200, { ...store.ops, generatedAt: new Date().toISOString() });
    }
    if (req.method === "POST" && path === "/api/ops/simulate") {
      const data = await body(req);
      const scenario = ["flood", "heat", "normal"].includes(data.scenario) ? data.scenario : null;
      if (!scenario) return json(res, 400, { error: "scenario must be flood, heat, or normal" });
      const values = scenario === "flood" ? { s1: 91, s2: 118, s3: 94, s4: 34, s5: 73, s6: 82 } : scenario === "heat" ? { s1: 68, s2: 18, s3: 42, s4: 43, s5: 49, s6: 19 } : { s1: 52, s2: 22, s3: 50, s4: 31, s5: 44, s6: 12 };
      const now = new Date().toISOString();
      store.ops.sensors = store.ops.sensors.map((sensor) => {
        const value = values[sensor.id] ?? sensor.value;
        return { ...sensor, value, state: value >= 80 ? "Alert" : value >= 55 ? "Elevated" : "Normal", updatedAt: now };
      });
      if (scenario !== "normal") {
        const kind = scenario === "flood" ? "Flood" : "Heat";
        store.ops.incidents.unshift({ id: `INC-${randomUUID().slice(0, 8).toUpperCase()}`, title: `${kind} scenario: community response drill`, area: scenario === "flood" ? "Nanpara · Bahraich" : "Gonda · Uttar Pradesh", kind, severity: "High", status: "New", time: "Just now", detail: "Created by the scenario simulator. Assign a response team to test the workflow." });
      }
      await persist();
      return json(res, 200, { ...store.ops, generatedAt: now });
    }
    if (req.method === "POST" && path === "/api/ops/incidents") {
      const data = await body(req);
      const title = String(data.title || "").trim().slice(0, 160);
      const area = String(data.area || "").trim().slice(0, 160);
      if (!title || !area) return json(res, 400, { error: "Incident title and area are required" });
      const incident = { id: `INC-${randomUUID().slice(0, 8).toUpperCase()}`, title, area, kind: "Community report", severity: "High", status: "New", time: "Just now", detail: "Reported by a community operator." };
      store.ops.incidents.unshift(incident);
      await persist();
      return json(res, 201, { ...store.ops, generatedAt: new Date().toISOString() });
    }
    const incidentMatch = path.match(/^\/api\/ops\/incidents\/([^/]+)$/);
    if (req.method === "PATCH" && incidentMatch) {
      const data = await body(req);
      const incident = store.ops.incidents.find((item) => item.id === decodeURIComponent(incidentMatch[1]));
      if (!incident) return json(res, 404, { error: "Incident not found" });
      if (!["New", "Dispatched", "Resolved"].includes(data.status)) return json(res, 400, { error: "Invalid incident status" });
      incident.status = data.status;
      await persist();
      return json(res, 200, { ...store.ops, generatedAt: new Date().toISOString() });
    }
    const resourceMatch = path.match(/^\/api\/ops\/resources\/([^/]+)\/dispatch$/);
    if (req.method === "POST" && resourceMatch) {
      const resource = store.ops.resources.find((item) => item.id === decodeURIComponent(resourceMatch[1]));
      if (!resource) return json(res, 404, { error: "Resource not found" });
      if (resource.available <= 0) return json(res, 409, { error: "No units are available" });
      resource.available -= 1;
      await persist();
      return json(res, 200, { ...store.ops, generatedAt: new Date().toISOString() });
    }
    if (req.method === "GET" && path === "/api/services") {
      return json(res, 200, { services: services.map((item) => ({ ...item, nameHi: serviceHindi[item.id], onlineProviders: store.providers.filter((provider) => provider.online && provider.skills.includes(item.id)).length })) });
    }
    if (req.method === "GET" && path === "/api/platform/summary") {
      const onlineProviders = store.providers.filter((provider) => provider.online);
      return json(res, 200, { serviceCount: services.length, ruralServiceCount: services.filter((item) => item.area === "rural").length, urbanServiceCount: services.filter((item) => item.area === "urban").length, onlineProviderCount: onlineProviders.length, activeBookingCount: store.bookings.filter((item) => !["completed", "cancelled"].includes(item.status)).length, completedBookingCount: store.bookings.filter((item) => item.status === "completed").length, updatedAt: new Date().toISOString() });
    }
    if (req.method === "POST" && path === "/api/ai/reply") {
      const data = await body(req);
      const message = String(data.message || "").trim().slice(0, 2000);
      if (!message) return json(res, 400, { error: "Enter a message" });
      if (!GROQ_API_KEY && !process.env.OPENAI_API_KEY) return json(res, 200, { configured: false });
      const prompt = "You are SevaSetu, an assistant for home services and Indian public benefit information. Return only a JSON object with exactly two string properties: en (a clear English answer) and hi (a natural Hindi answer in Devanagari). Keep both answers equivalent and concise. Do not claim to have booked services, contacted providers, checked live availability, verified eligibility, or dispatched emergency help. Real booking actions happen through app buttons. For immediate danger, advise contacting local emergency services and never invent a helpline. Clearly say when government details need official verification.";
      const history = Array.isArray(data.history) ? data.history.slice(-8).filter((item) => ["user", "assistant"].includes(item?.role) && typeof item?.content === "string").map((item) => ({ role: item.role, content: item.content.slice(0, 2000) })) : [];
      const useGroq = Boolean(GROQ_API_KEY);
      const response = await fetch(useGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${useGroq ? GROQ_API_KEY : process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(useGroq
          ? { model: process.env.GROQ_MODEL || "openai/gpt-oss-120b", messages: [{ role: "system", content: prompt }, ...history, { role: "user", content: message }], max_tokens: 500, temperature: 0.2, response_format: { type: "json_object" } }
          : { model: process.env.OPENAI_MODEL || "gpt-4.1-mini", instructions: prompt, input: [...history, { role: "user", content: message }], max_output_tokens: 500 }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error("AI service is temporarily unavailable");
      const result = await response.json();
      const answer = result.choices?.[0]?.message?.content || result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
      if (!answer) throw new Error("AI service returned an empty answer");
      let localized;
      try { localized = JSON.parse(answer); } catch { throw new Error("AI service returned an invalid bilingual answer"); }
      if (typeof localized.en !== "string" || typeof localized.hi !== "string") throw new Error("AI service returned an invalid bilingual answer");
      return json(res, 200, { configured: true, answerEn: localized.en, answerHi: localized.hi });
    }
    if (req.method === "POST" && path === "/api/ai/transcribe") {
      if (!GROQ_API_KEY) return json(res, 503, { error: "Voice fallback is not configured. Set GROQ_API_KEY on the backend." });
      const contentType = req.headers["content-type"] || "";
      if (!contentType.startsWith("multipart/form-data; boundary=")) return json(res, 400, { error: "Send a recorded audio file to transcribe" });
      const audio = await rawBody(req);
      if (!audio.length) return json(res, 400, { error: "No audio was recorded. Try speaking again." });
      const now = Date.now();
      const recent = (transcriptionRequests.get(req.socket.remoteAddress) || []).filter((time) => now - time < 60_000);
      if (recent.length >= 8) return json(res, 429, { error: "Too many voice requests. Wait a minute and try again." });
      recent.push(now); transcriptionRequests.set(req.socket.remoteAddress, recent);
      const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": contentType },
        body: audio,
        signal: AbortSignal.timeout(45_000),
      });
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) throw new Error("Voice transcription service is unavailable. Try again or use text input.");
      const transcript = String(result.text || "").trim().slice(0, 2000);
      if (!transcript) return json(res, 422, { error: "No speech was detected. Try speaking closer to the microphone." });
      return json(res, 200, { transcript });
    }
    if (req.method === "POST" && path === "/api/auth/otp") {
      const data = await body(req); const phone = normalizePhone(data.phone);
      if (phone.replace(/\D/g, "").length < 10) return json(res, 400, { error: "Enter a valid phone number" });
      if (TWILIO) await sendTwilioCode(phone);
      else if (process.env.NODE_ENV === "production" && !DEMO_OTP) return json(res, 503, { error: "SMS verification is not configured. Set the Twilio Verify environment variables." });
      else {
        const code = String(randomInt(100000, 1000000));
        store.otp = store.otp.filter((item) => item.phone !== phone);
        store.otp.push({ phone, code, expiresAt: Date.now() + 5 * 60_000 }); await persist();
        return json(res, 200, { message: DEMO_OTP ? "Demo code generated" : "Development code generated", developmentCode: code, demoMode: DEMO_OTP });
      }
      return json(res, 200, { message: "Verification code sent" });
    }
    if (req.method === "POST" && path === "/api/auth/verify") {
      const data = await body(req); const phone = normalizePhone(data.phone); const code = String(data.code || "");
      let valid = false;
      if (TWILIO) valid = await checkTwilioCode(phone, code);
      else { const challenge = store.otp.find((item) => item.phone === phone && item.expiresAt > Date.now()); valid = Boolean(challenge && challenge.code === code); store.otp = store.otp.filter((item) => item.phone !== phone); }
      if (!valid) return json(res, 401, { error: "The code is invalid or expired" });
      const requestedRole = data.role === "provider" ? "provider" : "customer";
      let user = store.users.find((item) => item.phone === phone);
      if (user && (user.role === "provider" ? "provider" : "customer") !== requestedRole) return json(res, 403, { error: `This phone belongs to a ${user.role === "provider" ? "provider" : "customer"} account. Choose the matching sign-in option.` });
      if (!user) { user = ensureRewards({ id: randomUUID(), phone, name: String(data.name || "").trim(), city: String(data.city || "").trim(), role: requestedRole, createdAt: new Date().toISOString() }); store.users.push(user); }
      else { if (data.name) user.name = String(data.name).trim(); if (data.city) user.city = String(data.city).trim(); }
      const token = tokenFor(user.id); store.sessions = store.sessions.filter((item) => item.userId !== user.id);
      store.sessions.push({ id: token, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60_000 }); await persist();
      return json(res, 200, { token, user: publicUser(user) });
    }
    if (req.method === "POST" && path === "/api/auth/register") {
      const data = await body(req);
      const email = String(data.email || "").trim().toLowerCase();
      const name = String(data.name || "").trim().slice(0, 100);
      const password = String(data.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: "Enter a valid email address" });
      if (password.length < 8 || password.length > 200) return json(res, 400, { error: "Password must be at least 8 characters" });
      if (!name) return json(res, 400, { error: "Enter your name" });
      if (store.users.some((item) => item.email === email)) return json(res, 409, { error: "An account with this email already exists. Sign in instead." });
      const role = data.role === "provider" ? "provider" : "customer";
      const phone = data.phone ? normalizePhone(data.phone) : "";
      if (phone && phone.replace(/\D/g, "").length < 10) return json(res, 400, { error: "Enter a valid phone number" });
      const user = ensureRewards({ id: randomUUID(), name, email, phone, city: String(data.city || "").trim().slice(0, 100), role, passwordHash: passwordDigest(password), createdAt: new Date().toISOString() });
      store.users.push(user);
      const token = await createSession(user);
      return json(res, 201, { token, user: publicUser(user) });
    }
    if (req.method === "POST" && path === "/api/auth/login") {
      const data = await body(req);
      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");
      const user = store.users.find((item) => item.email === email);
      if (!user?.passwordHash || !passwordMatches(password, user.passwordHash)) return json(res, 401, { error: "Email or password is incorrect" });
      if (data.role && (data.role === "provider" ? "provider" : "customer") !== (user.role === "provider" ? "provider" : "customer")) return json(res, 403, { error: `This is a ${user.role === "provider" ? "provider" : "customer"} account. Choose the matching sign-in option.` });
      const token = await createSession(user);
      return json(res, 200, { token, user: publicUser(user) });
    }
    if (req.method === "GET" && path === "/api/auth/me") { const user = requireUser(req, res); return user ? json(res, 200, { user: publicUser(user) }) : undefined; }
    if (req.method === "GET" && path === "/api/preferences") { const user = requireUser(req, res); return user ? json(res, 200, { preferences: user.preferences || {} }) : undefined; }
    if (req.method === "PATCH" && path === "/api/preferences") { const user = requireUser(req, res); if (!user) return; const data = await body(req); const allowed = ["bookingUpdates", "promotions", "govtSchemes", "smsAlerts", "emailDigest", "pushNotifs", "sevaPoints", "providerArrival"]; user.preferences = { ...(user.preferences || {}) }; for (const key of allowed) if (typeof data[key] === "boolean") user.preferences[key] = data[key]; await persist(); return json(res, 200, { preferences: user.preferences }); }
    if (req.method === "PATCH" && path === "/api/auth/profile") { const user = requireUser(req, res); if (!user) return; const data = await body(req); if (data.name !== undefined) user.name = String(data.name).trim().slice(0, 100); if (data.city !== undefined) user.city = String(data.city).trim().slice(0, 100); if (!user.name) return json(res, 400, { error: "Name is required" }); await persist(); return json(res, 200, { user: publicUser(user) }); }
    if (req.method === "POST" && path === "/api/auth/logout") { const user = requireUser(req, res); if (!user) return; const token = req.headers.authorization?.replace(/^Bearer\s+/i, ""); store.sessions = store.sessions.filter((item) => item.id !== token); await persist(); return json(res, 200, { ok: true }); }
    if (req.method === "GET" && path === "/api/rewards") { const user = requireRole(req, res, "customer"); if (!user) return; ensureRewards(user); await persist(); return json(res, 200, { points: user.points || 0, history: user.rewardHistory || [], lastCheckIn: user.lastCheckIn || null, serviceCredits: user.serviceCredits }); }
    if (req.method === "POST" && path === "/api/rewards/check-in") { const user = requireRole(req, res, "customer"); if (!user) return; const today = new Date().toISOString().slice(0, 10); if (user.lastCheckIn === today) return json(res, 409, { error: "You already checked in today" }); user.lastCheckIn = today; user.points = (user.points || 0) + 5; user.rewardHistory ||= []; user.rewardHistory.unshift({ id: randomUUID(), points: 5, label: "Daily check-in", labelHi: "दैनिक चेक-इन", createdAt: new Date().toISOString() }); await persist(); return json(res, 200, { points: user.points, lastCheckIn: today }); }
    if (req.method === "POST" && path === "/api/rewards/redeem") { const user = requireRole(req, res, "customer"); if (!user) return; const data = await body(req); const points = Number(data.points); if (![100, 500, 1000, 2000].includes(points)) return json(res, 400, { error: "Choose a listed reward" }); if ((user.points || 0) < points) return json(res, 409, { error: "Not enough points" }); user.points -= points; const code = `SEVA-${randomUUID().slice(0, 8).toUpperCase()}`; const credit = { code, value: points / 10, usedAt: null, createdAt: new Date().toISOString() }; user.serviceCredits ||= []; user.serviceCredits.push(credit); user.rewardHistory ||= []; user.rewardHistory.unshift({ id: randomUUID(), points: -points, label: `Redeemed ₹${points / 10} service credit (${code})`, labelHi: `₹${points / 10} सेवा क्रेडिट रिडीम (${code})`, createdAt: new Date().toISOString() }); await persist(); return json(res, 200, { points: user.points, code, value: points / 10 }); }
    if (req.method === "POST" && path === "/api/schemes/applications") { const user = requireRole(req, res, "customer"); if (!user) return; const data = await body(req); if (!String(data.schemeId || "").trim() || !String(data.name || "").trim() || phoneNumber(data.phone).replace(/\D/g, "").length < 10) return json(res, 400, { error: "Scheme, name, and valid phone number are required" }); const application = { id: randomUUID(), userId: user.id, schemeId: String(data.schemeId).slice(0, 100), name: String(data.name).trim().slice(0, 100), phone: normalizePhone(data.phone), status: "submitted", createdAt: new Date().toISOString() }; store.schemeApplications.push(application); await persist(); return json(res, 201, { application }); }
    if (req.method === "POST" && path === "/api/providers") {
      const user = requireRole(req, res, "provider"); if (!user) return;
      const data = await body(req); const skills = Array.isArray(data.skills) ? data.skills.map(String).slice(0, 20) : [];
      if (!String(data.name || user.name).trim() || skills.length === 0 || !String(data.city || user.city).trim()) return json(res, 400, { error: "Name, city, and at least one skill are required" });
      let provider = store.providers.find((item) => item.userId === user.id);
      const phone = data.phone ? normalizePhone(data.phone) : user.phone;
      if (!phone || phone.replace(/\D/g, "").length < 10) return json(res, 400, { error: "A valid phone number is required for provider registration" });
      user.phone = phone;
      provider = { ...(provider || { id: randomUUID(), userId: user.id, createdAt: new Date().toISOString() }), name: String(data.name || user.name).trim(), phone, city: String(data.city || user.city).trim(), address: String(data.address || "").trim(), experience: Number(data.experience || 0), skills, status: "pending", online: provider?.online || false };
      store.providers = store.providers.filter((item) => item.userId !== user.id); store.providers.push(provider); await persist(); return json(res, 201, { provider });
    }
    if (req.method === "GET" && path === "/api/providers/me") { const user = requireRole(req, res, "provider"); if (!user) return; return json(res, 200, { provider: store.providers.find((item) => item.userId === user.id) || null }); }
    if (req.method === "PATCH" && path === "/api/providers/me/availability") { const user = requireRole(req, res, "provider"); if (!user) return; const provider = store.providers.find((item) => item.userId === user.id); if (!provider) return json(res, 404, { error: "Submit a provider application first" }); const data = await body(req); provider.online = Boolean(data.online); await persist(); return json(res, 200, { provider }); }
    if (req.method === "GET" && path === "/api/providers") {
      const service = services.find((item) => item.id === url.searchParams.get("serviceId"));
      if (!service) return json(res, 400, { error: "Choose a valid service" });
      const providers = store.providers.filter((item) => item.online && item.skills.some((skill) => skill.toLowerCase() === service.id || skill.toLowerCase() === service.name.toLowerCase())).map((item) => ({ id: item.id, name: item.name, skill: service.name, skillHi: serviceHindi[service.id] || service.name, rating: 0, reviews: 0, distance: "—", price: `₹${service.startingPrice}`, location: item.city, available: true, verified: false, avatar: item.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), city: item.city }));
      return json(res, 200, { providers });
    }
    if (req.method === "GET" && path === "/api/provider/jobs") { const user = requireRole(req, res, "provider"); if (!user) return; const provider = store.providers.find((item) => item.userId === user.id); if (!provider) return json(res, 404, { error: "Submit a provider application first" }); const skills = provider.skills.map((skill) => skill.toLowerCase()); const jobs = store.bookings.filter((booking) => (booking.providerUserId === user.id) || (!booking.providerUserId && (booking.status === "confirmed" || booking.status === "pending") && skills.includes(booking.serviceId) && (!booking.preferredProviderId || booking.preferredProviderId === provider.id))).map((booking) => ({ ...booking, providerUserId: booking.providerUserId })); return json(res, 200, { jobs }); }
    if (req.method === "GET" && path === "/api/bookings") { const user = requireUser(req, res); if (!user) return; const isProvider = user.role === "provider"; return json(res, 200, { bookings: store.bookings.filter((item) => isProvider ? item.providerUserId === user.id : item.customerId === user.id).map((item) => bookingView(item, user.id)) }); }
    if (req.method === "POST" && path === "/api/bookings") {
      const user = requireRole(req, res, "customer"); if (!user) return;
      const data = await body(req); const service = services.find((item) => item.id === data.serviceId);
      if (!service) return json(res, 400, { error: "Choose a valid service" });
      if (data.clientRequestId && store.bookings.some((item) => item.customerId === user.id && item.clientRequestId === data.clientRequestId)) return json(res, 200, { booking: store.bookings.find((item) => item.customerId === user.id && item.clientRequestId === data.clientRequestId) });
      const requestedProvider = data.providerId ? store.providers.find((item) => item.id === data.providerId && item.online && item.skills.includes(service.id)) : null;
      if (data.providerId && !requestedProvider) return json(res, 409, { error: "That provider is no longer available for this service" });
      const creditCode = String(data.creditCode || "").trim().toUpperCase();
      const credit = creditCode ? (user.serviceCredits || []).find((item) => item.code === creditCode && !item.usedAt) : null;
      if (creditCode && !credit) return json(res, 409, { error: "That service credit is invalid or has already been used" });
      const creditDiscount = credit ? Math.min(service.startingPrice, credit.value) : 0;
      const booking = { id: `SVS-${randomUUID().slice(0, 8).toUpperCase()}`, clientRequestId: data.clientRequestId ? String(data.clientRequestId).slice(0, 100) : null, customerId: user.id, serviceId: service.id, serviceName: service.name, scheduledAt: data.scheduledAt || null, address: String(data.address || "").trim(), originalAmount: service.startingPrice, creditDiscount, creditCode: credit?.code || null, amount: service.startingPrice - creditDiscount, paymentMethod: data.paymentMethod === "cod" ? "cod" : null, paymentStatus: data.paymentMethod === "cod" ? "pending" : "unpaid", status: "confirmed", providerUserId: null, preferredProviderId: requestedProvider?.id || null, providerLocation: null, events: [{ status: "confirmed", at: new Date().toISOString() }], createdAt: new Date().toISOString() };
      if (credit) credit.usedAt = new Date().toISOString();
      store.bookings.unshift(booking); await persist(); return json(res, 201, { booking });
    }
    const bookingMatch = path.match(/^\/api\/bookings\/([^/]+)(?:\/(accept|location|customer-location|review))?$/);
    if (bookingMatch && req.method === "GET") { const user = requireUser(req, res); if (!user) return; const isProvider = user.role === "provider"; const booking = store.bookings.find((item) => item.id === bookingMatch[1] && (isProvider ? item.providerUserId === user.id : item.customerId === user.id)); return booking ? json(res, 200, { booking: bookingView(booking, user.id) }) : json(res, 404, { error: "Booking not found" }); }
    if (bookingMatch && req.method === "POST" && bookingMatch[2] === "accept") { const user = requireRole(req, res, "provider"); if (!user) return; const booking = store.bookings.find((item) => item.id === bookingMatch[1]); const provider = store.providers.find((item) => item.userId === user.id); if (!booking || !provider || !provider.online) return json(res, 404, { error: "This job is not available" }); if (booking.providerUserId || !provider.skills.includes(booking.serviceId) || (booking.preferredProviderId && booking.preferredProviderId !== provider.id)) return json(res, 409, { error: "This job was already accepted or does not match your skills" }); booking.providerUserId = user.id; booking.status = "assigned"; booking.events ||= []; booking.events.push({ status: "assigned", at: new Date().toISOString() }); await persist(); return json(res, 200, { booking }); }
    if (bookingMatch && req.method === "POST" && bookingMatch[2] === "customer-location") { const user = requireRole(req, res, "customer"); if (!user) return; const booking = store.bookings.find((item) => item.id === bookingMatch[1] && item.customerId === user.id && !["completed", "cancelled"].includes(item.status)); if (!booking) return json(res, 404, { error: "Active booking not found" }); const data = await body(req); const latitude = Number(data.latitude); const longitude = Number(data.longitude); if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return json(res, 400, { error: "Invalid coordinates" }); booking.customerLocation = { latitude, longitude, updatedAt: new Date().toISOString() }; await persist(); return json(res, 200, { customerLocation: booking.customerLocation }); }
    if (bookingMatch && req.method === "POST" && bookingMatch[2] === "location") { const user = requireRole(req, res, "provider"); if (!user) return; const booking = store.bookings.find((item) => item.id === bookingMatch[1] && item.providerUserId === user.id && !["completed", "cancelled"].includes(item.status)); if (!booking) return json(res, 404, { error: "Active assigned booking not found" }); const data = await body(req); const latitude = Number(data.latitude); const longitude = Number(data.longitude); if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return json(res, 400, { error: "Invalid coordinates" }); booking.providerLocation = { latitude, longitude, updatedAt: new Date().toISOString() }; await persist(); return json(res, 200, { providerLocation: booking.providerLocation }); }
    if (bookingMatch && req.method === "POST" && bookingMatch[2] === "review") { const user = requireRole(req, res, "customer"); if (!user) return; const booking = store.bookings.find((item) => item.id === bookingMatch[1] && item.customerId === user.id && item.status === "completed"); if (!booking) return json(res, 404, { error: "Completed booking not found" }); if (store.reviews.some((item) => item.bookingId === booking.id)) return json(res, 409, { error: "This booking already has a review" }); const data = await body(req); const rating = Number(data.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(res, 400, { error: "Choose a rating from 1 to 5" }); const review = { id: randomUUID(), bookingId: booking.id, customerId: user.id, rating, comment: String(data.comment || "").slice(0, 1000), createdAt: new Date().toISOString() }; store.reviews.push(review); user.points = (user.points || 0) + 20; user.rewardHistory ||= []; user.rewardHistory.unshift({ id: randomUUID(), points: 20, label: "Booking review", labelHi: "सेवा समीक्षा", createdAt: new Date().toISOString() }); await persist(); return json(res, 201, { review, points: user.points }); }
    if (bookingMatch && req.method === "PATCH") { const user = requireUser(req, res); if (!user) return; const data = await body(req); const requiredRole = data.status === "cancelled" ? "customer" : "provider"; if ((user.role === "provider" ? "provider" : "customer") !== requiredRole) return json(res, 403, { error: requiredRole === "provider" ? "Sign in with a provider account to update this job" : "Sign in with a customer account to cancel this booking" }); const booking = store.bookings.find((item) => item.id === bookingMatch[1]); if (!booking) return json(res, 404, { error: "Booking not found" }); const allowedNext = { assigned: "en_route", en_route: "arrived", arrived: "in_progress", in_progress: "completed" }; if (user.id === booking.customerId && data.status === "cancelled" && ["confirmed", "assigned"].includes(booking.status)) booking.status = "cancelled"; else if (user.id === booking.providerUserId && allowedNext[booking.status] === data.status) booking.status = data.status; else return json(res, 403, { error: "This status change is not allowed" }); booking.events ||= []; booking.events.push({ status: booking.status, at: new Date().toISOString() }); if (booking.status === "completed" && !booking.pointsAwarded) { const customer = store.users.find((item) => item.id === booking.customerId); if (customer) { customer.points = (customer.points || 0) + 50; customer.rewardHistory ||= []; customer.rewardHistory.unshift({ id: randomUUID(), points: 50, label: `Completed ${booking.serviceName} booking`, labelHi: `${booking.serviceName} की सेवा पूरी`, createdAt: new Date().toISOString() }); booking.pointsAwarded = true; } } await persist(); return json(res, 200, { booking }); }
    if (req.method === "POST" && path === "/api/payments/cod") { const user = requireRole(req, res, "customer"); if (!user) return; const data = await body(req); const booking = store.bookings.find((item) => item.id === data.bookingId && item.customerId === user.id); if (!booking) return json(res, 404, { error: "Booking not found" }); booking.paymentMethod = "cod"; booking.paymentStatus = "pending"; await persist(); return json(res, 200, { booking }); }
    return json(res, 404, { error: "Route not found" });
  } catch (error) {
    console.error(error);
    return json(res, error.status || 500, { error: error.status ? error.message : "Server error" });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log(`SevaSetu API listening on ${PORT}; database ${database ? "PostgreSQL" : DATA_FILE}`));
for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => server.close(async () => { await writeQueue; await database?.end(); process.exit(0); }));
