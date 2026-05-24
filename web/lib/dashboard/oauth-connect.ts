function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type StripeConnectResult = {
  connectionId: string;
  stripeAccountId: string;
  displayName: string | null;
};

export type ConnectWorkspaceResult =
  | { provider: 'xero'; connected: true }
  | { provider: 'stripe'; connected: true; newConnection: StripeConnectResult };

async function fetchConnectUrl(
  workspaceId: string,
  provider: 'xero' | 'stripe'
): Promise<string> {
  const path =
    provider === 'xero'
      ? '/auth/xero/connect'
      : '/auth/stripe/connect?flow=login';
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'X-Workspace-Id': workspaceId },
  });
  const data = await res.json().catch(() => null);
  if (!data?.success || !data.data?.url) {
    throw new Error(
      data?.error?.message ??
        `Could not start ${provider === 'xero' ? 'Xero' : 'Stripe'} connection.`
    );
  }
  return data.data.url as string;
}

export function openOAuthPopup(url: string): Window {
  const win = window.open(
    url,
    '_blank',
    'noopener,noreferrer,width=520,height=720'
  );
  if (!win) {
    throw new Error(
      'Pop-up blocked. Allow pop-ups for this site to connect accounts.'
    );
  }
  return win;
}

async function waitForXero(workspaceId: string, maxMs = 120000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await fetch('/api/xero/connections', {
      credentials: 'include',
      headers: { 'X-Workspace-Id': workspaceId },
    });
    const data = await res.json().catch(() => null);
    if (data?.success && data.data?.connected) return true;
    await sleep(1500);
  }
  return false;
}

type StripeConnectionRow = {
  id: string;
  stripeAccountId: string;
  displayName: string | null;
};

async function fetchStripeConnections(
  workspaceId: string
): Promise<StripeConnectionRow[]> {
  const res = await fetch('/api/stripe/connections', {
    credentials: 'include',
    headers: { 'X-Workspace-Id': workspaceId },
  });
  const data = await res.json().catch(() => null);
  if (!data?.success) return [];
  return (data.data?.connections ?? []) as StripeConnectionRow[];
}

async function waitForNewStripeConnection(
  workspaceId: string,
  beforeIds: Set<string>,
  maxMs = 120000
): Promise<StripeConnectResult | null> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const connections = await fetchStripeConnections(workspaceId);
    const added = connections.find((c) => !beforeIds.has(c.id));
    if (added) {
      return {
        connectionId: added.id,
        stripeAccountId: added.stripeAccountId,
        displayName: added.displayName,
      };
    }
    await sleep(1500);
  }
  return null;
}

export async function connectWorkspaceProvider(
  workspaceId: string,
  provider: 'xero' | 'stripe'
): Promise<ConnectWorkspaceResult> {
  const beforeStripeIds =
    provider === 'stripe'
      ? new Set((await fetchStripeConnections(workspaceId)).map((c) => c.id))
      : new Set<string>();

  const url = await fetchConnectUrl(workspaceId, provider);
  openOAuthPopup(url);

  if (provider === 'xero') {
    const connected = await waitForXero(workspaceId);
    if (!connected) {
      throw new Error(
        'Xero connection timed out. Close the OAuth window if it is still open, then try again.'
      );
    }
    return { provider: 'xero', connected: true };
  }

  const newConnection = await waitForNewStripeConnection(
    workspaceId,
    beforeStripeIds
  );
  if (!newConnection) {
    throw new Error(
      'Stripe connection timed out. Close the OAuth window if it is still open, then try again.'
    );
  }
  return { provider: 'stripe', connected: true, newConnection };
}
