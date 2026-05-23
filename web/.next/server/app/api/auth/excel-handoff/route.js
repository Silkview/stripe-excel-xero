"use strict";(()=>{var e={};e.id=6290,e.ids=[6290],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2426:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>h,routeModule:()=>p,serverHooks:()=>y,staticGenerationAsyncStorage:()=>m});var s={};n.r(s),n.d(s,{GET:()=>f,OPTIONS:()=>u,POST:()=>d});var a=n(3277),r=n(5265),o=n(5356),i=n(8793),c=n(8248),l=n(6771);async function u(){return(0,l.N4)()}async function f(e){let t=new URL(e.url),n=t.searchParams.get("nonce")?.trim();if(!n)return(0,l.i6)((0,c.bg)("INVALID_REQUEST","Missing handoff nonce.",400));let s=await (0,i.do)(n);if(console.log("[excel-auth-audit]",JSON.stringify({sessionId:"49b4e5",location:"excel-handoff/GET",message:"peek",hypothesisId:"H2",data:{hasPeek:!!s,nonceLen:n.length}})),!s)return(0,l.i6)((0,c.jsonSuccess)({ready:!1}));let a=await (0,i.KB)(n);return a?(0,l.i6)((0,c.jsonSuccess)({ready:!0,accessToken:a})):(0,l.i6)((0,c.jsonSuccess)({ready:!1}))}async function d(e){try{let t=await e.json().catch(()=>({})),n="string"==typeof t.nonce?t.nonce.trim():"",s="string"==typeof t.accessToken?t.accessToken.trim():"";if(!n||!s)return(0,l.o3)(e,(0,c.bg)("INVALID_REQUEST","Missing nonce or access token.",400));return await (0,i.Lc)(n,s),(0,l.o3)(e,(0,c.jsonSuccess)({ok:!0}))}catch{return(0,l.o3)(e,(0,c.bg)("AUTH_REQUIRED","Please sign in.",401))}}let p=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/auth/excel-handoff/route",pathname:"/api/auth/excel-handoff",filename:"route",bundlePath:"app/api/auth/excel-handoff/route"},resolvedPagePath:"/Users/ruvanfernando/stripe-excel-xero/web/app/api/auth/excel-handoff/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:m,serverHooks:y}=p,g="/api/auth/excel-handoff/route";function x(){return(0,o.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:m})}},8248:(e,t,n)=>{n.d(t,{bg:()=>o,bx:()=>l,ds:()=>u,ff:()=>c,hd:()=>i,jsonSuccess:()=>r,tb:()=>a});var s=n(7076);let a=15e3;function r(e,t=200){return s.NextResponse.json({success:!0,data:e},{status:t})}function o(e,t,n=400,a){let r={success:!1,error:{code:e,message:t,...a}};return s.NextResponse.json(r,{status:n})}function i(e){let t=JSON.stringify(e).replace(/</g,"\\u003c"),n="object"==typeof e&&null!==e&&"status"in e&&String(e.status).includes("connected"),s="object"==typeof e&&null!==e&&"message"in e&&"string"==typeof e.message?e.message:null;return`<!DOCTYPE html>
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
</html>`}function c(e,t){return i({status:"error",provider:e,message:t})}function l(e){let t=JSON.stringify({status:"signed_in",accessToken:e}).replace(/</g,"\\u003c"),n=JSON.stringify({status:"handoff_ready"}).replace(/</g,"\\u003c");return`<!DOCTYPE html>
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
    var signedInPayload = ${t};
    var handoffReadyPayload = ${n};
    var attempts = 0;
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
      sendToParent(signedInPayload);
      sendToParent(handoffReadyPayload);
      var el = document.getElementById('status');
      if (el) el.textContent = 'Returning to Excel…';
      attempts += 1;
      if (attempts < 25) setTimeout(retry, 200);
    }
    retry();
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
</html>`}},8793:(e,t,n)=>{n.d(t,{KB:()=>i,Lc:()=>r,do:()=>o});var s=n(6140),a=n(438);async function r(e,t){let n=(0,s.S)(),r=new Date(Date.now()+18e4).toISOString();await (0,a.v)(n).from("excel_auth_handoffs").upsert({nonce:e,access_token:t,expires_at:r})}async function o(e){let t=(0,s.S)(),{data:n,error:r}=await (0,a.v)(t).from("excel_auth_handoffs").select("access_token, expires_at").eq("nonce",e).maybeSingle();return r||!n?.access_token||new Date(n.expires_at).getTime()<Date.now()?null:n.access_token}async function i(e){let t=await o(e);if(!t)return null;let n=(0,s.S)();return await (0,a.v)(n).from("excel_auth_handoffs").delete().eq("nonce",e),t}},6771:(e,t,n)=>{n.d(t,{N4:()=>c,i6:()=>i,o3:()=>r,ty:()=>o});var s=n(7076);let a=[process.env.FRONTEND_URL,"http://localhost:4003",process.env.NEXT_PUBLIC_ADDIN_URL,"https://localhost:4000","http://localhost:4000","https://addin.silkview.org"].filter(Boolean).map(e=>e.replace(/\/$/,""));function r(e,t){let n=e.headers.get("origin");return n&&a.includes(n)&&(t.headers.set("Access-Control-Allow-Origin",n),t.headers.set("Access-Control-Allow-Credentials","true"),t.headers.set("Access-Control-Allow-Headers","Content-Type, Authorization, X-Workspace-Id"),t.headers.set("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS")),t}function o(e){return r(e,new s.NextResponse(null,{status:204}))}function i(e){return e.headers.set("Access-Control-Allow-Origin","*"),e.headers.set("Access-Control-Allow-Headers","Content-Type, Authorization, X-Workspace-Id"),e.headers.set("Access-Control-Allow-Methods","GET, OPTIONS"),e}function c(){return i(new s.NextResponse(null,{status:204}))}},6140:(e,t,n)=>{n.d(t,{S:()=>r});var s=n(218),a=n(1328);function r(){let{url:e}=(0,a.j)(),t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!t)throw Error("Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.");return(0,s.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1}})}},438:(e,t,n)=>{n.d(t,{v:()=>s});function s(e){return"function"==typeof e.schema?e.schema("core"):e}},1328:(e,t,n)=>{n.d(t,{j:()=>s});function s(){let e="https://szbfksebywhkalejxkgs.supabase.co",t="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmZrc2VieXdoa2FsZWp4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MjQ0MDcsImV4cCI6MjA5NTAwMDQwN30.LFAguTH_aKGvvn6JQKiCaxp7ZN79BQxs2lRyJ3m3_aY";if(!e||!t)throw Error("Missing Supabase env vars. Copy web/.env.example to web/.env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");return{url:e,anonKey:t}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[5942,3084,3786],()=>n(2426));module.exports=s})();