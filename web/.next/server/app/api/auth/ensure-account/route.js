"use strict";(()=>{var e={};e.id=5536,e.ids=[5536],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9539:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>y,patchFetch:()=>g,requestAsyncStorage:()=>p,routeModule:()=>f,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var a={};n.r(a),n.d(a,{POST:()=>l});var r=n(3277),o=n(5265),i=n(5356),s=n(2946);async function c(e,t,n){let a=await (0,s.ud)(e);if(a?.account_id)return{accountId:a.account_id,created:!1};throw Error("ONBOARDING_REQUIRED")}var u=n(7993),d=n(1985);async function l(e){try{let{user:t}=await (0,u.Vc)(e),n=await e.json().catch(()=>({})),a="string"==typeof n.accountName?n.accountName:t.user_metadata?.account_name,r=await c(t.id,t.email??"",a);return(0,d.jsonSuccess)(r)}catch(t){if(t instanceof u.QR)return(0,d.bg)(t.code,t.message,t.status);let e=t instanceof Error?t.message:"Failed to provision account.";if("ONBOARDING_REQUIRED"===e)return(0,d.jsonSuccess)({accountId:"",created:!1,needsOnboarding:!0});return(0,d.bg)("PROVISION_ERROR",e,500)}}let f=new r.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/auth/ensure-account/route",pathname:"/api/auth/ensure-account",filename:"route",bundlePath:"app/api/auth/ensure-account/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/ensure-account/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:h}=f,y="/api/auth/ensure-account/route";function g(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}},7993:(e,t,n)=>{n.d(t,{QR:()=>s,Vc:()=>c,jm:()=>d,m6:()=>l,x1:()=>u});var a=n(8009),r=n(6140),o=n(438),i=n(2946);class s extends Error{constructor(e,t,n=401){super(t),this.code=e,this.status=n}}async function c(e){let t=e?function(e){let t=e.headers.get("authorization");return t?.startsWith("Bearer ")&&t.slice(7).trim()||null}(e):null;if(t){let e=(0,r.S)(),{data:n,error:o}=await e.auth.getUser(t);if(o||!n.user)throw new s("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:await (0,a.u)(),user:n.user}}let n=await (0,a.u)(),{data:{user:o},error:i}=await n.auth.getUser();if(i||!o)throw new s("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:n,user:o}}async function u(e){let{supabase:t,user:n}=await c(e),a=await (0,i.ud)(n.id);if(!a)throw new s("ACCOUNT_REQUIRED","No account found for this user.",403);if("member"===a.role)throw new s("FORBIDDEN","Only account owners and admins can access this resource.",403);return{supabase:t,user:n,membership:a}}async function d(e){let{supabase:t,user:n}=await c(e),a=e.headers.get("x-workspace-id")||e.headers.get("X-Workspace-Id")||"";if(!a)throw new s("WORKSPACE_REQUIRED","Select a workspace before connecting or pulling data.",400);let u=(0,r.S)(),d=await (0,i.ud)(n.id,u);if(!d)throw new s("ACCOUNT_REQUIRED","No account found for this user.",403);let{data:l}=await (0,o.v)(u).from("workspaces").select("id, account_id").eq("id",a).eq("account_id",d.account_id).maybeSingle();if(!l)throw new s("WORKSPACE_FORBIDDEN","Workspace not found or access denied.",403);if("member"===d.role){let{data:e}=await (0,o.v)(u).from("account_users").select("id").eq("user_id",n.id).eq("account_id",d.account_id).maybeSingle();if(!e?.id)throw new s("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403);let{data:t}=await (0,o.v)(u).from("account_user_workspaces").select("workspace_id").eq("account_user_id",e.id).eq("workspace_id",a).maybeSingle();if(!t)throw new s("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403)}return{supabase:t,user:n,workspaceId:a,accountId:d.account_id,role:d.role}}async function l(e){return(0,i.ud)(e)}},1985:(e,t,n)=>{n.d(t,{tb:()=>o,ff:()=>u,hd:()=>c,ds:()=>l,bx:()=>d,bg:()=>s,jsonSuccess:()=>i});var a=n(7076);let r="Silkview Connect",o=15e3;function i(e,t=200){return a.NextResponse.json({success:!0,data:e},{status:t})}function s(e,t,n=400,r){let o={success:!1,error:{code:e,message:t,...r}};return a.NextResponse.json(o,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),a="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,o=function(e,t){if(t)return`${r} connected`;let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),i=n?"You can close this tab and return to Excel.":a??"Please close this tab and try again from the add-in.";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${r}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${o}</h1>
<p>${i}</p>
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
</html>`}function u(e,t){return c({status:"error",provider:e,message:t})}function d(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),a=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),o=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
    var signedInPayload = ${a};
    var handoffReadyPayload = ${o};
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
</html>`}function l(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
</html>`}},2946:(e,t,n)=>{n.d(t,{$2:()=>d,Lb:()=>c,N0:()=>s,ud:()=>i,yU:()=>u,zp:()=>o});var a=n(6140),r=n(438);function o(e){return e?.code==="23505"}async function i(e,t){let n=t??(0,a.S)(),{data:o,error:i}=await (0,r.v)(n).from("account_users").select("account_id, role").eq("user_id",e).order("joined_at",{ascending:!0,nullsFirst:!1}).order("created_at",{ascending:!0}).limit(1);if(i)return console.error("getPrimaryAccountMembership:",i),null;let s=o?.[0];return s?.account_id?{account_id:s.account_id,role:s.role}:null}async function s(e,t){let n=t??(0,a.S)(),{data:o,error:i}=await (0,r.v)(n).from("workspaces").select("id").eq("account_id",e).order("created_at",{ascending:!0}).limit(1);if(i)return console.error("getPrimaryWorkspaceForAccount:",i),null;let s=o?.[0];return s?.id?{id:s.id}:null}async function c(e,t,n){let o=n??(0,a.S)(),i=t.trim().toLowerCase(),{data:s,error:c}=await (0,r.v)(o).from("workspaces").select("id, name").eq("account_id",e);if(c)return console.error("findWorkspaceByNameForAccount:",c),null;let u=(s??[]).find(e=>e.name.trim().toLowerCase()===i);return u?.id?{id:u.id}:null}async function u(e,t){let n=t??(0,a.S)();await (0,r.v)(n).from("accounts").update({onboarding_completed_at:new Date().toISOString()}).eq("id",e).is("onboarding_completed_at",null)}async function d(e,t){let n=t??(0,a.S)(),{count:o}=await (0,r.v)(n).from("account_users").select("id",{count:"exact",head:!0}).eq("account_id",e);0===o&&await (0,r.v)(n).from("accounts").delete().eq("id",e)}},6140:(e,t,n)=>{n.d(t,{S:()=>o});var a=n(218),r=n(1328);function o(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,n)=>{n.d(t,{v:()=>a});function a(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,n)=>{n.d(t,{j:()=>a});function a(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},8009:(e,t,n)=>{n.d(t,{u:()=>i});var a=n(403),r=n(6701),o=n(1328);async function i(){let e=await (0,r.cookies)(),{url:t,anonKey:n}=(0,o.j)();return(0,a.createServerClient)(t,n,{cookies:{get:t=>e.get(t)?.value,set(t,n,a){e.set({name:t,value:n,...a})},remove(t,n){e.set({name:t,value:"",...n})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[5942,3084,3786,8769],()=>n(9539));module.exports=a})();