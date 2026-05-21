import { Router, Request, Response } from 'express';
import { tokenStore } from '../tokenStore';
import { sendSuccess, sendError } from '../utils/response';
import type { ManualJournalPushRequest } from '@stripesync/shared';
import {
  getAccounts,
  getMappingOptions,
  pushManualJournals,
  XeroServiceError,
} from '../services/xeroService';
import { resolveSessionId } from '../utils/sessionId';

const router = Router();

router.get('/connections', (req: Request, res: Response) => {
  const xero = tokenStore.getXero(resolveSessionId(req));
  sendSuccess(res, {
    connected: !!xero,
    tenantName: xero?.tenantName,
    tenantId: xero?.tenantId,
  });
});

router.get('/mapping-options', async (req: Request, res: Response) => {
  try {
    const options = await getMappingOptions(resolveSessionId(req));
    sendSuccess(res, options);
  } catch (err) {
    if (err instanceof XeroServiceError) {
      const status =
        err.code === 'XERO_AUTH_REQUIRED'
          ? 401
          : err.code === 'RATE_LIMITED'
            ? 429
            : err.code === 'TIMEOUT'
              ? 504
              : 502;
      return sendError(res, err.code, err.message, status, {
        retry_after: err.retryAfter,
      });
    }
    sendError(
      res,
      'XERO_ERROR',
      'Failed to fetch Xero mapping options. Please try again.',
      502
    );
  }
});

router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await getAccounts(resolveSessionId(req));
    sendSuccess(res, accounts);
  } catch (err) {
    if (err instanceof XeroServiceError) {
      const status =
        err.code === 'XERO_AUTH_REQUIRED'
          ? 401
          : err.code === 'RATE_LIMITED'
            ? 429
            : err.code === 'TIMEOUT'
              ? 504
              : 502;
      return sendError(res, err.code, err.message, status, {
        retry_after: err.retryAfter,
      });
    }
    sendError(res, 'XERO_ERROR', 'Failed to fetch accounts. Please try again.', 502);
  }
});

router.post('/manual-journals', async (req: Request, res: Response) => {
  const body = req.body as ManualJournalPushRequest;
  const status = body?.status;
  const lines = body?.lines;

  if (status !== 'DRAFT' && status !== 'POSTED') {
    sendError(
      res,
      'VALIDATION_ERROR',
      'Status must be DRAFT or POSTED.',
      400
    );
    return;
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'No journal lines to push. Build journals in Excel first.',
      400
    );
    return;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.date || !line?.accountCode) {
      sendError(
        res,
        'VALIDATION_ERROR',
        `Line ${i + 1} is missing date or account code.`,
        400
      );
      return;
    }
    if (typeof line.netAmount !== 'number' || line.netAmount === 0) {
      sendError(
        res,
        'VALIDATION_ERROR',
        `Line ${i + 1} must have a non-zero net amount.`,
        400
      );
      return;
    }
  }

  try {
    const result = await pushManualJournals(
      resolveSessionId(req),
      status,
      lines
    );
    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof XeroServiceError) {
      const statusCode =
        err.code === 'XERO_AUTH_REQUIRED'
          ? 401
          : err.code === 'RATE_LIMITED'
            ? 429
            : err.code === 'TIMEOUT'
              ? 504
              : err.code === 'VALIDATION_ERROR'
                ? 400
                : 502;
      return sendError(res, err.code, err.message, statusCode, {
        retry_after: err.retryAfter,
        details: err.details,
      });
    }
    sendError(
      res,
      'XERO_ERROR',
      'Failed to push manual journals to Xero. Please try again.',
      502
    );
  }
});

router.post('/bank-transactions', (_req: Request, res: Response) => {
  sendError(
    res,
    'NOT_IMPLEMENTED',
    'Bank transaction push is coming in phase 2.',
    501
  );
});

export default router;
