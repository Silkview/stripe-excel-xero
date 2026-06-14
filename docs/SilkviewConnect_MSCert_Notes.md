# Silkview Connect — Microsoft AppSource Certification Notes

**Confidential — Not for customer distribution**

Excel add-in · Stripe to Xero reconciliation  
**Version:** 1.0 beta · **Date:** June 2026 · **Publisher:** Silkview Systems · **Category:** Accounting & Finance

---

## 01 — Add-in overview

### What Silkview Connect does

Silkview Connect is a Microsoft Excel add-in (Office JS task pane) that automates reconciliation of Stripe payment data into Xero. It connects Stripe and Xero via OAuth 2.0, pulls Stripe balance transactions into Excel worksheets, builds Xero-ready manual journal and bank transaction rows using formula-driven account mappings, and pushes those entries to Xero via the Xero Accounting API — all from within the Excel task pane.

| Field | Value |
| --- | --- |
| Add-in name | Silkview Connect |
| Manifest ID | `6f4b82d9-1c5a-4b3d-9e28-7a1c5d9f3e4b` |
| Task pane URL | `https://addin.silkview.org/taskpane.html` |
| Host application | Microsoft Excel (desktop and web) |
| Min Office version | Excel 2016 / Office 365 |
| External services | Xero Accounting API, Stripe API |
| Authentication | OAuth 2.0 — Xero and Stripe, browser popup flow |
| Data storage | **Workbook:** pulled Stripe data and built Xero rows live in the user's Excel file. **Server:** OAuth access/refresh tokens and connection metadata are stored encrypted until the user disconnects on the web dashboard — not returned to the task pane. |
| Plans | Free (100 rows/pull, no Xero push), Pro, Firm (multiple Stripe accounts) |

---

## 02 — Test accounts for certification

Use these credentials to validate the complete workflow. Both accounts are connected to a Xero Demo Company (AU) — a sandboxed test organisation with no live financial data.

### Silkview Connect account (add-in login)

| Field | Value |
| --- | --- |
| Email | testsilkviewconnect@gmail.com |
| Password | CertReview2026! |
| Plan | Pro — all features unlocked |
| Workspace | Cert Review Workspace (pre-configured, connections active) |

### Xero login credentials & organisation

The Xero OAuth connection can be verified using these login credentials connected to Xero's standard Demo Company (AU).

| Field | Value |
| --- | --- |
| Xero username | testsilkviewconnect@gmail.com |
| Xero password | CertReview2026! |
| Organisation | Demo Company (AU) |
| Base currency | AUD |
| Connection | OAuth 2.0 — token auto-refreshes |
| Access level | Read chart of accounts, tax rates, contacts, reports. Write manual journals and bank transactions only. |

### Stripe — test mode account

Stripe is connected in test mode. Pre-populated with test balance transactions. No real funds involved.

| Field | Value |
| --- | --- |
| Account | Pre-connected test account — labelled **TEST** (orange) in task pane |
| Mode | TEST |
| Available data | 30 days of test balance transactions: charges, refunds, fees, payouts |

---

## 03 — Permissions and data access

### Xero OAuth 2.0 scopes

| Scope | Type | Purpose |
| --- | --- | --- |
| accounting.transactions | Read+Write | Post manual journals and bank transactions |
| accounting.settings | Read | Chart of accounts, tax rates, tracking categories |
| accounting.reports.read | Read | Organisation/report context as needed for mappings |
| accounting.contacts | Read | Contact list for bank transaction contact mapping |
| offline_access | System | Token refresh without re-authorisation |

**Not requested:** OpenID/profile/email scopes, payroll scopes, asset/file scopes, or write access to Xero settings/contacts beyond what the Accounting API requires for journal and bank transaction posts.

### Stripe OAuth scope

| Scope | Type | Purpose |
| --- | --- | --- |
| read_write | Read (Connect OAuth) | Pull balance transactions, payouts, and charges via the Connect platform. The add-in does not create charges or move funds. |

### Office JS permission

Manifest declares **ReadWriteDocument**. Required to create worksheets and write pulled Stripe data and prepared journal/bank rows into cells. No other host permissions are declared.

