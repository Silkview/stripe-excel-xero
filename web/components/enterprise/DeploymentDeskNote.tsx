import Link from 'next/link';
import {
  DEPLOYMENT_DESK_EMAIL,
  deploymentDeskMailtoUrl,
} from '@/lib/support';

type DeploymentDeskNoteProps = {
  className?: string;
};

export default function DeploymentDeskNote({ className = '' }: DeploymentDeskNoteProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-bg px-4 py-3 text-sm leading-relaxed text-text-2 ${className}`}
    >
      To deploy Silkview Connect across multiple client workspaces or to provision a Firm Plan
      with team access, please contact our deployment desk at{' '}
      <Link
        href={deploymentDeskMailtoUrl()}
        className="font-medium text-accent hover:underline"
      >
        {DEPLOYMENT_DESK_EMAIL}
      </Link>
      .
    </div>
  );
}
