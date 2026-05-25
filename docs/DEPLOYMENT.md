# Deployment guide — multi-tenant SaaS

Silkview is a **hosted SaaS**: you (the operator) run one Stripe Connect application and one Xero OAuth app. Each customer signs up, creates a workspace, and connects **their own** Stripe and Xero accounts via OAuth. Customer tokens are stored per workspace in `core.stripe_connections` and `core.xero_connections`.

## Who configures what

| | Operator (you) | End customer |
|---|----------------|--------------|
| **Configures** | Supabase, Vercel env vars, Stripe/Xero app registration, billing webhooks | Email/password, workspace name, MFA (optional) |
| **Connects integrations** | Nothing | Their Stripe + their Xero in Excel or dashboard |
| **Env vars** | `web/.env` on Vercel | None |

Never put `STRIPE_SECRET_KEY`, `STRIPE_CLIENT_ID`, or `XERO_CLIENT_SECRET` on the add-in project. The add-in only needs `VITE_API_URL` pointing at the web API.

## Staging vs production

Use **two Vercel environments** (separate projects or env groups). Stripe test and live modes use different keys and OAuth codes.

| | Staging (beta) | Production |
|---|----------------|------------|
| `NEXT_PUBLIC_APP_URL` | `https://staging.example.com` | `https://www.silkview.org` |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
| `STRIPE_CLIENT_ID` | `ca_…` (copied with **Test mode ON**) | `ca_…` (copied with **Test mode OFF**) |
| Stripe redirect | `{APP_URL}/api/stripe/callback` | same pattern |
| User Connect sign-in | Stripe login in **test** mode | Stripe login in **live** mode |
| `STRIPE_ALLOW_PLATFORM_SELF_CONNECT` | `false` | `false` |

Add-in project per environment: `VITE_API_URL` = that environment’s web URL.

## Operator environment variables (`web` Vercel project)

### Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB + auth admin |
| `ENCRYPTION_KEY` | 64-char hex; encrypts OAuth tokens at rest |
| `OAUTH_STATE_SECRET` | Long random string; signs OAuth `state` |
| `NEXT_PUBLIC_APP_URL` | Canonical web URL (OAuth callbacks) |
| `STRIPE_SECRET_KEY` | Platform secret (`sk_test_` or `sk_live_`) — Connect token exchange + billing |
| `STRIPE_CLIENT_ID` | Connect client ID (`ca_…`) from **same** Stripe account/mode as secret |
| `STRIPE_WEBHOOK_SECRET` | Billing webhook signing secret |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_FIRM_PRICE_ID` | Subscription price IDs |
| `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | Xero OAuth app |
| `FRONTEND_URL` | Add-in origin for CORS (e.g. `https://addin.silkview.org`) |
| `NEXT_PUBLIC_ADDIN_URL` | Same as add-in host (CORS) |

### Optional

| Variable | Purpose |
|----------|---------|
| `STRIPE_REDIRECT_URI` | Override callback; must equal `{NEXT_PUBLIC_APP_URL}/api/stripe/callback` |
| `XERO_REDIRECT_URI` | Override callback; must equal `{NEXT_PUBLIC_APP_URL}/api/xero/callback` |
| `STRIPE_ALLOW_PLATFORM_SELF_CONNECT` | `false` (default). Never `true` in production. |
| `SUPABASE_AUTO_CONFIRM_EMAIL` | Dev only: auto-confirm on signup webhook |

### Add-in Vercel project

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Web API URL (e.g. `https://www.silkview.org`) |

## Supabase

1. Apply **all** migrations in `supabase/migrations/` in order. On every push to `main` the GitHub Action (see "Deployment pipeline" below) runs them automatically via the Supabase Management API; for a fresh project bootstrap, run `SUPABASE_ACCESS_TOKEN=… SUPABASE_PROJECT_REF=… node scripts/apply-migrations.mjs` locally first.
2. **Project Settings → API → Exposed schemas** → add `core`.
3. **Authentication → URL configuration:** Site URL = `NEXT_PUBLIC_APP_URL`; redirect URLs for `/auth/callback`.
4. Optional webhook on `auth.users` INSERT → `POST /api/auth/signup` (email confirm only; **does not** create accounts).

## Deployment pipeline (GitHub Actions → Supabase → Vercel)

Migrations must run before the new code goes live. Push-to-deploy is handled by [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), which on every push to `main`:

1. Runs `node scripts/apply-migrations.mjs` — applies every file in `supabase/migrations/` that isn't already recorded in `supabase_migrations.schema_migrations` (matched by the filename stem with the leading `NNN_` prefix stripped).
2. On success, `POST`s the Vercel **deploy hook** for the `web` project, which triggers the production build.

### One-time setup

