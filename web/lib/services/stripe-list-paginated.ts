import {
  STRIPE_API_PAGE_SIZE,
  type StripeFetchLimits,
} from '@stripesync/shared/pullLimits';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type StripeListPageResult = {
  data: Record<string, unknown>[];
  hasMore: boolean;
};

export async function paginateStripeList(
  fetchPage: (startingAfter?: string) => Promise<StripeListPageResult>,
  limits: StripeFetchLimits
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < limits.maxPages; page++) {
    const { data, hasMore } = await fetchPage(startingAfter);
    if (data.length === 0) break;

    const remaining = limits.maxItems - results.length;
    if (remaining <= 0) break;

    results.push(...data.slice(0, remaining));
    if (results.length >= limits.maxItems || !hasMore) break;

    const last = data[data.length - 1];
    const lastId = last?.id;
    if (typeof lastId !== 'string' || !lastId) break;

    startingAfter = lastId;
    if (page < limits.maxPages - 1) {
      await sleep(limits.pageDelayMs);
    }
  }

  return results;
}

export function limitsForRemainingItems(
  limits: StripeFetchLimits,
  remaining: number
): StripeFetchLimits {
  const maxItems = Math.max(0, Math.min(limits.maxItems, remaining));
  const maxPages = Math.min(
    limits.maxPages,
    Math.max(1, Math.ceil(maxItems / STRIPE_API_PAGE_SIZE))
  );
  return { maxPages, maxItems, pageDelayMs: limits.pageDelayMs };
}
