import { Request } from 'express';

export function resolveSessionId(req: Request): string {
  const fromQuery = req.query.sessionId;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) {
    return fromQuery;
  }
  return req.session.id;
}