**Vercel — `web` project** (the `addin` project keeps Vercel's normal auto-deploy):

- Disable Vercel's automatic git deploys for `main`. This is already configured in [`web/vercel.json`](../web/vercel.json) via `git.deploymentEnabled.main = false`; verify the project picks it up after the first deploy of this change.
- **Settings → Git → Deploy Hooks** → create a hook named `main`. Copy the URL.

**GitHub repo → Settings → Secrets and variables → Actions** — add:

| Secret | Value |
|--------|-------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from <https://supabase.com/dashboard/account/tokens>. Treat like a password. |
| `SUPABASE_PROJECT_REF` | The project ref (e.g. `szbfksebywhkalejxkgs`). |
| `VERCEL_DEPLOY_HOOK_WEB` | The deploy hook URL you just copied. |

### Local migration commands

```bash
# Apply unapplied migrations to whatever project the env vars point at.
SUPABASE_ACCESS_TOKEN=… SUPABASE_PROJECT_REF=… node scripts/apply-migrations.mjs

# Show what would run without touching the DB.
DRY_RUN=1 SUPABASE_ACCESS_TOKEN=… SUPABASE_PROJECT_REF=… node scripts/apply-migrations.mjs
```

The runner is idempotent — already-applied migrations are skipped. Add new migrations as `supabase/migrations/NNN_short_name.sql`; the leading number controls ordering, the rest of the name is what's recorded in the ledger.

## Local add-in development

The production manifest at [`addin/manifest.xml`](../addin/manifest.xml) points at `https://addin.silkview.org` and must not be edited for local testing. Use a **separate gitignored manifest** that points at the local Vite dev server.

```bash
# One-time: trust the local HTTPS cert Vite uses for the add-in.
npx office-addin-dev-certs install

# One-time: copy the template, generate a fresh GUID, paste it as <Id>.
cp addin/manifest.local.example.xml addin/manifest.local.xml
uuidgen  # or [guid]::NewGuid() in PowerShell

# Run both dev servers (web on :4003, addin on :4000).
npm run dev

# Sideload the local manifest into Excel desktop.
npm run sideload:local -w addin

# Stop sideloading when finished.
npm run sideload:stop -w addin
```

Why a fresh GUID per machine: Office caches the bundle by `<Id>`. Reusing the production GUID will cause Excel to serve stale cached production code while loading the local manifest.

Account + workspace creation happens in **`POST /api/onboarding/complete`** after the user confirms email and finishes `/onboarding`.

## Stripe (operator)

1. [Stripe Dashboard → Connect](https://dashboard.stripe.com/settings/connect) — complete Connect setup (`connectApiEnabled` must be true; check `/api/stripe/connect/verify` when signed in as owner).
2. **Connect → OAuth** — copy **Client ID** (`ca_…`).
3. **Developers → API keys** — copy **Secret key** (`sk_test_…` or `sk_live_…`) with the **same** Test/Live toggle as step 2.
4. **Connect → Redirects** — register exactly:
   - `https://<your-web-host>/api/stripe/callback`
5. **Billing webhook** → `https://<your-web-host>/api/billing/webhook`
   - Enable these events (minimum recommended set):
     - **Checkout:** `checkout.session.completed`
     - **Subscriptions:** `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
     - **Invoices:** `invoice.paid`, `invoice.payment_failed`
   - Optional (not required for v1): `invoice.payment_succeeded` (legacy alias), `charge.succeeded`, `customer.subscription.trial_will_end`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`. Use a **separate** webhook endpoint for test vs live mode (each has its own secret).
   - Webhook and checkout-confirm events are logged to `core.billing_webhook_events` for debugging (query via Supabase SQL; no dashboard UI).
6. **Billing prices** — create Pro and Firm subscription prices in the **same** Stripe account and mode as `STRIPE_SECRET_KEY`. Set `STRIPE_PRO_PRICE_ID` and `STRIPE_FIRM_PRICE_ID`. Test and live price IDs differ; production env must use live prices with `sk_live_`.
7. **Customer portal** (optional, for Manage billing after subscribe): Stripe Dashboard → Settings → Billing → Customer portal — enable **Invoice history** and **Payment methods**.

After checkout, the app confirms payment via `POST /api/billing/checkout/confirm` (immediate account update) and the webhook (backup). Accounts flip from `trialing` to `active` with the chosen plan.

Customers click **Connect Stripe** in Excel; they sign into **their** Stripe account. Silkview never auto-links the platform owner account.

## Xero (operator)

1. [developer.xero.com](https://developer.xero.com) — create app.
2. Redirect URI: `https://<your-web-host>/api/xero/callback`
3. Scopes: `accounting.transactions`, `accounting.settings`, `accounting.reports.read`, `offline_access`

Customers authorize **their** Xero organisation (picker shown when they have multiple orgs).

## Verification commands

```bash
# After add-in deploy
npm run verify:addin-deploy

# After web deploy (set APP_URL)
APP_URL=https://www.silkview.org npm run verify:oauth-config
```

Or open (when signed in as account owner):

- `GET /api/oauth/redirect-uris`
- `GET /api/stripe/connect/verify` (dashboard Settings)
- `GET /api/billing/config-check` — confirms `STRIPE_SECRET_KEY` mode matches Pro/Firm price IDs (no secrets returned)

## Manual E2E checklist

### Staging (test keys)

- [ ] New signup → confirm email → `/onboarding` → account created
- [ ] Excel sign-in completes (handoff)
- [ ] Connect Stripe with a **test** Stripe account (not the Connect platform owner account)
- [ ] Connect Xero; if multiple orgs, pick the correct one
- [ ] Pull → Build → Push smoke test

### Production (live keys)

- [ ] Repeat with `sk_live_` + live `ca_` and live Stripe login
- [ ] `STRIPE_ALLOW_PLATFORM_SELF_CONNECT` is not `true`
- [ ] No platform Stripe account in `core.stripe_connections` for customer workspaces
