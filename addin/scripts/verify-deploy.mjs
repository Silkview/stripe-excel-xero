#!/usr/bin/env node
/**
 * Smoke-test production add-in: API proxy + bundle must not use legacy /auth/stripe paths.
 * Run after deploy: node addin/scripts/verify-deploy.mjs
 */
const ADDIN = process.env.ADDIN_URL || 'https://addin.silkview.org';

async function main() {
  let failed = false;

  for (const path of ['/api/onboarding/status', '/api/stripe/status', '/api/auth/excel-handoff?nonce=00000000-0000-4000-8000-000000000000']) {
    const url = `${ADDIN}${path}`;
    const res = await fetch(url);
    const text = await res.text();
    if (res.status === 404 || text.includes('NOT_FOUND')) {
      console.error(`FAIL ${path}: 404 (API proxy missing)`);
      failed = true;
    } else if (!text.includes('"success"')) {
      console.error(`FAIL ${path}: not JSON`);
      failed = true;
    } else {
      console.log(`OK   ${path}: ${res.status}`);
    }
  }

  const html = await fetch(`${ADDIN}/taskpane.html`).then((r) => r.text());
  const jsMatch = html.match(/assets\/(taskpane-[A-Za-z0-9_-]+\.js)/);
  if (!jsMatch) {
    console.error('FAIL taskpane.html: no JS bundle reference');
    failed = true;
  } else {
    const jsUrl = `${ADDIN}/assets/${jsMatch[1]}`;
    const js = await fetch(jsUrl).then((r) => r.text());
    if (js.includes('/auth/stripe')) {
      console.error(`FAIL ${jsMatch[1]}: still contains /auth/stripe — redeploy latest add-in build`);
      failed = true;
    } else if (!js.includes('/api/stripe')) {
      console.error(`FAIL ${jsMatch[1]}: missing /api/stripe paths`);
      failed = true;
    } else {
      console.log(`OK   bundle ${jsMatch[1]}: uses /api/stripe`);
    }
  }

  const authStripe = await fetch(`${ADDIN}/auth/stripe/status`);
  if (authStripe.status !== 404) {
    console.warn(`WARN /auth/stripe/status returned ${authStripe.status} (legacy path should 404 on add-in host)`);
  }

  if (failed) {
    process.exit(1);
  }
  console.log('\nAdd-in deploy looks good for Excel sign-in + post-auth API.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
