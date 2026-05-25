/** Pro and Firm in-app trial length (days). */
export const TRIAL_DAYS = 30;

const MS_PER_DAY = 86400000;

export function trialEndsAtIso(from: Date = new Date()): string {
  return new Date(from.getTime() + TRIAL_DAYS * MS_PER_DAY).toISOString();
}

export function trialCtaLabel(): string {
  return `Start ${TRIAL_DAYS}-day trial`;
}

export function trialHeroLabel(): string {
  return `${TRIAL_DAYS}-day Pro trial`;
}
