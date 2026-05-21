# Silkview Sync

Microsoft Excel Add-in that connects to **Stripe** (pull financial data) and **Xero** (push accounting entries). Phase 1 provides the framework, OAuth via Office Dialog API, and Stripe pulls (**Payouts**, **Balance Transactions**, **Charges**) to worksheets.

## Prerequisites

- **Node.js 18+** and npm
- **Microsoft Excel** (desktop Mac or Windows) for sideloading
- **Stripe Connect** OAuth app (test mode supported)
- **Xero** OAuth 2.0 app at [developer.xero.com](https://developer.xero.com)
- Optional: [ngrok](https://ngrok.com) if you need to test from a remote machine (not required for local dev)

## Project structure

```
addin/     Excel task pane (React + Vite + Office.js) — https://localhost:4000
server/    Express API + OAuth — http://localhost:4001
shared/    Shared TypeScript types
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your Stripe and Xero credentials (see registration sections below).

### 3. Trust localhost SSL certificate

Office Add-ins require **HTTPS** for the task pane. Install dev certificates:

```bash
npx office-addin-dev-certs install
```

Follow the prompts to trust the certificate in your system keychain (macOS) or certificate store (Windows).

Certificates are stored at `~/.office-addin-dev-certs/` (`localhost.crt` / `localhost.key`). Vite uses these automatically when present.

> **Screenshot placeholder:** System prompt to trust `Developer CA for Office Add-ins` on macOS.

### 4. Run development servers

From the repo root:

```bash
npm run dev
```

This starts:

| Service | URL |
|---------|-----|
| Add-in (Vite) | https://localhost:4000 |
| API server | http://localhost:4001 |

Individual workspaces:

```bash
npm run dev:addin
npm run dev:server
```

### 5. Sideload the manifest in Excel

1. Open Excel (desktop).
2. **Insert** → **Add-ins** → **Upload My Add-in** (or **Get Add-ins** → **Upload My Add-in**).
3. Select `addin/manifest.xml`.
4. Open the **Silkview Sync** task pane from the ribbon or **Home** tab if configured.

**macOS:** You may need to allow the add-in under **Excel** → **Preferences** → **Security** → **Trust Center**.

**Windows:** File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs (if using a network share).

> **Screenshot placeholder:** Excel “Upload Office Add-in” dialog with `manifest.xml` selected.

The task pane is ~300px wide. Use **Insert** → **Add-ins** → **My Add-ins** to reopen it.

## Task pane UI

The task pane uses a **3-step workflow** (Pull → Build → Push) with Stripe/Xero connection pills at the top. Open **Setup** (gear icon) for workbook creation and refreshing Xero dropdowns on the **Account_Mappings** sheet tab.

| Step | What you do |
|------|-------------|
| **0 Connect Xero** | Connect Xero first — your organisation **base currency** (e.g. AUD) is set automatically and shown in Setup |
| **1 Pull** | Connect Stripe, choose object and date range, pull to sheet (only rows in org currency) |
| **2 Build** | Build `Xero_Journals` and/or `Xero_Bank_Transaction` from balance transactions (same currency only) |
| **3 Push** | Push Manual Journals or Bank Transactions to Xero in org currency; bank payout account must match |

**Single currency:** Pull, Build, and Push are disabled until Xero is connected and base currency is known. Stripe pulls filter out other currencies; the status message shows how many rows were excluded. Build skips non-matching balance transactions. Push sets `CurrencyCode` on manual journals and validates that the **stripe_payout_bank** mapping is a BANK account in the org currency.

**Setup** (overlay): view **Default currency** (read-only, from Xero), **Set up workbook sheets**, and **Refresh Xero dropdowns** on the **Account_Mappings** sheet. Bank account dropdowns list only BANK accounts in the org currency. Edit mapping values on that sheet tab in Excel.

**Push read ranges** (saved in browser `localStorage`):

- Journals default: `Xero_Journals!A2:I500`
- Bank transactions default: `Xero_Bank_Transaction!A2:H500`

Rows with **Xero ID** already set (`✓ pushed` or an existing ID) are **skipped** on push. After push, the **Xero ID** column shows status: light **green** row fill when successful, **red** row fill with an error message when validation or Xero rejects that row.

## Register Stripe Connect OAuth app

1. Go to [Stripe Dashboard → Connect → Settings](https://dashboard.stripe.com/settings/connect).
2. Enable Connect and create a **Connect** application (or use Settings → Connect applications).
3. Note your **Client ID** (`ca_...`) and **Secret key** (`sk_...`).
4. Add redirect URI:

   ```
   https://localhost:4000/auth/stripe/callback
   ```

5. Set in `server/.env`:

   ```
   STRIPE_CLIENT_ID=ca_xxx
   STRIPE_CLIENT_SECRET=sk_xxx
   STRIPE_REDIRECT_URI=https://localhost:4000/auth/stripe/callback
   ```

> **Screenshot placeholder:** Stripe Connect redirect URI settings.

OAuth uses **read_write** scope (required by Stripe Connect for this app type; users connect their own Stripe account).

## Register Xero OAuth 2.0 app

1. Sign in at [developer.xero.com](https://developer.xero.com) → **My apps** → **New app**.
2. Choose **Web app** (or **Native** with redirect URI).
3. Add redirect URI (must match **exactly** — copy/paste, no trailing slash):

   ```
   https://localhost:4000/auth/xero/callback
   ```

   Common mistake: registering `http://localhost:4001/...` or port `3000` while the app uses `https://localhost:4000/...`. Xero returns `Invalid redirect_uri` if they differ.

4. Required scopes:

   - `accounting.transactions`
   - `accounting.settings`
   - `accounting.reports.read`
   - `offline_access`

5. Copy **Client ID** and **Client secret** into `server/.env`:

   ```
   XERO_CLIENT_ID=xxx
   XERO_CLIENT_SECRET=xxx
   XERO_REDIRECT_URI=https://localhost:4000/auth/xero/callback
   ```

> **Screenshot placeholder:** Xero app redirect URI and scope configuration.

## Set up workbook sheets

Before pulling or pushing data, open **Setup** (gear) and click **Set up workbook sheets**. This creates tabs with header rows only:

| Sheet | Purpose |
|-------|---------|
| `Stripe_Payouts` | Stripe payout pulls |
| `Stripe_Balance_Transactions` | Balance transaction pulls |
| `Stripe_Charges` | Charge pulls |
| `Xero_Journals` | Formula-driven manual journal lines (build from balance transactions); **Xero ID** column (I) for push status |
| `Xero_Bank_Transaction` | Bank transaction lines (build from balance transactions); **Xero ID** column (H) for push status |
| `Account_Mappings` | Stripe → Xero mapping (dropdowns from Xero) |

**Account_Mappings layout** (created on first setup):

| stripe_object | xero_account_code | xero_tax_type | xero_tracking_name | xero_tracking_option | xero_contact |
|---------------|-------------------|---------------|--------------------|-----------------------|--------------|
| charge | dropdown | dropdown | dropdown | dropdown (depends on tracking name) | |
| refund | | | | | |
| fee | | | | | |
| stripe_clearing | | | | | |
| stripe_payout_bank | BANK only | | | | |
| stripe_payout_contact | | | | | contact dropdown |

- **Connect Xero** first, then run setup (dropdowns apply automatically) or click **Refresh Xero mapping dropdowns**.
- Dropdowns use accounts, tax rates, tracking categories, and contacts from your Xero organisation (`GET /api/xero/mapping-options`).
- **Account code dropdowns (column B):**
  - `stripe_payout_bank` — **BANK** accounts only.
  - `charge`, `refund`, `fee`, `stripe_clearing` — any active account **except** BANK, GST, and debtor/system receivable accounts (Xero `Type` or `SystemAccount` such as `DEBTORS` / `GST`). The same `stripe_clearing` account is used for journal clearing lines and bank transaction account code.
  - `stripe_payout_contact` — no account column; use **xero_contact** (column F).
- `xero_tracking_option` is a **dependent** dropdown: options change based on the category chosen in the same row.

**Existing sheets are skipped** — if a tab already exists, it is left unchanged. To get the new sheet names, columns, or mapping rows, delete `Xero_Bank_Transfers` / `Account_Mappings` (if present) and run **Set up workbook sheets** again, or adjust tabs manually.

## Pull from Stripe

On the **Pull** tab, after connecting Stripe:

1. Choose **Object**: Payouts, Balance Transactions, or Charges.
2. Set **From** / **To** dates (`YYYY-MM-DD`).
3. Confirm **Destination** (defaults to the matching sheet, e.g. `Stripe_Balance_Transactions!A1`).
4. Click **Pull to sheet**.

**Limits:** Date range cannot exceed **90 days** (inclusive). If Stripe returns more than **2000** rows, the pull fails with an error and **nothing is written** to the sheet. The destination sheet’s existing data rows (from row 2 down) are **cleared** before new data is written.

| Object | Default destination | API |
|--------|---------------------|-----|
| Payouts | `Stripe_Payouts!A1` | `GET /api/stripe/payouts?from=&to=` |
| Balance Transactions | `Stripe_Balance_Transactions!A1` | `GET /api/stripe/balance-transactions?from=&to=` |
| Charges | `Stripe_Charges!A1` | `GET /api/stripe/charges?from=&to=` |

Rows are written with header row plus data. Amounts are in major currency units (cents ÷ 100). Date filters use Stripe `created` for balance transactions and charges, and `arrival_date` for payouts. Each request returns up to 100 records (no pagination yet).

## Build Xero journals from balance transactions

On the **Build** tab, click **Build journals from balance transactions** after:

1. **Set up workbook sheets** (includes `Xero_Journals` and `Account_Mappings`).
2. **Pull** data into `Stripe_Balance_Transactions`.
3. Fill **Account_Mappings** for `charge`, `refund`, `fee`, and `stripe_clearing` (account code and tax type at minimum).

The add-in **clears** existing data on `Xero_Journals` (including column I and row formatting) then writes **formula-driven** rows. For each distinct `created` date:

| Category | Lines per date | Gross Amount formula | Account (from mappings) |
|----------|----------------|--------------------|-------------------------|
| Charges | 2 | `SUMIFS` amount (col D) where type = `charge` | `charge` + opposite `stripe_clearing` |
| Refunds | 2 | `SUMIFS` amount where type = `refund` | `refund` + opposite `stripe_clearing` |
| Fees | 2 | `-SUMIFS` fee (col E) for that date | `fee` + opposite `stripe_clearing` |

- **Narration** (column B): `Stripe posting - [date]` — one Xero manual journal per date uses this narration.
- **Description** (column D): line detail (`Stripe - Charges - [date]`, etc.).

Changing balance transaction data recalculates journal amounts on Excel recalc.

## Build Xero bank transactions from balance transactions

On the **Build** tab, click **Build bank transactions from balance transactions** after:

1. **Set up workbook sheets** (includes `Xero_Bank_Transaction` and `Account_Mappings`).
2. **Pull** data into `Stripe_Balance_Transactions`.
3. Fill **Account_Mappings** for `stripe_payout_bank`, `stripe_clearing`, and `stripe_payout_contact`.

The add-in **clears** existing data on `Xero_Bank_Transaction` (including column H and row formatting), then writes one row per balance transaction where `type` = `payout`:

| Column | Source |
|--------|--------|
| Date | `available_on` |
| Type | `RECEIVE` |
| Contact | `stripe_payout_contact` mapping |
| Bank Account | `stripe_payout_bank` mapping |
| Reference | `source_id` |
| Account Code | `stripe_clearing` mapping |
| Amount | Negated Stripe `amount` (column D): payout rows are usually negative on the balance sheet, shown as positive RECEIVE in Xero |

## Push bank transactions to Xero

On the **Push** tab, choose **Bank Transactions**, set the read range (default `Xero_Bank_Transaction!A2:H500`), then click **Push bank transactions to Xero** after building rows.

- Skips rows that already have **Xero ID** set.
- Successful rows: light green fill and `✓ pushed` (or short ID) in column H.
- Failed rows: red fill and error message in column H.
- Reads calculated values from the sheet (Contact, Bank Account, Account Code from mapping formulas).
- Creates one Xero bank transaction per row: `Type: RECEIVE`, `Status: AUTHORISED`.
- Line description: `Stripe Payout - dd/mm/yyyy`.
- Amounts are sent as written on the sheet (positive RECEIVE after build negates Stripe payout signage).

Pre-push validation (server):

| Issue | What you’ll see |
|-------|------------------|
| Type not RECEIVE | Row must have Type = RECEIVE |
| Invalid contact | Contact must match a Xero contact from `stripe_payout_contact` mapping |
| Invalid bank account | Must be a BANK account code from Xero |
| Invalid line account | Clearing account must not be BANK/GST/debtor |
| Zero amount | Amount must be non-zero |

## Push manual journals to Xero

On the **Push** tab, choose **Manual Journals**:

1. Connect Xero and ensure `Xero_Journals` has lines (build journals first).
2. Set the read range (default `Xero_Journals!A2:I500`).
3. Choose **Journal status**: **Draft** (`DRAFT`) or **Posted** (`POSTED`).
4. Click **Push journals to Xero**.

The add-in reads calculated values from the range, **skips rows with Xero ID already set**, groups remaining lines by **date**, and creates one manual journal per date with narration `Stripe posting - dd/mm/yyyy`. Account codes and tax types are parsed from dropdown labels (`CODE — Name`). Rows without account code or with zero gross amount are skipped.

**Row feedback:** All pushed rows in range are highlighted **light green** with status in column I when everything succeeds. Rows that fail validation or Xero POST are highlighted **red** with the error in column I; other dates may still push successfully.

Before calling Xero, the server validates each date’s journal and returns row-level issues (also shown in the task pane):

| Issue | What you’ll see |
|-------|------------------|
| Unbalanced journal | Date and net total — lines for that date must sum to zero |
| Invalid account code | Account code not in your Xero chart of accounts |
| Invalid tax type | Tax type not in Xero tax rates |
| Invalid tracking | Category or option not in Xero tracking categories |
| Incomplete tracking | Category without option (or the reverse) |

If Xero rejects the POST, messages are categorized the same way where possible.

**GST / tax types:** Each journal line sends the **Tax Type** from column F (from `Account_Mappings` per stripe object: charge, refund, fee, stripe_clearing). Pushes use `LineAmountTypes: Inclusive` so amounts in column E are treated as GST-inclusive.

## Phase 1 verification checklist

- [ ] `npm run dev` — both add-in and server running
- [ ] Sideload `addin/manifest.xml` — task pane loads
- [ ] **Set up workbook sheets** — six tabs created (or skipped if already present)
- [ ] **Connect Stripe** — Office dialog opens → authorize → “Connected as …”
- [ ] **Connect Xero** — dialog → authorize → tenant name shown
- [ ] Select **Payouts**, date range, **Pull to sheet** → `Stripe_Payouts` worksheet with data
- [ ] Select **Balance Transactions** → default `Stripe_Balance_Transactions!A1` → pull populates sheet
- [ ] Select **Charges** → default `Stripe_Charges!A1` → pull populates sheet
- [ ] Fill `Account_Mappings`, then **Build journals from balance transactions** → `Xero_Journals` has formula rows per day
- [ ] **Push journals to Xero** as Draft or Posted → manual journals appear in Xero (one per date)
- [ ] Errors appear in the task pane status area (friendly messages, not raw API errors)
- [ ] `GET /api/xero/accounts` returns chart of accounts after Xero connect (optional: curl with session cookie)

## OAuth architecture

OAuth **cannot** run inside the task pane iframe. The add-in:

1. Fetches an auth URL from the backend (`/auth/stripe/connect` or `/auth/xero/connect`).
2. Opens it in the **system browser** via `Office.context.ui.openBrowserWindow()` (Stripe/Google sign-in fail in Office’s dialog WebView).
3. Provider redirects to the backend callback (`https://localhost:4000/auth/.../callback`).
4. Tokens are stored keyed by OAuth `state` (task pane session id); the task pane **polls** until connected.
5. Callback page shows “Return to Excel” (and uses `messageParent` when opened in a dialog fallback).

Tokens are stored **in memory** on the server, keyed by `express-session` cookie (sent with `withCredentials: true` from the add-in).

## API endpoints (phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/stripe/connect` | Stripe Connect OAuth URL |
| GET | `/auth/stripe/callback` | OAuth callback (HTML) |
| GET | `/auth/stripe/status` | Connection status |
| GET | `/auth/xero/connect` | Xero OAuth URL (PKCE) |
| GET | `/auth/xero/callback` | OAuth callback (HTML) |
| GET | `/api/stripe/payouts?from=&to=` | Pull payouts |
| GET | `/api/stripe/balance-transactions?from=&to=` | Pull balance transactions |
| GET | `/api/stripe/charges?from=&to=` | Pull charges |
| GET | `/api/xero/connections` | Xero connection status |
| GET | `/api/xero/accounts` | Chart of accounts (filtered) |
| GET | `/api/xero/mapping-options` | Accounts, tax rates, tracking categories, contacts for mapping dropdowns |
| POST | `/api/xero/manual-journals` | Push manual journals (`status`: `DRAFT` \| `POSTED`, `lines[]`) |
| POST | `/api/xero/bank-transactions` | Push bank transactions (`transactions[]`, status AUTHORISED in Xero) |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Task pane blank / won’t load | Ensure `npx office-addin-dev-certs install` completed; visit https://localhost:4000/taskpane.html in a browser and accept the cert |
| Stripe stuck on Google login | Office’s embedded browser is incompatible with Stripe; sign-in opens in your **system browser** — complete it there, then return to Excel |
| Dialog doesn’t return to task pane | Confirm `AppDomains` in manifest include Stripe/Xero; callback uses `https://localhost:4000` |
| CORS / session errors | `FRONTEND_URL` in `.env` must be `https://localhost:4000`; restart server after changes |
| Stripe “not connected” after auth | Check redirect URI matches exactly; use same browser session (cookies) |

## What’s not in phase 1

- Pagination beyond 100 Stripe list results
- Payout balance transaction drill-down (link payouts → balance transactions)
- Column mapping UI
- Bank transaction push
- Write-back Xero manual journal IDs to the sheet
- Persistent token storage (Redis/DB)
- Multi-currency handling

## License

Private — internal use.
