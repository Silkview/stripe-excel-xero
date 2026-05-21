import { Router, Request, Response } from 'express';
import { tokenStore } from '../tokenStore';
import { sendSuccess, sendError } from '../utils/response';
import type {
  BankTransactionPushRequest,
  ManualJournalPushRequest,
} from '@stripesync/shared';
import {
  ensureXeroBaseCurrency,
  getAccounts,
  getMappingOptions,
  pushBankTransactions,
  pushManualJournals,
  XeroServiceError,
} from '../services/xeroService';
import { resolveSessionId } from '../utils/sessionId';

const router = Router();

router.get('/connections', async (req: Request, res: Response) => {
  const sessionId = resolveSessionId(req);
  const xero = tokenStore.getXero(sessionId);
  if (!xero) {
    sendSuccess(res, { connected: false });
    return;
  }
  try {
    const baseCurrency = await ensureXeroBaseCurrency(sessionId);
    const updated = tokenStore.getXero(sessionId);
    sendSuccess(res, {
      connected: true,
      tenantName: updated?.tenantName,
      tenantId: updated?.tenantId,
      baseCurrency,
    });
  } catch (err) {
    if (err instanceof XeroServiceError) {
      return sendError(res, err.code, err.message, 502);
    }
    sendError(res, 'XERO_ERROR', 'Failed to load Xero connection.', 502);
  }
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
        `Line ${i + 1} must have a non-zero gross amount.`,
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
        rowIssues: err.rowIssues,
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

router.post('/bank-transactions', async (req: Request, res: Response) => {
  const body = req.body as BankTransactionPushRequest;
  const transactions = body?.transactions;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'No bank transactions to push. Build bank transactions in Excel first.',
      400
    );
    return;
  }

  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    if (!txn?.date || !txn?.bankAccountCode || !txn?.accountCode) {
      sendError(
        res,
        'VALIDATION_ERROR',
        `Transaction ${i + 1} is missing date, bank account, or account code.`,
        400
      );
      return;
    }
    if (!txn?.contactName?.trim()) {
      sendError(
        res,
        'VALIDATION_ERROR',
        `Transaction ${i + 1} is missing contact.`,
        400
      );
      return;
    }
    if (typeof txn.amount !== 'number' || txn.amount === 0) {
      sendError(
        res,
        'VALIDATION_ERROR',
        `Transaction ${i + 1} must have a non-zero amount.`,
        400
      );
      return;
    }
  }

  try {
    const result = await pushBankTransactions(
      resolveSessionId(req),
      transactions
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
        rowIssues: err.rowIssues,
      });
    }
    sendError(
      res,
      'XERO_ERROR',
      'Failed to push bank transactions to Xero. Please try again.',
      502
    );
  }
});

export default router;
