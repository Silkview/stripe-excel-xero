"use strict";(()=>{var e={};e.id=5901,e.ids=[5901],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1317:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>h,patchFetch:()=>g,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>f});var r={};i.r(r),i.d(r,{POST:()=>l});var n=i(3277),s=i(5265),a=i(5356),o=i(6140);async function c(e,t){let i=t.trim().toLowerCase(),r=1;for(let t=0;t<10;t++){let{data:t,error:n}=await e.auth.admin.listUsers({page:r,perPage:200});if(n||!t.users.length)break;let s=t.users.find(e=>e.email?.trim().toLowerCase()===i);if(s){let e=(s.identities??[]).map(e=>e.provider);return{userFound:!0,emailConfirmed:!!s.email_confirmed_at,hasEmailPasswordIdentity:e.includes("email")}}if(!t.nextPage)break;r=t.nextPage}return{userFound:!1,emailConfirmed:!1,hasEmailPasswordIdentity:!1}}var u=i(8248);async function l(e){let t=await e.json().catch(()=>({})),i="string"==typeof t.email?t.email.trim().toLowerCase():"";if(!i)return(0,u.bg)("VALIDATION_ERROR","email is required.",400);try{let e=(0,o.S)(),t=await c(e,i);return(0,u.jsonSuccess)(t)}catch(t){let e=t instanceof Error?t.message:"hint lookup failed";return(0,u.bg)("HINT_ERROR",e,500)}}let d=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/signin-hint/route",pathname:"/api/auth/signin-hint",filename:"route",bundlePath:"app/api/auth/signin-hint/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/signin-hint/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:p,staticGenerationAsyncStorage:f,serverHooks:m}=d,h="/api/auth/signin-hint/route";function g(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:f})}},8248:(e,t,i)=>{i.d(t,{bg:()=>a,ff:()=>c,hd:()=>o,jsonSuccess:()=>s,tb:()=>n});var r=i(7076);let n=15e3;function s(e,t=200){return r.NextResponse.json({success:!0,data:e},{status:t})}function a(e,t,i=400,n){let s={success:!1,error:{code:e,message:t,...n}};return r.NextResponse.json(s,{status:i})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),i="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),r="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${i?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${i?"You can close this tab and return to Excel.":r??"Please close this tab and try again from the add-in."}</p>
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
</html>`}function c(e,t){return o({status:"error",provider:e,message:t})}},6140:(e,t,i)=>{i.d(t,{S:()=>s});var r=i(218),n=i(1328);function s(){let{url:e}=(0,n.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,r.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},1328:(e,t,i)=>{i.d(t,{j:()=>r});function r(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[5942,3084,3786],()=>i(1317));module.exports=r})();