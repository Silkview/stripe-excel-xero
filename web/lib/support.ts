export const SUPPORT_EMAIL = 'admin@silkview.org';

export const SUPPORT_GUIDE_PATH = '/support';

export const TERMS_PATH = '/terms';

export const PRIVACY_PATH = '/privacy';

export function supportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}`;
}
