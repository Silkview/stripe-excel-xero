import Button from './ui/Button';
import { getAppUrl } from '../utils/api';

const SUPPORT_EMAIL = 'admin@silkview.org';

const WORKFLOW_STEPS = [
  { num: '1', label: 'Pull', desc: 'Stripe balance transactions into Excel' },
  { num: '2', label: 'Build', desc: 'Xero-ready journals and bank transactions' },
  { num: '3', label: 'Push', desc: 'Entries to your Xero ledger' },
] as const;

type WelcomePanelProps = {
  onSignIn: () => void;
  signingIn: boolean;
  sessionExpired?: boolean;
};

export default function WelcomePanel({
  onSignIn,
  signingIn,
  sessionExpired = false,
}: WelcomePanelProps) {
  const signupUrl = `${getAppUrl()}/auth/signup`;
  const firmSignupUrl = `${getAppUrl()}/auth/signup?plan=firm`;

  return (
    <div className="p-3.5 flex-1">
      {sessionExpired ? (
        <>
          <h2 className="text-lg font-semibold">Session expired</h2>
          <p className="text-sm text-ink-2 mt-2 mb-4">
            Your session expired. Sign in again to sync Stripe and Xero data.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Welcome to Silkview Connect</h2>
          <p className="text-sm text-ink-2 mt-2 mb-4">
            Pull Stripe balance transactions into Excel, build Xero-ready journals
            and bank transactions, and push them to your ledger—all from your
            workbook.
          </p>
          <ul className="mb-4 space-y-2">
            {WORKFLOW_STEPS.map((step) => (
              <li key={step.num} className="flex items-start gap-2 text-sm text-ink-2">
                <span className="w-[18px] h-[18px] shrink-0 rounded-full bg-accent text-white text-[10px] font-mono flex items-center justify-center mt-0.5">
                  {step.num}
                </span>
                <span>
                  <span className="font-semibold text-ink">{step.label}</span>
                  {' — '}
                  {step.desc}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="space-y-2 mb-5">
        <Button variant="build" onClick={onSignIn} disabled={signingIn}>
          {signingIn ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            window.open(signupUrl, '_blank');
          }}
        >
          Create account
        </Button>
      </div>

      <p className="text-xs text-ink-3 leading-relaxed border-t border-border pt-3.5">
        Corporate teams can use our{' '}
        <a
          href={firmSignupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-medium hover:underline"
        >
          Firm plan
        </a>{' '}
        for up to 5 users and multiple client workspaces. Contact{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-accent font-medium hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{' '}
        to get started, or ask your administrator for an invite link.
      </p>
    </div>
  );
}
