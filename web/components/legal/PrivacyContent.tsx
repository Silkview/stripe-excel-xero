import LegalEmailLink from '@/components/legal/LegalEmailLink';
import {
  LegalHighlightBox,
  LegalTable,
} from '@/components/legal/LegalPageLayout';

export default function PrivacyContent() {
  return (
    <>
      <LegalHighlightBox>
        <p>
          <strong>Plain-English summary:</strong> Silkview Connect does not store your Stripe
          or Xero financial data. We only store your account credentials, encrypted OAuth
          tokens to connect to Stripe and Xero on your behalf, and billing information. All
          financial data stays in Excel on your device or in Xero and Stripe&apos;s own
          systems.
        </p>
      </LegalHighlightBox>

      <h2 id="overview">1. Overview</h2>
      <p>
        Silkview Connect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) provides an Excel
        add-in that enables accountants and bookkeepers to pull financial data from Stripe
        and push accounting entries to Xero. This Privacy Policy explains how we collect,
        use, store, and protect your personal information when you use our service.
      </p>
      <p>
        By using Silkview Connect, you agree to the collection and use of information as
        described in this policy. If you do not agree, please do not use our service.
      </p>

      <h2 id="who-we-are">2. Who we are</h2>
      <p>
        Silkview Connect is operated by <strong>Silkview Systems</strong>, registered in
        Australia (ABN: 47 369 039 956). 
      </p>
      <p>
        For privacy enquiries, contact our Privacy Officer at <LegalEmailLink />.
      </p>
      <p>
        We are subject to the <strong>Australian Privacy Act 1988 (Cth)</strong> and the
        Australian Privacy Principles (APPs). For users located in the European Economic
        Area, we also comply with the General Data Protection Regulation (GDPR) where
        applicable.
      </p>

      <h2 id="data-we-collect">3. Data we collect</h2>
      <p>We collect the minimum data necessary to operate the service:</p>
      <LegalTable variant="data">
        <thead>
          <tr>
            <th>Data type</th>
            <th>What we store</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Account information</strong>
            </td>
            <td>Name, email address, account name, role (owner/member)</td>
            <td>To create and manage your Silkview Connect account and provide access</td>
          </tr>
          <tr>
            <td>
              <strong>Authentication</strong>
            </td>
            <td>
              Hashed password (via Supabase Auth). We never store your password in plain
              text.
            </td>
            <td>To authenticate you when you sign in</td>
          </tr>
          <tr>
            <td>
              <strong>Workspace data</strong>
            </td>
            <td>Workspace names, creation dates, which users are members</td>
            <td>To organise your connections per client or entity</td>
          </tr>
          <tr>
            <td>
              <strong>Xero OAuth tokens</strong>
            </td>
            <td>
              Encrypted access token, encrypted refresh token, token expiry, Xero tenant ID
              and tenant name
            </td>
            <td>
              To connect to Xero on your behalf to pull account codes and push journal
              entries
            </td>
          </tr>
          <tr>
            <td>
              <strong>Stripe OAuth tokens</strong>
            </td>
            <td>
              Encrypted access token, Stripe account ID, display name, live/test mode flag
            </td>
            <td>
              To connect to Stripe on your behalf to pull balance transactions and payout
              data
            </td>
          </tr>
          <tr>
            <td>
              <strong>Billing information</strong>
            </td>
            <td>
              Stripe Customer ID, subscription ID, plan name, subscription status, renewal
              date. Card details are held exclusively by Stripe — we never see or store them.
            </td>
            <td>To manage your subscription and send billing notifications</td>
          </tr>
          <tr>
            <td>
              <strong>Usage data</strong>
            </td>
            <td>
              API request logs (timestamp, endpoint, HTTP status code, anonymised user ID).
              No financial data is logged.
            </td>
            <td>For debugging, security monitoring, and service reliability</td>
          </tr>
          <tr>
            <td>
              <strong>Session data</strong>
            </td>
            <td>Session tokens stored in encrypted cookies</td>
            <td>To keep you signed in across the web dashboard and Excel add-in</td>
          </tr>
        </tbody>
      </LegalTable>

      <h2 id="data-we-dont-collect">4. What we do not store</h2>
      <p>This is important to understand:</p>
      <ul>
        <li>
          <strong>We do not store Stripe transaction data.</strong> Balance transactions,
          charges, payouts, refunds, and disputes are fetched from Stripe and written
          directly to your Excel workbook. They are not saved to our servers.
        </li>
        <li>
          <strong>We do not store Xero accounting data.</strong> Account codes, journal
          entries, and bank transactions that you push to Xero are sent directly from your
          Excel workbook to the Xero API. We do not retain copies.
        </li>
        <li>
          <strong>We do not store your Excel files or workbook content.</strong> Your
          spreadsheets remain on your device or in Microsoft&apos;s infrastructure.
        </li>
        <li>
          <strong>We do not store your Xero account mappings.</strong> Account code mappings
          and column configurations are stored in your Excel workbook only.
        </li>
        <li>
          <strong>We do not sell your data</strong> to any third party, ever.
        </li>
      </ul>

      <h2 id="how-we-use">5. How we use your data</h2>
      <p>We use the data we collect solely to:</p>
      <ul>
        <li>Provide and operate the Silkview Connect service</li>
        <li>
          Authenticate your identity and enforce plan limits (user and workspace counts)
        </li>
        <li>
          Connect to Stripe and Xero APIs on your behalf using your stored OAuth tokens
        </li>
        <li>Process subscription payments via Stripe Billing</li>
        <li>
          Send transactional emails (account invitations, billing receipts, security alerts)
        </li>
        <li>Monitor service health and investigate security incidents</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>
        We do not use your data for advertising, profiling, or any purpose beyond operating
        the service described above.
      </p>

      <h2 id="token-security">6. OAuth token security</h2>
      <p>
        Your Xero and Stripe OAuth tokens give us access to your financial systems. We treat
        them with the highest level of protection:
      </p>
      <ul>
        <li>
          <strong>Encryption at rest:</strong> All tokens are encrypted using AES-256-GCM
          before being written to our database. The encryption key is stored separately in our
          server environment and never in the database itself.
        </li>
        <li>
          <strong>Encryption in transit:</strong> All data transmitted between the Excel
          add-in, our servers, and third-party APIs uses TLS 1.2 or higher.
        </li>
        <li>
          <strong>Minimum scope:</strong> Stripe OAuth tokens are requested with{' '}
          <code>read_only</code> scope — we cannot move money or modify your Stripe account.
          Xero tokens are scoped to <code>accounting.transactions</code>,{' '}
          <code>accounting.settings</code>, and <code>offline_access</code> only.
        </li>
        <li>
          <strong>Access control:</strong> Tokens are only decrypted server-side at the
          moment of an API call. They are never exposed to the browser or Excel add-in
          frontend.
        </li>
        <li>
          <strong>Token refresh:</strong> Xero tokens are refreshed automatically before
          expiry. You are notified in the dashboard if a reconnection is required.
        </li>
        <li>
          <strong>Revocation:</strong> You can disconnect Xero or Stripe connections at any
          time from your workspace dashboard. This immediately deletes the stored tokens from
          our database.
        </li>
      </ul>

      <h2 id="third-parties">7. Third-party services</h2>
      <p>We use the following sub-processors to operate our service:</p>
      <LegalTable variant="data">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Data shared</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Supabase</strong>
            </td>
            <td>Database and authentication</td>
            <td>Account data, encrypted tokens, workspace data</td>
            <td>Australia (AWS ap-southeast-2)</td>
          </tr>
          <tr>
            <td>
              <strong>Vercel</strong>
            </td>
            <td>API hosting and add-in hosting</td>
            <td>Request logs (no financial data)</td>
            <td>Sydney, AU region</td>
          </tr>
          <tr>
            <td>
              <strong>Stripe</strong>
            </td>
            <td>Subscription billing and payment processing</td>
            <td>Name, email, billing address for invoicing</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>
              <strong>Xero</strong>
            </td>
            <td>Accounting data access (via OAuth)</td>
            <td>OAuth tokens only — your Xero data is never forwarded to us</td>
            <td>New Zealand / Australia</td>
          </tr>
          <tr>
            <td>
              <strong>Microsoft (AppSource)</strong>
            </td>
            <td>Excel add-in distribution</td>
            <td>Add-in installation data per Microsoft&apos;s privacy policy</td>
            <td>Per Microsoft&apos;s policy</td>
          </tr>
        </tbody>
      </LegalTable>
      <p>
        We do not share your personal information with any other third parties except as
        required by law.
      </p>

      <h2 id="data-retention">8. Data retention</h2>
      <ul>
        <li>
          <strong>Active accounts:</strong> We retain your account data for as long as your
          account is active.
        </li>
        <li>
          <strong>Deleted workspaces:</strong> When you delete a workspace, all associated
          OAuth tokens are permanently deleted immediately.
        </li>
        <li>
          <strong>Cancelled subscriptions:</strong> Account data is retained for 90 days
          after cancellation to allow reactivation, then permanently deleted.
        </li>
        <li>
          <strong>Deleted accounts:</strong> When you delete your account, all personal data
          (account details, encrypted tokens, workspace data) is permanently and irreversibly
          deleted within 30 days.
        </li>
        <li>
          <strong>Billing records:</strong> We are required to retain billing records for 7
          years to comply with Australian tax law (Tax Administration Act 1953).
        </li>
        <li>
          <strong>Server logs:</strong> Anonymised API request logs are retained for 90 days
          for security monitoring, then deleted.
        </li>
      </ul>

      <h2 id="your-rights">9. Your rights</h2>
      <h3>Australian users (Privacy Act 1988)</h3>
      <p>Under the Australian Privacy Principles, you have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>
          Request deletion of your personal information (subject to legal retention
          requirements)
        </li>
        <li>
          Complain to the Office of the Australian Information Commissioner (OAIC) at{' '}
          <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
            oaic.gov.au
          </a>{' '}
          if you believe we have breached your privacy
        </li>
      </ul>
      <h3>EEA/UK users (GDPR)</h3>
      <p>
        If you are located in the European Economic Area or United Kingdom, you additionally
        have the right to:
      </p>
      <ul>
        <li>Portability of your personal data in a machine-readable format</li>
        <li>Object to processing and request restriction of processing</li>
        <li>Lodge a complaint with your local data protection authority</li>
      </ul>
      <p>
        To exercise any of these rights, email <LegalEmailLink />. We will respond within 30
        days.
      </p>

      <h2 id="children">10. Children&apos;s privacy</h2>
      <p>
        Silkview Connect is a professional accounting tool intended for use by adults. We do
        not knowingly collect personal information from anyone under 18 years of age. If you
        believe a minor has provided us with personal information, please contact us
        immediately.
      </p>

      <h2 id="changes">11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by email to your registered address and by posting a prominent notice in the
        dashboard. Continued use of the service after the effective date of any changes
        constitutes acceptance of the updated policy.
      </p>
      <p>Previous versions of this policy are available on request.</p>

      <h2 id="contact">12. Contact us</h2>
      <p>For any privacy questions, data access requests, or to report a concern:</p>
      <ul>
        <li>
          <strong>Email:</strong> <LegalEmailLink />
        </li>
        <li>
          <strong>Response time:</strong> We aim to respond to all privacy enquiries within
          5 business days.
        </li>
      </ul>
      <p>
        If you are not satisfied with our response, you may contact the Office of the
        Australian Information Commissioner at{' '}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
          oaic.gov.au
        </a>{' '}
        or call 1300 363 992.
      </p>
    </>
  );
}
