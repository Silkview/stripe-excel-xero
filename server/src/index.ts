import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import express from 'express';
import { createSessionMiddleware } from './middleware/session';
import { createCorsMiddleware } from './middleware/cors';
import authRoutes from './routes/auth';
import stripeRoutes from './routes/stripe';
import xeroRoutes from './routes/xero';
import { sendError } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '4001', 10);

app.use(createCorsMiddleware());
app.use(express.json());
app.use(createSessionMiddleware());

// #region agent log
app.use((req, _res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/api')) {
    const fs = require('fs') as typeof import('fs');
    const line = JSON.stringify({sessionId:'49b4e5',runId:'post-fix',location:'index.ts:request',message:'server request',data:{method:req.method,path:req.path,origin:req.headers.origin||null},timestamp:Date.now(),hypothesisId:'B,E'}) + '\n';
    fs.appendFileSync('/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log', line);
  }
  next();
});
// #endregion

app.use('/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/xero', xeroRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    sendError(res, 'SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
);

app.listen(PORT, () => {
  console.log(`Silkview Sync API running on http://localhost:${PORT}`);
});
