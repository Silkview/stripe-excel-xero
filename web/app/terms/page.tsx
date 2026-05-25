import LegalPageLayout, { type LegalTocItem } from '@/components/legal/LegalPageLayout';
import TermsContent from '@/components/legal/TermsContent';

export const metadata = {
  title: 'Terms of Service | Silkview Connect',
  description:
    'Terms of Service for Silkview Connect — the Excel add-in for Stripe data and Xero accounting.',
};

const TOC: LegalTocItem[] = [
  { href: '#acceptance', label: '1. Acceptance' },
  { href: '#service', label: '2. The service' },
  { href: '#accounts', label: '3. Accounts' },
  { href: '#plans', label: '4. Plans & billing' },
  { href: '#acceptable-use', label: '5. Acceptable use' },
  { href: '#third-party', label: '6. Third-party connections' },
  { href: '#financial-data', label: '7. Financial data' },
  { href: '#ip', label: '8. Intellectual property' },
  { href: '#confidentiality', label: '9. Confidentiality' },
  { href: '#warranties', label: '10. Warranties' },
  { href: '#liability', label: '11. Limitation of liability' },
  { href: '#indemnity', label: '12. Indemnity' },
  { href: '#termination', label: '13. Termination' },
  { href: '#disputes', label: '14. Disputes' },
  { href: '#general', label: '15. General' },
  { href: '#contact', label: '16. Contact' },
];

const META = 'Last updated: 25 May 2026 · Effective: 25 May 2026';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" meta={META} toc={TOC}>
      <TermsContent />
    </LegalPageLayout>
  );
}
