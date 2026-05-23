import { getPrimaryAccountMembership } from './account-membership';

/** Returns existing account membership only — does not auto-provision. */
export async function ensureAccountForUser(
  userId: string,
  _email: string,
  _accountName?: string
): Promise<{ accountId: string; created: boolean }> {
  const existing = await getPrimaryAccountMembership(userId);

  if (existing?.account_id) {
    return { accountId: existing.account_id, created: false };
  }

  throw new Error('ONBOARDING_REQUIRED');
}
