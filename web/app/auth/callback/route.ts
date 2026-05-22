import { createSupabaseServer } from '@/lib/supabase/server';
import { ensureAccountForUser } from '@/lib/auth/ensure-account';
import { getPostAuthRedirectPath } from '@/lib/auth/post-auth-redirect';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnMode = url.searchParams.get('return');

  const supabase = await createSupabaseServer();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (returnMode === 'excel') {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token ?? '';
    const html = `<!DOCTYPE html><html><head><script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script></head><body><p>Signed in. Return to Excel.</p><script>Office.onReady(function(){try{Office.context.ui.messageParent(JSON.stringify({status:'signed_in',accessToken:${JSON.stringify(accessToken)}}));}catch(e){}});</script></body></html>`;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const accountName =
      (user.user_metadata?.account_name as string | undefined) ?? undefined;
    try {
      await ensureAccountForUser(user.id, user.email, accountName);
    } catch {
      // Webhook may have provisioned; continue auth flow
    }
  }

  const redirectPath = user
    ? await getPostAuthRedirectPath(supabase)
    : '/auth/login';

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