---

## 04 — Step-by-step testing workflow

The cert review workspace has connections active. Steps 1–2 confirm connections; Steps 3–4 set up sheets and pull data. **Configure Account_Mappings (Step 5) before Build** — required for correct journal and bank transaction account codes.

### Step 1 — Sign in

1. **Open task pane** — In Excel: **Insert → My Add-ins → Silkview Connect**. Task pane opens on the right.
2. **Sign in** — Click **Sign in**. Browser opens `https://www.silkview.org/auth/login`. Enter cert review credentials.
3. **Select workspace** — Return to Excel. Select **Cert Review Workspace** from the workspace dropdown.

### Step 2 — Verify connections

1. **Check Xero card** — Should show **Demo Company (AU)** with green connected indicator and currency **AUD**.
2. **Check Stripe card** — Shows test account with orange **TEST** badge. Account ticked under **Accounts for pull**.
3. **If reconnect needed** — Use **Reconnect** on the connection card in the task pane (OAuth popup). To fully disconnect, sign in at `https://www.silkview.org/dashboard` and disconnect Stripe/Xero from the workspace card there, then reconnect from the task pane.

### Step 3 — Setup sheets

1. **Setup sheets** — In the **Quick setup** strip at the top of the task pane, click **Setup sheets**. Creates seven required worksheets if not present.
2. **Refresh Xero** — In **Quick setup**, click **Refresh Xero** (enabled when Xero is connected). Populates account code dropdowns on **Account_Mappings**.

**Seven worksheets created:** `Stripe_Payouts`, `Stripe_Balance_Transactions`, `Stripe_Balance_Trx_Payouts`, `Stripe_Charges`, `Xero_Journals`, `Xero_Bank_Transaction`, `Account_Mappings`.

### Step 4 — Pull (Stripe data)

1. **Go to Pull tab** — Click the **Pull** tab (step 1) in the task pane.
2. **Configure** — Object: **Balance Transactions**. Date range: any 30-day window in the last 90 days. Destination: `Stripe_Balance_Transactions!A1` (default).
3. **Pull to sheet** — Click **Pull to sheet**. Confirm row count &gt; 0 in the result message. Sheet has **13 columns** (A–M): two Stripe account columns plus eleven balance-transaction fields; headers in row 1, data from row 2.

### Step 5 — Configure Account_Mappings

Open the **Account_Mappings** worksheet (created in Step 3). After **Refresh Xero**, each row has dropdowns for **Xero Account Code**, **Xero Tax Type**, and (in the Contact Mapping section) **Xero Contact**. Set these values before building journals or bank transactions:

| Stripe Object | Xero Account Code | Xero Tax Type |
| --- | --- | --- |
| charge | 200 — Sales | OUTPUT — GST on Income |
| refund | 200 — Sales | OUTPUT — GST on Income |
| fee | 200 — Sales | OUTPUT — GST on Income |
| stripe_clearing | 855 — Clearing Account | *(leave blank or default)* |
| stripe_payout_bank | 090 — Business Bank Account | *(leave blank or default)* |

**Contact Mapping** (lower section of the same sheet):

| Label | Xero Contact |
| --- | --- |
| Bank Transfer Contact | Bank |

1. **Account mapping rows** — For each **charge**, **refund**, and **fee** row, select **200 — Sales** in column B and **OUTPUT — GST on Income** in column C.
2. **Clearing and bank rows** — For **stripe_clearing**, select **855 — Clearing Account**. For **stripe_payout_bank**, select **090 — Business Bank Account**.
3. **Contact** — In the Contact Mapping section, set **Bank Transfer Contact** to **Bank**.
4. **Save the workbook** — Mappings are read from the sheet when you build; incorrect or empty mappings will produce wrong account codes or build errors.

### Step 6 — Build (journals and bank transactions)

