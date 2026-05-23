"use strict";(()=>{var e={};e.id=7603,e.ids=[7603],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4709:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>h,patchFetch:()=>m,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>d});var n={};s.r(n),s.d(n,{POST:()=>u});var r=s(3277),a=s(5265),i=s(5356),o=s(8009),c=s(8248);async function u(e){let t=await e.json().catch(()=>({})),s="string"==typeof t.access_token?t.access_token:"",n="string"==typeof t.refresh_token?t.refresh_token:"";if(!s||!n)return(0,c.bg)("VALIDATION_ERROR","access_token and refresh_token are required.",400);let r=await (0,o.u)(),{error:a}=await r.auth.setSession({access_token:s,refresh_token:n});return a?(0,c.bg)("AUTH_ERROR",a.message,401):(0,c.jsonSuccess)({ok:!0})}let p=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/session/route",pathname:"/api/auth/session",filename:"route",bundlePath:"app/api/auth/session/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/session/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:l,staticGenerationAsyncStorage:d,serverHooks:f}=p,h="/api/auth/session/route";function m(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:d})}},8248:(e,t,s)=>{s.d(t,{bg:()=>i,ff:()=>c,hd:()=>o,jsonSuccess:()=>a,tb:()=>r});var n=s(7076);let r=15e3;function a(e,t=200){return n.NextResponse.json({success:!0,data:e},{status:t})}function i(e,t,s=400,r){let a={success:!1,error:{code:e,message:t,...r}};return n.NextResponse.json(a,{status:s})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),s="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),n="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${s?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${s?"You can close this tab and return to Excel.":n??"Please close this tab and try again from the add-in."}</p>
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
</html>`}function c(e,t){return o({status:"error",provider:e,message:t})}},1328:(e,t,s)=>{s.d(t,{j:()=>n});function n(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},8009:(e,t,s)=>{s.d(t,{u:()=>i});var n=s(403),r=s(6701),a=s(1328);async function i(){let e=await (0,r.cookies)(),{url:t,anonKey:s}=(0,a.j)();return(0,n.createServerClient)(t,s,{cookies:{get:t=>e.get(t)?.value,set(t,s,n){e.set({name:t,value:s,...n})},remove(t,s){e.set({name:t,value:"",...s})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[5942,3084,3786,8769],()=>s(4709));module.exports=n})();