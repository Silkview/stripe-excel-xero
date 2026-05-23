#!/usr/bin/env node
/**
 * Smoke-test OAuth configuration on deployed web app.
 * Usage: APP_URL=https://www.silkview.org npm run verify:oauth-config
 */
const APP_URL = (process.env.APP_URL || 'https://www.silkview.org').replace(
  /\/$/,
  ''
);

async function main() {
  let failed = false;

  const urisRes = await fetch(`${APP_URL}/api/oauth/redirect-uris`);
  const uris = await urisRes.json();
  if (!uris.success) {
    console.error('FAIL /api/oauth/redirect-uris');
    failed = true;
  } else {
    console.log('OK   stripe redirect:', uris.data.stripe);
    console.log('OK   xero redirect:', uris.data.xero);
  }

  const verifyRes = await fetch(`${APP_URL}/api/stripe/connect/verify`);
  if (verifyRes.status === 401) {
    console.log(
      'OK   /api/stripe/connect/verify requires sign-in (not public)'
    );
  } else if (verifyRes.ok) {
    const verify = await verifyRes.json();
    if (verify.data?.paired) {
      console.log('OK   Stripe Connect paired:', verify.data.secretMode);
    } else {
      console.error('FAIL Stripe Connect not paired:', verify.data?.hint);
      failed = true;
    }
  } else {
    console.error('FAIL /api/stripe/connect/verify', verifyRes.status);
    failed = true;
  }

  if (failed) process.exit(1);
  console.log('\nOAuth config checks passed (operator verify needs owner login).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
