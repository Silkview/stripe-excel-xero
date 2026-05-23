"use strict";(()=>{var e={};e.id=3341,e.ids=[3341],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8581:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>y,patchFetch:()=>v,requestAsyncStorage:()=>w,routeModule:()=>_,serverHooks:()=>g,staticGenerationAsyncStorage:()=>x});var a={};n.r(a),n.d(a,{GET:()=>h});var r=n(3277),s=n(5265),i=n(5356),o=n(7076),c=n(7993),u=n(8248);async function d(e){let{data:t}=await e.auth.mfa.getAuthenticatorAssuranceLevel(),{data:n}=await e.auth.mfa.listFactors(),a=n?.totp?.find(e=>"verified"===e.status)??null,r=t?.currentLevel??null,s=t?.nextLevel??null;return{currentLevel:r,nextLevel:s,needsVerification:!!a&&"aal1"===r&&"aal2"===s,hasVerifiedTotp:!!a,totpFactorId:a?.id??null}}async function l(e){var t;let{data:{user:n}}=await e.auth.getUser(),a=await d(e);return!a.hasVerifiedTotp&&!a.needsVerification&&(t=n?.user_metadata,t?.mfa_enroll_skipped!==!0)}var f=n(7305);async function p(e,t){let n=t?.excelMode??!1,{data:{user:a}}=await e.auth.getUser();return a&&(await (0,f.V2)(a.id,a.user_metadata)).needsOnboarding?n?"/onboarding?return=excel":"/onboarding":(await d(e)).needsVerification?n?"/auth/mfa/verify?return=excel":"/auth/mfa/verify":await l(e)?n?"/auth/excel?step=mfa":"/auth/mfa/enroll":n?"/api/auth/excel-finish":"/dashboard"}var m=n(8793);async function h(e){let t=new URL(e.url),n=t.searchParams.get("handoff")?.trim()||null,a=Number(t.searchParams.get("r")??"0");try{let{supabase:r}=await (0,c.Vc)(e);if(a>8)return new o.NextResponse((0,u.ds)("Sign-in is stuck in a redirect loop. Close this window and try again from Excel."),{headers:{"Content-Type":"text/html; charset=utf-8"}});let{data:s,error:i}=await r.auth.refreshSession();if(i)return new o.NextResponse((0,u.ds)(i.message),{headers:{"Content-Type":"text/html; charset=utf-8"}});let d=s.session;if(!d?.access_token){let e=new URL("/auth/excel",t.origin);return o.NextResponse.redirect(e)}let l=await p(r,{excelMode:!0});if("/api/auth/excel-finish"!==l&&"/auth/excel-complete"!==l){let e=new URL(l,t.origin);return e.searchParams.set("r",String(a+1)),n&&e.searchParams.set("handoff",n),o.NextResponse.redirect(e)}if(!n)return console.error("[excel-auth-audit]",JSON.stringify({location:"excel-finish",message:"saveHandoff skipped",reason:"missing handoff query param"})),new o.NextResponse((0,u.ds)("Excel sign-in is missing its session handoff. Close this window, return to the task pane, and click Sign in again."),{headers:{"Content-Type":"text/html; charset=utf-8"}});try{await (0,m.Lc)(n,d.access_token)}catch(t){let e=t instanceof Error?t.message:"Could not store handoff.";return console.error("[excel-auth-audit]",JSON.stringify({location:"excel-finish",message:"saveHandoff error",detail:e.slice(0,200)})),new o.NextResponse((0,u.ds)(`Sign-in succeeded but Excel could not receive your session. Apply Supabase migration 008_excel_auth_handoffs.sql, then try again. (${e})`),{headers:{"Content-Type":"text/html; charset=utf-8"}})}return console.log("[excel-auth-audit]",JSON.stringify({location:"excel-finish",hasHandoff:!!n,saveHandoff:"ok"})),new o.NextResponse((0,u.bx)(d.access_token,n),{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(t){let e=t instanceof Error?t.message:"Sign-in could not be completed.";return new o.NextResponse((0,u.ds)(e),{headers:{"Content-Type":"text/html; charset=utf-8"}})}}let _=new r.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/excel-finish/route",pathname:"/api/auth/excel-finish",filename:"route",bundlePath:"app/api/auth/excel-finish/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/excel-finish/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:w,staticGenerationAsyncStorage:x,serverHooks:g}=_,y="/api/auth/excel-finish/route";function v(){return(0,i.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:x})}},7993:(e,t,n)=>{n.d(t,{QR:()=>o,Vc:()=>c,jm:()=>d,m6:()=>l,x1:()=>u});var a=n(8009),r=n(6140),s=n(438),i=n(2946);class o extends Error{constructor(e,t,n=401){super(t),this.code=e,this.status=n}}async function c(e){let t=e?function(e){let t=e.headers.get("authorization");return t?.startsWith("Bearer ")&&t.slice(7).trim()||null}(e):null;if(t){let e=(0,r.S)(),{data:n,error:s}=await e.auth.getUser(t);if(s||!n.user)throw new o("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:await (0,a.u)(),user:n.user}}let n=await (0,a.u)(),{data:{user:s},error:i}=await n.auth.getUser();if(i||!s)throw new o("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:n,user:s}}async function u(e){let{supabase:t,user:n}=await c(e),a=await (0,i.ud)(n.id);if(!a)throw new o("ACCOUNT_REQUIRED","No account found for this user.",403);if("member"===a.role)throw new o("FORBIDDEN","Only account owners and admins can access this resource.",403);return{supabase:t,user:n,membership:a}}async function d(e){let{supabase:t,user:n}=await c(e),a=e.headers.get("x-workspace-id")||e.headers.get("X-Workspace-Id")||"";if(!a)throw new o("WORKSPACE_REQUIRED","Select a workspace before connecting or pulling data.",400);let u=(0,r.S)(),d=await (0,i.ud)(n.id,u);if(!d)throw new o("ACCOUNT_REQUIRED","No account found for this user.",403);let{data:l}=await (0,s.v)(u).from("workspaces").select("id, account_id").eq("id",a).eq("account_id",d.account_id).maybeSingle();if(!l)throw new o("WORKSPACE_FORBIDDEN","Workspace not found or access denied.",403);if("member"===d.role){let{data:e}=await (0,s.v)(u).from("account_users").select("id").eq("user_id",n.id).eq("account_id",d.account_id).maybeSingle();if(!e?.id)throw new o("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403);let{data:t}=await (0,s.v)(u).from("account_user_workspaces").select("workspace_id").eq("account_user_id",e.id).eq("workspace_id",a).maybeSingle();if(!t)throw new o("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403)}return{supabase:t,user:n,workspaceId:a,accountId:d.account_id,role:d.role}}async function l(e){return(0,i.ud)(e)}},8248:(e,t,n)=>{n.d(t,{bg:()=>i,bx:()=>u,ds:()=>d,ff:()=>c,hd:()=>o,jsonSuccess:()=>s,tb:()=>r});var a=n(7076);let r=15e3;function s(e,t=200){return a.NextResponse.json({success:!0,data:e},{status:t})}function i(e,t,n=400,r){let s={success:!1,error:{code:e,message:t,...r}};return a.NextResponse.json(s,{status:n})}function o(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),a="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,r=function(e,t){if(t)return"Silkview Sync connected";let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),s=n?"You can close this tab and return to Excel.":a??"Please close this tab and try again from the add-in.";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${r}</h1>
<p>${s}</p>
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
</html>`}function c(e,t){return o({status:"error",provider:e,message:t})}function u(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),a=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),r=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${a};
    var handoffReadyPayload = ${r};
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
</html>`}},2946:(e,t,n)=>{n.d(t,{$2:()=>d,Lb:()=>c,N0:()=>o,ud:()=>i,yU:()=>u,zp:()=>s});var a=n(6140),r=n(438);function s(e){return e?.code==="23505"}async function i(e,t){let n=t??(0,a.S)(),{data:s,error:i}=await (0,r.v)(n).from("account_users").select("account_id, role").eq("user_id",e).order("joined_at",{ascending:!0,nullsFirst:!1}).order("created_at",{ascending:!0}).limit(1);if(i)return console.error("getPrimaryAccountMembership:",i),null;let o=s?.[0];return o?.account_id?{account_id:o.account_id,role:o.role}:null}async function o(e,t){let n=t??(0,a.S)(),{data:s,error:i}=await (0,r.v)(n).from("workspaces").select("id").eq("account_id",e).order("created_at",{ascending:!0}).limit(1);if(i)return console.error("getPrimaryWorkspaceForAccount:",i),null;let o=s?.[0];return o?.id?{id:o.id}:null}async function c(e,t,n){let s=n??(0,a.S)(),i=t.trim().toLowerCase(),{data:o,error:c}=await (0,r.v)(s).from("workspaces").select("id, name").eq("account_id",e);if(c)return console.error("findWorkspaceByNameForAccount:",c),null;let u=(o??[]).find(e=>e.name.trim().toLowerCase()===i);return u?.id?{id:u.id}:null}async function u(e,t){let n=t??(0,a.S)();await (0,r.v)(n).from("accounts").update({onboarding_completed_at:new Date().toISOString()}).eq("id",e).is("onboarding_completed_at",null)}async function d(e,t){let n=t??(0,a.S)(),{count:s}=await (0,r.v)(n).from("account_users").select("id",{count:"exact",head:!0}).eq("account_id",e);0===s&&await (0,r.v)(n).from("accounts").delete().eq("id",e)}},8793:(e,t,n)=>{n.d(t,{KB:()=>o,Lc:()=>s,do:()=>i});var a=n(6140),r=n(438);async function s(e,t){let n=(0,a.S)(),s=new Date(Date.now()+18e4).toISOString();await (0,r.v)(n).from("excel_auth_handoffs").upsert({nonce:e,access_token:t,expires_at:s})}async function i(e){let t=(0,a.S)(),{data:n,error:s}=await (0,r.v)(t).from("excel_auth_handoffs").select("access_token, expires_at").eq("nonce",e).maybeSingle();return s||!n?.access_token||new Date(n.expires_at).getTime()<Date.now()?null:n.access_token}async function o(e){let t=await i(e);if(!t)return null;let n=(0,a.S)();return await (0,r.v)(n).from("excel_auth_handoffs").delete().eq("nonce",e),t}},7305:(e,t,n)=>{n.d(t,{V2:()=>u,ZT:()=>c,uS:()=>d});var a=n(6140),r=n(438),s=n(1752),i=n(2946);let o=["free","pro","firm"];function c(e){var t;return e?{planCode:"string"==typeof(t=e.plan_code)&&o.includes(t)?t:null,accountName:"string"==typeof e.account_name&&e.account_name.trim()||null,workspaceName:"string"==typeof e.workspace_name&&e.workspace_name.trim()||null}:{planCode:null,accountName:null,workspaceName:null}}async function u(e,t,n){let o=c(t),u=(0,a.S)(),d=await (0,i.ud)(e,u);if(!d?.account_id)return{needsAccountSetup:!0,needsConnectionSetup:!1,needsOnboarding:!0,planCode:o.planCode,accountId:null,workspaceId:null,hasXero:!1,hasStripe:!1,limits:null,prefill:o};let{data:l}=await (0,r.v)(u).from("accounts").select("id, plan_code, onboarding_completed_at, max_users, max_workspaces").eq("id",d.account_id).single(),f=l?.plan_code??"free",p=await (0,s.Le)(f),{data:m}=await (0,r.v)(u).from("workspaces").select("id").eq("account_id",d.account_id).order("created_at",{ascending:!0}),h=(m??[]).map(e=>e.id),_=m?.[0]?.id??null;n&&h.includes(n)&&(_=n);let w=!1,x=!1;if(_){let{data:e}=await (0,r.v)(u).from("xero_connections").select("id").eq("workspace_id",_).eq("is_active",!0).maybeSingle();w=!!e;let{data:t}=await (0,r.v)(u).from("stripe_connections").select("id").eq("workspace_id",_).eq("is_active",!0).maybeSingle();x=!!t}let g=!_,y=!g&&(!w||!x),v=g||!l?.onboarding_completed_at;return{needsAccountSetup:g,needsConnectionSetup:y,needsOnboarding:v,planCode:f,accountId:d.account_id,workspaceId:_,hasXero:w,hasStripe:x,limits:p?{maxUsers:p.max_users,maxWorkspaces:p.max_workspaces,maxStripeConnections:p.max_stripe_connections,maxXeroConnectionsPerWorkspace:p.max_xero_connections_per_workspace}:null,prefill:o}}async function d(e){let t=(0,a.S)(),{data:n}=await (0,r.v)(t).from("workspaces").select("id").eq("account_id",e);if(!n?.length)return 0;let s=n.map(e=>e.id),{count:i}=await (0,r.v)(t).from("stripe_connections").select("id",{count:"exact",head:!0}).in("workspace_id",s).eq("is_active",!0);return i??0}},1752:(e,t,n)=>{n.d(t,{Le:()=>o,du:()=>i});var a=n(6140),r=n(438),s=n(4259);async function i(){let e=(0,a.S)(),{data:t,error:n}=await (0,r.v)(e).from("plans").select("*").order("sort_order",{ascending:!0});if(n){if(n.message.includes("Invalid schema"))return s.l;throw Error(n.message)}return(t??[]).map(e=>{var t;return{code:e.code,name:e.name,description:e.description??"",features:Array.isArray(t=e.features)?t.filter(e=>"string"==typeof e):[],max_users:e.max_users,max_workspaces:e.max_workspaces,max_stripe_connections:e.max_stripe_connections,max_xero_connections_per_workspace:e.max_xero_connections_per_workspace??1,stripe_price_id:e.stripe_price_id,sort_order:e.sort_order}})}async function o(e){return(await i()).find(t=>t.code===e)??null}},4259:(e,t,n)=>{n.d(t,{j:()=>r,l:()=>a});let a=[{code:"free",name:"Free",description:"Get started with one workspace and core sync features.",features:["Excel add-in for Stripe & Xero","1 user","1 workspace","1 Stripe account","1 Xero organisation per workspace"],max_users:1,max_workspaces:1,max_stripe_connections:1,max_xero_connections_per_workspace:1,stripe_price_id:null,sort_order:0},{code:"pro",name:"Pro",description:"For solo operators who need a single workspace.",features:["Everything in Free","1 user","1 workspace","1 Stripe account","Priority email support"],max_users:1,max_workspaces:1,max_stripe_connections:1,max_xero_connections_per_workspace:1,stripe_price_id:null,sort_order:1},{code:"firm",name:"Firm",description:"For teams managing multiple clients in one account.",features:["Up to 5 users (invite team)","Up to 5 workspaces","Up to 5 Stripe accounts (account-wide)","1 Xero org per workspace"],max_users:5,max_workspaces:5,max_stripe_connections:5,max_xero_connections_per_workspace:1,stripe_price_id:null,sort_order:2}];function r(e){return a.find(t=>t.code===e)??null}},6140:(e,t,n)=>{n.d(t,{S:()=>s});var a=n(218),r=n(1328);function s(){let{url:e}=(0,r.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,n)=>{n.d(t,{v:()=>a});function a(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,n)=>{n.d(t,{j:()=>a});function a(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},8009:(e,t,n)=>{n.d(t,{u:()=>i});var a=n(403),r=n(6701),s=n(1328);async function i(){let e=await (0,r.cookies)(),{url:t,anonKey:n}=(0,s.j)();return(0,a.createServerClient)(t,n,{cookies:{get:t=>e.get(t)?.value,set(t,n,a){e.set({name:t,value:n,...a})},remove(t,n){e.set({name:t,value:"",...n})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[5942,3084,3786,8769],()=>n(8581));module.exports=a})();