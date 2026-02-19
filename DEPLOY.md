# DocYard – Stripe, Railway, Supabase setup

## Commit & push to GitHub

From the project root:

```bash
git add -A
git status
git commit -m "Your message"
git push
```

Or run `npm run push` to stage everything and see status, then commit and push.

---

## Environment variables

### Server (`server/.env`)

Copy from `server/.env.example`. You already have a `.env` with placeholders.

| Variable | Where to get it |
|----------|-----------------|
| `ADMIN_SECRET` | Pick a strong random string for /admin |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `STRIPE_PRICE_ID` | Stripe → Products → your subscription → Pricing → API ID (`price_...`) |
| `DATABASE_URL` | **Railway** → your Postgres service → Connect → copy **Postgres connection URL** |
| `SUPABASE_URL` | **Supabase** → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (server-only, never expose in client) |
| `FRONTEND_URL` | Your production app URL (e.g. `https://yourapp.com`) for Stripe redirects |

### Client (`client/.env`)

Copy from `client/.env.example`.

| Variable | Where to get it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Same as server: Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` / public key (safe for browser) |

---

## Stripe

1. Create an account at [stripe.com](https://stripe.com) and get [API keys](https://dashboard.stripe.com/apikeys).
2. Create a **Product** (e.g. “DocYard Pro”) and a **Price** (e.g. $10/month recurring). Copy the Price ID (`price_...`).
3. Put `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` in `server/.env`. Restart the server.

---

## Railway (Postgres)

1. In [Railway](https://railway.app), create a project and add **Postgres**.
2. Open the Postgres service → **Connect** → copy the **Postgres connection URL** (starts with `postgresql://`).
3. Set `DATABASE_URL` in `server/.env`. The app can use this for user data, stats, or other persistence once wired.

---

## Supabase (auth & users)

1. Create a project at [supabase.com](https://supabase.com).
2. In **Settings → API**: copy **Project URL** and **anon** key.
3. In `client/.env`: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. In `server/.env` (optional, for server-side auth checks): set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Auth and user tables live in Supabase; you can link them to Railway Postgres later if needed.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check (Railway/load balancers). Returns `{ ok, service, timestamp }`. |
| POST | /api/feedback | Submit feedback. Body: `{ type: 'good'\|'bad', message?, context?, tags? }`. Returns 201 `{ success: true }`. |
| GET | /api/feedback/stats | Aggregate counts. Returns `{ success: true, data: { total, good, bad, recent } }`. |
| POST | /api/export/excel | Export rows to Excel (Yardi JE or standard). |
| POST | /api/export/csv | Export rows to CSV. |

Errors use `{ success: false, error: "message" }` with appropriate status code. For Postgres/Railway migration, see `server/docs/SCHEMA.md`.

---

## Desktop app (Electron)

You can build DocYard as a desktop app (Windows, Mac, or Linux). The desktop build runs the **client only** (no server): parsing, documents, and exports work offline; feedback is stored locally when the server is not available.

### Prerequisites

From the project root, install dependencies including Electron:

```bash
npm install
cd client && npm install && cd ..
```

### Run desktop app in development

1. Start the Vite dev server and Electron (Electron will open and load http://localhost:3000):

```bash
npm run electron:dev
```

2. Or in two terminals: `npm run dev:client` then `npx electron .`

### Build installable desktop app

1. Build the client and package with Electron Builder:

```bash
npm run electron:build
```

2. Output is in the **`release/`** folder:
   - **Windows:** `release/DocYard Setup x.x.x.exe` (installer) and `release/DocYard x.x.x.exe` (portable)
   - **macOS:** `release/DocYard-x.x.x.dmg`
   - **Linux:** `release/DocYard-x.x.x.AppImage`

3. To build without creating the installer (faster, for testing): `npm run electron:pack`

4. To build for a specific architecture (e.g. 64-bit Windows on an ARM machine):  
   `npm run build && electron-builder --win --x64`

### Notes

- The desktop app does not start the Node server; it uses only the built client. API features (e.g. feedback to server) work when you later point the app at a deployed backend, or they fall back to local storage.
- Windows Defender or SmartScreen may show a warning for unsigned builds; you can “Run anyway” or sign the app with a code-signing certificate for distribution.

---

## Run locally

```bash
# From project root – install all deps once
npm run install:all

# Run server + client together
npm run dev
```

- **Client:** http://localhost:3000 (or 3001, 3002 if 3000 is in use)
- **Server API:** http://localhost:4000 (client proxies `/api` to this)

If port 4000 is already in use, set `PORT=4001` in `server/.env` and in `client/vite.config.js` change the proxy target to `http://localhost:4001`.

Or run in two terminals: `npm run dev:server` and `npm run dev:client`.
