# Silkview Sync

Microsoft Excel Add-in that connects to **Stripe** (pull financial data) and **Xero** (push accounting entries). The backend is a **Next.js 14** app on Vercel with **Supabase** (auth, Postgres RLS, encrypted OAuth tokens) and **Stripe** subscription billing.

## Prerequisites

- **Node.js 18+** and npm
- **Microsoft Excel** (desktop Mac or Windows) for sideloading
- **Supabase** project ([supabase.com](https://supabase.com))
- **Stripe** — Connect OAuth app (add-in) + Billing products/webhook (account plans)
- **Xero** OAuth 2.0 app at [developer.xero.com](https://developer.xero.com)
- Optional: [ngrok](https://ngrok.com) for remote Excel testing

## Project structure

```
addin/              Excel task pane (React + Vite + Office.js) — https://localhost:4000
web/                Next.js API + auth + billing — http://localhost:4003
shared/             Shared TypeScript types and rules
supabase/migrations/  Postgres schema, RLS, plan limits
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a Supabase project.
2. Apply the migration (creates the **`core`** schema — app tables are not in `public`):

   ```bash
   supabase db push
   # or run supabase/migrations/001_initial_schema.sql in the SQL editor
   ```

3. Expose the `core` schema to the API:
   - **Local:** `supabase/config.toml` already lists `core` under `[api].schemas`.
   - **Hosted:** Project Settings → API → **Exposed schemas** → add `core`.

4. Configure **Authentication** (Dashboard → Authentication):
   - **Providers → Email:** enable email sign-in, turn on **Confirm email**, set minimum password length (8+).
   - **MFA → TOTP:** enable authenticator-app MFA (optional per user in the app).
   - **URL configuration:** Site URL = `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:4003`). Add redirect URLs:
     - `http://localhost:4003/auth/callback` and `http://localhost:4003/auth/callback/**`
     - `https://localhost:4000/auth/callback` and `https://localhost:4000/auth/callback/**` (Excel add-in dialog via Vite proxy)
5. Optional **Database Webhook** on `auth.users` **INSERT** → `POST https://<your-api>/api/auth/signup` with header `x-webhook-secret: <SUPABASE_SERVICE_ROLE_KEY>` (auto-confirms email only). Account + workspace are created in **`POST /api/onboarding/complete`** after the user confirms email and finishes `/onboarding`.

### 3. Configure environment

```bash
cp web/.env.example web/.env.local
cp addin/.env.example addin/.env
```

Next.js reads **`web/.env.local`** (not `.env.example`). Restart `npm run dev` after creating or changing env files.

Edit `web/.env`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client (webhooks, signup, token storage) |
| `ENCRYPTION_KEY` | 32-byte hex for AES-256-GCM OAuth tokens (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `OAUTH_STATE_SECRET` | Signs OAuth `state` (workspace + user) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / price IDs | Subscription billing |
| `STRIPE_CLIENT_ID` / `STRIPE_CONNECT_SECRET` | Stripe Connect (add-in) |
| `STRIPE_REDIRECT_URI` | `http://localhost:4003/api/stripe/callback` (dev) |
| `XERO_*` | Xero OAuth; redirect `http://localhost:4003/api/xero/callback` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:4003` |
| `FRONTEND_URL` | `https://localhost:4000` (add-in origin for CORS) |

`addin/.env`: `VITE_API_URL=http://localhost:4003`

### 4. Trust localhost SSL certificate

Office Add-ins require **HTTPS** for the task pane:

```bash
npx office-addin-dev-certs install
```

Certificates: `~/.office-addin-dev-certs/` (`localhost.crt` / `localhost.key`). Vite uses these on port 4000.

### 5. Run development servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Add-in (Vite) | https://localhost:4000 |
| API (Next.js) | http://localhost:4003 |

Vite proxies `/api` and `/auth` to Next.js. OAuth callbacks hit the API directly (`/api/stripe/callback`, `/api/xero/callback`). Legacy paths `/auth/stripe/*` rewrite to `/api/stripe/*`.

```bash
npm run dev:addin
npm run dev:web
```

### 6. Sideload the manifest in Excel

1. Open Excel → **Insert** → **Add-ins** → **Upload My Add-in**.
2. Select `addin/manifest.xml`.
3. Open **Silkview Sync** from the ribbon.

### 7. Web app and sign-in

| URL | Purpose |
|-----|---------|
| `http://localhost:4003/` | Marketing landing page |
| `http://localhost:4003/auth/signup` | Email + password signup (confirmation email) |
| `http://localhost:4003/auth/login` | Password sign-in, or Excel magic-link tab |
| `http://localhost:4003/dashboard` | Account shell after sign-in |
| `http://localhost:4003/auth/mfa/enroll` | Optional TOTP setup (skippable) |

After email confirmation, users are prompted to enroll MFA (can skip), then land on the dashboard.

### 8. Excel add-in

1. Click **Sign in** in the task pane — Office dialog opens `https://localhost:4000/auth/excel` (proxied to Next.js; password sign-in, MFA verify if enrolled, or magic link).
2. After login, the add-in loads your workspace and sends `Authorization: Bearer` + `X-Workspace-Id` on API calls.
3. **Connect Xero** first (base currency), then **Connect Stripe**, then Pull → Build → Push.

## Deploy (Vercel)

1. Create a Vercel project with **Root Directory** = `web`, **Framework** = Next.js. Leave **Output Directory** empty (do not set `.next` — that causes platform 404 on all routes). In Build & Development Settings, leave **Build Command** and **Install Command** empty so [`web/vercel.json`](web/vercel.json) applies (`cd .. && npm install`, `cd .. && npm run build -w web`). Do not override with `build -w addin` — the add-in is a separate Vercel project (see step 6).
2. Set all `web/.env` variables in Vercel.
3. Set `NEXT_PUBLIC_APP_URL` to your web host (e.g. `https://www.silkview.org`). Register **these exact** callback URLs in Stripe Connect and Xero (same host, `https`, `/api/...` paths):

   ```
   https://www.silkview.org/api/stripe/callback
   https://www.silkview.org/api/xero/callback
   ```

   After deploy, confirm with `GET https://www.silkview.org/api/oauth/redirect-uris`.

   **Do not use:** `http://` (except local dev), apex-only host if the app uses `www`, `/api/auth/xero`, or the add-in host (`addin.silkview.org`). Optional `STRIPE_REDIRECT_URI` / `XERO_REDIRECT_URI` must match the URLs above or are ignored.

4. Stripe billing webhook: `https://<your-domain>/api/billing/webhook`
5. Supabase: site URL + redirect URLs for auth; signup webhook to production `/api/auth/signup`
6. Production add-in: set `VITE_API_URL` to your Vercel URL; update `addin/manifest.xml` `SourceLocation` and `AppDomains`

## Task pane UI

3-step workflow (Pull → Build → Push) with Stripe/Xero connection pills. **Setup** (gear) for workbook sheets and Xero mapping dropdowns.

| Step | What you do |
|------|-------------|
| **Sign in** | Supabase magic link via Office dialog |
| **Connect Xero** | Org **base currency** set automatically |
| **Connect Stripe** | Connect account for this workspace |
| **Pull** | Stripe objects, date range, org currency filter |
| **Build** | `Xero_Journals` and/or `Xero_Bank_Transaction` |
| **Push** | Manual journals or bank transactions to Xero |

**Single currency:** Pull/Build/Push disabled until Xero is connected and base currency is known.

## Register Stripe Connect OAuth app

1. [Stripe Dashboard → Connect → Settings](https://dashboard.stripe.com/settings/connect)
2. Redirect URI (dev via Vite proxy or direct API):

   ```
   http://localhost:4003/api/stripe/callback
   ```

   Production: `https://<domain>/api/stripe/callback`

3. In `web/.env`: `STRIPE_CLIENT_ID`, `STRIPE_CONNECT_SECRET`, `STRIPE_REDIRECT_URI`

## Register Xero OAuth 2.0 app

1. [developer.xero.com](https://developer.xero.com) → **New app**
2. Redirect URI:

   ```
   http://localhost:4003/api/xero/callback
   ```

3. Scopes: `accounting.transactions`, `accounting.settings`, `accounting.reports.read`, `offline_access`
4. `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI` in `web/.env`

## OAuth architecture

| Old (Express) | New (Next.js + Supabase) |
|---------------|--------------------------|
| `sessionId` query/cookie | Supabase JWT + `X-Workspace-Id` header |
| In-memory tokens | AES-256-GCM encrypted rows in `stripe_connections` / `xero_connections` |
| `state=sessionId` | Signed `state` with workspace + user + nonce |

Stripe/Xero connect still opens the **system browser** (`Office.context.ui.openBrowserWindow`) and polls status until connected.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Auth webhook (auto-confirm email; optional) |
| POST | `/api/onboarding/complete` | Create account + first workspace after signup |
| GET/POST | `/api/workspace` | List / create workspaces |
| POST | `/api/account/invite` | Invite user (plan limits) |
| POST | `/api/billing/checkout` | Stripe Checkout |
| POST | `/api/billing/portal` | Billing portal |
| POST | `/api/billing/webhook` | Subscription updates |
| GET | `/api/stripe/connect` | Stripe Connect OAuth URL |
| GET | `/api/stripe/callback` | OAuth callback (HTML) |
| GET | `/api/stripe/status` | Connection status |
| GET | `/api/stripe/payouts` etc. | Pull Stripe data |
| GET | `/api/xero/connect` | Xero OAuth (PKCE) |
| GET | `/api/xero/callback` | OAuth callback |
| GET | `/api/xero/connections` | Xero status + `base_currency` |
| GET | `/api/xero/mapping-options` | Mapping dropdown data |
| POST | `/api/xero/manual-journals` | Push journals |
| POST | `/api/xero/bank-transactions` | Push bank transactions |

Auth pages: `/auth/login`, `/auth/callback` (code exchange; returns token to Excel when `return=excel`).

## Workbook sheets

Run **Set up workbook sheets** in Setup to create:

| Sheet | Purpose |
|-------|---------|
| `Stripe_Payouts` | Payout pulls |
| `Stripe_Balance_Transactions` | Balance transactions |
| `Stripe_Charges` | Charges |
| `Xero_Journals` | Manual journal lines (build) |
| `Xero_Bank_Transaction` | Bank transaction lines (build) |
| `Account_Mappings` | Stripe → Xero mapping |

See earlier README sections in git history for column layouts, build formulas, and push validation rules — behaviour is unchanged; only the API host and auth model differ.

## Verification checklist

- [ ] Supabase migration applied; signup webhook creates account + workspace
- [ ] Landing page at `/`; signup → confirm email → MFA enroll (or skip) → dashboard
- [ ] Password sign-in works; optional MFA verify on next login
- [ ] `npm run build` — addin + web succeed
- [ ] `npm run dev` — add-in and Next.js running
- [ ] Sideload manifest — task pane loads
- [ ] Sign in → workspace selected
- [ ] Connect Xero → `base_currency` shown
- [ ] Connect Stripe → pull payouts/BT/charges
- [ ] Build journals / bank transactions → push to Xero
- [ ] Billing webhook updates plan (optional)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Task pane blank | Run `npx office-addin-dev-certs install`; open https://localhost:4000/taskpane.html |
| API 401 | Sign in again; check `VITE_API_URL` matches Next dev server |
| CORS errors | `FRONTEND_URL=https://localhost:4000` in `web/.env` |
| Invalid Xero redirect | Register `https://<web-host>/api/xero/callback` in Xero (not `/api/auth/xero`). Check `/api/oauth/redirect-uris` |
| Stripe Connect fails | Register `https://<web-host>/api/stripe/callback` on Stripe Connect (must be `https` in production) |
| OAuth “No authorization code” | You opened the callback URL directly; start from **Connect** in dashboard or Excel |
| OAuth state invalid | `OAUTH_STATE_SECRET` stable across deploys; complete connect in one browser session |

## License

Private — internal use.
