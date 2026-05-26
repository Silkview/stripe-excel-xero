import Image from 'next/image';
import {
  betaFeedbackMailtoUrl,
  SUPPORT_EMAIL,
  supportMailtoUrl,
} from '@/lib/support';
import styles from './UserGuide.module.css';

function WordmarkSvg({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" width={size} height={size} aria-hidden>
      <path
        d="M2 3.5h10M2 7h10M2 10.5h5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="10.5" r="2.5" fill="#06B3E8" />
    </svg>
  );
}

function MockupTopbar({ title }: { title: string }) {
  return (
    <div className={styles.mockupTopbar}>
      <div className={styles.mockupDot} style={{ background: '#FF5F57' }} />
      <div className={styles.mockupDot} style={{ background: '#FEBC2E' }} />
      <div className={styles.mockupDot} style={{ background: '#28C840' }} />
      <div className={styles.mockupTitle}>{title}</div>
    </div>
  );
}

function TpHeader() {
  return (
    <div className={styles.tpHdr}>
      <div className={styles.tpLogo}>
        <div className={styles.tpLogoMark}>
          <WordmarkSvg size={11} />
        </div>
        Silkview Connect
      </div>
      <div className={styles.tpDashLink}>Dashboard ↗</div>
    </div>
  );
}

function TpWorkspaceBar({ value }: { value: string }) {
  return (
    <div className={styles.tpWs}>
      <span className={styles.tpWsLabel}>Workspace</span>
      <span className={styles.tpWsVal}>{value}</span>
    </div>
  );
}

