import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PREFIXES = [
  '/auth/login',
  '/auth/excel',
  '/auth/signup',
  '/auth/callback',
  '/auth/mfa',
  '/auth/excel-complete',
  '/auth/invite',
  '/api/auth/signup',
  '/api/auth/session',
  '/api/auth/signin-hint',
  '/api/auth/login-audit',
  '/api/auth/excel-finish',
  '/api/oauth/redirect-uris',
  '/api/plans',
  '/api/addin/manifest',
  '/api/account/invite/preview',
  '/api/billing/webhook',
  '/api/cron/',
  '/api/stripe/callback',
  '/api/xero/callback',
  '/api/xero/complete-tenant',
  '/api/xero/tenant-pick-preview',
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/api/auth/excel-handoff' &&
    (request.method === 'GET' ||
      request.method === 'OPTIONS' ||
      request.method === 'POST')
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (
    pathname === '/api/stripe/connect' ||
    pathname.startsWith('/api/stripe/connect/platform') ||
    pathname.startsWith('/api/stripe/status') ||
    pathname.startsWith('/api/stripe/connections') ||
    pathname.startsWith('/api/onboarding/') ||
    pathname.startsWith('/api/xero/connect') ||
    pathname.startsWith('/auth/stripe/') ||
    pathname.startsWith('/auth/xero/')
  ) {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Please sign in.' } },
      { status: 401 }
    );
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/auth/:path*'],
};
