import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    xeroCodeVerifier?: string;
  }
}

export function createSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
