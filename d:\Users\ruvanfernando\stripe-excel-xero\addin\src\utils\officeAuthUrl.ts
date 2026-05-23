/** Origin for Office auth dialog (`/auth/excel`). Prefer web API URL in production. */
export function getOfficeAuthOrigin(): string {
  const fromEnv =
    (import.meta.env.VITE_OFFICE_AUTH_ORIGIN as string | undefined)?.replace(
      /\/$/,
      ''
    ) ||
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

  if (fromEnv) {
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'officeAuthUrl:getOfficeAuthOrigin',message:'auth origin from env',data:{fromEnv,taskpaneOrigin:typeof window!=='undefined'?window.location?.origin:null},timestamp:Date.now(),hypothesisId:'H1-H2',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    return fromEnv;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'officeAuthUrl:getOfficeAuthOrigin',message:'auth origin from taskpane window',data:{origin:window.location.origin},timestamp:Date.now(),hypothesisId:'H1-H2',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    return window.location.origin;
  }

  return 'https://localhost:4000';
}
