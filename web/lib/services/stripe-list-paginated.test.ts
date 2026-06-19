import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateStripeList, limitsForRemainingItems } from './stripe-list-paginated';
import {
  STRIPE_API_PAGE_SIZE,
  stripeFetchLimitsForPlan,
} from '@stripesync/shared/pullLimits';

const paidLimits = { maxPages: 20, maxItems: 2000, pageDelayMs: 0 };

test('stops when has_more is false', async () => {
  let calls = 0;
  const result = await paginateStripeList(async () => {
    calls++;
    return {
      data: [{ id: 'tx_1' }, { id: 'tx_2' }],
      hasMore: false,
    };
  }, paidLimits);
  assert.equal(calls, 1);
  assert.equal(result.length, 2);
});

test('paginates until maxItems', async () => {
  let page = 0;
  const limits = { maxPages: 20, maxItems: 150, pageDelayMs: 0 };
  const result = await paginateStripeList(async () => {
    page++;
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: `tx_${page}_${i}`,
    }));
    return { data, hasMore: page < 5 };
  }, limits);
  assert.equal(result.length, 150);
  assert.equal(page, 2);
});

test('stops at maxPages', async () => {
  let calls = 0;
  const limits = { maxPages: 3, maxItems: 2000, pageDelayMs: 0 };
  await paginateStripeList(async () => {
    calls++;
    return {
      data: [{ id: `tx_${calls}` }],
      hasMore: true,
    };
  }, limits);
  assert.equal(calls, 3);
});

test('passes starting_after cursor between pages', async () => {
  const cursors: (string | undefined)[] = [];
  await paginateStripeList(async (startingAfter) => {
    cursors.push(startingAfter);
    if (!startingAfter) {
      return {
        data: [{ id: 'tx_a' }, { id: 'tx_b' }],
        hasMore: true,
      };
    }
    return {
      data: [{ id: 'tx_c' }],
      hasMore: false,
    };
  }, paidLimits);
  assert.deepEqual(cursors, [undefined, 'tx_b']);
});

test('limitsForRemainingItems caps pages for small remainder', () => {
  const limits = stripeFetchLimitsForPlan('pro');
  const remaining = limitsForRemainingItems(limits, 50);
  assert.equal(remaining.maxItems, 50);
  assert.equal(remaining.maxPages, 1);
});

test('stripeFetchLimitsForPlan free plan uses one page', () => {
  const limits = stripeFetchLimitsForPlan('free');
  assert.equal(limits.maxItems, 100);
  assert.equal(limits.maxPages, 1);
  assert.equal(limits.pageDelayMs, 1000);
});

test('stripeFetchLimitsForPlan paid plan uses twenty pages', () => {
  const limits = stripeFetchLimitsForPlan('pro');
  assert.equal(limits.maxItems, 2000);
  assert.equal(limits.maxPages, 20);
  assert.equal(limits.maxItems, STRIPE_API_PAGE_SIZE * limits.maxPages);
});
