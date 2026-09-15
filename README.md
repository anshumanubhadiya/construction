# Sarvotam Construction · Thekedar OS

Production construction-site management for **Sarvotam Construction, Dahegam (Gujarat)** — one web app for the owner, staff, clients, workers and supervisors. Real email/password auth, live cloud sync and site-photo proof of work, usable from any phone.

React 19 · Vite · Tailwind v4 · Framer Motion · **Supabase (Auth · Postgres · Storage · Realtime)**

---

## 1 · First-run setup (one time, ~5 minutes)

1. Open your Supabase project → **SQL Editor → New query**.
2. Paste the contents of `supabase-schema.sql` (also served at `/schema.sql` on the deployed site) and **Run**. This creates every table, the signup trigger, RBAC policies, the photo Storage bucket and realtime.
3. **Authentication → Sign In / Providers → Email**: while testing, turn **Confirm email OFF** (instant logins). For production, turn it ON and add custom SMTP under Auth → SMTP so password-reset emails send reliably.
4. Open the app and go to **/signup** — **the first account created automatically becomes the Owner (Admin)**. Never share this password.

> No demo logins exist anywhere in this app anymore. All accounts are real Supabase Auth users; the UI never shows passwords.

## 2 · Roles & access

| Role | How to get it | What they see |
|---|---|---|
| **Admin (Owner)** | First signup becomes owner | Everything: sites, money, users, settings, join codes |
| **Staff (Sub-admin)** | Sign up with a one-time **join code** (Users → Team join codes) | Everything except Users & Settings pages (server-blocked too) |
| **Supervisor** | Join code or admin assignment | Attendance + materials on site + site photos. No money pages |
| **Client** | Self-signup → owner approves & links to their client record | Their projects, estimates, payments, **photo updates** |
| **Worker** | Self-signup → owner approves & links to their worker record | Own attendance calendar, earnings, advances, salary slip |

Password reset: **Forgot password?** on the login page emails a single-use secure link (PKCE). Nobody can change or read passwords client-side — change-password inside the app also verifies the current password on the server.

## 3 · Features

- **Owner cockpit** — live P&L, monthly income/cost charts, budget alerts, today's attendance status, one-click approve.
- **Projects / Clients / Workers** — full CRUD, GST fields, worker daily rates, auto cost rollups.
- **Attendance** — one-tap day grid (Present / Half Day / Absent / Holiday) + advances, saved **per day** to cloud with `unique(worker_id, date)`; supervisor devices update live.
- **Materials, Income, Expenses, Vehicles & logs** — every rupee on its site; diesel + hire costs auto-computed.
- **Estimates** — line items, GST, PDF print, share status. Kept local per device (no cloud table).
- **Site Photos (proof of work)** — camera-capture or gallery upload with **progress bar**, project + date + note; instant grid gallery with lightbox on every teammate's phone; clients see only their own sites.
- **Reports & PDFs** — salary slips, P&L, client statements (print-to-PDF, zero dependencies).
- **Realtime** — Postgres changes refresh all open devices within ~1s; offline writes queue locally and sync on return.

## 4 · Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production dist/
```

Env (optional — falls back to the live project):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 5 · Deploy for everyone's phone

**Vercel**: import the repo → framework preset *Vite* → add the two env vars → deploy. `vercel.json` already handles SPA rewrites.

**Netlify**: build `npm run build`, publish `dist`, add the env vars. `public/_redirects` handles SPA rewrites.

Share the HTTPS URL — mobile browsers get full camera upload (Android) and can be installed to the home screen as an app.

## 6 · Architecture notes

- `src/services/supabaseClient.ts` — supabase-js (auth, PKCE) + session-aware REST `api` wrapper (RLS applies to every query).
- `src/services/adapters.ts` — UI↔DB mapping, required-field validation, number coercion, `""` → null, `unique` FK-safe day replace.
- `src/services/auth.ts` — signup/login/reset/change-password, admin profile ops, join codes.
- `src/services/sync.ts` — parallel pull, write-through with schema-tolerant retry, storage upload with progress, realtime subscription, sample-data publisher.
- `src/store/appStore.ts` — zustand; optimistic UI + cloud write-through + temp-id→cloud-id remap with FK fixups. Stats: labour = wages×day-factor + advances; vehicle = hire+diesel; net = income − costs.
- Security: all tables RLS-on; managers (admin/staff) write, active users read; supervisors write only attendance/materials; profile role/status changes blocked by trigger unless made by a manager.

### Known production hardening (optional later)
- Tighten client/worker *read* policies to row-scoped (e.g. worker sees only own attendance) — current reads are "any active logged-in user", right-sized for a single-business app.
- Add your own domain + custom SMTP in Supabase so reset emails come from `@yourdomain`.
