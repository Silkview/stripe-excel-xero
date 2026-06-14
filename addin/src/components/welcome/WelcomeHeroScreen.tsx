import Button from '../ui/Button';
import DeploymentDeskNote from './DeploymentDeskNote';

function ConnectLogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M4 9h22M4 15h22M4 21h14"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="23" cy="21" r="5" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" />
      <path
        d="M23 19v4M21 21h4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
        fill="white"
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="2" />
      <path d="M3 10h18M9 10v10" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function XeroChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 30 30" fill="none" aria-hidden>
      <circle cx="15" cy="15" r="15" fill="rgba(255,255,255,0.2)" />
      <path
        d="M9 10l6 5-6 5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 10l-6 5 6 5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  {
    iconBg: 'bg-stripe',
    icon: <BoltIcon />,
    title: 'Pull from Stripe',
    desc: 'Balance transactions, payouts, and more — filtered to your Xero currency',
  },
  {
    iconBg: 'bg-accent',
    icon: <TableIcon />,
    title: 'Review in Excel',
    desc: 'Formula-driven journals built from your account mappings — you control what posts',
  },
  {
    iconBg: 'bg-xero',
    icon: <XeroChevronIcon />,
    title: 'Push to Xero',
    desc: 'Post journals and bank transactions directly — Xero ID written back to each row',
  },
] as const;

type WelcomeHeroScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

export default function WelcomeHeroScreen({
  onGetStarted,
  onSignIn,
}: WelcomeHeroScreenProps) {
  return (
    <div className="flex-1">
      <div className="px-5 pt-7 pb-6 text-center">
        <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-accent to-xero mx-auto mb-4 flex items-center justify-center">
          <ConnectLogoMark />
        </div>
        <h2 className="text-lg font-medium text-ink mb-1.5 leading-snug">
          Stripe to Xero,
          <br />
          inside Excel
        </h2>
        <p className="text-[13px] text-ink-2 leading-relaxed max-w-[240px] mx-auto">
          Pull your Stripe transactions into Excel and push clean journals to Xero — without
          leaving your spreadsheet.
        </p>
      </div>

      <div className="px-5 mb-4 flex flex-col gap-2.5">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-[11px] px-[13px] bg-bg rounded"
          >
            <div
              className={`w-8 h-8 rounded-lg ${feature.iconBg} flex items-center justify-center shrink-0`}
            >
              {feature.icon}
            </div>
            <div>
              <div className="text-[13px] font-medium text-ink mb-0.5">{feature.title}</div>
              <div className="text-xs text-ink-2 leading-snug">{feature.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <Button variant="build" onClick={onGetStarted}>
          Get started →
        </Button>
        <p className="text-center mt-2.5 text-xs text-ink-2">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignIn}
            className="text-accent font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Sign in
          </button>
        </p>
        <p className="text-center mt-3 text-[11px] text-ink-3 leading-relaxed">
          A valid Stripe and Xero account is required for this add-in.
        </p>
        <DeploymentDeskNote className="text-center mt-3 px-1" />
      </div>
    </div>
  );
}
