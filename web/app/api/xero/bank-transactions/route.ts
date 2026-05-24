import { requireWorkspaceWithXero } from '@/lib/api-auth';
import { pushBankTransactions } from '@/lib/services/xero';
import type { BankTransactionPushRequest } from '@stripesync/shared';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspaceWithXero(request);
    const body = (await request.json()) as BankTransactionPushRequest;
    const transactions = body?.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'No bank transactions to push. Build bank transactions in Excel first.',
          400
        )
      );
    }

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      if (!txn?.date || !txn?.bankAccountCode || !txn?.accountCode) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            `Transaction ${i + 1} is missing date, bank account, or account code.`,
            400
          )
        );
      }
      if (!txn?.contactName?.trim()) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            `Transaction ${i + 1} is missing contact.`,
            400
          )
        );
      }
      if (typeof txn.amount !== 'number' || txn.amount === 0) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            `Transaction ${i + 1} must have a non-zero amount.`,
            400
          )
        );
      }
    }

    const result = await pushBankTransactions(workspaceId, transactions);
    return ok(request, result);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
