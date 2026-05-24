"use strict";(()=>{var e={};e.id=5536,e.ids=[5536],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},59539:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>w,patchFetch:()=>y,requestAsyncStorage:()=>p,routeModule:()=>f,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var a={};n.r(a),n.d(a,{POST:()=>l});var i=n(93277),r=n(15265),o=n(55356),s=n(92946);async function c(e,t,n){let a=await (0,s.ud)(e);if(a?.account_id)return{accountId:a.account_id,created:!1};throw Error("ONBOARDING_REQUIRED")}var u=n(7993),d=n(21985);async function l(e){try{let{user:t}=await (0,u.Vc)(e),n=await e.json().catch(()=>({})),a="string"==typeof n.accountName?n.accountName:t.user_metadata?.account_name,i=await c(t.id,t.email??"",a);return(0,d.jsonSuccess)(i)}catch(t){if(t instanceof u.QR)return(0,d.bg)(t.code,t.message,t.status);let e=t instanceof Error?t.message:"Failed to provision account.";if("ONBOARDING_REQUIRED"===e)return(0,d.jsonSuccess)({accountId:"",created:!1,needsOnboarding:!0});return(0,d.bg)("PROVISION_ERROR",e,500)}}let f=new i.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/auth/ensure-account/route",pathname:"/api/auth/ensure-account",filename:"route",bundlePath:"app/api/auth/ensure-account/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/ensure-account/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:h}=f,w="/api/auth/ensure-account/route";function y(){return(0,o.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}},7993:(e,t,n)=>{n.d(t,{QR:()=>c,Vc:()=>u,jm:()=>l,m6:()=>f,x1:()=>d});var a=n(28009),i=n(26140),r=n(20438),o=n(92946),s=n(11431);class c extends Error{constructor(e,t,n=401){super(t),this.code=e,this.status=n}}async function u(e){let t=e?function(e){let t=e.headers.get("authorization");return t?.startsWith("Bearer ")&&t.slice(7).trim()||null}(e):null;if(t){let e=(0,i.S)(),{data:n,error:r}=await e.auth.getUser(t);if(r||!n.user)throw new c("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:await (0,a.u)(),user:n.user}}let n=await (0,a.u)(),{data:{user:r},error:o}=await n.auth.getUser();if(o||!r)throw new c("AUTH_REQUIRED","Please sign in to continue.",401);return{supabase:n,user:r}}async function d(e){let{supabase:t,user:n}=await u(e),a=await (0,o.ud)(n.id);if(!a)throw new c("ACCOUNT_REQUIRED","No account found for this user.",403);if("member"===a.role)throw new c("FORBIDDEN","Only account owners and admins can access this resource.",403);return{supabase:t,user:n,membership:a}}async function l(e){let{supabase:t,user:n}=await u(e),a=e.headers.get("x-workspace-id")||e.headers.get("X-Workspace-Id")||"";if(!a)throw new c("WORKSPACE_REQUIRED","Select a workspace before connecting or pulling data.",400);let d=(0,i.S)(),l=await (0,o.ud)(n.id,d);if(!l)throw new c("ACCOUNT_REQUIRED","No account found for this user.",403);let{data:f}=await (0,r.v)(d).from("workspaces").select("id, account_id").eq("id",a).eq("account_id",l.account_id).maybeSingle();if(!f)throw new c("WORKSPACE_FORBIDDEN","Workspace not found or access denied.",403);if("member"===l.role){let{data:e}=await (0,r.v)(d).from("account_users").select("id").eq("user_id",n.id).eq("account_id",l.account_id).maybeSingle();if(!e?.id)throw new c("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403);let{data:t}=await (0,r.v)(d).from("account_user_workspaces").select("workspace_id").eq("account_user_id",e.id).eq("workspace_id",a).maybeSingle();if(!t)throw new c("WORKSPACE_FORBIDDEN","You do not have access to this workspace.",403)}return await (0,s.cy)(l.account_id),{supabase:t,user:n,workspaceId:a,accountId:l.account_id,role:l.role}}async function f(e){return(0,o.ud)(e)}},21985:(e,t,n)=>{n.d(t,{tb:()=>r,ff:()=>u,hd:()=>c,ds:()=>l,bx:()=>d,bg:()=>s,jsonSuccess:()=>o});var a=n(67076);let i="Silkview Connect",r=15e3;function o(e,t=200){return a.NextResponse.json({success:!0,data:e},{status:t})}function s(e,t,n=400,i){let r={success:!1,error:{code:e,message:t,...i}};return a.NextResponse.json(r,{status:n})}function c(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),a="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null,r=function(e,t){if(t)return`${i} connected`;let n="object"==typeof e&&null!==e&&"provider"in e&&"string"==typeof e.provider?e.provider.toLowerCase():"";return"xero"===n?"Xero not connected":"stripe"===n?"Stripe not connected":"Connection failed"}(e,n),o="You can close this tab and return to Excel.",s=n?o:a??"Please close this tab and try again from the add-in.",c=JSON.stringify("You can close this tab and return to the dashboard.").replace(/</g,"\\u003c"),u=JSON.stringify(o).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${i}</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${r}</h1>
<p id="status">${s}</p>
<script>
  (function() {
    var payload = ${t};
    var isSuccess = ${n?"true":"false"};
    if (isSuccess && window.opener && !window.opener.closed) {
      var statusEl = document.getElementById('status');
      if (statusEl) statusEl.textContent = ${c};
      try {
        window.opener.postMessage(
          { type: 'silkview_oauth', ...payload },
          window.location.origin
        );
      } catch (e) { }
    }
  })();
  Office.onReady(function() {
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${t});
        var statusEl = document.getElementById('status');
        if (statusEl && ${n?"true":"false"}) {
          statusEl.textContent = ${u};
        }
      }
    } catch (e) { }
  });
