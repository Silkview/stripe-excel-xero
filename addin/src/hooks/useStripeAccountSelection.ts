import { useState, useEffect, useCallback } from 'react';
import type { StripeConnectionItem } from '@stripesync/shared';

export function useStripeAccountSelection(
  connections: StripeConnectionItem[],
  defaultStripeAccountId?: string
) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set()
  );

  const initSelection = useCallback(() => {
    if (!connections.length) {
      setSelectedAccountIds(new Set());
      return;
    }
    const defaultId =
      defaultStripeAccountId ??
      connections.find((c) => c.isDefault)?.stripeAccountId ??
      connections[0]?.stripeAccountId;
    setSelectedAccountIds(defaultId ? new Set([defaultId]) : new Set());
  }, [connections, defaultStripeAccountId]);

  useEffect(() => {
    initSelection();
  }, [initSelection]);

  const toggleAccount = (stripeAccountId: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(stripeAccountId)) {
        next.delete(stripeAccountId);
      } else {
        next.add(stripeAccountId);
      }
      return next;
    });
  };

  const selectAllAccounts = () => {
    setSelectedAccountIds(new Set(connections.map((c) => c.stripeAccountId)));
  };

  const clearAccountSelection = () => {
    setSelectedAccountIds(new Set());
  };

  const selectedList = connections.filter((c) =>
    selectedAccountIds.has(c.stripeAccountId)
  );

  return {
    selectedAccountIds,
    selectedList,
    toggleAccount,
    selectAllAccounts,
    clearAccountSelection,
  };
}
