import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import {
  authExcelSignInErrorHtml,
  authExcelSignInHtml,
} from '@/lib/api-response';
import { getPostAuthRedirectPath } from '@/lib/auth/post-auth-redirect';
import { saveExcelAuthHandoff } from '@/lib/auth/excel-handoff';

const EXCEL_FINISH_PATH = '/api/auth/excel-finish';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const handoffNonce = url.searchParams.get('handoff')?.trim() || null;
  const redirectCount = Number(url.searchParams.get('r') ?? '0');

  try {
    const { supabase } = await requireUser(request);

    if (redirectCount > 8) {
      return new NextResponse(
        authExcelSignInErrorHtml(
          'Sign-in is stuck in a redirect loop. Close this window and try again from Excel.'
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { data: refreshData, error: refreshErr } =
      await supabase.auth.refreshSession();
    if (refreshErr) {
      return new NextResponse(authExcelSignInErrorHtml(refreshErr.message), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const session = refreshData.session;
    if (!session?.access_token) {
      const login = new URL('/auth/excel', url.origin);
      return NextResponse.redirect(login);
    }

    const next = await getPostAuthRedirectPath(supabase, { excelMode: true });
    if (next !== EXCEL_FINISH_PATH && next !== '/auth/excel-complete') {
      const target = new URL(next, url.origin);
      target.searchParams.set('r', String(redirectCount + 1));
      if (handoffNonce) target.searchParams.set('handoff', handoffNonce);
      return NextResponse.redirect(target);
    }

    if (!handoffNonce) {
      console.error(
        '[excel-auth-audit]',
        JSON.stringify({
          location: 'excel-finish',
          message: 'saveHandoff skipped',
          reason: 'missing handoff query param',
        })
      );
      return new NextResponse(
        authExcelSignInErrorHtml(
          'Excel sign-in is missing its session handoff. Close this window, return to the task pane, and click Sign in again.'
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    try {
      await saveExcelAuthHandoff(handoffNonce, session.access_token);
    } catch (saveErr) {
      const detail =
        saveErr instanceof Error ? saveErr.message : 'Could not store handoff.';
      console.error(
        '[excel-auth-audit]',
        JSON.stringify({
          location: 'excel-finish',
          message: 'saveHandoff error',
          detail: detail.slice(0, 200),
        })
      );
      return new NextResponse(
        authExcelSignInErrorHtml(
          'Sign-in succeeded but Excel could not receive your session. ' +
            'Apply Supabase migration 008_excel_auth_handoffs.sql, then try again. ' +
            `(${detail})`
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    console.log(
      '[excel-auth-audit]',
      JSON.stringify({
        location: 'excel-finish',
        hasHandoff: !!handoffNonce,
        saveHandoff: 'ok',
      })
    );

    return new NextResponse(authExcelSignInHtml(session.access_token), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Sign-in could not be completed.';
    return new NextResponse(authExcelSignInErrorHtml(message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
