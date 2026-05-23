"use strict";(()=>{var e={};e.id=3654,e.ids=[3654],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2402:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>m,requestAsyncStorage:()=>p,routeModule:()=>f,serverHooks:()=>l,staticGenerationAsyncStorage:()=>d});var s={};r.r(s),r.d(s,{POST:()=>u});var i=r(3277),n=r(5265),a=r(5356),o=r(6140),c=r(8248);async function u(e){if(e.headers.get("x-webhook-secret")!==process.env.SUPABASE_SERVICE_ROLE_KEY)return(0,c.bg)("FORBIDDEN","Invalid webhook secret.",403);let{userId:t}=await e.json();if(!t)return(0,c.bg)("VALIDATION_ERROR","userId is required.",400);try{if("true"===process.env.SUPABASE_AUTO_CONFIRM_EMAIL){let e=(0,o.S)();await e.auth.admin.updateUserById(t,{email_confirm:!0})}return(0,c.jsonSuccess)({ok:!0})}catch(t){let e=t instanceof Error?t.message:"Webhook failed.";return(0,c.bg)("DB_ERROR",e,500)}}let f=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/auth/signup/route",pathname:"/api/auth/signup",filename:"route",bundlePath:"app/api/auth/signup/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signup/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:l}=f,h="/api/auth/signup/route";function m(){return(0,a.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:d})}},8248:(e,t,r)=>{r.d(t,{bg:()=>a,bx:()=>u,ds:()=>f,ff:()=>c,hd:()=>o,jsonSuccess:()=>n,tb:()=>i});var s=r(7076);let i=15e3;function n(e,t=200){return s.NextResponse.json({success:!0,data:e},{status:t})}function a(e,t,r=400,i){let n={success:!1,error:{code:e,message:t,...i}};return s.NextResponse.json(n,{status:r})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),r="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),s="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${r?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${r?"You can close this tab and return to Excel.":s??"Please close this tab and try again from the add-in."}</p>
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
</html>`}function c(e,t){return o({status:"error",provider:e,message:t})}function u(e){let t=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p>You can close this window and return to Excel.</p>
<script>
  Office.onReady(function() {
    var payload = ${t};
    var attempts = 0;
    function sendToParent() {
      try {
        if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
          Office.context.ui.messageParent(payload);
          return true;
        }
      } catch (e) { }
      return false;
    }
    function retry() {
      if (sendToParent()) return;
      attempts += 1;
      if (attempts < 8) setTimeout(retry, 200);
    }
    retry();
  });
</script>
</body>
</html>`}function f(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}},6140:(e,t,r)=>{r.d(t,{S:()=>n});var s=r(218),i=r(1328);function n(){let{url:e}=(0,i.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,s.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},1328:(e,t,r)=>{r.d(t,{j:()=>s});function s(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[5942,3084,3786],()=>r(2402));module.exports=s})();