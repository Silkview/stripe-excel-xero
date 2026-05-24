"use strict";(()=>{var e={};e.id=5901,e.ids=[5901],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1317:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>m,patchFetch:()=>y,requestAsyncStorage:()=>l,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>p});var i={};n.r(i),n.d(i,{POST:()=>u});var r=n(3277),s=n(5265),a=n(5356),o=n(6140);async function c(e,t){let n=t.trim().toLowerCase(),i=1;for(let t=0;t<10;t++){let{data:t,error:r}=await e.auth.admin.listUsers({page:i,perPage:200});if(r||!t.users.length)break;let s=t.users.find(e=>e.email?.trim().toLowerCase()===n);if(s){let e=(s.identities??[]).map(e=>e.provider);return{userFound:!0,emailConfirmed:!!s.email_confirmed_at,hasEmailPasswordIdentity:e.includes("email")}}if(!t.nextPage)break;i=t.nextPage}return{userFound:!1,emailConfirmed:!1,hasEmailPasswordIdentity:!1}}var f=n(1985);async function u(e){let t=await e.json().catch(()=>({})),n="string"==typeof t.email?t.email.trim().toLowerCase():"";if(!n)return(0,f.bg)("VALIDATION_ERROR","email is required.",400);try{let e=(0,o.S)(),t=await c(e,n);return(0,f.jsonSuccess)(t)}catch(t){let e=t instanceof Error?t.message:"hint lookup failed";return(0,f.bg)("HINT_ERROR",e,500)}}let d=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/signin-hint/route",pathname:"/api/auth/signin-hint",filename:"route",bundlePath:"app/api/auth/signin-hint/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signin-hint/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:l,staticGenerationAsyncStorage:p,serverHooks:h}=d,m="/api/auth/signin-hint/route";function y(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:p})}},1985:(e,t,n)=>{n.d(t,{tb:()=>s,ff:()=>f,hd:()=>c,ds:()=>d,bx:()=>u,bg:()=>o,jsonSuccess:()=>a});var i=n(7076);let r="Silkview Connect",s=15e3;function a(e,t=200){return i.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,n=400,r){let s={success:!1,error:{code:e,message:t,...r}};return i.NextResponse.json(s,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),i="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,s=function(e,t){if(t)return`${r} connected`;let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),a=n?"You can close this tab and return to Excel.":i??"Please close this tab and try again from the add-in.";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${r}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${s}</h1>
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
</html>`}function f(e,t){return c({status:"error",provider:e,message:t})}function u(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),i=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),s=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
    var signedInPayload = ${i};
    var handoffReadyPayload = ${s};
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
</html>`}},6140:(e,t,n)=>{n.d(t,{S:()=>s});var i=n(218),r=n(1328);function s(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,i.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},1328:(e,t,n)=>{n.d(t,{j:()=>i});function i(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),i=t.X(0,[5942,3084,3786],()=>n(1317));module.exports=i})();