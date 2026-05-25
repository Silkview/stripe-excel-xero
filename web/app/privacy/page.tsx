import LegalPageLayout, { type LegalTocItem } from '@/components/legal/LegalPageLayout';
import PrivacyContent from '@/components/legal/PrivacyContent';

export const metadata = {
  title: 'Privacy Policy | Silkview Connect',
  description:
    'Privacy Policy for Silkview Connect — how we collect, use, and protect your data.',
};

const TOC: LegalTocItem[] = [
  { href: '#overview', label: 'Overview' },
  { href: '#who-we-are', label: 'Who we are' },
  { href: '#data-we-collect', label: 'Data we collect' },
  { href: '#data-we-dont-collect', label: "What we don't store" },
  { href: '#how-we-use', label: 'How we use data' },
  { href: '#token-security', label: 'Token security' },
  { href: '#third-parties', label: 'Third-party services' },
  { href: '#data-retention', label: 'Data retention' },
  { href: '#your-rights', label: 'Your rights' },
  { href: '#children', label: 'Children' },
  { href: '#changes', label: 'Policy changes' },
  { href: '#contact', label: 'Contact us' },
];

const META = 'Last updated: 25 May 2026 · Effective: 25 May 2026';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" meta={META} toc={TOC}>
      <PrivacyContent />
    </LegalPageLayout>
  );
}
