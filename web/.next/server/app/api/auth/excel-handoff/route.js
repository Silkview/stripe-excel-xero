"use strict";(()=>{var e={};e.id=6290,e.ids=[6290],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2426:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>x,patchFetch:()=>S,requestAsyncStorage:()=>m,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>y});var s={};n.r(s),n.d(s,{GET:()=>p,OPTIONS:()=>l,POST:()=>d});var r=n(3277),a=n(5265),o=n(5356),i=n(7076),c=n(8793),u=n(8248),f=n(6771);async function l(e){return(0,f.o)(e,new i.NextResponse(null,{status:204}))}async function p(e){let t=new URL(e.url),n=t.searchParams.get("nonce")?.trim();if(!n)return(0,f.o)(e,(0,u.bg)("INVALID_REQUEST","Missing handoff nonce.",400));if(!await (0,c.do)(n))return(0,f.o)(e,(0,u.jsonSuccess)({ready:!1}));let s=await (0,c.KB)(n);return s?(0,f.o)(e,(0,u.jsonSuccess)({ready:!0,accessToken:s})):(0,f.o)(e,(0,u.jsonSuccess)({ready:!1}))}async function d(e){try{let t=await e.json().catch(()=>({})),n="string"==typeof t.nonce?t.nonce.trim():"",s="string"==typeof t.accessToken?t.accessToken.trim():"";if(!n||!s)return(0,f.o)(e,(0,u.bg)("INVALID_REQUEST","Missing nonce or access token.",400));return await (0,c.Lc)(n,s),(0,f.o)(e,(0,u.jsonSuccess)({ok:!0}))}catch{return(0,f.o)(e,(0,u.bg)("AUTH_REQUIRED","Please sign in.",401))}}let h=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/excel-handoff/route",pathname:"/api/auth/excel-handoff",filename:"route",bundlePath:"app/api/auth/excel-handoff/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/excel-handoff/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:y,serverHooks:g}=h,x="/api/auth/excel-handoff/route";function S(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:y})}},8248:(e,t,n)=>{n.d(t,{bg:()=>o,bx:()=>u,ds:()=>f,ff:()=>c,hd:()=>i,jsonSuccess:()=>a,tb:()=>r});var s=n(7076);let r=15e3;function a(e,t=200){return s.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,n=400,r){let a={success:!1,error:{code:e,message:t,...r}};return s.NextResponse.json(a,{status:n})}function i(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),s="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${n?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${n?"You can close this tab and return to Excel.":s??"Please close this tab and try again from the add-in."}</p>
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
</html>`}function c(e,t){return i({status:"error",provider:e,message:t})}function u(e){let t=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}},8793:(e,t,n)=>{n.d(t,{KB:()=>i,Lc:()=>a,do:()=>o});var s=n(6140),r=n(438);async function a(e,t){let n=(0,s.S)(),a=new Date(Date.now()+18e4).toISOString();await (0,r.v)(n).from("excel_auth_handoffs").upsert({nonce:e,access_token:t,expires_at:a})}async function o(e){let t=(0,s.S)(),{data:n,error:a}=await (0,r.v)(t).from("excel_auth_handoffs").select("access_token, expires_at").eq("nonce",e).maybeSingle();return a||!n?.access_token||new Date(n.expires_at).getTime()<Date.now()?null:n.access_token}async function i(e){let t=await o(e);if(!t)return null;let n=(0,s.S)();return await (0,r.v)(n).from("excel_auth_handoffs").delete().eq("nonce",e),t}},6771:(e,t,n)=>{n.d(t,{o:()=>a,t:()=>o});var s=n(7076);let r=[process.env.FRONTEND_URL,"http://localhost:4003",process.env.NEXT_PUBLIC_ADDIN_URL,"https://localhost:4000","http://localhost:4000","https://addin.silkview.org"].filter(Boolean).map(e=>e.replace(/\/$/,""));function a(e,t){let n=e.headers.get("origin");return n&&r.includes(n)&&(t.headers.set("Access-Control-Allow-Origin",n),t.headers.set("Access-Control-Allow-Credentials","true"),t.headers.set("Access-Control-Allow-Headers","Content-Type, Authorization, X-Workspace-Id"),t.headers.set("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS")),t}function o(e){return a(e,new s.NextResponse(null,{status:204}))}},6140:(e,t,n)=>{n.d(t,{S:()=>a});var s=n(218),r=n(1328);function a(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,s.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,n)=>{n.d(t,{v:()=>s});function s(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,n)=>{n.d(t,{j:()=>s});function s(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[5942,3084,3786],()=>n(2426));module.exports=s})();