"use strict";(()=>{var e={};e.id=6290,e.ids=[6290],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2426:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>x,patchFetch:()=>S,requestAsyncStorage:()=>m,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>y});var n={};s.r(n),s.d(n,{GET:()=>p,OPTIONS:()=>l,POST:()=>d});var r=s(3277),o=s(5265),i=s(5356),a=s(7076),c=s(8793),f=s(8248),u=s(6771);async function l(e){return(0,u.o)(e,new a.NextResponse(null,{status:204}))}async function p(e){let t=new URL(e.url),s=t.searchParams.get("nonce")?.trim();if(!s)return(0,u.o)(e,(0,f.bg)("INVALID_REQUEST","Missing handoff nonce.",400));let n=await (0,c.K)(s);return n?(0,u.o)(e,(0,f.jsonSuccess)({ready:!0,accessToken:n})):(0,u.o)(e,(0,f.jsonSuccess)({ready:!1}))}async function d(e){try{let t=await e.json().catch(()=>({})),s="string"==typeof t.nonce?t.nonce.trim():"",n="string"==typeof t.accessToken?t.accessToken.trim():"";if(!s||!n)return(0,u.o)(e,(0,f.bg)("INVALID_REQUEST","Missing nonce or access token.",400));return await (0,c.L)(s,n),(0,u.o)(e,(0,f.jsonSuccess)({ok:!0}))}catch{return(0,u.o)(e,(0,f.bg)("AUTH_REQUIRED","Please sign in.",401))}}let h=new r.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/auth/excel-handoff/route",pathname:"/api/auth/excel-handoff",filename:"route",bundlePath:"app/api/auth/excel-handoff/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/excel-handoff/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:y,serverHooks:g}=h,x="/api/auth/excel-handoff/route";function S(){return(0,i.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:y})}},8248:(e,t,s)=>{s.d(t,{bg:()=>i,bx:()=>f,ds:()=>u,ff:()=>c,hd:()=>a,jsonSuccess:()=>o,tb:()=>r});var n=s(7076);let r=15e3;function o(e,t=200){return n.NextResponse.json({success:!0,data:e},{status:t})}function i(e,t,s=400,r){let o={success:!1,error:{code:e,message:t,...r}};return n.NextResponse.json(o,{status:s})}function a(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),s="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),n="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
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
</html>`}function c(e,t){return a({status:"error",provider:e,message:t})}function f(e){let t=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}},8793:(e,t,s)=>{s.d(t,{K:()=>i,L:()=>o});var n=s(6140),r=s(438);async function o(e,t){let s=(0,n.S)(),o=new Date(Date.now()+18e4).toISOString();await (0,r.v)(s).from("excel_auth_handoffs").upsert({nonce:e,access_token:t,expires_at:o})}async function i(e){let t=(0,n.S)(),{data:s,error:o}=await (0,r.v)(t).from("excel_auth_handoffs").select("access_token, expires_at").eq("nonce",e).maybeSingle();return(await (0,r.v)(t).from("excel_auth_handoffs").delete().eq("nonce",e),o||!s?.access_token||new Date(s.expires_at).getTime()<Date.now())?null:s.access_token}},6771:(e,t,s)=>{s.d(t,{o:()=>o,t:()=>i});var n=s(7076);let r=[process.env.FRONTEND_URL,"http://localhost:4003",process.env.NEXT_PUBLIC_ADDIN_URL,"https://localhost:4000","http://localhost:4000","https://addin.silkview.org"].filter(Boolean).map(e=>e.replace(/\/$/,""));function o(e,t){let s=e.headers.get("origin");return s&&r.includes(s)&&(t.headers.set("Access-Control-Allow-Origin",s),t.headers.set("Access-Control-Allow-Credentials","true"),t.headers.set("Access-Control-Allow-Headers","Content-Type, Authorization, X-Workspace-Id"),t.headers.set("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS")),t}function i(e){return o(e,new n.NextResponse(null,{status:204}))}},6140:(e,t,s)=>{s.d(t,{S:()=>o});var n=s(218),r=s(1328);function o(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,n.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,s)=>{s.d(t,{v:()=>n});function n(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,s)=>{s.d(t,{j:()=>n});function n(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[5942,3084,3786],()=>s(2426));module.exports=n})();