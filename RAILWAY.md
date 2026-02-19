# Deploy EazyBookz to Railway

Use this guide to connect your GitHub repo to Railway and deploy **EazyBookz** (eazybookz.com). The endpoint appears after a **successful** deploy and when the service is healthy.

---

## 1. Connect the repo

1. In **Railway** → your project → **New** → **GitHub Repo**.
2. Select the repo that contains this code.
3. Railway will create a **service** and use the config in this repo (`railway.json`).

**If the service already exists and the source is wrong:**

- **Settings** → **Source** → **Disconnect** (if needed), then **Connect Repo** and pick the correct repo/branch (e.g. `main` or `master`).

---

## 2. Variables (Railway dashboard)

In the service → **Variables** tab, add:

| Variable        | Value        | Notes                                      |
|----------------|--------------|--------------------------------------------|
| `NODE_ENV`     | `production` | So the server serves the built client.     |
| `PORT`         | *(optional)* | Railway sets this automatically if missing.|

**Supabase (add when you create the project):**

| Variable                     | Value              | Notes                          |
|-----------------------------|--------------------|--------------------------------|
| `VITE_SUPABASE_URL`         | `https://xxx.supabase.co` | From Supabase → Settings → API (used at **build** time). |
| `VITE_SUPABASE_ANON_KEY`    | `eyJ...`           | From Supabase → Settings → API (anon/public key). |
| `SUPABASE_URL`              | same as above      | For server-side (optional).    |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...`           | Server-only; never expose in client. |

**Important:** Any `VITE_*` variable must be set in Railway **before** the build. The client is built on deploy, so it bakes in whatever `VITE_*` values exist then.

---

## 3. Build and deploy behavior

This repo’s `railway.json` tells Railway to:

- **Build:** run `npm run install:all` (install root + server + client deps) then `npm run build` (build the Vite client to `client/dist`).
- **Start:** run `npm run start` (start the Express server from `server/`; it serves the API and the built client).
- **Healthcheck:** GET `/api/health`; if it returns 200, the deploy is considered healthy.

Railway will assign a **PORT**; the server uses `process.env.PORT || 4000`.

---

## 4. Fix “Failed to get network endpoint”

This usually means one of:

1. **No successful deploy yet**  
   - Check **Deployments**. The latest deployment should be **Success**.  
   - If the build or start command fails, fix the error (see build logs) and redeploy.

2. **Service not listening on PORT**  
   - The app already uses `process.env.PORT` in `server/src/index.js`. No change needed if you’re using the repo’s start command.

3. **Public networking not enabled**  
   - In the service → **Settings** → **Networking** → enable **Public Networking** (or add a **Generate Domain** button if you see it).  
   - After a successful deploy, Railway will show a URL. Point your domain **eazybookz.com** to this URL (CNAME or A record as Railway instructs).

4. **Healthcheck failing**  
   - We use `healthcheckPath: "/api/health"`. If the app crashes or doesn’t respond on that path, the deploy can stay unhealthy. Check **Deployments** → latest deploy → **View logs** for errors.

**Checklist:**

- [ ] Source repo is correct (e.g. `bantui/AP/docYard` or your actual repo).
- [ ] Branch is correct (e.g. `main`).
- [ ] `NODE_ENV=production` in Variables.
- [ ] Latest deployment is **Success** (green).
- [ ] **Public Networking** is on and a domain is generated.
- [ ] Opening the generated URL loads the app; `/api/health` returns JSON with `"ok": true`.

---

## 5. Supabase (after you create it)

1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase: **Settings** → **API** — copy:
   - **Project URL** → use as `VITE_SUPABASE_URL` and `SUPABASE_URL`.
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`.
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only; never in client).
3. In Railway → your service → **Variables** → add the variables from the table in section 2.
4. Redeploy so the client build picks up `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The app already reads these in `client/src/lib/supabase.js` and in the server where needed.

---

## 6. One-line summary

**Connect repo → set `NODE_ENV=production` → deploy → enable Public Networking → use the generated URL.** Add Supabase variables when the project is ready, then redeploy.
