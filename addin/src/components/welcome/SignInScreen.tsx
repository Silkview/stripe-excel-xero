import Button from '../ui/Button';
import { getAppUrl } from '../../utils/api';

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="white" strokeWidth="2" />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SignInScreenProps = {
  onSignIn: () => void;
  signingIn: boolean;
  sessionExpired?: boolean;
};

export default function SignInScreen({
  onSignIn,
  signingIn,
  sessionExpired = false,
}: SignInScreenProps) {
  const signupUrl = `${getAppUrl()}/auth/signup`;
  const firmSignupUrl = `${getAppUrl()}/auth/signup?plan=firm`;
  const appUrl = getAppUrl();

  return (
    <div className="flex-1 flex flex-col">
      {sessionExpired ? (
        <div className="px-5 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-ink">Session expired</h2>
          <p className="text-sm text-ink-2 mt-2">
            Your session expired. Sign in again to sync Stripe and Xero data.
          </p>
        </div>
      ) : (
        <div className="px-5 pt-6 pb-2 text-center">
          <div className="w-11 h-11 rounded-[11px] bg-accent mx-auto mb-3.5 flex items-center justify-center">
            <LockIcon />
          </div>
          <h2 className="text-base font-medium text-ink mb-1.5">Sign in to Silkview</h2>
          <p className="text-[12.5px] text-ink-2 leading-snug">
            Your browser will open for secure sign-in. Return to Excel after completing.
          </p>
        </div>
      )}

      <div className="px-5 pt-3.5 pb-1.5">
        <Button
          variant="build"
          onClick={onSignIn}
          disabled={signingIn}
          className="flex items-center justify-center gap-2"
        >
          <LoginIcon />
          {signingIn ? 'Opening browser…' : 'Sign in with Silkview'}
        </Button>
      </div>

      <div className="px-5 pb-1.5">
        <div className="h-px bg-rule my-2.5" />
      </div>

      <div className="px-5 pb-5">
        <Button
          variant="ghost"
          onClick={() => {
            window.open(signupUrl, '_blank');
          }}
        >
          Create a free account →
        </Button>
      </div>

      <div className="mt-auto px-5 py-2.5 pb-[18px] bg-bg border-t border-rule">
        <p className="text-[11.5px] text-ink-2 leading-relaxed text-center">
          For accounting firms with multiple clients, ask your admin for an invite link or visit{' '}
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            silkview.org
          </a>{' '}
          to start a{' '}
          <a
            href={firmSignupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-medium hover:underline"
          >
            Firm plan
          </a>{' '}
          — up to 5 users and 5 workspaces.
        </p>
      </div>
    </div>
  );
}
