import LegalPageLayout, { type LegalTocItem } from '@/components/legal/LegalPageLayout';
import EnterpriseContent from '@/components/enterprise/EnterpriseContent';

export const metadata = {
  title: 'Enterprise & Firm Deployment | Silkview Connect',
  description:
    'Deploy Silkview Connect across client workspaces, provision Firm Plans with team access, and roll out the Excel add-in via Microsoft 365.',
};

const TOC: LegalTocItem[] = [
  { href: '#overview', label: 'Overview' },
  { href: '#acquire', label: 'How to acquire' },
  { href: '#self-service', label: 'Self-service Firm' },
  { href: '#enterprise-provisioning', label: 'Enterprise provisioning' },
  { href: '#m365', label: 'Microsoft 365 deployment' },
  { href: '#features', label: 'Enterprise features' },
  { href: '#contact', label: 'Contact' },
];

const META =
  'Firm plans, team workspaces, M365 centralized deployment, and custom enterprise provisioning.';

export default function EnterprisePage() {
  return (
    <LegalPageLayout
      eyebrow="Enterprise"
      title="Enterprise & Firm Deployment"
      meta={META}
      toc={TOC}
    >
      <EnterpriseContent />
    </LegalPageLayout>
  );
}
