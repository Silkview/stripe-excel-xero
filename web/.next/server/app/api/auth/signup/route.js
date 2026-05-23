"use strict";(()=>{var e={};e.id=3654,e.ids=[3654],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2402:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>h,patchFetch:()=>m,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>l,staticGenerationAsyncStorage:()=>p});var i={};n.r(i),n.d(i,{POST:()=>f});var r=n(3277),s=n(5265),a=n(5356),o=n(6140),c=n(8248);async function f(e){if(e.headers.get("x-webhook-secret")!==process.env.SUPABASE_SERVICE_ROLE_KEY)return(0,c.bg)("FORBIDDEN","Invalid webhook secret.",403);let{userId:t}=await e.json();if(!t)return(0,c.bg)("VALIDATION_ERROR","userId is required.",400);try{if("true"===process.env.SUPABASE_AUTO_CONFIRM_EMAIL){let e=(0,o.S)();await e.auth.admin.updateUserById(t,{email_confirm:!0})}return(0,c.jsonSuccess)({ok:!0})}catch(t){let e=t instanceof Error?t.message:"Webhook failed.";return(0,c.bg)("DB_ERROR",e,500)}}let u=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/signup/route",pathname:"/api/auth/signup",filename:"route",bundlePath:"app/api/auth/signup/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signup/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:l}=u,h="/api/auth/signup/route";function m(){return(0,a.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:p})}},8248:(e,t,n)=>{n.d(t,{bg:()=>a,bx:()=>f,ds:()=>u,ff:()=>c,hd:()=>o,jsonSuccess:()=>s,tb:()=>r});var i=n(7076);let r=15e3;function s(e,t=200){return i.NextResponse.json({success:!0,data:e},{status:t})}function a(e,t,n=400,r){let s={success:!1,error:{code:e,message:t,...r}};return i.NextResponse.json(s,{status:n})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),i="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,r=function(e,t){if(t)return"Silkview Sync connected";let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),s=n?"You can close this tab and return to Excel.":i??"Please close this tab and try again from the add-in.";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${r}</h1>
<p>${s}</p>
<script>
  Office.onReady(function() {
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${t});
      }
    } catch (e) { }
  });
</script>
</body>
</html>`}function c(e,t){return o({status:"error",provider:e,message:t})}function f(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),i=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),r=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${i};
    var handoffReadyPayload = ${r};
    var handoffNonce = ${n};
    var attempts = 0;
    function persistHandoffThen(cb) {
      if (!handoffNonce) { cb(); return; }
      fetch('/api/auth/excel-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nonce: handoffNonce, accessToken: signedInPayload.accessToken })
      }).finally(cb);
    }
    function sendToParent(payload) {
      try {
        if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
          Office.context.ui.messageParent(payload);
          return true;
        }
      } catch (e) { }
      return false;
    }
    function retry() {
      persistHandoffThen(function() {
        sendToParent(signedInPayload);
        sendToParent(handoffReadyPayload);
        var el = document.getElementById('status');
        if (el) el.textContent = 'Returning to Excel…';
        attempts += 1;
        if (attempts < 25) setTimeout(retry, 200);
      });
    }
    retry();
  });
</script>
</body>
</html>`}function u(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Sign-in failed</h1>
<p>${e.replace(/</g,"&lt;")}</p>
<script>
  Office.onReady(function() {
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${t});
      }
    } catch (e) { }
  });
</script>
</body>
</html>`}},6140:(e,t,n)=>{n.d(t,{S:()=>s});var i=n(218),r=n(1328);function s(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,i.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},1328:(e,t,n)=>{n.d(t,{j:()=>i});function i(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),i=t.X(0,[5942,3084,3786],()=>n(2402));module.exports=i})();