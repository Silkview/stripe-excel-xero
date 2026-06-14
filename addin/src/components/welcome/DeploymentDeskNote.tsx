const DEPLOYMENT_DESK_EMAIL = 'admin@silkview.org';

type DeploymentDeskNoteProps = {
  className?: string;
};

export default function DeploymentDeskNote({ className = '' }: DeploymentDeskNoteProps) {
  return (
    <p className={`text-[11px] text-ink-3 leading-relaxed ${className}`}>
      To deploy Silkview Connect across multiple client workspaces or to provision a Firm Plan
      with team access, please contact our deployment desk at{' '}
      <a
        href={`mailto:${DEPLOYMENT_DESK_EMAIL}`}
        className="text-accent font-medium hover:underline"
      >
        {DEPLOYMENT_DESK_EMAIL}
      </a>
      .
    </p>
  );
}
