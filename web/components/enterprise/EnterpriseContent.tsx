import Link from 'next/link';
import { LegalHighlightBox } from '@/components/legal/LegalPageLayout';
import {
  ENTERPRISE_RELATIONS_EMAIL,
  enterpriseRelationsMailtoUrl,
} from '@/lib/support';

export default function EnterpriseContent() {
  return (
    <>
      <h2 id="overview">Enterprise &amp; Firm Deployment</h2>
      <p>
        Centralized Stripe-to-Xero reconciliation built for accounting practices and
        corporate finance teams.
      </p>
      <p>
        Silkview Connect scales seamlessly across large organizations. Whether you are
        an accounting firm managing dozens of distinct client Stripe feeds or an enterprise
        finance team operating multi-entity corporate structures, our platform provides
        the security, control, and centralized management your workflow demands.
      </p>

      <h2 id="acquire">How to Acquire a Firm or Enterprise Account</h2>
      <p>
        We offer two flexible onboarding paths to get your team up and running with
        Silkview Connect:
      </p>

      <h3 id="self-service">1. Self-Service Firm Workspace</h3>
      <p>
        If you manage a smaller practice or want immediate setup, you can provision a
        Firm Plan directly through your standard account dashboard:
      </p>
      <ol>
        <li>
          <strong>Step 1:</strong> Create your primary account at{' '}
          <Link href="/auth/signup">www.silkview.org/signup</Link>.
        </li>
        <li>
          <strong>Step 2:</strong> Navigate to the Billing tab and select the Firm Plan.
        </li>
        <li>
          <strong>Step 3:</strong> Use your dashboard&apos;s Team Management panel to
          instantly invite up to 5 team members and link up to 5 client Stripe/Xero
          workspaces.
        </li>
      </ol>

      <h3 id="enterprise-provisioning">2. High-Volume &amp; Custom Enterprise Provisioning</h3>
      <p>
        For corporate finance teams, international subsidiaries, or large accounting
        practices requiring custom volume thresholds, bespoke pricing, or offline corporate
        procurement protocols:
      </p>
      <ul>
        <li>
          <strong>Contact Us Directly:</strong> Email our deployment desk at{' '}
          <a href={enterpriseRelationsMailtoUrl()}>{ENTERPRISE_RELATIONS_EMAIL}</a>.
        </li>
        <li>
          <strong>Procurement &amp; Invoicing:</strong> We support standard corporate
          purchase orders (POs) and annual consolidated invoicing via bank
          transfer/ACH, removing the need for individual corporate credit cards.
        </li>
        <li>
          <strong>Account Activation:</strong> Upon agreement execution, our engineering
          team manually provisions and flags your corporate email domains (e.g.,
          @yourfirm.com) as pre-authorized in our database, granting instant access to
          your designated staff.
        </li>
      </ul>

      <h2 id="m365">Microsoft 365 Centralized Deployment</h2>
      <p>
        Silkview Connect is fully optimized for enterprise-wide delivery. Corporate IT
        Administrators can deploy our Excel add-in across an entire global workforce in
        minutes, ensuring staff do not need to manually install local plug-ins.
      </p>
      <LegalHighlightBox>
        <p>
          <strong>IT Administrator Setup Instructions:</strong>
        </p>
        <ol className="mb-0 mt-2 pl-5">
          <li>
            Log into your Microsoft 365 Admin Center (admin.microsoft.com) using global
            administrator credentials.
          </li>
          <li>Navigate to Settings &gt; Integrated Apps.</li>
          <li>Click Get Apps and search the marketplace catalog for Silkview Connect.</li>
          <li>Click Deploy Now.</li>
          <li>
            Select whether to deploy the add-in to your Entire Organization, specific
            Groups (e.g., the Accounting Department), or individual users.
          </li>
          <li>Accept the standard web app permissions and click Save.</li>
        </ol>
      </LegalHighlightBox>
      <p>
        The Silkview Connect sidebar icon will automatically propagate directly into the
        Microsoft Excel ribbon (Desktop, Mac, and Web browser versions) for all authorized
        employees within a few minutes.
      </p>

      <h2 id="features">Enterprise-Grade Features</h2>
      <ul>
        <li>
          <strong>Multi-Tenant Workspaces:</strong> Maintain absolute data segregation.
          Keep separate client datasets or regional corporate entities in isolated silos
          managed from a single administrative overhead view.
        </li>
        <li>
          <strong>Role-Based Access Control (RBAC):</strong> Assign team invites as Admins
          or Contributors to regulate who can modify account mappings or initiate pushes
          to your live Xero ledgers.
        </li>
        <li>
          <strong>Secure OAuth 2.0 Credentialing:</strong> Your live connection tokens
          to Xero and Stripe remain fully encrypted using bank-grade AES-256 protocols at
          rest. We do not store financial transactions on our servers; data lives in your
          local Excel workbooks.
        </li>
      </ul>

      <h2 id="contact">Contact</h2>
      <p>
        For custom volume evaluations, Data Processing Agreements (DPAs), or dedicated
        onboarding support, please contact our enterprise relations team at{' '}
        <a href={enterpriseRelationsMailtoUrl()}>{ENTERPRISE_RELATIONS_EMAIL}</a>.
      </p>
    </>
  );
}
