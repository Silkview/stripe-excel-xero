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

1. Apply **all** migrations `001` through `008` in order.
2. **Project Settings → API → Exposed schemas** → add `core`.
3. **Authentication → URL configuration:** Site URL = `NEXT_PUBLIC_APP_URL`; redirect URLs for `/auth/callback`.
4. Optional webhook on `auth.users` INSERT → `POST /api/auth/signup` (email confirm only; **does not** create accounts).

Account + workspace creation happens in **`POST /api/onboarding/complete`** after the user confirms email and finishes `/onboarding`.

## Stripe (operator)

1. [Stripe Dashboard → Connect](https://dashboard.stripe.com/settings/connect) — complete Connect setup (`connectApiEnabled` must be true; check `/api/stripe/connect/verify` when signed in as owner).
2. **Connect → OAuth** — copy **Client ID** (`ca_…`).
3. **Developers → API keys** — copy **Secret key** (`sk_test_…` or `sk_live_…`) with the **same** Test/Live toggle as step 2.
4. **Connect → Redirects** — register exactly:
   - `https://<your-web-host>/api/stripe/callback`
5. Billing webhook → `https://<your-web-host>/api/billing/webhook`.

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
