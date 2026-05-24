"use strict";(()=>{var e={};e.id=7603,e.ids=[7603],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},84709:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>d,routeModule:()=>f,serverHooks:()=>p,staticGenerationAsyncStorage:()=>l});var n={};s.r(n),s.d(n,{POST:()=>u});var a=s(93277),r=s(15265),i=s(55356),o=s(28009),c=s(21985);async function u(e){let t=await e.json().catch(()=>({})),s="string"==typeof t.access_token?t.access_token:"",n="string"==typeof t.refresh_token?t.refresh_token:"";if(!s||!n)return(0,c.bg)("VALIDATION_ERROR","access_token and refresh_token are required.",400);let a=await (0,o.u)(),{error:r}=await a.auth.setSession({access_token:s,refresh_token:n});return r?(0,c.bg)("AUTH_ERROR",r.message,401):(0,c.jsonSuccess)({ok:!0})}let f=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/auth/session/route",pathname:"/api/auth/session",filename:"route",bundlePath:"app/api/auth/session/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/session/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:d,staticGenerationAsyncStorage:l,serverHooks:p}=f,h="/api/auth/session/route";function y(){return(0,i.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:l})}},21985:(e,t,s)=>{s.d(t,{tb:()=>r,ff:()=>u,hd:()=>c,ds:()=>d,bx:()=>f,bg:()=>o,jsonSuccess:()=>i});var n=s(67076);let a="Silkview Connect",r=15e3;function i(e,t=200){return n.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,s=400,a){let r={success:!1,error:{code:e,message:t,...a}};return n.NextResponse.json(r,{status:s})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),s="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),n="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,r=function(e,t){if(t)return`${a} connected`;let s="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===s?"Xero not connected":"stripe"===s?"Stripe not connected":"Connection failed"}(e,s),i="You can close this tab and return to Excel.",o=s?i:n??"Please close this tab and try again from the add-in.",c=JSON.stringify("You can close this tab and return to the dashboard.").replace(/</g,"\\u003c"),u=JSON.stringify(i).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${a}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${r}</h1>
<p id="status">${o}</p>
<script>
  (function() {
    var payload = ${t};
    var isSuccess = ${s?"true":"false"};
    if (isSuccess && window.opener && !window.opener.closed) {
      var statusEl = document.getElementById('status');
      if (statusEl) statusEl.textContent = ${c};
      try {
        window.opener.postMessage(
          { type: 'silkview_oauth', ...payload },
          window.location.origin
        );
      } catch (e) { }
    }
  })();
  Office.onReady(function() {
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${t});
        var statusEl = document.getElementById('status');
        if (statusEl && ${s?"true":"false"}) {
          statusEl.textContent = ${u};
        }
      }
    } catch (e) { }
  });
</script>
</body>
</html>`}function u(e,t){return c({status:"error",provider:e,message:t})}function f(e,t){let s=JSON.stringify(t??"").replace(/</g,"\\u003c"),n=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),r=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${a}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${n};
    var handoffReadyPayload = ${r};
    var handoffNonce = ${s};
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
</html>`}function d(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${a}</title>
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
</html>`}},31328:(e,t,s)=>{s.d(t,{j:()=>n});function n(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},28009:(e,t,s)=>{s.d(t,{u:()=>i});var n=s(10403),a=s(36701),r=s(31328);async function i(){let e=await (0,a.cookies)(),{url:t,anonKey:s}=(0,r.j)();return(0,n.createServerClient)(t,s,{cookies:{get:t=>e.get(t)?.value,set(t,s,n){e.set({name:t,value:s,...n})},remove(t,s){e.set({name:t,value:"",...s})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[5942,3084,3786,8769],()=>s(84709));module.exports=n})();