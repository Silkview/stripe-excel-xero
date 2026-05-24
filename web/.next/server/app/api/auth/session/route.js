"use strict";(()=>{var e={};e.id=7603,e.ids=[7603],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},84709:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>h,patchFetch:()=>m,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>l,staticGenerationAsyncStorage:()=>p});var s={};n.r(s),n.d(s,{POST:()=>f});var r=n(93277),i=n(15265),a=n(55356),o=n(28009),c=n(21985);async function f(e){let t=await e.json().catch(()=>({})),n="string"==typeof t.access_token?t.access_token:"",s="string"==typeof t.refresh_token?t.refresh_token:"";if(!n||!s)return(0,c.bg)("VALIDATION_ERROR","access_token and refresh_token are required.",400);let r=await (0,o.u)(),{error:i}=await r.auth.setSession({access_token:n,refresh_token:s});return i?(0,c.bg)("AUTH_ERROR",i.message,401):(0,c.jsonSuccess)({ok:!0})}let u=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/session/route",pathname:"/api/auth/session",filename:"route",bundlePath:"app/api/auth/session/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/session/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:l}=u,h="/api/auth/session/route";function m(){return(0,a.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:p})}},21985:(e,t,n)=>{n.d(t,{tb:()=>i,ff:()=>f,hd:()=>c,ds:()=>d,bx:()=>u,bg:()=>o,jsonSuccess:()=>a});var s=n(67076);let r="Silkview Connect",i=15e3;function a(e,t=200){return s.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,n=400,r){let i={success:!1,error:{code:e,message:t,...r}};return s.NextResponse.json(i,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),s="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,i=function(e,t){if(t)return`${r} connected`;let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),a=n?"You can close this tab and return to Excel.":s??"Please close this tab and try again from the add-in.";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${r}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${i}</h1>
<p>${a}</p>
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
</html>`}function f(e,t){return c({status:"error",provider:e,message:t})}function u(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),s=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),i=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${r}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${s};
    var handoffReadyPayload = ${i};
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
</html>`}function d(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${r}</title>
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
</html>`}},31328:(e,t,n)=>{n.d(t,{j:()=>s});function s(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},28009:(e,t,n)=>{n.d(t,{u:()=>a});var s=n(10403),r=n(36701),i=n(31328);async function a(){let e=await (0,r.cookies)(),{url:t,anonKey:n}=(0,i.j)();return(0,s.createServerClient)(t,n,{cookies:{get:t=>e.get(t)?.value,set(t,n,s){e.set({name:t,value:n,...s})},remove(t,n){e.set({name:t,value:"",...n})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[5942,3084,3786,8769],()=>n(84709));module.exports=s})();