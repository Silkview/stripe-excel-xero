'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { PRODUCT_NAME } from '@stripesync/shared/brand';
import {
  ENTERPRISE_PATH,
  EXCEL_ADDIN_STORE_URL,
} from '@/lib/support';

function GuideStep({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-ink sm:text-[17px]">{title}</h3>
      <div className="mt-3 space-y-3 text-sm text-text-2 sm:text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function ExcelAccessGuide() {
  return (
    <section
      className="mt-10 rounded-xl border-2 border-accent/30 bg-accent/5 px-6 py-6"
      aria-labelledby="excel-access-heading"
    >
      <h2
        id="excel-access-heading"
        className="text-lg font-semibold text-ink sm:text-xl"
      >
        Get started with the Excel add-in
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-text-2 sm:text-base leading-relaxed">
        Welcome to {PRODUCT_NAME}. Connect your platforms from this dashboard,
        install the add-in from the Microsoft Office Add-ins store, then sign in
        from Excel to pull data.
      </p>

      <GuideStep title="Step 1: Connect your accounts">
        <p>
          Before opening Excel, link your platforms from this dashboard.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-ink">
          <li>
            Click <strong>Connect Stripe</strong> and sign in to authorize
            secure read access to your Stripe data.
          </li>
          <li>
            Click <strong>Connect Xero</strong> and select the organisation you
            want to link. Pro and Firm plans only — Free plan users can skip
            Xero and still pull Stripe data from Excel.
          </li>
        </ol>
      </GuideStep>

      <GuideStep title="Step 2: Install from the Office Add-ins store">
        <p>
          Install {PRODUCT_NAME} from the Microsoft marketplace. This works on
          Excel for Mac, Windows, and the web.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-ink">
          <li>
            Open Microsoft Excel and create or open a workbook.
          </li>
          <li>
            On the ribbon, go to the <strong>Insert</strong> tab and click{' '}
            <strong>Get Add-ins</strong> (on Excel for the web, click{' '}
            <strong>Add-ins</strong>, then <strong>More Add-ins</strong>).
          </li>
          <li>
            Search for <strong>Silkview Connect</strong> in the Office Add-ins
            store.
          </li>
          <li>
            Click <strong>Add</strong> or <strong>Install</strong> and accept the
            permissions prompt.
          </li>
          <li>
            The {PRODUCT_NAME} button appears on the <strong>Home</strong>{' '}
            ribbon once installation completes.
          </li>
        </ol>
        <p>
          <a
            href={EXCEL_ADDIN_STORE_URL}
            className="font-medium text-accent underline hover:text-accent-hover"
            target="_blank"
            rel="noreferrer"
          >
            Open in Microsoft marketplace
          </a>
        </p>
        <p className="text-text-3 text-xs">
          IT administrators can deploy the add-in org-wide via Microsoft 365 — see
          our{' '}
          <Link
            href={ENTERPRISE_PATH}
            className="text-accent underline hover:text-accent-hover"
          >
            Enterprise deployment guide
          </Link>
          .
        </p>
      </GuideStep>

      <GuideStep title="Step 3: Sign in and pull data">
        <p>With the add-in installed, stream data into your workbook.</p>
        <ol className="list-decimal pl-5 space-y-2 text-ink">
          <li>
            Click the {PRODUCT_NAME} button on the Home ribbon to open the task
            pane.
          </li>
          <li>
            Click <strong>Sign in</strong> and use the same email and password
            as on the website.
          </li>
          <li>
            Select your workspace if prompted. Use <strong>Refresh</strong> in
            the task pane header if connections do not appear — confirm Stripe
            (and Xero on Pro/Firm) show as connected.
          </li>
          <li>
            Open the <strong>Pull</strong> tab, choose an object and date range,
            then click <strong>Pull to sheet</strong>. Free plan: up to 90 days
            and 100 transactions per pull.
          </li>
          <li>
            On Pro or Firm with Xero connected, use the <strong>Build</strong>{' '}
            and <strong>Push</strong> tabs to create journals and post to Xero.
          </li>
        </ol>
      </GuideStep>

      <p className="mt-6 text-sm text-text-2 border-t border-accent/20 pt-4">
        <Link
          href="/support"
          className="font-medium text-accent underline hover:text-accent-hover"
        >
          Full user guide
        </Link>{' '}
        — ongoing reference for pull, build, push, and troubleshooting.
      </p>
    </section>
  );
}
