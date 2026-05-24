import Link from 'next/link';
import { SUPPORT_EMAIL, supportMailtoUrl } from '@/lib/support';

const sections = [
  {
    id: 'get-started',
    title: 'Get started',
    steps: [
      'Install or sideload the Silkview Connect Excel add-in in your workbook.',
      'Open the task pane and click Sign in. Complete sign-in in the browser, then return to Excel.',
      'If you are new, finish account setup on the web (workspace name and plan), then return to the add-in.',
      'Select your workspace from the dropdown at the top of the task pane if you have more than one.',
    ],
  },
  {
    id: 'connect',
    title: 'Connect Xero and Stripe',
    steps: [
      'Connect Xero and Stripe from the task pane, or from the dashboard at silkview.org (connections sync when you click Refresh in the header).',
      'On the dashboard, set manual journal posting to Draft only or Draft and Post per workspace.',
      'Open the Account_Mappings sheet and map Stripe object types (charge, refund, fee, etc.) to Xero account codes, tax types, and tracking categories.',
      'Use Refresh Xero under Quick setup to reload mapping dropdowns after connecting Xero.',
    ],
  },
  {
    id: 'prepare',
    title: 'Prepare your workbook',
    steps: [
      'Click Setup sheets under Quick setup to create Stripe, Xero, and mapping tabs with the correct headers.',
      'Click Refresh Xero to populate dropdown lists on the Account_Mappings sheet from your connected Xero organisation.',
      'Confirm your organisation currency appears in the connections area — pulls and builds use this currency only.',
    ],
  },
  {
    id: 'pull',
    title: 'Pull — Stripe data',
    steps: [
      'Go to the Pull tab and choose a date range.',
      'Pull balance transactions (and other Stripe objects as needed). Data is written to the Stripe sheets in your workbook.',
      'Review pulled rows on Stripe_Balance_Transactions before building journals or bank transactions.',
    ],
  },
  {
    id: 'build',
    title: 'Build — journals and bank transactions',
    steps: [
      'Go to the Build tab and click Build journals to generate Xero_Journals rows from balance transactions (grouped by date and type).',
      'Click Build bank transactions to create payout rows on Xero_Bank_Transaction from Stripe payout lines.',
      'Review formulas and amounts in Excel. Adjust mappings on Account_Mappings if account codes need to change, then rebuild.',
    ],
  },
  {
    id: 'push',
    title: 'Push — post to Xero',
    steps: [
      'Go to the Push tab and choose whether manual journals are posted as Draft or Posted (if your workspace allows posting).',
      'Push journals and/or bank transactions. Each row receives a Xero ID and status writeback when successful.',
      'Rows that already show a Xero ID are skipped to avoid duplicates.',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    steps: [
      'After changing connections, team, or billing on the dashboard, click Refresh in the add-in header to reload workspace and connection state.',
      'If Xero shows reconnect required, use Reconnect in the task pane or dashboard.',
      'If your trial ended or billing is blocked, open the dashboard billing page from the link in the add-in.',
      `For help, email ${SUPPORT_EMAIL} or visit the dashboard.`,
    ],
  },
];

export default function UserGuide() {
  return (
    <article className="mx-auto max-w-[720px]">
      <div className="mb-10 text-center">
        <p className="section-eyebrow mb-3.5">Support</p>
        <h1 className="section-title mb-3">Excel add-in user guide</h1>
        <p className="section-sub mx-auto max-w-[520px]">
          Step-by-step instructions for Silkview Connect in Excel — from sign-in
          through pull, build, and push to Xero.
        </p>
      </div>

      <nav
        aria-label="Guide sections"
        className="mb-10 rounded-lg border border-rule bg-surface p-4"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
          On this page
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-accent hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 rounded-lg border border-rule bg-bg p-6 sm:p-8"
          >
            <h2 className="mb-4 flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink">
              <span className="font-mono text-sm font-medium text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              {section.title}
            </h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-2">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-accent/30 bg-accent-light/40 p-6 text-center">
        <p className="text-sm text-ink-2">
          Need more help? Contact us at{' '}
          <a
            href={supportMailtoUrl()}
            className="font-medium text-accent hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          {' '}or{' '}
          <Link href="/auth/login" className="font-medium text-accent hover:underline">
            sign in to the dashboard
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
