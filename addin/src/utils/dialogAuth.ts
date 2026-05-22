function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function openAuthInSystemBrowser(url: string): boolean {
  const ui = Office.context.ui as Office.Context['ui'] & {
    openBrowserWindow?: (url: string) => void;
  };
  if (typeof ui.openBrowserWindow === 'function') {
    ui.openBrowserWindow(url);
    return true;
  }
  return false;
}

export async function pollUntil(
  check: () => Promise<boolean>,
  maxMs = 120000,
  intervalMs = 1500
): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(intervalMs);
  }
  return false;
}

export function openAuthDialog(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    Office.context.ui.displayDialogAsync(
      url,
      { height: 60, width: 50, displayInIframe: false },
      (asyncResult) => {
        if (asyncResult.status !== Office.AsyncResultStatus.Succeeded) {
          const err = asyncResult.error;
          const detail =
            err?.message ??
            (err?.code != null ? String(err.code) : undefined);
          reject(
            new Error(
              detail
                ? `Could not open the sign-in window: ${detail}`
                : 'Could not open the sign-in window. Please try again.'
            )
          );
          return;
        }

        const dialog = asyncResult.value;

        dialog.addEventHandler(
          Office.EventType.DialogMessageReceived,
          (arg) => {
            dialog.close();
            if ('message' in arg && arg.message) {
              try {
                const payload = JSON.parse(arg.message);
                if (payload.status === 'error') {
                  reject(
                    new Error(
                      payload.message || 'Connection was cancelled or failed.'
                    )
                  );
                } else if (
                  payload.status === 'signed_in' &&
                  typeof payload.accessToken === 'string'
                ) {
                  resolve(payload);
                } else {
                  resolve(payload);
                }
              } catch {
                reject(new Error('Invalid response from sign-in window.'));
              }
            } else {
              reject(new Error('No response from sign-in window.'));
            }
          }
        );

        dialog.addEventHandler(
          Office.EventType.DialogEventReceived,
          (arg) => {
            if ('error' in arg && arg.error === 12006) {
              reject(new Error('Sign-in was cancelled.'));
            }
          }
        );
      }
    );
  });
}

/** Opens OAuth in the system browser (Stripe/Google SSO need a full browser). */
export async function openAuthFlow(
  url: string,
  waitForConnected: () => Promise<boolean>
): Promise<void> {
  const usedBrowser = openAuthInSystemBrowser(url);

  if (usedBrowser) {
    const connected = await pollUntil(waitForConnected);
    if (!connected) {
      throw new Error(
        'Sign-in timed out. Finish authorization in your browser, then click Connect again.'
      );
    }
    return;
  }

  await openAuthDialog(url);
}