export default function UserGuide() {
  return (
    <div className={styles.root}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroLabel}>Documentation</div>
        <h1>Excel Add-in User Guide</h1>
        <p>
          Step-by-step instructions for Silkview Connect — from sign-in through
          pull, build, and push to Xero.
        </p>
        <div className={styles.heroTags}>
          <span className={styles.heroTag}>✦ Excel desktop &amp; web</span>
          <span className={styles.heroTag}>✦ AUD only (v1)</span>
          <span className={styles.heroTag}>✦ Xero + Stripe</span>
          <span className={styles.heroTag}>Updated May 2026</span>
        </div>
      </section>

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <nav className={styles.sidebar} aria-label="Guide sections">
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Getting started</div>
            <a className={styles.sbLink} href="#get-started">
              <div className={styles.sbNum}>1</div>Get started
            </a>
            <a className={styles.sbLink} href="#connect">
              <div className={styles.sbNum}>2</div>Connect Xero &amp; Stripe
            </a>
            <a className={styles.sbLink} href="#prepare">
              <div className={styles.sbNum}>3</div>Prepare your workbook
            </a>
          </div>
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Daily workflow</div>
            <a className={styles.sbLink} href="#pull">
              <div className={styles.sbNum}>4</div>Pull — Stripe data
            </a>
            <a className={styles.sbLink} href="#build">
              <div className={styles.sbNum}>5</div>Build — journals &amp; bank tx
            </a>
            <a className={styles.sbLink} href="#push">
              <div className={styles.sbNum}>6</div>Push — post to Xero
            </a>
          </div>
          <div className={styles.sbSection}>
            <div className={styles.sbSectionLabel}>Reference</div>
            <a className={styles.sbLink} href="#accounting">
              <div className={styles.sbNum}>7</div>Accounting treatment
            </a>
            <a className={styles.sbLink} href="#troubleshooting">
              <div className={styles.sbNum}>8</div>Troubleshooting
            </a>
          </div>
        </nav>

        {/* CONTENT */}
        <div>
          {/* ========== 1. GET STARTED ========== */}
          <section className={styles.stepSection} id="get-started">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb1}`}>01</div>
              <div>
                <div className={styles.stepTitle}>Get started</div>
                <div className={styles.stepSub}>
                  Open the Silkview task pane and sign in to your account
                </div>
              </div>
            </div>

            <p>
              Silkview Connect is currently in <strong>beta</strong>. Access is
              provisioned by the Silkview team — there is no public install
              from the Office Store yet. Once your add-in is enabled in your
              Excel workbook, follow the steps below to sign in.
            </p>

            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>Open the Silkview Connect task pane in Excel</strong>
                  <p>
                    Launch the add-in from the Excel <strong>Insert</strong>{' '}
                    tab. The task pane opens on the right side of Excel and
                    shows a Sign in button.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>Sign in or create an account</strong>
                  <p>
                    Click <strong>Sign in</strong> in the task pane. A browser
                    window opens to <code>silkview.org/auth/login</code>. Sign
                    in with your credentials, or click{' '}
                    <strong>Create account</strong> if you are new. After
                    sign-in, return to Excel — the task pane updates
                    automatically.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Complete account setup (new users only)</strong>
                  <p>
                    New accounts are redirected to the web dashboard to name
                    your account and create your first workspace. Once done,
                    return to Excel. Your workspace will appear in the
                    dropdown.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>4</div>
                <div className={styles.stepItemBody}>
                  <strong>Select your workspace</strong>
                  <p>
                    If your account has multiple workspaces, use the{' '}
                    <strong>Workspace</strong> dropdown at the top of the task
                    pane to choose which one you are working in. Each
                    workspace has its own Xero and Stripe connections.
                  </p>
                </div>
              </div>
            </div>

            {/* Figure 1 */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Silkview Connect — Excel task pane" />
              <div className={styles.mockupBody}>
                <Image
                  className={styles.mockupImg}
                  src="/support/taskpane-signin.png"
                  alt="Silkview Connect task pane — Sign in screen"
                  width={375}
                  height={221}
                />
              </div>
              <div className={styles.mockupCaption}>
                Figure 1 — Workspace selector with the Sign in card. Clicking
                Sign in opens the browser auth flow.
              </div>
            </div>
          </section>

          {/* ========== 2. CONNECT ========== */}
          <section className={styles.stepSection} id="connect">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb2}`}>02</div>
              <div>
                <div className={styles.stepTitle}>Connect Xero and Stripe</div>
                <div className={styles.stepSub}>
                  Authorise access to both platforms for your workspace
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutXero}`}>
              <span className={styles.calloutIcon}>ℹ️</span>
              <p>
                Connections are <strong>per workspace</strong>. Each workspace
                links exactly one Xero organisation and one or more Stripe
                accounts. If you manage multiple clients, create a separate
                workspace per client.
              </p>
            </div>

            <h3>Connecting Xero</h3>
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>Click the Xero connection card</strong>
                  <p>
                    In the connections section of the task pane, click{' '}
                    <strong>Connect to Xero</strong>. A browser dialog opens
                    and redirects you to Xero&apos;s authorisation page.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>Authorise Silkview Connect in Xero</strong>
                  <p>
                    Sign in to Xero if prompted, then select the organisation
                    you want to connect and click{' '}
                    <strong>Allow access</strong>. Silkview Connect requests{' '}
                    <strong>read access to settings and accounts</strong> and{' '}
                    <strong>write access to transactions</strong> only — it
                    cannot modify your Xero settings or access unrelated data.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Confirm connection</strong>
                  <p>
                    Return to Excel. The Xero connection card now shows your
                    organisation name (e.g. <em>Demo Company (AU)</em>), a
                    green connected indicator, and your base currency (e.g.{' '}
                    <strong>AUD</strong>). All pulls and builds use this
                    currency.
                  </p>
                </div>
              </div>
            </div>

            <h3>Connecting Stripe</h3>
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>Click Connect Stripe</strong>
                  <p>
                    In the Stripe connection card, click{' '}
                    <strong>Connect Stripe</strong>. A browser dialog opens
                    and redirects you to Stripe&apos;s OAuth Connect page.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>Select your Stripe account</strong>
                  <p>
                    Choose the Stripe account to connect and click{' '}
                    <strong>Connect</strong>. Silkview Connect requests{' '}
                    <strong>read-only</strong> access — it cannot move funds,
                    create charges, or modify your Stripe account.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Add additional Stripe accounts (Firm plan)</strong>
                  <p>
                    On the Firm plan you can connect multiple Stripe accounts
                    per workspace. Click{' '}
                    <strong>+ Add another account</strong> beneath the
                    accounts list and repeat the connect flow. Each new
                    account appears as a checkable row under{' '}
                    <strong>Accounts for pull</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutWarn}`}>
              <span className={styles.calloutIcon}>⚠️</span>
              <p>
                <strong>Live vs test mode:</strong> Stripe accounts connected
                in test mode are labelled <strong>Test</strong> in orange.
                Data from test accounts is real test data only — do not push
                test-mode data to a live Xero organisation. Use a separate
                test workspace for development.
              </p>
            </div>

            {/* Figure 2 */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Connections — both connected" />
              <div className={styles.mockupBody}>
                <Image
                  className={styles.mockupImg}
                  src="/support/taskpane-connections.png"
                  alt="Silkview Connect task pane — Xero and Stripe connections"
                  width={375}
                  height={405}
                />
              </div>
              <div className={styles.mockupCaption}>
                Figure 2 — Both connections active. Xero shows the
                organisation name with currency. Stripe shows individual
                accounts under &quot;Accounts for pull&quot; with live/test
                badges.
              </div>
            </div>

            <h3>Managing connections from the dashboard</h3>
            <p>
              Connections can also be managed from the web dashboard at{' '}
              <a href="https://www.silkview.org">silkview.org</a>. After
              making changes in the dashboard (reconnecting Xero, adding a
              Stripe account), return to Excel and click{' '}
              <strong>Refresh</strong> in the add-in header to reload the
              latest connection state without restarting Excel.
            </p>
          </section>

          {/* ========== 3. PREPARE ========== */}
          <section className={styles.stepSection} id="prepare">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb3}`}>03</div>
              <div>
                <div className={styles.stepTitle}>Prepare your workbook</div>
                <div className={styles.stepSub}>
                  Create sheets and configure your account mappings — done
                  once per workspace
                </div>
              </div>
            </div>

            <h3>Step 1 — Set up sheets</h3>
            <p>
              Click <strong>Setup sheets</strong> under Quick setup in the
              task pane. This creates the following sheets in your workbook
              if they don&apos;t already exist:
            </p>

            <div className={styles.sheetWrap}>
              <div className={styles.sheetTabs}>
                <div
                  className={`${styles.sheetTab} ${styles.sheetTabActive}`}
                >
                  Stripe_Balance_Transactions
                </div>
                <div className={styles.sheetTab}>Stripe_Payouts</div>
                <div className={styles.sheetTab}>Stripe_Balance_Trx_Payouts</div>
                <div className={styles.sheetTab}>Stripe_Charges</div>
                <div className={styles.sheetTab}>Xero_Journals</div>
                <div className={styles.sheetTab}>Xero_Bank_Transaction</div>
                <div className={styles.sheetTab}>Account_Mappings</div>
              </div>
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Sheet</th>
                    <th>Purpose</th>
                    <th>Written by</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Stripe_Balance_Transactions</td>
                    <td>Raw Stripe balance transaction data</td>
                    <td>Pull tab (add-in)</td>
                  </tr>
                  <tr>
                    <td>Stripe_Payouts</td>
                    <td>Stripe payout summaries</td>
                    <td>Pull tab (add-in)</td>
                  </tr>
                  <tr>
                    <td>Stripe_Balance_Trx_Payouts</td>
                    <td>Balance transactions filtered to payouts only</td>
                    <td>Pull tab (add-in)</td>
                  </tr>
                  <tr>
                    <td>Stripe_Charges</td>
                    <td>Charge-level detail</td>
                    <td>Pull tab (add-in)</td>
                  </tr>
                  <tr>
                    <td>Xero_Journals</td>
                    <td>Manual journal rows ready to push</td>
                    <td>Build tab (add-in) + you</td>
                  </tr>
                  <tr>
                    <td>Xero_Bank_Transaction</td>
                    <td>Bank transaction rows ready to push</td>
                    <td>Build tab (add-in) + you</td>
                  </tr>
                  <tr>
                    <td>Account_Mappings</td>
                    <td>
                      Your GL account codes, tax types and bank-transfer
                      contact
                    </td>
                    <td>You (Xero dropdowns populated by add-in)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                You can rename or reorganise sheets as long as you update the{' '}
                <strong>Destination</strong> field in the Pull tab and the{' '}
                <strong>Read range</strong> field in the Push tab to match.
                The add-in does not hard-code sheet names — it reads whatever
                range you specify.
              </p>
            </div>

            <h3>Step 2 — Refresh Xero account dropdowns</h3>
            <p>
              Click <strong>Refresh Xero</strong> under Quick setup. This
              fetches your Xero chart of accounts, tax rates, tracking
              categories, and contacts, then populates dropdown lists on the{' '}
              <code>Account_Mappings</code> sheet. You must do this after
              first connecting Xero, and again after adding new accounts,
              tracking options, or contacts in Xero.
            </p>

            <h3>Step 3 — Configure Account_Mappings</h3>
            <p>
              The <code>Account_Mappings</code> sheet has two sections — an{' '}
              <strong>Account Mapping</strong> block at the top and a{' '}
              <strong>Contact Mapping</strong> block below. Both control how
              Stripe transactions translate into Xero entries. Configure each
              cell once and the values are referenced by formula in every
              future Build.
            </p>

            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '20px 0 6px',
              }}
            >
              Section A — Account Mapping (rows 1–7)
            </h4>
            <div className={styles.amapSection}>
              <div className={styles.amapTitle}>Account Mapping</div>
              <table className={styles.mappingTable}>
                <thead>
                  <tr className={styles.amapHeader}>
                    <th>Stripe Object</th>
                    <th>Xero Account Code</th>
                    <th>Xero Tax Type</th>
                    <th>Xero Tracking Name</th>
                    <th>Xero Tracking Option</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span
                        className={`${styles.typePill} ${styles.tpCharge}`}
                      >
                        charge
                      </span>
                    </td>
                    <td>200 — Sales</td>
                    <td>OUTPUT2 (GST on income)</td>
                    <td>(optional)</td>
                    <td>(optional)</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`${styles.typePill} ${styles.tpRefund}`}
                      >
                        refund
                      </span>
                    </td>
                    <td>200 — Sales</td>
                    <td>OUTPUT2 (GST on income)</td>
                    <td>(optional)</td>
                    <td>(optional)</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`${styles.typePill} ${styles.tpFee}`}
                      >
                        fee
                      </span>
                    </td>
                    <td>404 — Bank Charges</td>
                    <td>NONE (no GST on bank fees)</td>
                    <td>(optional)</td>
                    <td>(optional)</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`${styles.typePill} ${styles.tpClearing}`}
                      >
                        stripe_clearing
                      </span>
                    </td>
                    <td>855 — Stripe Clearing</td>
                    <td>NONE</td>
                    <td>(optional)</td>
                    <td>(optional)</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        className={`${styles.typePill} ${styles.tpBank}`}
                      >
                        stripe_payout_bank
                      </span>
                    </td>
                    <td>120 — Business Cheque (bank accounts only)</td>
                    <td>NONE</td>
                    <td>(optional)</td>
                    <td>(optional)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '20px 0 6px',
              }}
            >
              Section B — Contact Mapping (rows 9–11)
            </h4>
            <div className={styles.amapSection}>
              <div className={styles.amapTitle}>Contact Mapping</div>
              <table className={styles.mappingTable}>
                <thead>
                  <tr className={styles.amapHeader}>
                    <th> </th>
                    <th>Xero Contact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.amapLabel}>
                      <span
                        className={`${styles.typePill} ${styles.tpContact}`}
                      >
                        Bank Transfer Contact
                      </span>
                    </td>
                    <td>Stripe Payments Australia Pty Ltd</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`${styles.callout} ${styles.calloutWarn}`}>
              <span className={styles.calloutIcon}>⚠️</span>
              <p>
                <strong>Clearing account is required.</strong> You must set up
                a <strong>Stripe Clearing Account</strong> in your Xero chart
                of accounts (a current asset account, not a bank account) and
                map it to the <code>stripe_clearing</code> row. This account
                temporarily holds Stripe revenue until the net payout arrives
                at your bank. See the{' '}
                <a href="#accounting">Accounting treatment</a> section for a
                full explanation.
              </p>
            </div>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                The <code>stripe_payout_bank</code> row&apos;s dropdown is
                filtered to <strong>bank accounts only</strong>, while every
                other row pulls from the journal/GL account list. The contact
                cell in row 11 (<code>B11</code>) is referenced by every bank
                transaction the Build step generates.
              </p>
            </div>
          </section>

          {/* ========== 4. PULL ========== */}
          <section className={styles.stepSection} id="pull">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb4}`}>04</div>
              <div>
                <div className={styles.stepTitle}>Pull — Stripe data</div>
                <div className={styles.stepSub}>
                  Retrieve balance transactions and other objects from Stripe
                  into Excel
                </div>
              </div>
            </div>

            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>Go to the Pull tab</strong>
                  <p>
                    Click the <strong>Pull</strong> tab (step 1) in the task
                    pane.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>
                    Select which Stripe accounts to pull from
                  </strong>
                  <p>
                    In the Stripe connection card above the tabs, tick the
                    accounts you want to include under{' '}
                    <strong>Accounts for pull</strong>. When multiple
                    accounts are selected, each is pulled separately then
                    merged and sorted by date in the destination sheet.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Choose the Object type</strong>
                  <p>
                    Select the Stripe data type to pull. The available
                    options are <strong>Payouts</strong>,{' '}
                    <strong>Balance Transactions</strong>,{' '}
                    <strong>Balance Transaction Payouts</strong>, and{' '}
                    <strong>Charges</strong>. For the standard reconciliation
                    workflow, use <strong>Balance Transactions</strong> —
                    this includes charges, refunds, and fees in a single
                    unified list.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>4</div>
                <div className={styles.stepItemBody}>
                  <strong>Set the date range</strong>
                  <p>
                    Enter <strong>From</strong> and <strong>To</strong>{' '}
                    dates. The maximum range per pull is{' '}
                    <strong>90 days</strong>. For month-end processing, set
                    From to the first day of the month and To to the last
                    day. The date filter uses the transaction created date,
                    not the payout arrival date.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>5</div>
                <div className={styles.stepItemBody}>
                  <strong>Confirm the destination</strong>
                  <p>
                    The <strong>Destination</strong> field defaults to{' '}
                    <code>{'<Sheet>!A1'}</code> for the selected object (for
                    example <code>Stripe_Payouts!A1</code> or{' '}
                    <code>Stripe_Balance_Transactions!A1</code>). The pull
                    overwrites from the starting cell — headers go on row 1,
                    data from row 2. Existing data is replaced entirely on
                    each pull.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>6</div>
                <div className={styles.stepItemBody}>
                  <strong>Click Pull to sheet</strong>
                  <p>
                    The add-in fetches data from Stripe and writes it to
                    Excel. The row count and destination are confirmed in a
                    green result bar below the button.{' '}
                    <strong>Free plan:</strong> 100 rows total per pull,
                    capped at 90 days.{' '}
                    <strong>Pro / Firm plans:</strong> 2,000 rows total per
                    pull, accounts merged and sorted by date.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutStripe}`}>
              <span className={styles.calloutIcon}>⚡</span>
              <p>
                <strong>Currency filter.</strong> On Pro/Firm, Silkview
                Connect filters Stripe transactions to your Xero
                organisation&apos;s base currency (e.g. AUD). On Free, all
                Stripe currencies are returned. Multi-currency support in the
                push step is limited in v1.
              </p>
            </div>

            {/* Figure 3 */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Pull tab — Payouts" />
              <div className={styles.mockupBody}>
                <Image
                  className={styles.mockupImg}
                  src="/support/taskpane-pull.png"
                  alt="Silkview Connect task pane — Pull tab with Payouts selected"
                  width={375}
                  height={724}
                />
              </div>
              <div className={styles.mockupCaption}>
                Figure 3 — Pull tab with a 1-month range. The Object dropdown
                defaults to Payouts; switch it to Balance Transactions for
                the build flow.
              </div>
            </div>

            <h3>What gets written to the sheet</h3>
            <p>
              Each Pull object writes to its own sheet. The column layouts
              below match the live add-in (column A is the leftmost cell
              written by the pull).
            </p>

            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '14px 0 4px',
              }}
            >
              Stripe_Balance_Transactions (13 columns, A–M)
            </h4>
            <div
              className={`${styles.sheetWrap} ${styles.sheetWrapScroll}`}
            >
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Col</th>
                    <th>Header</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>Stripe Account ID</td>
                    <td>Source connection (e.g. acct_1Sv…)</td>
                  </tr>
                  <tr>
                    <td>B</td>
                    <td>Stripe Account Name</td>
                    <td>Friendly account label</td>
                  </tr>
                  <tr>
                    <td>C</td>
                    <td>Transaction ID</td>
                    <td>
                      <code>txn_…</code>
                    </td>
                  </tr>
                  <tr>
                    <td>D</td>
                    <td>Created</td>
                    <td>UTC → local date</td>
                  </tr>
                  <tr>
                    <td>E</td>
                    <td>Available On</td>
                    <td>Date the funds become payable</td>
                  </tr>
                  <tr>
                    <td>F</td>
                    <td>Amount</td>
                    <td>Signed (negative for refunds, fees, payouts)</td>
                  </tr>
                  <tr>
                    <td>G</td>
                    <td>Fee</td>
                    <td>Stripe fee component</td>
                  </tr>
                  <tr>
                    <td>H</td>
                    <td>Net</td>
                    <td>Amount minus fee</td>
                  </tr>
                  <tr>
                    <td>I</td>
                    <td>Currency</td>
                    <td>Lower-case ISO (aud, usd, …)</td>
                  </tr>
                  <tr>
                    <td>J</td>
                    <td>Type</td>
                    <td>
                      <code>charge</code>, <code>refund</code>,{' '}
                      <code>payout</code>, <code>stripe_fee</code>, …
                    </td>
                  </tr>
                  <tr>
                    <td>K</td>
                    <td>Reporting Category</td>
                    <td>Stripe&apos;s reporting bucket</td>
                  </tr>
                  <tr>
                    <td>L</td>
                    <td>Description</td>
                    <td>Free-form text from the source object</td>
                  </tr>
                  <tr>
                    <td>M</td>
                    <td>Source ID</td>
                    <td>Underlying charge, refund or payout ID</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '20px 0 4px',
              }}
            >
              Stripe_Payouts (11 columns, A–K)
            </h4>
            <div
              className={`${styles.sheetWrap} ${styles.sheetWrapScroll}`}
            >
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Col</th>
                    <th>Header</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>Stripe Account ID</td>
                    <td>Source connection</td>
                  </tr>
                  <tr>
                    <td>B</td>
                    <td>Stripe Account Name</td>
                    <td>Friendly account label</td>
                  </tr>
                  <tr>
                    <td>C</td>
                    <td>Payout ID</td>
                    <td>
                      <code>po_…</code>
                    </td>
                  </tr>
                  <tr>
                    <td>D</td>
                    <td>Arrival Date</td>
                    <td>Date funds hit your bank</td>
                  </tr>
                  <tr>
                    <td>E</td>
                    <td>Gross Amount</td>
                    <td>Total of charges in the payout</td>
                  </tr>
                  <tr>
                    <td>F</td>
                    <td>Fee Amount</td>
                    <td>Total Stripe fees in the payout</td>
                  </tr>
                  <tr>
                    <td>G</td>
                    <td>Net Amount</td>
                    <td>What lands in your bank</td>
                  </tr>
                  <tr>
                    <td>H</td>
                    <td>Currency</td>
                    <td>Lower-case ISO</td>
                  </tr>
                  <tr>
                    <td>I</td>
                    <td>Status</td>
                    <td>paid, in_transit, …</td>
                  </tr>
                  <tr>
                    <td>J</td>
                    <td>Description</td>
                    <td>From Stripe</td>
                  </tr>
                  <tr>
                    <td>K</td>
                    <td>Bank Account Last4</td>
                    <td>Last 4 digits of the destination bank account</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ========== 5. BUILD ========== */}
          <section className={styles.stepSection} id="build">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb5}`}>05</div>
              <div>
                <div className={styles.stepTitle}>
                  Build — journals and bank transactions
                </div>
                <div className={styles.stepSub}>
                  Generate formula-driven Xero entries from your Stripe data
                </div>
              </div>
            </div>

            <p>
              The Build tab reads from{' '}
              <code>Stripe_Balance_Transactions</code> and your{' '}
              <code>Account_Mappings</code> to generate two types of Xero
              entries. Every account-code, tax-type and tracking value is
              written as an{' '}
              <strong>INDEX/MATCH formula against Account_Mappings</strong>,
              so editing a mapping flows through to all built rows on the
              next refresh. Bank-transaction contacts come from{' '}
              <code>=Account_Mappings!$B$11</code>.
            </p>

            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>
                    Go to the Build tab and click Build journals from balance
                    transactions
                  </strong>
                  <p>
                    This generates rows on the <code>Xero_Journals</code>{' '}
                    sheet — one signed line per Stripe object type per day
                    (charges, refunds, fees) plus the matching clearing-line
                    pair. Tax is applied INCLUSIVE via the{' '}
                    <code>Tax Type</code> column, so no separate GST line is
                    needed.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>
                    Click Build bank transactions from balance transactions
                  </strong>
                  <p>
                    This generates rows on{' '}
                    <code>Xero_Bank_Transaction</code> — one{' '}
                    <code>RECEIVE</code> row per Stripe payout. The bank
                    account references your <code>stripe_payout_bank</code>{' '}
                    mapping and the offset account references{' '}
                    <code>stripe_clearing</code>.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Review and adjust in Excel</strong>
                  <p>
                    All generated rows are plain Excel data — you can edit,
                    reorder, add rows, or apply your own formulas. The
                    add-in reads whatever is in the range at push time. If
                    account codes need adjustment, update{' '}
                    <code>Account_Mappings</code> — formulas recalculate
                    automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                <strong>Rebuilding is safe.</strong> If you rebuild after
                adjusting mappings, the build overwrites the generated rows.
                Rows that have already been pushed (marked with a Xero ID in
                column I for journals or column H for bank transactions) are
                automatically skipped — be careful not to manually overwrite
                pushed rows you need to keep as audit trail.
              </p>
            </div>

            {/* Figure 4 */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Build tab" />
              <div className={styles.mockupBody}>
                <Image
                  className={styles.mockupImg}
                  src="/support/taskpane-build.png"
                  alt="Silkview Connect task pane — Build tab with manual journals and bank transactions"
                  width={375}
                  height={775}
                />
              </div>
              <div className={styles.mockupCaption}>
                Figure 4 — Build tab. The Pull step is marked done; each
                build card targets a separate Xero entry type.
              </div>
            </div>

            <h3>Xero_Journals sheet structure (10 columns, A–J)</h3>
            <p>
              The add-in writes formulas to columns A–H. Columns I (
              <code>Xero ID</code>) and J (<code>Status</code>) are populated
              by the Push step.
            </p>
            <div
              className={`${styles.sheetWrap} ${styles.sheetWrapScroll}`}
            >
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Col A — Date</th>
                    <th>Col B — Narration</th>
                    <th>Col C — Account Code</th>
                    <th>Col D — Description</th>
                    <th>Col E — Gross Amount</th>
                    <th>Col F — Tax Type</th>
                    <th>Col G — Tracking Name 1</th>
                    <th>Col H — Tracking Option 1</th>
                    <th>Col I — Xero ID</th>
                    <th>Col J — Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2026-05-15</td>
                    <td>Stripe posting — 2026-05-15</td>
                    <td>200</td>
                    <td>charge</td>
                    <td className={styles.cellPos}>12,840.00</td>
                    <td>OUTPUT2</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>2026-05-15</td>
                    <td>Stripe posting — 2026-05-15</td>
                    <td>855</td>
                    <td>charge clearing</td>
                    <td className={styles.cellNeg}>-12,840.00</td>
                    <td>NONE</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>2026-05-15</td>
                    <td>Stripe posting — 2026-05-15</td>
                    <td>404</td>
                    <td>fee</td>
                    <td className={styles.cellPos}>372.36</td>
                    <td>NONE</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>2026-05-15</td>
                    <td>Stripe posting — 2026-05-15</td>
                    <td>855</td>
                    <td>fee clearing</td>
                    <td className={styles.cellNeg}>-372.36</td>
                    <td>NONE</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        fontSize: 10,
                        color: 'var(--ink3)',
                        fontStyle: 'italic',
                      }}
                    >
                      … additional date rows below …
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                <strong>Single signed Gross Amount column.</strong> Unlike a
                traditional ledger, the sheet uses a single{' '}
                <code>Gross Amount</code> (column E) — positive for debits to
                the account in column C, negative for credits. Xero splits
                GST automatically when the <code>Tax Type</code> in column F
                is set and the line amount is inclusive.
              </p>
            </div>

            <h3>Xero_Bank_Transaction sheet structure (9 columns, A–I)</h3>
            <p>
              The add-in writes columns A–G. Column H (<code>Xero ID</code>)
              and I (<code>Status</code>) are populated by the Push step.
              <code>Type</code> is always <code>RECEIVE</code>;{' '}
              <code>Contact</code> is the formula{' '}
              <code>=Account_Mappings!$B$11</code>.
            </p>
            <div
              className={`${styles.sheetWrap} ${styles.sheetWrapScroll}`}
            >
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Col A — Date</th>
                    <th>Col B — Type</th>
                    <th>Col C — Contact</th>
                    <th>Col D — Bank Account</th>
                    <th>Col E — Reference</th>
                    <th>Col F — Account Code</th>
                    <th>Col G — Amount</th>
                    <th>Col H — Xero ID</th>
                    <th>Col I — Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2026-05-30</td>
                    <td>RECEIVE</td>
                    <td>Stripe Payments Australia Pty Ltd</td>
                    <td>120</td>
                    <td>po_3Qz1</td>
                    <td>855</td>
                    <td className={styles.cellPos}>12,467.64</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>2026-05-23</td>
                    <td>RECEIVE</td>
                    <td>Stripe Payments Australia Pty Ltd</td>
                    <td>120</td>
                    <td>po_3Qy8</td>
                    <td>855</td>
                    <td className={styles.cellPos}>8,943.40</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ========== 6. PUSH ========== */}
          <section className={styles.stepSection} id="push">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb6}`}>06</div>
              <div>
                <div className={styles.stepTitle}>Push — post to Xero</div>
                <div className={styles.stepSub}>
                  Send journals and bank transactions to your Xero
                  organisation
                </div>
              </div>
            </div>

            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>1</div>
                <div className={styles.stepItemBody}>
                  <strong>Go to the Push tab and choose what to push</strong>
                  <p>
                    Toggle between <strong>📒 Manual journals</strong> and{' '}
                    <strong>🏦 Bank transactions</strong> using the
                    segmented switch at the top of the Push tab. Push each
                    type separately.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>2</div>
                <div className={styles.stepItemBody}>
                  <strong>Confirm the read range</strong>
                  <p>
                    The <strong>Read range</strong> field defaults to{' '}
                    <code>Xero_Journals!A2:J500</code> for journals and{' '}
                    <code>Xero_Bank_Transaction!A2:I500</code> for bank
                    transactions. Adjust if you renamed sheets or moved data.
                    The value is remembered per workspace.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>3</div>
                <div className={styles.stepItemBody}>
                  <strong>Choose Draft or Posted (journals only)</strong>
                  <p>
                    Select <strong>Draft</strong> to post journals as draft
                    entries in Xero — you can review and approve them in
                    Xero before they hit the ledger. Select{' '}
                    <strong>Posted</strong> to post directly. Your workspace
                    settings on the dashboard may restrict this to Draft
                    only. Bank transactions are always posted as
                    AUTHORISED Receive Money.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>4</div>
                <div className={styles.stepItemBody}>
                  <strong>Click Push to Xero</strong>
                  <p>
                    The add-in sends each row to the Xero API. A progress
                    indicator shows while rows are being processed. Do not
                    close Excel during this step.
                  </p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepItemNum}>5</div>
                <div className={styles.stepItemBody}>
                  <strong>Check the status writeback</strong>
                  <p>
                    After a successful push, the{' '}
                    <strong>Xero ID</strong> and <strong>Status</strong>{' '}
                    columns are updated: <code>I</code> (Xero ID) and{' '}
                    <code>J</code> (Status) for journals; <code>H</code>{' '}
                    (Xero ID) and <code>I</code> (Status) for bank
                    transactions. On any subsequent push, rows showing a
                    Xero ID are automatically skipped — preventing duplicate
                    entries.
                  </p>
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutImportant}`}>
              <span className={styles.calloutIcon}>🛑</span>
              <p>
                <strong>Review before you push.</strong> Once a manual
                journal is posted (not draft) in Xero, it creates ledger
                entries that affect your financial reports and BAS. Always
                review journal rows in Excel before posting. If you push
                incorrect entries, you will need to void or delete them
                manually in Xero.
              </p>
            </div>

            {/* Figure 5a — Push tab */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Push tab — Manual journals" />
              <div className={styles.mockupBody}>
                <Image
                  className={styles.mockupImg}
                  src="/support/taskpane-push.png"
                  alt="Silkview Connect task pane — Push tab with Manual journals selected"
                  width={375}
                  height={775}
                />
              </div>
              <div className={styles.mockupCaption}>
                Figure 5a — Push tab with the segmented switch on{' '}
                <em>Manual journals</em>. Bank transactions uses the same
                layout but without the Status dropdown.
              </div>
            </div>

            {/* Figure 5b — Xero_Journals after push */}
            <div className={styles.mockupWrap}>
              <MockupTopbar title="Xero_Journals sheet — after push" />
              <div
                className={styles.mockupBody}
                style={{ overflowX: 'auto' }}
              >
                <table
                  className={styles.sheetTable}
                  style={{ minWidth: 900 }}
                >
                  <thead>
                    <tr>
                      <th>A — Date</th>
                      <th>B — Narration</th>
                      <th>C — Account</th>
                      <th>D — Description</th>
                      <th>E — Gross</th>
                      <th>F — Tax</th>
                      <th>G — Tracking Name</th>
                      <th>H — Tracking Option</th>
                      <th>I — Xero ID</th>
                      <th>J — Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: 'var(--green-l)' }}>
                      <td>2026-05-15</td>
                      <td>STRIPE-05-15</td>
                      <td>200</td>
                      <td>charge</td>
                      <td className={styles.cellPos}>12,840.00</td>
                      <td>OUTPUT2</td>
                      <td></td>
                      <td></td>
                      <td className={styles.cellOk}>mj_3Qz1abc</td>
                      <td className={styles.cellOk}>✓ pushed</td>
                    </tr>
                    <tr style={{ background: 'var(--green-l)' }}>
                      <td>2026-05-15</td>
                      <td>STRIPE-05-15</td>
                      <td>855</td>
                      <td>charge clearing</td>
                      <td className={styles.cellNeg}>-12,840.00</td>
                      <td>NONE</td>
                      <td></td>
                      <td></td>
                      <td className={styles.cellOk}>mj_3Qz1abc</td>
                      <td className={styles.cellOk}>✓ pushed</td>
                    </tr>
                    <tr>
                      <td>2026-05-16</td>
                      <td>STRIPE-05-16</td>
                      <td>200</td>
                      <td>charge</td>
                      <td className={styles.cellPos}>4,200.00</td>
                      <td>OUTPUT2</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ color: 'var(--ink3)' }}>pending</td>
                    </tr>
                    <tr>
                      <td>2026-05-16</td>
                      <td>STRIPE-05-16</td>
                      <td>855</td>
                      <td>charge clearing</td>
                      <td className={styles.cellNeg}>-4,200.00</td>
                      <td>NONE</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ color: 'var(--ink3)' }}>pending</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.mockupCaption}>
                Figure 5b — After push. Green rows have a Xero ID in column
                I and a pushed marker in column J; they are skipped on the
                next push.
              </div>
            </div>
          </section>

          {/* ========== 7. ACCOUNTING ========== */}
          <section className={styles.stepSection} id="accounting">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb7}`}>07</div>
              <div>
                <div className={styles.stepTitle}>Accounting treatment</div>
                <div className={styles.stepSub}>
                  How manual journals and bank transactions work together in
                  Xero
                </div>
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutImportant}`}>
              <span className={styles.calloutIcon}>📋</span>
              <p>
                <strong>Not accounting advice.</strong> The treatment
                described here is a common approach for Xero-based
                businesses using Stripe in Australia (AUD, GST-registered).
                Your specific circumstances may require a different
                approach. Consult your accountant or registered tax agent.
              </p>
            </div>

            <h3>The core problem Silkview Connect solves</h3>
            <p>
              Stripe pays out a <strong>net amount</strong> to your bank —
              after deducting processing fees. But in Xero you need to
              record:
            </p>
            <ul>
              <li>
                <strong>Gross revenue</strong> (including GST) on the date
                each charge occurred
              </li>
              <li>
                <strong>Stripe processing fees</strong> as a separate
                expense
              </li>
              <li>
                <strong>GST on income</strong> split out correctly for your
                BAS
              </li>
              <li>
                <strong>The net payout</strong> matching exactly what
                arrived at your bank
              </li>
            </ul>
            <p>
              Silkview Connect handles this using the{' '}
              <strong>clearing account method</strong> — the industry
              standard approach recommended by Xero-certified accountants.
            </p>

            <h3>The clearing account method — overview</h3>

            <div className={styles.flow}>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbStripe}`}>
                  Stripe charge
                  <br />
                  occurs
                </div>
                <div className={styles.flowSub}>Customer pays</div>
              </div>
              <div className={styles.flowArrow}>→</div>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbClr}`}>
                  Stripe Clearing
                  <br />
                  Account (Xero)
                </div>
                <div className={styles.flowSub}>
                  Current asset
                  <br />
                  balance sheet
                </div>
              </div>
              <div className={styles.flowArrow}>→</div>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbXero}`}>
                  Revenue + GST
                  <br />
                  account (Xero)
                </div>
                <div className={styles.flowSub}>
                  P&amp;L recognised
                  <br />
                  on charge date
                </div>
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--ink3)',
                marginBottom: 16,
              }}
            >
              Then when the payout arrives at your bank:
            </div>
            <div className={styles.flow}>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbStripe}`}>
                  Stripe payout
                  <br />
                  (net amount)
                </div>
                <div className={styles.flowSub}>Arrives at bank</div>
              </div>
              <div className={styles.flowArrow}>→</div>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbAcc}`}>
                  Bank account
                  <br />
                  (Xero)
                </div>
                <div className={styles.flowSub}>DR bank account</div>
              </div>
              <div className={styles.flowArrow}>→</div>
              <div className={styles.flowStep}>
                <div className={`${styles.flowBox} ${styles.fbClr}`}>
                  Stripe Clearing
                  <br />
                  Account clears
                </div>
                <div className={styles.flowSub}>
                  CR clearing → $0
                  <br />
                  balance at period end
                </div>
              </div>
            </div>

            <h3>Step 1 — Revenue journal (per day, from Build)</h3>
            <p>
              For each day in your date range, Silkview Connect builds a
              manual journal in Xero that records gross revenue and Stripe
              fees. The GST is handled automatically by Xero when you set
              the correct <code>Tax Type</code> on the revenue line — you do
              not add a separate GST line.
            </p>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>📑</span>
              <p>
                The illustration below uses traditional debit/credit columns
                for clarity. In <code>Xero_Journals</code> the same entries
                are represented as a single signed{' '}
                <code>Gross Amount</code> column — positive amounts behave
                like debits, negative amounts like credits.
              </p>
            </div>

            <div className={styles.journalEntry}>
              <div className={styles.jeHead}>
                <div
                  className={styles.jeHeadIcon}
                  style={{ background: 'var(--accent-l)' }}
                >
                  📓
                </div>
                <div className={styles.jeHeadTitle}>
                  Manual Journal — 15 May 2026
                </div>
                <div className={styles.jeHeadSub}>
                  Narration: Stripe posting — 2026-05-15
                </div>
              </div>
              <table className={styles.jeTable}>
                <thead>
                  <tr>
                    <th>Account code</th>
                    <th>Account name</th>
                    <th>Description</th>
                    <th>Tax type</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.jeDr}>855</td>
                    <td className={styles.jeDr}>Stripe Clearing Account</td>
                    <td>Gross Stripe charges — 15 May</td>
                    <td>NONE</td>
                    <td className={styles.jeDr}>$12,840.00</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className={styles.jeCr}>200</td>
                    <td className={styles.jeCr}>Sales Revenue</td>
                    <td>Stripe charges — 15 May</td>
                    <td>OUTPUT2 ← GST split by Xero</td>
                    <td></td>
                    <td className={styles.jeCr}>$12,840.00</td>
                  </tr>
                  <tr>
                    <td className={styles.jeDr}>404</td>
                    <td className={styles.jeDr}>Bank Charges</td>
                    <td>Stripe fees — 15 May</td>
                    <td>NONE</td>
                    <td className={styles.jeDr}>$372.36</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className={styles.jeCr}>855</td>
                    <td className={styles.jeCr}>Stripe Clearing Account</td>
                    <td>Stripe fees offset</td>
                    <td>NONE</td>
                    <td></td>
                    <td className={styles.jeCr}>$372.36</td>
                  </tr>
                  <tr className={styles.jeTotal}>
                    <td colSpan={4}>Totals (must balance)</td>
                    <td>$13,212.36</td>
                    <td>$13,212.36</td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.jeNote}>
                💡 Xero automatically posts $1,167.27 (10% of $11,672.73
                net) to the GST on Income account when Tax Type = OUTPUT2
                and LineAmountType = INCLUSIVE. You only specify the gross
                amount — Xero does the split.
              </div>
            </div>

            <div className={`${styles.callout} ${styles.calloutXero}`}>
              <span className={styles.calloutIcon}>ℹ️</span>
              <p>
                <strong>GST treatment:</strong> Stripe charges your
                customers an amount that may or may not include GST,
                depending on your Stripe settings. Silkview Connect uses{' '}
                <code>LineAmountTypes = INCLUSIVE</code> — meaning the
                amount you enter is the gross (GST-inclusive) figure. Xero
                splits out the GST portion automatically. Verify your
                Stripe checkout is configured to collect GST at 10% for
                Australian customers.
              </p>
            </div>

            <h3>
              Step 2 — Refund journal (included in daily journal if refunds
              exist)
            </h3>
            <p>
              Refunds reverse the revenue and adjust the clearing account.
              They appear on the date the refund was created in Stripe, not
              the original charge date.
            </p>

            <div className={styles.journalEntry}>
              <div className={styles.jeHead}>
                <div
                  className={styles.jeHeadIcon}
                  style={{ background: 'var(--red-l)' }}
                >
                  ↩️
                </div>
                <div className={styles.jeHeadTitle}>
                  Refund lines — included in 15 May journal
                </div>
                <div className={styles.jeHeadSub}>Stripe refund re_3Qx…</div>
              </div>
              <table className={styles.jeTable}>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Account name</th>
                    <th>Description</th>
                    <th>Tax type</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.jeDr}>200</td>
                    <td className={styles.jeDr}>Sales Revenue</td>
                    <td>Stripe refund — 15 May</td>
                    <td>OUTPUT2</td>
                    <td className={styles.jeDr}>$75.00</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className={styles.jeCr}>855</td>
                    <td className={styles.jeCr}>Stripe Clearing Account</td>
                    <td>Clearing — refund</td>
                    <td>NONE</td>
                    <td></td>
                    <td className={styles.jeCr}>$75.00</td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.jeNote}>
                💡 Stripe returns the processing fee on refunds. This is
                reflected as a positive fee in the balance transactions and
                is handled by the fee lines in the same journal.
              </div>
            </div>

            <h3>Step 3 — Bank transaction (per payout, from Build)</h3>
            <p>
              When Stripe pays out to your bank, it sends the net amount —
              gross charges minus fees minus refunds accumulated since the
              last payout. Silkview Connect creates a{' '}
              <strong>Receive Money</strong> bank transaction in Xero for
              this payout. This is what reconciles against your bank feed.
            </p>

            <div className={styles.journalEntry}>
              <div className={styles.jeHead}>
                <div
                  className={styles.jeHeadIcon}
                  style={{ background: 'var(--green-l)' }}
                >
                  🏦
                </div>
                <div className={styles.jeHeadTitle}>
                  Bank Transaction (Receive Money) — 30 May 2026
                </div>
                <div className={styles.jeHeadSub}>
                  Payout po_3Qz1… · matches bank feed import
                </div>
              </div>
              <table className={styles.jeTable}>
                <thead>
                  <tr>
                    <th>Bank account</th>
                    <th>Reference</th>
                    <th>Contact</th>
                    <th>Amount</th>
                    <th>Offset account</th>
                    <th>Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.jeDr}>120 — Business Cheque</td>
                    <td>po_3Qz1</td>
                    <td>Stripe Payments Australia Pty Ltd</td>
                    <td className={styles.jeDr}>$12,467.64</td>
                    <td>855 — Stripe Clearing</td>
                    <td>NONE</td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.jeNote}>
                💡 The $12,467.64 is the net payout = $12,840 gross charges
                − $372.36 Stripe fees. This matches exactly what Stripe
                deposits to your bank, so Xero&apos;s bank feed
                reconciliation finds it automatically.
              </div>
            </div>

            <h3>How the Stripe Clearing Account reconciles to zero</h3>
            <p>
              At the end of each month, the Stripe Clearing Account balance
              should equal <strong>zero</strong> (or the balance of
              unpaid-out charges if there are pending payouts). Here&apos;s
              the maths:
            </p>

            <div className={styles.sheetWrap}>
              <table className={styles.sheetTable}>
                <thead>
                  <tr>
                    <th>Movement</th>
                    <th>Entry type</th>
                    <th>Account</th>
                    <th>DR</th>
                    <th>CR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gross charges (revenue journals)</td>
                    <td>Manual journal</td>
                    <td>855 Clearing</td>
                    <td className={styles.cellPos}>$12,840.00</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Stripe fees (revenue journals)</td>
                    <td>Manual journal</td>
                    <td>855 Clearing</td>
                    <td></td>
                    <td className={styles.cellNeg}>$372.36</td>
                  </tr>
                  <tr>
                    <td>Refunds (revenue journals)</td>
                    <td>Manual journal</td>
                    <td>855 Clearing</td>
                    <td></td>
                    <td className={styles.cellNeg}>$75.00</td>
                  </tr>
                  <tr>
                    <td>Net payout to bank</td>
                    <td>Bank transaction</td>
                    <td>855 Clearing</td>
                    <td></td>
                    <td className={styles.cellNeg}>$12,392.64</td>
                  </tr>
                  <tr
                    style={{
                      background: 'var(--green-l)',
                      fontWeight: 600,
                    }}
                  >
                    <td colSpan={3}>
                      <strong>Clearing account balance</strong>
                    </td>
                    <td>$12,840.00</td>
                    <td>
                      $12,840.00 →{' '}
                      <strong style={{ color: 'var(--green)' }}>
                        $0.00
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>✅</span>
              <p>
                <strong>If the clearing account doesn&apos;t zero:</strong>{' '}
                A non-zero balance usually means either (a) a payout is
                pending and will clear next period, or (b) there&apos;s a
                missing or incorrect entry. Check that all payouts in the
                period have corresponding bank transactions, and that
                refund amounts match between Stripe and your journals.
              </p>
            </div>

            <h3>What Xero sees — end state</h3>
            <ul>
              <li>
                <strong>Profit &amp; Loss:</strong> Revenue is recognised on
                charge date (not payout date) — correct for accrual
                accounting. Stripe fees appear as a separate bank charge
                expense line.
              </li>
              <li>
                <strong>GST / BAS:</strong> GST on income is correctly
                recorded on charge date via the OUTPUT2 tax type on your
                revenue journal lines.
              </li>
              <li>
                <strong>Bank reconciliation:</strong> The bank transaction
                (Receive Money) matches the net payout amount that arrives
                from Stripe, so Xero&apos;s bank feed auto-matches it.
              </li>
              <li>
                <strong>Balance sheet:</strong> The Stripe Clearing Account
                (current asset) holds in-transit Stripe funds. It should
                clear to zero at month end.
              </li>
            </ul>
          </section>

          {/* ========== 8. TROUBLESHOOTING ========== */}
          <section className={styles.stepSection} id="troubleshooting">
            <div className={styles.stepHeader}>
              <div className={`${styles.stepBadge} ${styles.sb8}`}>08</div>
              <div>
                <div className={styles.stepTitle}>Troubleshooting</div>
                <div className={styles.stepSub}>
                  Common issues and how to resolve them
                </div>
              </div>
            </div>

            <h3>Connection and refresh issues</h3>
            <ul>
              <li>
                <strong>After making changes in the dashboard</strong>{' '}
                (changing connections, team, or billing), click{' '}
                <strong>Refresh</strong> in the add-in header to reload
                workspace and connection state without restarting Excel.
              </li>
              <li>
                <strong>Xero shows &quot;reconnect required&quot;</strong> —
                Xero OAuth tokens expire every 30 minutes (access token)
                but refresh automatically. If the refresh token expires
                (after 60 days of inactivity), you need to reconnect. Click{' '}
                <strong>Reconnect</strong> in the task pane or dashboard.
              </li>
              <li>
                <strong>Stripe connection dropped</strong> — This can happen
                if you revoked access in Stripe&apos;s dashboard. Reconnect
                from the task pane by clicking the Stripe connection card.
              </li>
            </ul>

            <h3>Pull issues</h3>
            <ul>
              <li>
                <strong>No rows returned</strong> — Check that your date
                range contains actual transactions. Stripe returns
                transactions in UTC — a transaction on &quot;1 May&quot; in
                Sydney may appear on &quot;30 April&quot; UTC. Try extending
                your date range by one day on each end.
              </li>
              <li>
                <strong>Free plan row limit hit</strong> — The Free plan
                returns a maximum of 100 rows per pull. Upgrade to Pro or
                Firm for 2,000 rows. Narrow your date range to stay under
                100 rows on the Free plan.
              </li>
              <li>
                <strong>Currency mismatch</strong> — On Pro/Firm only
                transactions in your Xero organisation&apos;s base currency
                (e.g. AUD) are returned. Multi-currency support in v1 is
                limited.
              </li>
            </ul>

            <h3>Build issues</h3>
            <ul>
              <li>
                <strong>Missing account codes in dropdowns</strong> — Click{' '}
                <strong>Refresh Xero</strong> in Quick setup to reload the
                chart of accounts, tax rates, tracking categories, and
                contacts from Xero. This is required after adding new
                accounts in Xero.
              </li>
              <li>
                <strong>
                  Journals don&apos;t balance / formulas show #N/A
                </strong>{' '}
                — Check that all five Account_Mappings rows (
                <code>charge</code>, <code>refund</code>, <code>fee</code>,{' '}
                <code>stripe_clearing</code>,{' '}
                <code>stripe_payout_bank</code>) have account codes filled
                in, and that the Bank Transfer Contact in row 11 is set.
              </li>
              <li>
                <strong>Unexpected amounts</strong> — Stripe amounts are in
                cents in their API; Silkview Connect divides by 100 for
                display. If you see amounts that look ×100, contact support
                — this is a data conversion issue.
              </li>
            </ul>

            <h3>Push issues</h3>
            <ul>
              <li>
                <strong>&quot;Account not found&quot; error</strong> — The
                account code in your journal rows doesn&apos;t exist in
                your Xero organisation. Check Account_Mappings and ensure
                the codes match exactly (Xero account codes are
                case-sensitive).
              </li>
              <li>
                <strong>&quot;Tax rate not found&quot; error</strong> — The
                Tax Type value in your rows must match Xero&apos;s exact
                tax rate code for your region (e.g. <code>OUTPUT2</code>{' '}
                for GST on income in Australia). Refresh Xero dropdowns
                and re-check Account_Mappings.
              </li>
              <li>
                <strong>Duplicate entries in Xero</strong> — Rows that show
                a Xero ID in column I (journals) or column H (bank
                transactions) are skipped automatically. If you see
                duplicates in Xero, you may have pushed the same rows from
                two different workbooks. Check the Xero ID column before
                pushing. Delete the duplicates manually in Xero.
              </li>
              <li>
                <strong>Push fails partway through</strong> — The Status
                column shows which rows succeeded (Xero ID) and which
                failed (error message). Rows that failed can be pushed
                again — the add-in will skip already-pushed rows
                automatically.
              </li>
              <li>
                <strong>Trial expired / billing blocked</strong> — If your
                trial ended or a payment failed, Xero push is disabled. A
                banner in the task pane links to the dashboard billing
                page. Update your payment details to restore push access
                immediately.
              </li>
            </ul>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>📣</span>
              <p>
                <strong>Found a bug or have feedback?</strong>{' '}
                <a href={betaFeedbackMailtoUrl()}>
                  Send beta feedback (30 seconds) →
                </a>{' '}
                A pre-filled email opens in your mail client — just describe
                what you were doing and what happened.
              </p>
            </div>

            <h3>Getting help</h3>
            <p>For issues not covered here:</p>
            <ul>
              <li>
                Email{' '}
                <a href={supportMailtoUrl()}>{SUPPORT_EMAIL}</a> with your
                account email, workspace name, and a description of the
                issue
              </li>
              <li>
                Sign in at{' '}
                <a href="https://www.silkview.org/auth/login">
                  silkview.org/auth/login
                </a>{' '}
                and use the in-dashboard support chat (Firm plan)
              </li>
              <li>
                Include a screenshot of any error message shown in the task
                pane or status column
              </li>
            </ul>

            <div className={`${styles.callout} ${styles.calloutTip}`}>
              <span className={styles.calloutIcon}>💡</span>
              <p>
                <strong>Response times:</strong> Support emails are
                answered within 1 business day (AEST) for Pro and Firm
                plans, and within 3 business days for Free accounts.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
