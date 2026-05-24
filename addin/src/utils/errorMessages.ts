import type { ApiResponse } from '@stripesync/shared';

const FRIENDLY_MESSAGES: Record<string, string> = {
  STRIPE_AUTH_REQUIRED:
    'Your Stripe connection has expired. Please connect Stripe again.',
  XERO_AUTH_REQUIRED:
    'Your Xero connection has expired. Please connect Xero again.',
  TIMEOUT: 'The request took too long. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  NOT_IMPLEMENTED: 'This feature is coming in phase 2.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
  CONFIG_ERROR: 'The server is not configured correctly. Contact your administrator.',
  STRIPE_ERROR: 'Could not reach Stripe. Please try again.',
  XERO_ERROR: 'Could not reach Xero. Please try again.',
  SERVER_ERROR: 'Something went wrong on the server. Please try again.',
  ACCOUNT_REQUIRED:
    'Your account is not set up yet. Sign out and sign in again, or contact support.',
  AUTH_REQUIRED: 'Your session expired. Sign in again.',
  BILLING_REQUIRED:
    'Subscribe to Pro or Firm to continue using Silkview Connect.',
  XERO_UPGRADE_REQUIRED:
    'Upgrade to Pro or Firm to connect Xero and push to your ledger.',
  PROVISION_ERROR: '',
};

export function friendlyError(
  response?: ApiResponse,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!response?.error) return fallback;
  const { code, message } = response.error;
  if (code === 'CONFIG_ERROR' && message) return message;
  if (code === 'PROVISION_ERROR' && message?.trim()) return message.trim();
  if (code === 'VALIDATION_ERROR' && message?.trim()) return message.trim();
  if (code && FRIENDLY_MESSAGES[code] && FRIENDLY_MESSAGES[code]) {
    return FRIENDLY_MESSAGES[code];
  }
  if (message?.trim()) return message.trim();
  return fallback;
}

export function formatErrorWithDetails(response?: ApiResponse): string {
  const main = friendlyError(response);
  const details = response?.error?.details;
  if (!details?.length) return main;
  return `${main}\n\n${details.map((d) => `• ${d}`).join('\n')}`;
}

export function friendlyErrorFromCode(code: string): string {
  return FRIENDLY_MESSAGES[code] || 'Something went wrong. Please try again.';
}
