export const SUPPORT_EMAIL = 'admin@silkview.org';

export const DEPLOYMENT_DESK_EMAIL = 'admin@silkview.org';

export const ENTERPRISE_RELATIONS_EMAIL = 'admin@silkview.org';

export const SUPPORT_GUIDE_PATH = '/support';

export const TERMS_PATH = '/terms';

export const PRIVACY_PATH = '/privacy';

export const ENTERPRISE_PATH = '/enterprise';

export function supportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}`;
}

export function deploymentDeskMailtoUrl(): string {
  return `mailto:${DEPLOYMENT_DESK_EMAIL}`;
}

export function enterpriseRelationsMailtoUrl(): string {
  return `mailto:${ENTERPRISE_RELATIONS_EMAIL}`;
}

export function betaFeedbackMailtoUrl(): string {
  const subject = encodeURIComponent('Beta feedback');
  const body = encodeURIComponent(
    [
      'Hi Silkview team,',
      '',
      'What I was trying to do:',
      '',
      'What happened instead:',
      '',
      'Workspace / account (optional):',
      '',
      'Browser / Excel version (optional):',
    ].join('\n')
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
