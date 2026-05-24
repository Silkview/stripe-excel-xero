import { isBankPayoutAccount } from '@stripesync/shared/accountMappingRules';
import { requireWorkspaceWithXero } from '@/lib/api-auth';
import { appendDebugLog } from '@/lib/debug-log';
import { ensureXeroBaseCurrency, getMappingOptions } from '@/lib/services/xero';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspaceWithXero(request);
    const options = await getMappingOptions(workspaceId);
    let baseCurrency: string | undefined;
    try {
      baseCurrency = await ensureXeroBaseCurrency(workspaceId);
    } catch {
      baseCurrency = undefined;
    }
    const bankTypeAccounts = options.accounts.filter(
      (a) => (a.Type || '').toUpperCase() === 'BANK'
    );
    const filteredBankAccounts = options.accounts.filter((a) =>
      isBankPayoutAccount(a, baseCurrency)
    );
    appendDebugLog({
      sessionId: '4702f2',
      location: 'mapping-options/route.ts',
      message: 'bank accounts for mapping dropdown',
      hypothesisId: 'H1-H2',
      runId: 'post-fix',
      data: {
        workspaceId,
        baseCurrency: baseCurrency ?? null,
        totalAccounts: options.accounts.length,
        bankTypeCount: bankTypeAccounts.length,
        filteredBankCount: filteredBankAccounts.length,
        bankSamples: bankTypeAccounts.slice(0, 12).map((a) => ({
          Code: a.Code,
          Name: a.Name,
          CurrencyCode: a.CurrencyCode ?? null,
          displayLabel: a.displayLabel,
        })),
        filteredSamples: filteredBankAccounts.slice(0, 12).map((a) => ({
          Code: a.Code,
          Name: a.Name,
          CurrencyCode: a.CurrencyCode ?? null,
          displayLabel: a.displayLabel,
        })),
      },
    });
    return ok(request, options);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
