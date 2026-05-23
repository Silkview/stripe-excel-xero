"use strict";(()=>{var e={};e.id=5901,e.ids=[5901],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1317:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>h,patchFetch:()=>g,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var s={};i.r(s),i.d(s,{POST:()=>f});var r=i(3277),n=i(5265),a=i(5356),o=i(6140);async function c(e,t){let i=t.trim().toLowerCase(),s=1;for(let t=0;t<10;t++){let{data:t,error:r}=await e.auth.admin.listUsers({page:s,perPage:200});if(r||!t.users.length)break;let n=t.users.find(e=>e.email?.trim().toLowerCase()===i);if(n){let e=(n.identities??[]).map(e=>e.provider);return{userFound:!0,emailConfirmed:!!n.email_confirmed_at,hasEmailPasswordIdentity:e.includes("email")}}if(!t.nextPage)break;s=t.nextPage}return{userFound:!1,emailConfirmed:!1,hasEmailPasswordIdentity:!1}}var u=i(8248);async function f(e){let t=await e.json().catch(()=>({})),i="string"==typeof t.email?t.email.trim().toLowerCase():"";if(!i)return(0,u.bg)("VALIDATION_ERROR","email is required.",400);try{let e=(0,o.S)(),t=await c(e,i);return(0,u.jsonSuccess)(t)}catch(t){let e=t instanceof Error?t.message:"hint lookup failed";return(0,u.bg)("HINT_ERROR",e,500)}}let l=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/auth/signin-hint/route",pathname:"/api/auth/signin-hint",filename:"route",bundlePath:"app/api/auth/signin-hint/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signin-hint/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=l,h="/api/auth/signin-hint/route";function g(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}},8248:(e,t,i)=>{i.d(t,{bg:()=>a,bx:()=>u,ds:()=>f,ff:()=>c,hd:()=>o,jsonSuccess:()=>n,tb:()=>r});var s=i(7076);let r=15e3;function n(e,t=200){return s.NextResponse.json({success:!0,data:e},{status:t})}function a(e,t,i=400,r){let n={success:!1,error:{code:e,message:t,...r}};return s.NextResponse.json(n,{status:i})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),i="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),s="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${i?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${i?"You can close this tab and return to Excel.":s??"Please close this tab and try again from the add-in."}</p>
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
</html>`}},6140:(e,t,i)=>{i.d(t,{S:()=>n});var s=i(218),r=i(1328);function n(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,s.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},1328:(e,t,i)=>{i.d(t,{j:()=>s});function s(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),s=t.X(0,[5942,3084,3786],()=>i(1317));module.exports=s})();