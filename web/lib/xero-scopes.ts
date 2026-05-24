/** Scopes requested on Xero OAuth connect (must include accounting.contacts for Contacts API). */
export const XERO_OAUTH_SCOPES = [
  'accounting.transactions',
  'accounting.settings',
  'accounting.reports.read',
  'accounting.contacts',
  'offline_access',
] as const;

export function xeroOAuthScopeString(): string {
  return XERO_OAUTH_SCOPES.join(' ');
}