</script>
</body>
</html>`}function u(e,t){return c({status:"error",provider:e,message:t})}function d(e,t){let n=JSON.stringify(t??"").replace(/</g,"\\u003c"),a=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),r=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${i}</title>
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
</html>`}function l(e){let t=JSON.stringify({status:"error",message:e}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${i}</title>
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
</html>`}},92946:(e,t,n)=>{n.d(t,{$2:()=>d,Lb:()=>c,N0:()=>s,ud:()=>o,yU:()=>u,zp:()=>r});var a=n(26140),i=n(20438);function r(e){return e?.code==="23505"}async function o(e,t){let n=t??(0,a.S)(),{data:r,error:o}=await (0,i.v)(n).from("account_users").select("account_id, role").eq("user_id",e).order("joined_at",{ascending:!0,nullsFirst:!1}).order("created_at",{ascending:!0}).limit(1);if(o)return console.error("getPrimaryAccountMembership:",o),null;let s=r?.[0];return s?.account_id?{account_id:s.account_id,role:s.role}:null}async function s(e,t){let n=t??(0,a.S)(),{data:r,error:o}=await (0,i.v)(n).from("workspaces").select("id").eq("account_id",e).order("created_at",{ascending:!0}).limit(1);if(o)return console.error("getPrimaryWorkspaceForAccount:",o),null;let s=r?.[0];return s?.id?{id:s.id}:null}async function c(e,t,n){let r=n??(0,a.S)(),o=t.trim().toLowerCase(),{data:s,error:c}=await (0,i.v)(r).from("workspaces").select("id, name").eq("account_id",e);if(c)return console.error("findWorkspaceByNameForAccount:",c),null;let u=(s??[]).find(e=>e.name.trim().toLowerCase()===o);return u?.id?{id:u.id}:null}async function u(e,t){let n=t??(0,a.S)();await (0,i.v)(n).from("accounts").update({onboarding_completed_at:new Date().toISOString()}).eq("id",e).is("onboarding_completed_at",null)}async function d(e,t){let n=t??(0,a.S)(),{count:r}=await (0,i.v)(n).from("account_users").select("id",{count:"exact",head:!0}).eq("account_id",e);0===r&&await (0,i.v)(n).from("accounts").delete().eq("id",e)}},11431:(e,t,n)=>{n.d(t,{Bh:()=>p,EN:()=>w,cy:()=>m,i3:()=>r,nX:()=>f,pE:()=>o,rb:()=>d,uN:()=>h});var a=n(26140),i=n(20438);class r extends Error{constructor(e="Your trial has ended. Subscribe to continue using Silkview Connect."){super(e),this.code="BILLING_REQUIRED",this.name="BillingRequiredError"}}class o extends Error{constructor(e="Choose which workspace and connections to keep on the Pro plan."){super(e),this.code="DOWNGRADE_REQUIRED",this.name="DowngradeRequiredError"}}let s=["pro","firm"],c=new Set(["past_due","canceled","unpaid","incomplete"]);async function u(e){let t=(0,a.S)(),{data:n}=await (0,i.v)(t).from("accounts").select("id, plan_code, subscription_status, trial_ends_at, stripe_subscription_id, billing_downgrade_completed_at").eq("id",e).maybeSingle();return n}async function d(e){let t=await u(e);if(!t)return"active";let n=t.plan_code??"free";if(!s.includes(n))return"active";let a=t.subscription_status??"trialing";return"active"===a||"trialing"===a?"trialing"===a&&!t.stripe_subscription_id&&t.trial_ends_at&&new Date(t.trial_ends_at).getTime()<=Date.now()?"trial_expired":"active":c.has(a)?"payment_required":"active"}async function l(e){let t=(0,a.S)(),{count:n}=await (0,i.v)(t).from("workspaces").select("id",{count:"exact",head:!0}).eq("account_id",e);if((n??0)>1)return!0;let{data:r}=await (0,i.v)(t).from("workspaces").select("id").eq("account_id",e);for(let e of r??[]){let{count:n}=await (0,i.v)(t).from("stripe_connections").select("id",{count:"exact",head:!0}).eq("workspace_id",e.id).eq("is_active",!0);if((n??0)>1)return!0;let{count:a}=await (0,i.v)(t).from("xero_connections").select("id",{count:"exact",head:!0}).eq("workspace_id",e.id).eq("is_active",!0);if((a??0)>1)return!0}return!1}async function f(e){let t=await u(e);return!!t&&"pro"===t.plan_code&&"active"===t.subscription_status&&!t.billing_downgrade_completed_at&&l(e)}async function p(e){let t=await d(e);if("trial_expired"===t)throw new r("Your trial has ended. Subscribe to continue using Silkview Connect.");if("payment_required"===t)throw new r("Your subscription is inactive. Update billing to continue.")}async function m(e){if(await p(e),await f(e))throw new o}function h(){return"http://localhost:4003/dashboard/billing"}async function w(e){let t=(0,a.S)(),{data:n}=await (0,i.v)(t).from("accounts").select("stripe_customer_id").eq("id",e).maybeSingle(),[r,o]=await Promise.all([d(e),f(e)]);return{billingAccess:r,needsDowngradeSelection:o,billingUrl:h(),hasStripeCustomer:!!n?.stripe_customer_id}}},26140:(e,t,n)=>{n.d(t,{S:()=>r});var a=n(40218),i=n(31328);function r(){let{url:e}=(0,i.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},20438:(e,t,n)=>{n.d(t,{v:()=>a});function a(e){return"function"==typeof e.schema?e.schema("core"):e}},31328:(e,t,n)=>{n.d(t,{j:()=>a});function a(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}},28009:(e,t,n)=>{n.d(t,{u:()=>o});var a=n(10403),i=n(36701),r=n(31328);async function o(){let e=await (0,i.cookies)(),{url:t,anonKey:n}=(0,r.j)();return(0,a.createServerClient)(t,n,{cookies:{get:t=>e.get(t)?.value,set(t,n,a){e.set({name:t,value:n,...a})},remove(t,n){e.set({name:t,value:"",...n})}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),a=t.X(0,[5942,3084,3786,8769],()=>n(59539));module.exports=a})();