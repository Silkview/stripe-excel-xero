import cors from 'cors';

export function createCorsMiddleware() {
  const origin = process.env.FRONTEND_URL || 'https://localhost:4000';
  return cors({
    origin,
    credentials: true,
  });
}
