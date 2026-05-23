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
        let settled = false;

        const finishResolve = (payload: Record<string, unknown>) => {
          if (settled) return;
          settled = true;
          resolve(payload);
        };

        const finishReject = (err: Error) => {
          if (settled) return;
          settled = true;
          reject(err);
        };

        dialog.addEventHandler(
          Office.EventType.DialogMessageReceived,
          (arg) => {
            // #region agent log
            fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'dialogAuth:DialogMessageReceived',message:'dialog message',data:{hasMessage:'message' in arg && !!arg.message},timestamp:Date.now(),hypothesisId:'H6',runId:'post-fix-v2'})}).catch(()=>{});
            // #endregion
            if ('message' in arg && arg.message) {
              try {
                const payload = JSON.parse(arg.message) as Record<
                  string,
                  unknown
                >;
                if (payload.status === 'error') {
                  finishReject(
                    new Error(
                      (typeof payload.message === 'string' && payload.message) ||
                        'Connection was cancelled or failed.'
                    )
                  );
                } else {
                  finishResolve(payload);
                }
              } catch {
                finishReject(new Error('Invalid response from sign-in window.'));
              }
            } else {
              finishReject(new Error('No response from sign-in window.'));
            }
            try {
              dialog.close();
            } catch {
              // Dialog may already be closing after messageParent.
            }
          }
        );

        dialog.addEventHandler(
          Office.EventType.DialogEventReceived,
          (arg) => {
            // #region agent log
            const errCode = 'error' in arg ? arg.error : undefined;
            fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'dialogAuth:DialogEventReceived',message:'dialog event',data:{errCode,settled},timestamp:Date.now(),hypothesisId:'H6',runId:'post-fix-v2'})}).catch(()=>{});
            // #endregion
            if ('error' in arg && arg.error === 12006 && !settled) {
              finishReject(new Error('Sign-in was cancelled.'));
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
        'Sign-in timed out. Check the browser tab for a Stripe error (often mismatched Connect client ID and secret key). Then click Connect again.'
      );
    }
    return;
  }

  await openAuthDialog(url);
}
