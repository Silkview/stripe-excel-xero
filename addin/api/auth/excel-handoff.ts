export const config = { runtime: 'edge' };

const WEB_API = 'https://www.silkview.org';

export default async function handler(req: Request): Promise<Response> {
  const incoming = new URL(req.url);
  const target = `${WEB_API}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const res = await fetch(target, {
    method: req.method,
    headers,
    body:
      req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
  });

  const out = new Headers(res.headers);
  out.set('access-control-allow-origin', '*');

  return new Response(res.body, { status: res.status, headers: out });
}
