"use strict";(()=>{var e={};e.id=7603,e.ids=[7603],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4709:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>m,patchFetch:()=>h,requestAsyncStorage:()=>p,routeModule:()=>f,serverHooks:()=>d,staticGenerationAsyncStorage:()=>l});var i={};s.r(i),s.d(i,{POST:()=>u});var n=s(3277),r=s(5265),a=s(5356),o=s(8009),c=s(8248);async function u(e){let t=await e.json().catch(()=>({})),s="string"==typeof t.access_token?t.access_token:"",i="string"==typeof t.refresh_token?t.refresh_token:"";if(!s||!i)return(0,c.bg)("VALIDATION_ERROR","access_token and refresh_token are required.",400);let n=await (0,o.u)(),{error:r}=await n.auth.setSession({access_token:s,refresh_token:i});return r?(0,c.bg)("AUTH_ERROR",r.message,401):(0,c.jsonSuccess)({ok:!0})}let f=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/auth/session/route",pathname:"/api/auth/session",filename:"route",bundlePath:"app/api/auth/session/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/session/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:l,serverHooks:d}=f,m="/api/auth/session/route";function h(){return(0,a.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:l})}},8248:(e,t,s)=>{s.d(t,{bg:()=>a,bx:()=>u,ds:()=>f,ff:()=>c,hd:()=>o,jsonSuccess:()=>r,tb:()=>n});var i=s(7076);let n=15e3;function r(e,t=200){return i.NextResponse.json({success:!0,data:e},{status:t})}function a(e,t,s=400,n){let r={success:!1,error:{code:e,message:t,...n}};return i.NextResponse.json(r,{status:s})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),s="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),i="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${s?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${s?"You can close this tab and return to Excel.":i??"Please close this tab and try again from the add-in."}</p>
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
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${t});
      }
    } catch (e) { }
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
</html>`}},1328:(e,t,s)=>{s.d(t,{j:()=>i});function i(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},8009:(e,t,s)=>{s.d(t,{u:()=>a});var i=s(403),n=s(6701),r=s(1328);async function a(){let e=await (0,n.cookies)(),{url:t,anonKey:s}=(0,r.j)();return(0,i.createServerClient)(t,s,{cookies:{get:t=>e.get(t)?.value,set(t,s,i){e.set({name:t,value:s,...i})},remove(t,s){e.set({name:t,value:"",...s})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),i=t.X(0,[5942,3084,3786,8769],()=>s(4709));module.exports=i})();