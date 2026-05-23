"use strict";(()=>{var e={};e.id=6290,e.ids=[6290],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2426:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>g,patchFetch:()=>y,requestAsyncStorage:()=>p,routeModule:()=>f,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var a={};n.r(a),n.d(a,{GET:()=>l,POST:()=>d});var r=n(3277),i=n(5265),s=n(5356),c=n(7993),o=n(8793),u=n(8248);async function l(e){let t=new URL(e.url),n=t.searchParams.get("nonce")?.trim();if(!n)return(0,u.bg)("INVALID_REQUEST","Missing handoff nonce.",400);let a=await (0,o.K)(n);return a?(0,u.jsonSuccess)({ready:!0,accessToken:a}):(0,u.jsonSuccess)({ready:!1})}async function d(e){try{await (0,c.Vc)(e);let t=await e.json().catch(()=>({})),n="string"==typeof t.nonce?t.nonce.trim():"",a="string"==typeof t.accessToken?t.accessToken.trim():"";if(!n||!a)return(0,u.bg)("INVALID_REQUEST","Missing nonce or access token.",400);return await (0,o.L)(n,a),(0,u.jsonSuccess)({ok:!0})}catch{return(0,u.bg)("AUTH_REQUIRED","Please sign in.",401)}}let f=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/auth/excel-handoff/route",pathname:"/api/auth/excel-handoff",filename:"route",bundlePath:"app/api/auth/excel-handoff/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/excel-handoff/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:h}=f,g="/api/auth/excel-handoff/route";function y(){return(0,s.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}},7993:(e,t,n)=>{n.d(t,{QR:()=>c,Vc:()=>o,jm:()=>u,m6:()=>l});var a=n(8009),r=n(6140),i=n(438),s=n(2946);class c extends Error{constructor(e,t,n=401){super(t),this.code=e,this.status=n}}async function o(e){let t=e?function(e){let t=e.headers.get("authorization");return t?.startsWith("Bearer ")&&t.slice(7).trim()||null}(e):null;if(t){let e=(0,r.S)(),{data:n,error:i}=await e.auth.getUser(t);if(i||!n.user)throw new c("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:await (0,a.u)(),user:n.user}}let n=await (0,a.u)(),{data:{user:i},error:s}=await n.auth.getUser();if(s||!i)throw new c("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:n,user:i}}async function u(e){let{supabase:t,user:n}=await o(e),a=e.headers.get("x-workspace-id")||e.headers.get("X-Workspace-Id")||"";if(!a)throw new c("WORKSPACE_REQUIRED","Select a workspace before connecting or pulling data.",400);let u=(0,r.S)(),l=await (0,s.ud)(n.id,u);if(!l)throw new c("ACCOUNT_REQUIRED","No account found for this user.",403);let{data:d}=await (0,i.v)(u).from("workspaces").select("id, account_id").eq("id",a).eq("account_id",l.account_id).maybeSingle();if(!d)throw new c("WORKSPACE_FORBIDDEN","Workspace not found or access denied.",403);return{supabase:t,user:n,workspaceId:a,accountId:l.account_id}}async function l(e){return(0,s.ud)(e)}},8248:(e,t,n)=>{n.d(t,{bg:()=>s,bx:()=>u,ds:()=>l,ff:()=>o,hd:()=>c,jsonSuccess:()=>i,tb:()=>r});var a=n(7076);let r=15e3;function i(e,t=200){return a.NextResponse.json({success:!0,data:e},{status:t})}function s(e,t,n=400,r){let i={success:!1,error:{code:e,message:t,...r}};return a.NextResponse.json(i,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),a="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${n?"Silkview Sync connected":"Stripe not connected"}</h1>
<p>${n?"You can close this tab and return to Excel.":a??"Please close this tab and try again from the add-in."}</p>
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
</html>`}function o(e,t){return c({status:"error",provider:e,message:t})}function u(e){let t=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}function l(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}},2946:(e,t,n)=>{n.d(t,{$2:()=>l,Lb:()=>o,N0:()=>c,ud:()=>s,yU:()=>u,zp:()=>i});var a=n(6140),r=n(438);function i(e){return e?.code==="23505"}async function s(e,t){let n=t??(0,a.S)(),{data:i,error:s}=await (0,r.v)(n).from("account_users").select("account_id, role").eq("user_id",e).order("joined_at",{ascending:!0,nullsFirst:!1}).order("created_at",{ascending:!0}).limit(1);if(s)return console.error("getPrimaryAccountMembership:",s),null;let c=i?.[0];return c?.account_id?{account_id:c.account_id,role:c.role}:null}async function c(e,t){let n=t??(0,a.S)(),{data:i,error:s}=await (0,r.v)(n).from("workspaces").select("id").eq("account_id",e).order("created_at",{ascending:!0}).limit(1);if(s)return console.error("getPrimaryWorkspaceForAccount:",s),null;let c=i?.[0];return c?.id?{id:c.id}:null}async function o(e,t,n){let i=n??(0,a.S)(),s=t.trim().toLowerCase(),{data:c,error:o}=await (0,r.v)(i).from("workspaces").select("id, name").eq("account_id",e);if(o)return console.error("findWorkspaceByNameForAccount:",o),null;let u=(c??[]).find(e=>e.name.trim().toLowerCase()===s);return u?.id?{id:u.id}:null}async function u(e,t){let n=t??(0,a.S)();await (0,r.v)(n).from("accounts").update({onboarding_completed_at:new Date().toISOString()}).eq("id",e).is("onboarding_completed_at",null)}async function l(e,t){let n=t??(0,a.S)(),{count:i}=await (0,r.v)(n).from("account_users").select("id",{count:"exact",head:!0}).eq("account_id",e);0===i&&await (0,r.v)(n).from("accounts").delete().eq("id",e)}},8793:(e,t,n)=>{n.d(t,{K:()=>s,L:()=>i});var a=n(6140),r=n(438);async function i(e,t){let n=(0,a.S)(),i=new Date(Date.now()+18e4).toISOString();await (0,r.v)(n).from("excel_auth_handoffs").upsert({nonce:e,access_token:t,expires_at:i})}async function s(e){let t=(0,a.S)(),{data:n,error:i}=await (0,r.v)(t).from("excel_auth_handoffs").select("access_token, expires_at").eq("nonce",e).maybeSingle();return(await (0,r.v)(t).from("excel_auth_handoffs").delete().eq("nonce",e),i||!n?.access_token||new Date(n.expires_at).getTime()<Date.now())?null:n.access_token}},6140:(e,t,n)=>{n.d(t,{S:()=>i});var a=n(218),r=n(1328);function i(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,n)=>{n.d(t,{v:()=>a});function a(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,n)=>{n.d(t,{j:()=>a});function a(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},8009:(e,t,n)=>{n.d(t,{u:()=>s});var a=n(403),r=n(6701),i=n(1328);async function s(){let e=await (0,r.cookies)(),{url:t,anonKey:n}=(0,i.j)();return(0,a.createServerClient)(t,n,{cookies:{get:t=>e.get(t)?.value,set(t,n,a){e.set({name:t,value:n,...a})},remove(t,n){e.set({name:t,value:"",...n})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[5942,3084,3786,8769],()=>n(2426));module.exports=a})();