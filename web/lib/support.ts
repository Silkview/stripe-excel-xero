export const SUPPORT_EMAIL = 'admin@silkview.org';

export const SUPPORT_GUIDE_PATH = '/support';

export function supportMailtoUrl(): string {
  return `mailto:${SUPPORT_EMAIL}`;
}
