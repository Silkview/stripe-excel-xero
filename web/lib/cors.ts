import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_ADDIN_URL,
  'https://localhost:4000',
  'http://localhost:4000',
  'https://addin.silkview.org',
]
  .filter(Boolean)
  .map((o) => o!.replace(/\/$/, '')) as string[];

export function withCors(request: Request, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Workspace-Id'
    );
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
  }
  return response;
}

export function corsOptions(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
