import Link from 'next/link';
import LegalEmailLink from '@/components/legal/LegalEmailLink';
import {
  LegalImportantBox,
  LegalTable,
  LegalWarnBox,
} from '@/components/legal/LegalPageLayout';
import { PRIVACY_PATH } from '@/lib/support';

export default function TermsContent() {
  return (
    <>
      <LegalWarnBox>
        <p>
          <strong>Please read these terms carefully before using Silkview Connect.</strong>{' '}
          By creating an account or using the service, you agree to be bound by these
          Terms of Service. If you do not agree, do not use our service.
        </p>
      </LegalWarnBox>

      <h2 id="acceptance">1. Acceptance of terms</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement
        between you (or the entity you represent, &quot;you&quot; or &quot;Customer&quot;)
        and <strong>Silkview Systems</strong> (ABN: 47 369 039 956) (&quot;Silkview
        Connect&quot;, &quot;we&quot;, &quot;us&quot;) governing your access to and use of
        the Silkview Connect service, including the Microsoft Excel add-in, web dashboard,
        and API (collectively the &quot;Service&quot;).
      </p>
      <p>
        If you are agreeing to these Terms on behalf of a company or other legal entity,
        you represent that you have authority to bind that entity. If you do not have such
        authority, you must not accept these Terms or use the Service.
      </p>
      <p>These Terms are governed by the laws of New South Wales, Australia.</p>

      <h2 id="service">2. The service</h2>
      <p>Silkview Connect provides software that enables users to:</p>
      <ul>
        <li>
          Connect to Stripe accounts via OAuth to retrieve balance transactions, payouts,
          charges, and related financial data into Microsoft Excel
        </li>
        <li>
          Connect to Xero organisations via OAuth to push manual journal entries and bank
          transactions
        </li>
        <li>
          Manage multiple workspaces, each linking one Xero organisation to one or more
          Stripe accounts
        </li>
        <li>Invite team members to collaborate within a shared account</li>
      </ul>
      <p>
        We reserve the right to modify, suspend, or discontinue any part of the Service at
        any time with reasonable notice. We will not be liable to you for any such
        modification, suspension, or discontinuation, provided we give at least 30
        days&apos; notice for material changes that affect paid plans.
      </p>

      <h2 id="accounts">3. Accounts and workspaces</h2>
      <h3>Registration</h3>
      <p>
        You must register for an account to use the Service. You agree to provide accurate,
        current, and complete information and to keep your account information updated. You
        are responsible for maintaining the confidentiality of your login credentials.
      </p>
      <h3>Account security</h3>
      <p>
        You are responsible for all activity that occurs under your account. You must notify
        us immediately at <LegalEmailLink /> if you suspect any unauthorised use of your
        account. We recommend enabling multi-factor authentication (MFA), which is
        available in account settings.
      </p>
      <h3>Account ownership</h3>
      <p>
        One user is designated as the account Owner. The Owner is responsible for managing
        users, workspaces, and billing. The Owner may invite additional users up to the limit
        of their plan. Users may be assigned roles of Owner, Admin, or Member as defined in
        the service.
      </p>
      <h3>Plan limits</h3>
      <p>
        Each account is subject to the limits of its plan. Exceeding plan limits (e.g.
        creating more workspaces than permitted) will be blocked by the Service. You must
        upgrade your plan to increase limits.
      </p>

      <h2 id="plans">4. Plans, pricing, and billing</h2>
      <h3>Plans</h3>
      <LegalTable>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Price</th>
            <th>Users</th>
            <th>Workspaces</th>
            <th>Transactions per pull</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Free</strong>
            </td>
            <td>$0/month</td>
            <td>1</td>
            <td>1</td>
            <td>100</td>
          </tr>
          <tr>
            <td>
              <strong>Pro</strong>
            </td>
            <td>$29/month AUD</td>
            <td>1</td>
            <td>1</td>
            <td>2,000</td>
          </tr>
          <tr>
            <td>
              <strong>Firm</strong>
            </td>
            <td>$79/month AUD</td>
            <td>5</td>
            <td>5</td>
            <td>2,000 per workspace</td>
          </tr>
        </tbody>
      </LegalTable>
      <p>
        All prices are in Australian Dollars (AUD) and exclude GST where applicable. GST
        (10%) will be added for Australian-registered entities where required by law.
      </p>

      <h3>Free tier</h3>
      <p>
        The Free plan is provided without charge and without a time limit, subject to the
        usage limits above. We reserve the right to modify or discontinue the Free plan with
        30 days&apos; notice.
      </p>

      <h3>Paid plans — trial</h3>
      <p>
        Pro and Firm plans include a 30-day free trial. No credit card is required during
        the trial period. At the end of the trial, you will be asked to provide payment
        details to continue. If you do not provide payment details, your account will
        automatically revert to the Free plan.
      </p>

      <h3>Billing</h3>
      <p>
        Paid plans are billed monthly in advance. Billing is processed by Stripe. By
        providing payment details, you authorise us to charge your payment method on a
        recurring monthly basis until you cancel. Invoices are sent to your registered email
        address.
      </p>

      <h3>Failed payments</h3>
      <p>
        If a payment fails, we will attempt to charge again after 3 and 7 days. If payment
        remains unsuccessful after these attempts, your account will be suspended.
        Suspended accounts retain data for 30 days before permanent deletion.
      </p>

      <h3>Upgrades and downgrades</h3>
      <p>
        You may upgrade your plan at any time — the change takes effect immediately and you
        will be charged a prorated amount for the remainder of the billing period.
        Downgrades take effect at the end of the current billing period. If a downgrade
        would result in you exceeding plan limits (e.g. you have 3 workspaces and downgrade
        to Pro which allows 1), you must reduce your workspaces to the new limit before the
        downgrade takes effect.
      </p>

      <h3>Refunds</h3>
      <p>
        We do not offer refunds for partial months or unused portions of a billing period,
        except where required by Australian Consumer Law. If you believe you are entitled to
        a refund, contact <LegalEmailLink /> within 14 days of the charge.
      </p>

      <h3>Price changes</h3>
      <p>
        We may change our pricing with at least 30 days&apos; notice. Price changes will
        take effect at the start of your next billing period after the notice period.
        Continued use of a paid plan after the price change constitutes acceptance of the new
        price.
      </p>

      <h2 id="acceptable-use">5. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>
          Violate any applicable law or regulation, including the Australian Privacy Act
          1988, the Anti-Money Laundering and Counter-Terrorism Financing Act 2006, or any
          tax law
        </li>
        <li>
          Access Stripe or Xero accounts for which you do not have authorisation from the
          account holder
        </li>
        <li>Attempt to circumvent plan limits or access controls</li>
        <li>
          Reverse-engineer, decompile, or otherwise attempt to extract the source code of
          the Service
        </li>
        <li>
          Use automated scripts or bots to access the Service in ways that would unreasonably
          burden our infrastructure
        </li>
        <li>
          Resell, sublicense, or white-label the Service without our written permission
        </li>
        <li>
          Use the Service to facilitate any fraudulent, deceptive, or illegal financial
          activity
        </li>
        <li>
          Upload or transmit malicious code, viruses, or any content that would disrupt or
          damage the Service
        </li>
      </ul>
      <p>
        Breach of these acceptable use provisions may result in immediate suspension or
        termination of your account without refund.
      </p>

      <h2 id="third-party">6. Third-party connections</h2>
      <h3>Stripe and Xero</h3>
      <p>
        The Service facilitates connections to Stripe and Xero via their respective OAuth
        APIs. Your use of these connections is also subject to:
      </p>
      <ul>
        <li>
          <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">
            Stripe Services Agreement
          </a>
        </li>
        <li>
          <a
            href="https://www.xero.com/legal/terms/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Xero Terms of Use
          </a>
        </li>
      </ul>
      <p>
        We are not a party to your agreements with Stripe or Xero and are not responsible
        for their services, availability, or any changes they make to their APIs that affect
        the functionality of Silkview Connect.
      </p>
      <h3>Microsoft Excel</h3>
      <p>
        The Excel add-in component of the Service operates within Microsoft Excel and is
        subject to Microsoft&apos;s terms of service. We are not affiliated with Microsoft
        Corporation.
      </p>
      <h3>API changes</h3>
      <p>
        If Stripe, Xero, or Microsoft make changes to their APIs or platforms that affect our
        Service, we will use reasonable efforts to update the Service promptly. We are not
        liable for any loss caused by third-party API changes or downtime.
      </p>

      <h2 id="financial-data">7. Financial data and accuracy</h2>
      <LegalImportantBox>
        <p>
          <strong>Critical:</strong> Silkview Connect is a productivity tool. It does not
          provide accounting, tax, financial, or legal advice. You are solely responsible
          for reviewing all data before pushing it to Xero and for the accuracy of your
          accounting records.
        </p>
      </LegalImportantBox>
      <p>You acknowledge and agree that:</p>
      <ul>
        <li>
          <strong>Review before push:</strong> You must review all journal entries, bank
          transactions, and other data generated by the Service before pushing them to Xero.
          The Service&apos;s &quot;build&quot; step generates suggested entries based on
          your account mappings — these are not guaranteed to be correct for your specific
          accounting situation.
        </li>
        <li>
          <strong>Account mappings are your responsibility:</strong> The account codes, tax
          types, and other mappings you configure in your Excel workbook are your
          responsibility. Incorrect mappings will produce incorrect journal entries.
        </li>
        <li>
          <strong>No accounting advice:</strong> Nothing in the Service or its documentation
          constitutes accounting, tax, financial, or legal advice. You should seek advice
          from a qualified accountant or registered tax agent for your specific
          circumstances.
        </li>
        <li>
          <strong>GST and tax compliance:</strong> You are responsible for ensuring that
          your use of the Service results in accurate GST and tax reporting. Silkview Connect
          is not liable for any tax penalties, interest, or assessments arising from incorrect
          accounting entries.
        </li>
        <li>
          <strong>Reconciliation:</strong> The Service facilitates the transfer of data
          between systems but does not guarantee reconciliation of your accounts. You remain
          responsible for reconciling your Xero accounts against your bank statements and
          Stripe payouts.
        </li>
        <li>
          <strong>Data accuracy:</strong> The data we retrieve from Stripe and Xero is
          accurate at the time of retrieval but may not reflect subsequent changes. We
          recommend pulling fresh data before month-end processing.
        </li>
      </ul>

      <h2 id="ip">8. Intellectual property</h2>
      <h3>Our property</h3>
      <p>
        The Service, including all software, design, documentation, trademarks, and content,
        is owned by us or our licensors and is protected by Australian and international
        intellectual property laws. Nothing in these Terms transfers any intellectual
        property rights to you.
      </p>
      <h3>Your data</h3>
      <p>
        You retain all rights to your data. By using the Service, you grant us a limited,
        non-exclusive licence to access your data solely as necessary to provide the Service
        to you. We do not claim ownership of your financial data, Excel workbooks, or any
        content you create.
      </p>
      <h3>Feedback</h3>
      <p>
        If you provide us with feedback, suggestions, or ideas about the Service, you grant
        us a perpetual, irrevocable, royalty-free licence to use that feedback without any
        obligation to you.
      </p>

      <h2 id="confidentiality">9. Confidentiality</h2>
      <p>
        Each party agrees to keep the other&apos;s confidential information confidential and
        not to disclose it to third parties, except as required by law or with the other
        party&apos;s written consent. &quot;Confidential information&quot; means any
        information designated as confidential or that should reasonably be understood to be
        confidential given the nature of the information and circumstances of disclosure.
      </p>
      <p>
        Your financial data and client data accessed through the Service is treated as
        confidential information. Our pricing (beyond what is publicly listed), technical
        architecture, and non-public product roadmap are our confidential information.
      </p>

      <h2 id="warranties">10. Warranties and disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the
        maximum extent permitted by Australian law, we disclaim all warranties, whether
        express, implied, or statutory, including warranties of:
      </p>
      <ul>
        <li>Merchantability or fitness for a particular purpose</li>
        <li>Uninterrupted or error-free operation</li>
        <li>Accuracy or completeness of data retrieved from Stripe or Xero</li>
        <li>Compatibility with all versions of Microsoft Excel</li>
      </ul>
      <p>
        Nothing in these Terms excludes, restricts, or modifies any right or remedy, or any
        guarantee, warranty, or other term or condition implied or imposed by the Australian
        Consumer Law that cannot lawfully be excluded or limited. If the Australian Consumer
        Law applies and our services come with a consumer guarantee, our liability is limited
        to re-supplying the services, or the cost of having the services re-supplied.
      </p>

      <h2 id="liability">11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability to you for all claims
        arising out of or relating to these Terms or the Service (whether in contract, tort,
        negligence, or otherwise) is limited to the greater of:
      </p>
      <ul>
        <li>
          The total fees you paid us in the <strong>3 months immediately preceding</strong>{' '}
          the event giving rise to the claim; or
        </li>
        <li>
          <strong>AUD $100</strong>
        </li>
      </ul>
      <p>We are not liable for any:</p>
      <ul>
        <li>Loss of profits, revenue, or business</li>
        <li>Loss of data or corruption of data</li>
        <li>Indirect, incidental, consequential, special, or punitive damages</li>
        <li>Tax penalties, interest, or assessments arising from incorrect accounting entries</li>
        <li>
          Loss arising from third-party API downtime, changes, or errors (Stripe, Xero,
          Microsoft)
        </li>
        <li>Loss arising from your failure to review data before pushing to Xero</li>
      </ul>
      <p>These limitations apply even if we have been advised of the possibility of such damages.</p>

      <h2 id="indemnity">12. Indemnity</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Silkview Connect and its officers,
        directors, employees, and agents from and against any claims, liabilities, damages,
        losses, and expenses (including reasonable legal fees) arising out of or relating
        to:
      </p>
      <ul>
        <li>Your use of the Service in violation of these Terms</li>
        <li>Your violation of any applicable law or regulation</li>
        <li>Any accounting errors resulting from incorrect data or mappings you configured</li>
        <li>
          Any claim by a third party (including your clients) arising from your use of the
          Service
        </li>
        <li>
          Your unauthorised access to Stripe or Xero accounts you do not have permission to
          access
        </li>
      </ul>

      <h2 id="termination">13. Termination</h2>
      <h3>By you</h3>
      <p>
        You may cancel your subscription at any time from the billing section of the
        dashboard. Cancellation takes effect at the end of your current billing period. You
        may delete your account at any time from account settings. Account deletion is
        immediate and irreversible — all data will be permanently deleted within 30 days.
      </p>
      <h3>By us</h3>
      <p>We may suspend or terminate your account immediately without notice if:</p>
      <ul>
        <li>You breach these Terms, particularly the Acceptable Use provisions</li>
        <li>We are required to do so by law</li>
        <li>
          We reasonably believe your account is being used for fraudulent or illegal activity
        </li>
      </ul>
      <p>
        We may terminate your account with 30 days&apos; notice for any other reason,
        including discontinuation of the Service. In such cases, you will receive a prorated
        refund for any unused portion of a paid billing period.
      </p>
      <h3>Effect of termination</h3>
      <p>
        Upon termination: your right to access the Service ceases; OAuth tokens stored by us
        are permanently deleted; your Excel workbooks and the data within them are unaffected
        (they remain on your device or Microsoft&apos;s infrastructure).
      </p>

      <h2 id="disputes">14. Disputes and governing law</h2>
      <h3>Governing law</h3>
      <p>
        These Terms are governed by the laws of New South Wales, Australia. You submit to
        the exclusive jurisdiction of the courts of New South Wales for any disputes arising
        under these Terms.
      </p>
      <h3>Dispute resolution</h3>
      <p>
        Before commencing any legal proceedings, you agree to first contact us at{' '}
        <LegalEmailLink /> and give us 30 days to attempt to resolve the dispute in good
        faith.
      </p>
      <h3>Australian Consumer Law</h3>
      <p>
        If you are an Australian consumer, you may have rights under the Australian Consumer
        Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) that cannot be
        excluded by these Terms. Nothing in these Terms is intended to exclude those rights.
      </p>

      <h2 id="general">15. General provisions</h2>
      <h3>Entire agreement</h3>
      <p>
        These Terms, together with our{' '}
        <Link href={PRIVACY_PATH}>Privacy Policy</Link>, constitute the entire agreement
        between you and us regarding the Service and supersede all prior agreements and
        understandings.
      </p>
      <h3>Amendments</h3>
      <p>
        We may amend these Terms at any time. We will notify you of material changes by email
        at least 14 days before they take effect. Your continued use of the Service after the
        effective date constitutes acceptance. If you do not agree to the amended Terms, you
        must stop using the Service and cancel your subscription.
      </p>
      <h3>Severability</h3>
      <p>
        If any provision of these Terms is found to be unenforceable, that provision will be
        modified to the minimum extent necessary to make it enforceable, and the remaining
        provisions will continue in full force.
      </p>
      <h3>Waiver</h3>
      <p>
        Our failure to enforce any provision of these Terms on one occasion does not waive
        our right to enforce it on any other occasion.
      </p>
      <h3>Assignment</h3>
      <p>
        You may not assign your rights or obligations under these Terms without our prior
        written consent. We may assign these Terms to a successor entity in connection with
        a merger, acquisition, or sale of substantially all of our assets, with notice to
        you.
      </p>
      <h3>Force majeure</h3>
      <p>
        We are not liable for any failure or delay in performance caused by events beyond our
        reasonable control, including natural disasters, power failures, internet outages, or
        third-party service failures (including Stripe and Xero outages).
      </p>
      <h3>No partnership</h3>
      <p>
        Nothing in these Terms creates a partnership, joint venture, agency, or employment
        relationship between you and us.
      </p>

      <h2 id="contact">16. Contact us</h2>
      <p>For any questions about these Terms:</p>
      <ul>
        <li>
          <strong>General:</strong> <LegalEmailLink />
        </li>
        <li>
          <strong>Billing:</strong> <LegalEmailLink />
        </li>
        <li>
          <strong>Legal:</strong> <LegalEmailLink />
        </li>
        <li>
       
        </li>
      </ul>
    </>
  );
}
