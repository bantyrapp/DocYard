# DocYard

**Trial balance to Yardi journal entry.** The Yardi tool you trust for property accounting. Runs **in your browser**—no server or WiFi required for the main flow. Upload your Excel trial balance, set post month and journal date, and download a file ready to import into Yardi. You can also download Excel templates (Yardi JE, trial balance). Stripe payments and a React Native app may be added later; the Electron desktop wrapper is an optional side feature.

## License

Proprietary. Copyright (c) 2025 DocYard. All Rights Reserved. See [LICENSE](LICENSE).

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### Environment

Copy `server/.env.example` to `server/.env` and set:

- `ADMIN_SECRET` – Secret key for the admin stats page (required for `/admin`; set a strong random string)
- `STRIPE_SECRET_KEY` – Stripe secret key (for payments; optional to run without)
- `STRIPE_PRICE_ID` – Stripe Price ID for subscription (optional to run without)
- `FRONTEND_URL` – Optional; frontend URL for Stripe redirects (defaults to request origin)

### Run locally

**Development (client + server):**

```bash
# Terminal 1 – server (port 4000)
cd server && npm run dev

# Terminal 2 – client (port 3000, proxies /api to server)
cd client && npm run dev
```

Open http://localhost:3000 (or the port Vite shows if 3000 is in use).

**Production build:**

```bash
cd client && npm run build
cd ../server && npm start
```

Serves the built client from the server. Set `PORT` (default 4000) and `NODE_ENV=production` as needed.

## Admin

Visit **/admin** and enter your `ADMIN_SECRET` to view:

- **Total exports (downloads)** – number of times users have downloaded a Yardi journal entry
- **Recent exports** – last 20 export timestamps

Stats are stored in `server/data/export-stats.json` (created automatically).

## Offline / in-browser

The **main flow runs entirely in the browser**: upload Excel → parse → build Yardi JE → download. No server call is required, so the app works without WiFi. The server is optional (used for admin stats and, when configured, Stripe).

## Download (desktop app for different computers)

The **Download** page (`/download`) lets users get the DocYard desktop app for their computer. It’s linked from the footer and the hamburger menu.

**Build installers per platform:**

1. Set the URL the app should load when packaged: in `electron/main.js` set `APP_URL` to your deployed web app (e.g. `https://app.docyard.com`), or use the `APP_URL` env var when building.

2. From the `electron/` folder, build for each OS (use the right machine or CI for each):
   - **Windows:** `npm run build:win` → installers in `electron/dist/` (e.g. `DocYard Setup 1.0.0.exe`).
   - **macOS:** `npm run build:mac` (on a Mac) → `electron/dist/*.dmg`.
   - **Linux:** `npm run build:linux` → `electron/dist/*.AppImage`.

3. Host the built files (e.g. GitHub Releases, S3, or your server) and point the web app at them with env vars so the Download page shows real links:
   - `VITE_DOWNLOAD_WIN_URL` – full URL to the Windows installer.
   - `VITE_DOWNLOAD_MAC_URL` – full URL to the Mac .dmg.
   - `VITE_DOWNLOAD_LINUX_URL` – full URL to the Linux AppImage.

   Example (in `client/.env` or your build env):  
   `VITE_DOWNLOAD_WIN_URL=https://github.com/you/docyard/releases/download/v1.0.0/DocYard-Setup-1.0.0.exe`

   Rebuild the client after setting these so the Download page shows “Download for Windows”, “Download for Mac”, and “Download for Linux” instead of “Installer coming soon”.

## React Native (future)

A React Native mobile app is a possible future addition; the core logic is in `client/src/lib/yardiExport.js` and can be reused.

## Project structure

- `client/` – Vite + React app (upload, pricing, terms, feedback, admin)
- `server/` – Express API (upload Excel, export Yardi JE, Stripe, admin stats)
- `electron/` – Electron wrapper for the desktop app
- `LICENSE` – Proprietary license
- `.env` – Not committed; use `.env.example` as a template

## Testing

**Quick verification:**

1. **Server:** `cd server && npm run dev` → should log "Server running at http://localhost:4000".
2. **Client:** `cd client && npm run dev` → Vite starts (e.g. http://localhost:3000 or 3001). Open the URL and confirm the DocYard home page loads.
3. **Export API:** POST to `http://localhost:4000/api/export/excel` with JSON body `{ "rows": [["Account","Debit","Credit"],["1000","100","0"]], "sheetName": "Sheet1", "format": "yardi_je", "postMonth": "01/2025", "journalDate": "01/31/2025" }` → returns Excel file. Each successful Yardi export increments the stats count.
4. **Admin:** Set `ADMIN_SECRET` in `server/.env`, then open `/admin`, enter that key, and click "View stats". You should see total exports and recent timestamps.
5. **Electron (optional):** With client running, `cd electron && npm install && npm start`. If the client is on port 3001, run `set DEV_URL=http://localhost:3001` (Windows) or `DEV_URL=http://localhost:3001` (Mac/Linux) before `npm start`.

## Launch checklist

- [x] License in place
- [x] `.gitignore` excludes `.env`, `node_modules`, `dist`
- [x] No secrets in repo
- [ ] Set production `FRONTEND_URL` and Stripe keys when going live
- [ ] Deploy server (e.g. Railway) and client (or same host)
- [ ] Point domain and test upload → download flow
