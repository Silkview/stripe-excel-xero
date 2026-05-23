import type { XeroAccountOption, XeroMappingOptions } from '@stripesync/shared';
import { isBankPayoutAccount, isJournalMappingAccount } from '@stripesync/shared/accountMappingRules';
import { colLetter } from './officeHelpers';
import { JOURNAL_SHEET } from '../config/xeroJournalBuilder';

export const LISTS_SHEET = '_StripeSync_Lists';
export const NAMED_TAX = 'XeroTaxTypes';
export const NAMED_ACCOUNT_TAX_LOOKUP = 'XeroAccountTaxLookup';
const NAMED_TAX_ACCT_PREFIX = 'XeroTaxAcct_';

const JOURNAL_TAX_COL = 'F';
const JOURNAL_ACCOUNT_COL = 'C';
const JOURNAL_FIRST_DATA_ROW = 2;
const JOURNAL_TAX_MAX_ROW = 502;

function sanitizeNamedRangePart(name: string): string {
  let s = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!s || /^[0-9]/.test(s)) s = `_${s}`;
  return s.slice(0, 40);
}

export function accountTaxRangeName(accountCode: string): string {
  return `${NAMED_TAX_ACCT_PREFIX}${sanitizeNamedRangePart(accountCode)}`;
}

export function taxDisplayLabelForAccount(
  account: Pick<XeroAccountOption, 'TaxType'>,
  taxRates: XeroMappingOptions['taxRates']
): string | undefined {
  const taxType = (account.TaxType ?? '').trim();
  if (!taxType) return undefined;
  return taxRates.find((t) => t.TaxType === taxType)?.displayLabel;
}

function listValidation(source: string): Excel.DataValidationRule {
  return {
    list: {
      inCellDropDown: true,
      source,
    },
  };
}

export function accountTaxValidationFormula(accountCell: string): string {
  return `=IF(${accountCell}="","",INDIRECT(VLOOKUP(${accountCell},${NAMED_ACCOUNT_TAX_LOOKUP},2,FALSE)))`;
}

/** Accounts that can appear on mapping / journal sheets. */
function accountsForTaxLookup(
  options: XeroMappingOptions,
  defaultCurrency?: string
): XeroAccountOption[] {
  return options.accounts.filter(
    (a) =>
      isJournalMappingAccount(a) || isBankPayoutAccount(a, defaultCurrency)
  );
}

export async function deleteAccountTaxNamedRanges(
  context: Excel.RequestContext,
  names: Excel.NamedItemCollection
): Promise<void> {
  names.loadItems();
  await context.sync();
  for (const item of names.items) {
    item.load('name');
  }
  await context.sync();
  for (const item of names.items) {
    if (item.name.startsWith(NAMED_TAX_ACCT_PREFIX)) {
      item.delete();
    }
  }
}

/**
 * Writes per-account tax list named ranges and XeroAccountTaxLookup on _StripeSync_Lists.
 * Returns the next free column index after the lookup table.
 */
export async function setupAccountTaxDropdowns(
  context: Excel.RequestContext,
  listsSheet: Excel.Worksheet,
  names: Excel.NamedItemCollection,
  options: XeroMappingOptions,
  defaultCurrency: string | undefined,
  startColIndex: number
): Promise<number> {
  const accounts = accountsForTaxLookup(options, defaultCurrency);
  const lookupCol = colLetter(startColIndex);
  const rangeNameCol = colLetter(startColIndex + 1);
  const taxValueCol = colLetter(startColIndex + 2);

  await deleteAccountTaxNamedRanges(context, names);

  const existing = names.getItemOrNullObject(NAMED_ACCOUNT_TAX_LOOKUP);
  existing.load('name');
  await context.sync();
  if (!existing.isNullObject) {
    existing.delete();
  }

  const lookupRows: string[][] = [];
  let taxValueRow = 2;

  for (const account of accounts) {
    const taxLabel = taxDisplayLabelForAccount(account, options.taxRates);
    const rangeName = account.TaxType
      ? accountTaxRangeName(account.Code)
      : NAMED_TAX;

    if (account.TaxType && taxLabel) {
      listsSheet.getRange(`${taxValueCol}${taxValueRow}`).values = [[taxLabel]];
      names.add(
        rangeName,
        `='${LISTS_SHEET}'!$${taxValueCol}$${taxValueRow}:$${taxValueCol}$${taxValueRow}`
      );
      taxValueRow += 1;
    }

    lookupRows.push([account.displayLabel, rangeName]);
  }

  if (lookupRows.length > 0) {
    listsSheet.getRange(`${lookupCol}1`).values = [['Account']];
    listsSheet.getRange(`${rangeNameCol}1`).values = [['TaxList']];
    listsSheet.getRange(
      `${lookupCol}2:${rangeNameCol}${lookupRows.length + 1}`
    ).values = lookupRows;
    names.add(
      NAMED_ACCOUNT_TAX_LOOKUP,
      `='${LISTS_SHEET}'!$${lookupCol}$2:$${rangeNameCol}$${lookupRows.length + 1}`
    );
  }

  await context.sync();
  return startColIndex + 3;
}

export async function applyAccountMappingsTaxValidation(
  mappingsSheet: Excel.Worksheet,
  firstDataRow: number,
  lastDataRow: number,
  skipRows: number[] = []
): Promise<void> {
  const skip = new Set(skipRows);
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    if (skip.has(row)) continue;
    mappingsSheet.getRange(`C${row}`).dataValidation.rule = listValidation(
      accountTaxValidationFormula(`B${row}`)
    );
  }
}

export async function applyXeroJournalsTaxDropdowns(
  context: Excel.RequestContext
): Promise<void> {
  const lookup = context.workbook.names.getItemOrNullObject(
    NAMED_ACCOUNT_TAX_LOOKUP
  );
  lookup.load('name');
  await context.sync();
  if (lookup.isNullObject) return;

  const journalSheet =
    context.workbook.worksheets.getItemOrNullObject(JOURNAL_SHEET);
  journalSheet.load('name');
  await context.sync();
  if (journalSheet.isNullObject) return;

  const used = journalSheet.getUsedRangeOrNullObject();
  used.load(['rowCount', 'rowIndex']);
  await context.sync();

  let lastRow = JOURNAL_TAX_MAX_ROW;
  if (!used.isNullObject && used.rowCount > 0) {
    lastRow = Math.min(
      JOURNAL_TAX_MAX_ROW,
      used.rowIndex + used.rowCount - 1
    );
  }

  if (lastRow < JOURNAL_FIRST_DATA_ROW) return;

  for (let row = JOURNAL_FIRST_DATA_ROW; row <= lastRow; row++) {
    journalSheet.getRange(`${JOURNAL_TAX_COL}${row}`).dataValidation.rule =
      listValidation(
        accountTaxValidationFormula(`${JOURNAL_ACCOUNT_COL}${row}`)
      );
  }
}