1. **Go to Build tab** — Click the **Build** tab (step 2).
2. **Build journals** — Under **Manual journals**, click **Build journals from balance transactions**. Activates **Xero_Journals** with lines (Date, Narration, Account Code, Description, **Gross Amount**, Tax Type, tracking columns).
3. **Build bank transactions (optional)** — Under **Bank transactions**, click **Build bank transactions from balance transactions**. Populates **Xero_Bank_Transaction** with one Receive Money row per payout.
4. **Verify** — Journal lines use mapped account codes from **Account_Mappings**. Each journal date groups charges, refunds, and fees; balancing is validated server-side when pushing (not as separate Dr/Cr columns in the sheet).

### Step 7 — Push (post to Xero)

1. **Go to Push tab** — Click the **Push** tab (step 3).
2. **Choose type** — Segmented control: **Manual journals** or **Bank transactions**.
3. **Journals** — Set **Read range** (default covers built rows). **Status** defaults to **Draft** (or **Posted** if the workspace allows). Click **↑ Push journals to Xero**.
4. **Verify writeback** — Successful rows: green highlight, **Xero ID** in column I, **Status** in column J (`DRAFT` or `POSTED`). Already-pushed rows are skipped.
5. **Verify in Xero** — In Xero Demo Company: **Accounting → Manual Journals**. Pushed journals appear with correct narration, date, and amounts.

Bank transactions: use **Push bank transactions to Xero**; rows post as **AUTHORISED** Receive Money; status writeback in columns H (Xero ID) and I (Status).

---

## 05 — Expected outcomes

| Step | Action | Expected result | Pass criteria |
| --- | --- | --- | --- |
| Sign in | Click Sign in | Browser opens auth page | Task pane shows workspace selector after auth |
| Connect | Check Xero card | Org name, green dot, AUD | Org name and currency visible, no error state |
| Connect | Check Stripe card | Test account + orange TEST badge | Account listed and ticked under Accounts for pull |
| Setup | Setup sheets | 7 worksheets created | All seven sheet tabs present |
| Setup | Refresh Xero | Account_Mappings dropdowns filled | Column B shows Xero account code dropdowns |
| Pull | Pull Balance Transactions | Sheet populated | Row count &gt; 0; 13 columns A–M with headers |
| Mappings | Configure Account_Mappings | Demo Co account codes set | charge/refund/fee → 200-Sales + OUTPUT-GST; clearing → 855; bank → 090; contact → Bank |
| Build | Build journals | Xero_Journals populated | Lines with Gross Amount; mapped account codes |
| Build | Build bank transactions | Xero_Bank_Transaction populated | Payout rows with contact and bank account |
| Push | Push journals to Xero | Journals in Xero | Xero IDs in column I; Status DRAFT or POSTED in J |
| Push | Push bank transactions | Bank txs in Xero | Xero IDs and status on bank sheet |

---

## 06 — Network calls and data handling

| Domain | Purpose | Auth |
| --- | --- | --- |
| `addin.silkview.org` | Task pane UI, static assets, `/api/*` proxy to web API | Session via handoff from web app |
| `www.silkview.org` | Sign-in, dashboard, REST API (Stripe/Xero broker) | HttpOnly session cookie |
| `api.xero.com` | Xero Accounting API | OAuth 2.0 Bearer (brokered by backend) |
| `api.stripe.com` | Stripe API — balance transactions, payouts, charges | Connect OAuth (brokered by backend) |
| `connect.stripe.com` / `login.xero.com` | OAuth authorization popups | User consent |

OAuth tokens for Xero and Stripe are held **server-side only** (encrypted at rest) — never returned to the Excel task pane. Transactional Stripe/Xero data pulled into the workbook remains in the user's file.

---

## 07 — Support and contact information

| Item | URL |
| --- | --- |
| Publisher | Silkview Systems |
| Support URL | https://www.silkview.org/support |
| Privacy policy | https://www.silkview.org/privacy |
| Terms of service | https://www.silkview.org/terms |
| Manifest URL | https://www.silkview.org/api/addin/manifest |
| Certification contact | Via support URL above |

For issues during certification review, capture the error message and contact us via the support URL. The cert review account has full Pro access — if any feature appears locked, please report it.

---

*Regenerate PDF after editing this file: `python3 scripts/generate_mscert_pdf.py`*
