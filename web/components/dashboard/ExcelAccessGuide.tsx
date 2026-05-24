'use client';

import Link from 'next/link';
import { PRODUCT_NAME } from '@stripesync/shared/brand';
import { getAddinManifestUrl } from '@/lib/excel-launch';

const steps = [
  'Open Microsoft Excel (desktop or Excel on the web) and open or create a workbook.',
  `Go to Insert → Add-ins → My Add-ins, search for "${PRODUCT_NAME}", and add it to your workbook.`,
  'Open the task pane from the Home ribbon, click Sign in, and complete sign-in in your browser.',
  'Select your workspace, then connect Xero and Stripe from the task pane to start syncing.',
];

export default function ExcelAccessGuide() {
  const manifestUrl = getAddinManifestUrl();

  return (
    <section
      className="mt-10 rounded-xl border-2 border-accent/30 bg-accent/5 px-6 py-6"
      aria-labelledby="excel-access-heading"
    >
      <h2
        id="excel-access-heading"
        className="text-lg font-semibold text-ink sm:text-xl"
      >
        Use {PRODUCT_NAME} in Excel
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-text-2 sm:text-base">
        Stripe and Xero syncing runs inside the Excel add-in. Install the add-in
        once, sign in from the task pane, and work from your workbook.
      </p>
      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-ink sm:text-base">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-text-2">
        First-time setup or sideloading?{' '}
        <a
          href={manifestUrl}
          className="font-medium text-accent underline hover:text-accent-hover"
          target="_blank"
          rel="noreferrer"
        >
          Download the add-in manifest
        </a>
        {' · '}
        <Link
          href="/support"
          className="font-medium text-accent underline hover:text-accent-hover"
        >
          Full user guide
        </Link>
      </p>
    </section>
  );
}
