"use strict";(()=>{var e={};e.id=5901,e.ids=[5901],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},81317:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>m,patchFetch:()=>y,requestAsyncStorage:()=>l,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>p});var i={};n.r(i),n.d(i,{POST:()=>f});var s=n(93277),a=n(15265),r=n(55356),o=n(26140);async function c(e,t){let n=t.trim().toLowerCase(),i=1;for(let t=0;t<10;t++){let{data:t,error:s}=await e.auth.admin.listUsers({page:i,perPage:200});if(s||!t.users.length)break;let a=t.users.find(e=>e.email?.trim().toLowerCase()===n);if(a){let e=(a.identities??[]).map(e=>e.provider);return{userFound:!0,emailConfirmed:!!a.email_confirmed_at,hasEmailPasswordIdentity:e.includes("email")}}if(!t.nextPage)break;i=t.nextPage}return{userFound:!1,emailConfirmed:!1,hasEmailPasswordIdentity:!1}}var u=n(21985);async function f(e){let t=await e.json().catch(()=>({})),n="string"==typeof t.email?t.email.trim().toLowerCase():"";if(!n)return(0,u.bg)("VALIDATION_ERROR","email is required.",400);try{let e=(0,o.S)(),t=await c(e,n);return(0,u.jsonSuccess)(t)}catch(t){let e=t instanceof Error?t.message:"hint lookup failed";return(0,u.bg)("HINT_ERROR",e,500)}}let d=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/signin-hint/route",pathname:"/api/auth/signin-hint",filename:"route",bundlePath:"app/api/auth/signin-hint/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signin-hint/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:l,staticGenerationAsyncStorage:p,serverHooks:h}=d,m="/api/auth/signin-hint/route";function y(){return(0,r.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:p})}},21985:(e,t,n)=>{n.d(t,{tb:()=>a,ff:()=>u,hd:()=>c,ds:()=>d,bx:()=>f,bg:()=>o,jsonSuccess:()=>r});var i=n(67076);let s="Silkview Connect",a=15e3;function r(e,t=200){return i.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,n=400,s){let a={success:!1,error:{code:e,message:t,...s}};return i.NextResponse.json(a,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),i="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,a=function(e,t){if(t)return`${s} connected`;let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),r="You can close this tab and return to Excel.",o=n?r:i??"Please close this tab and try again from the add-in.",c=JSON.stringify("You can close this tab and return to the dashboard.").replace(/</g,"\\u003c"),u=JSON.stringify(r).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${s}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${a}</h1>
<p id="status">${o}</p>
<script>
  (function() {
    var payload = ${t};
    var isSuccess = ${n?"true":"false"};
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
        if (statusEl && ${n?"true":"false"}) {
          statusEl.textContent = ${u};
        }
      }
    } catch (e) { }
  });
</script>
</body>
</html>`}function u(e,t){return c({status:"error",provider:e,message:t})}function f(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),i=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),a=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${s}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${i};
    var handoffReadyPayload = ${a};
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
  <title>${s}</title>
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
</html>`}},26140:(e,t,n)=>{n.d(t,{S:()=>a});var i=n(40218),s=n(31328);function a(){let{url:e}=(0,s.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,i.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},31328:(e,t,n)=>{n.d(t,{j:()=>i});function i(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),i=t.X(0,[5942,3084,3786],()=>n(81317));module.exports=i})();