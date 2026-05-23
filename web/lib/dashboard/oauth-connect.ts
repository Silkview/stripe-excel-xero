function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function waitForStripe(workspaceId: string, maxMs = 120000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await fetch('/api/stripe/connections', {
      credentials: 'include',
      headers: { 'X-Workspace-Id': workspaceId },
    });
    const data = await res.json().catch(() => null);
    const count = data?.data?.connections?.length ?? 0;
    if (data?.success && count > 0) return true;
    await sleep(1500);
  }
  return false;
}

export async function connectWorkspaceProvider(
  workspaceId: string,
  provider: 'xero' | 'stripe'
): Promise<void> {
  const url = await fetchConnectUrl(workspaceId, provider);
  openOAuthPopup(url);
  const connected =
    provider === 'xero'
      ? await waitForXero(workspaceId)
      : await waitForStripe(workspaceId);
  if (!connected) {
    throw new Error(
      `${provider === 'xero' ? 'Xero' : 'Stripe'} connection timed out. Close the OAuth window if it is still open, then try again.`
    );
  }
}
