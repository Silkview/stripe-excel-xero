'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { PRODUCT_NAME } from '@stripesync/shared/brand';
import { getAddinManifestDownloadUrl } from '@/lib/excel-launch';

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

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

function PlatformDetails({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-lg border border-border bg-surface/80 px-4 py-3 mt-3 group">
      <summary className="cursor-pointer font-medium text-ink list-none [&::-webkit-details-marker]:hidden">
        <span className="text-accent mr-1.5">+</span>
        {label}
      </summary>
      <div className="mt-3 text-sm text-text-2 space-y-2 pl-0.5">{children}</div>
    </details>
  );
}

export default function ExcelAccessGuide() {
  const manifestDownloadUrl = getAddinManifestDownloadUrl();

  return (
    <section
      className="mt-10 rounded-xl border-2 border-accent/30 bg-accent/5 px-6 py-6"
      aria-labelledby="excel-access-heading"
    >
      <h2
        id="excel-access-heading"
        className="text-lg font-semibold text-ink sm:text-xl"
      >
        Instructions for Beta Test Users
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-text-2 sm:text-base leading-relaxed">
        Welcome to the {PRODUCT_NAME} private beta. Complete Step 1 to set up
        your account and download your access file, then follow the installation
        section for your version of Excel.
      </p>

      <GuideStep title="Step 1: Create your account and download manifest">
        <p>
          Before opening Excel, link your platforms and save your secure access
          file.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-ink">
          <li>
            Go to{' '}
            <a
              href="https://www.silkview.org"
              className="font-medium text-accent underline hover:text-accent-hover"
              target="_blank"
              rel="noreferrer"
            >
              silkview.org
            </a>{' '}
            and{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-accent underline hover:text-accent-hover"
            >
              sign up
            </Link>
            .
          </li>
          <li>
            From your dashboard, click <strong>Connect Stripe</strong> and sign
            in to authorize secure read access to your Stripe data.
          </li>
          <li>
            Click <strong>Connect Xero</strong> and select the organisation you
            want to link. Pro and Firm plans only — Free beta testers can skip
            Xero and still pull Stripe data from Excel.
          </li>
          <li>
            When Stripe is connected (and Xero too, if on Pro/Firm),{' '}
            <a
              href={manifestDownloadUrl}
              download="silkview-connect-manifest.xml"
              className="font-medium text-accent underline hover:text-accent-hover"
            >
              download the manifest file
            </a>
            . This saves <Code>manifest.xml</Code> to your computer.
          </li>
        </ol>
      </GuideStep>

      <GuideStep title="Step 2: Install the add-in (choose your platform)">
        <p>Open the section that matches how you use Microsoft Excel.</p>

        <PlatformDetails label="Option A: Excel on the Web (easiest)">
          <p className="text-text-3 text-xs mb-2">
            Use this if you run Excel in Chrome, Safari, or Edge.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-ink">
            <li>
              Go to{' '}
              <a
                href="https://office.com"
                className="text-accent underline"
                target="_blank"
                rel="noreferrer"
              >
                office.com
              </a>
              , sign in, and open a new blank workbook.
            </li>
            <li>
              On the ribbon, open the <strong>Home</strong> tab.
            </li>
            <li>
              Click <strong>Add-ins</strong> (grid icon) on the right of the
              toolbar.
            </li>
            <li>
              Click <strong>More Add-ins</strong> or{' '}
              <strong>Manage My Add-ins</strong> at the bottom of the panel.
            </li>
            <li>
              In the popup, click <strong>Upload My Add-in</strong> (top
              right).
            </li>
            <li>
              Click <strong>Browse</strong>, select your downloaded{' '}
              <Code>manifest.xml</Code>, and click <strong>Upload</strong>.
            </li>
          </ol>
        </PlatformDetails>

        <PlatformDetails label="Option B: Excel for Mac (WEF folder)">
          <p className="text-text-3 text-xs mb-2">
            Use this for the native Excel app on Mac. Apple requires a specific
            system folder.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-ink">
            <li>Open Finder.</li>
            <li>
              In the menu bar, click <strong>Go</strong> →{' '}
              <strong>Go to Folder…</strong> (or press Cmd + Shift + G).
            </li>
            <li>
              Paste this path and press Enter:{' '}
              <Code>
                ~/Library/Containers/com.microsoft.Excel/Data/Documents/wef
              </Code>
            </li>
            <li>
              If the <Code>wef</Code> folder does not exist, create a new folder
              named exactly <Code>wef</Code> (all lowercase) inside{' '}
              <Code>Documents</Code>, then open it.
            </li>
            <li>
              Move your downloaded <Code>manifest.xml</Code> into the{' '}
              <Code>wef</Code> folder.
            </li>
            <li>Quit Excel completely, then reopen it.</li>
            <li>
              Open a workbook → <strong>Insert</strong> tab → arrow next to{' '}
              <strong>My Add-ins</strong> → check{' '}
              <strong>Developer Add-ins</strong> for {PRODUCT_NAME}.
            </li>
          </ol>
        </PlatformDetails>

        <PlatformDetails label="Option C: Excel for Windows (trusted catalog folder)">
          <p className="text-text-3 text-xs mb-2">
            Use this for the native Excel app on Windows.
          </p>
          <p className="font-medium text-ink text-sm mt-1">Part 1 — Trusted folder</p>
          <ol className="list-decimal pl-5 space-y-2 text-ink mt-2">
            <li>
              Create a folder (e.g. <Code>C:\SilkviewAddin</Code>) and place{' '}
              <Code>manifest.xml</Code> inside it.
            </li>
            <li>
              Right-click the folder → <strong>Properties</strong> →{' '}
              <strong>Sharing</strong> tab → <strong>Share…</strong>
            </li>
            <li>
              Share with yourself or Everyone, click <strong>Share</strong>, then{' '}
              <strong>Done</strong>.
            </li>
            <li>
              Copy the <strong>Network Path</strong> under the folder name (e.g.{' '}
              <Code>\\Your-PC\SilkviewAddin</Code>).
            </li>
          </ol>
          <p className="font-medium text-ink text-sm mt-4">Part 2 — Link to Excel</p>
          <ol className="list-decimal pl-5 space-y-2 text-ink mt-2" start={5}>
            <li>
              In Excel: <strong>File</strong> → <strong>Options</strong> →{' '}
              <strong>Trust Center</strong> → <strong>Trust Center Settings…</strong>
            </li>
            <li>
              Click <strong>Trusted Add-in Catalogs</strong> on the left.
            </li>
            <li>
              Paste the network path into <strong>Catalog URL</strong>, click{' '}
              <strong>Add catalog</strong>.
            </li>
            <li>
              Check <strong>Show in Menu</strong> for that row, click{' '}
              <strong>OK</strong>, and restart Excel.
            </li>
            <li>
              <strong>Insert</strong> → <strong>My Add-ins</strong> →{' '}
              <strong>Shared Folder</strong> tab → select {PRODUCT_NAME} →{' '}
              <strong>Add</strong>.
            </li>
          </ol>
        </PlatformDetails>
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
