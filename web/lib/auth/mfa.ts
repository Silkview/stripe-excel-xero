import type { SupabaseClient } from '@supabase/supabase-js';

export interface MfaStatus {
  currentLevel: string | null;
  nextLevel: string | null;
  needsVerification: boolean;
  hasVerifiedTotp: boolean;
  totpFactorId: string | null;
}

export async function getMfaStatus(
  supabase: SupabaseClient
): Promise<MfaStatus> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factorsData } = await supabase.auth.mfa.listFactors();

  const verifiedTotp =
    factorsData?.totp?.find((f) => f.status === 'verified') ?? null;

  const currentLevel = aal?.currentLevel ?? null;
  const nextLevel = aal?.nextLevel ?? null;
  const needsVerification =
    !!verifiedTotp &&
    currentLevel === 'aal1' &&
    nextLevel === 'aal2';

  return {
    currentLevel,
    nextLevel,
    needsVerification,
    hasVerifiedTotp: !!verifiedTotp,
    totpFactorId: verifiedTotp?.id ?? null,
  };
}

export async function enrollTotp(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator app',
  });
  if (error) throw error;
  return data;
}

/** Start or restart TOTP enrollment (clears stale unverified factors first). */
export async function prepareTotpEnrollment(supabase: SupabaseClient) {
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const stale =
    factorsData?.all?.filter(
      (f) => f.factor_type === 'totp' && f.status === 'unverified'
    ) ?? [];
  for (const factor of stale) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  return enrollTotp(supabase);
}

export async function verifyTotpEnrollment(
  supabase: SupabaseClient,
  factorId: string,
  code: string
) {
  const { data: challenge, error: challengeErr } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeErr) throw challengeErr;

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) throw error;
  return data;
}

export async function verifyMfaLogin(
  supabase: SupabaseClient,
  factorId: string,
  code: string
) {
  return verifyTotpEnrollment(supabase, factorId, code);
}
