import type { XeroMappingOptions } from '@stripesync/shared';
import {
  isBankPayoutAccount,
  isJournalMappingAccount,
} from '@stripesync/shared/accountMappingRules';
import {
  ACCOUNT_MAPPING_STRIPE_OBJECTS,
  ACCOUNT_MAPPING_HEADERS,
} from '../config/workbookSheets';
import { colLetter } from './officeHelpers';
import {
  LISTS_SHEET,
  NAMED_ACCOUNT_TAX_LOOKUP,
  NAMED_TAX,
  applyAccountMappingsTaxValidation,
  applyXeroJournalsTaxDropdowns,
  deleteAccountTaxNamedRanges,
  setupAccountTaxDropdowns,
} from './xeroAccountTaxDropdowns';
import { normalizeAccountMappingCell } from './accountMappingsRead';
import {
  accountCodeFromInternalTaxRangeName,
  isInternalTaxRangeName,
} from './xeroAccountTaxDropdowns';

const ACCOUNT_MAPPINGS_SHEET = 'Account_Mappings';
const MAPPING_ROW_COUNT = ACCOUNT_MAPPING_STRIPE_OBJECTS.length;
const FIRST_DATA_ROW = 2;
const LAST_DATA_ROW = FIRST_DATA_ROW + MAPPING_ROW_COUNT - 1;

const NAMED_JOURNAL_ACCOUNTS = 'XeroJournalAccounts';
const NAMED_BANK_ACCOUNTS = 'XeroBankAccounts';
const BANK_LIST_COL = 'H';
const NAMED_CONTACTS = 'XeroContacts';
const CONTACT_LIST_COL = 'I';
const NAMED_TRACKING = 'XeroTrackingNames';
const NAMED_TRACK_PREFIX = 'XeroTrack_';
const NAMED_CATEGORY_LOOKUP = 'XeroCategoryLookup';

function sanitizeNamedRangePart(name: string): string {
  let s = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!s || /^[0-9]/.test(s)) s = `_${s}`;
  return s.slice(0, 40);
}

function trackingRangeName(categoryName: string): string {
  return `${NAMED_TRACK_PREFIX}${sanitizeNamedRangePart(categoryName)}`;
}

function listValidation(source: string): Excel.DataValidationRule {
  return {
    list: {
      inCellDropDown: true,
      source,
    },
  };
}

export async function applyAccountMappingsDropdowns(
  options: XeroMappingOptions,
  defaultCurrency?: string
): Promise<void> {
  await Excel.run(async (context) => {
    const mappingsSheet =
      context.workbook.worksheets.getItemOrNullObject(ACCOUNT_MAPPINGS_SHEET);
    mappingsSheet.load('name');
    await context.sync();

    if (mappingsSheet.isNullObject) {
      throw new Error(
        'Account_Mappings sheet not found. Run Set up workbook sheets first.'
      );
    }

    let listsSheet =
      context.workbook.worksheets.getItemOrNullObject(LISTS_SHEET);
    await context.sync();

    if (listsSheet.isNullObject) {
      listsSheet = context.workbook.worksheets.add(LISTS_SHEET);
      listsSheet.visibility = Excel.SheetVisibility.veryHidden;
    } else {
      listsSheet.getUsedRangeOrNullObject()?.clear(Excel.ClearApplyTo.all);
    }

    const journalAccounts = options.accounts.filter((a) => isJournalMappingAccount(a));
    const bankAccounts = options.accounts.filter((a) =>
      isBankPayoutAccount(a, defaultCurrency)
    );

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'accountMappingsExcel.ts:applyAccountMappingsDropdowns',message:'filter accounts for dropdowns',data:{defaultCurrency:defaultCurrency??null,allAccounts:options.accounts?.length??0,journalAccounts:journalAccounts.length,bankAccounts:bankAccounts.length,bankAccountSamples:bankAccounts.slice(0,8).map((a)=>({Code:a.Code,Name:(a as any).Name,Type:(a as any).Type,CurrencyCode:(a as any).CurrencyCode,displayLabel:(a as any).displayLabel}))},timestamp:Date.now(),hypothesisId:'H2-H3',runId:'pre-fix'})}).catch(()=>{});
    // #endregion

    const journalAccountLabels = journalAccounts
      .filter((a) => isJournalMappingAccount(a))
      .map((a) => a.displayLabel);
    const bankAccountLabels = bankAccounts.map((a) => a.displayLabel);
    const taxLabels = options.taxRates.map((t) => t.displayLabel);
    const contactLabels = (options.contacts ?? []).map((c) => c.displayLabel);
    const categoryNames = options.trackingCategories.map((c) => c.Name);

    if (journalAccountLabels.length > 0) {
      listsSheet.getRange(`A1:A${journalAccountLabels.length}`).values =
        journalAccountLabels.map((l) => [l]);
    }
    if (bankAccountLabels.length > 0) {
      listsSheet.getRange(
        `${BANK_LIST_COL}1:${BANK_LIST_COL}${bankAccountLabels.length}`
      ).values = bankAccountLabels.map((l) => [l]);
    }
    if (contactLabels.length > 0) {
      listsSheet.getRange(
        `${CONTACT_LIST_COL}1:${CONTACT_LIST_COL}${contactLabels.length}`
      ).values = contactLabels.map((l) => [l]);
    }
    if (taxLabels.length > 0) {
      listsSheet.getRange(`B1:B${taxLabels.length}`).values =
        taxLabels.map((l) => [l]);
    }
    if (categoryNames.length > 0) {
      listsSheet.getRange(`C1:C${categoryNames.length}`).values =
        categoryNames.map((l) => [l]);
    }

    let colIndex = 4;
    for (const cat of options.trackingCategories) {
      if (cat.Options.length === 0) continue;
      const col = colLetter(colIndex);
      listsSheet.getRange(`${col}1`).values = [[cat.Name]];
      listsSheet.getRange(`${col}2:${col}${cat.Options.length + 1}`).values =
        cat.Options.map((o) => [o]);
      colIndex += 1;
    }

    await context.sync();

    const names = context.workbook.names;
    await deleteAccountTaxNamedRanges(context, names);

    const toDelete = [
      NAMED_JOURNAL_ACCOUNTS,
      NAMED_BANK_ACCOUNTS,
      NAMED_CONTACTS,
      'XeroAccounts',
      NAMED_TAX,
      NAMED_TRACKING,
      NAMED_CATEGORY_LOOKUP,
      NAMED_ACCOUNT_TAX_LOOKUP,
      ...options.trackingCategories.map((c) => trackingRangeName(c.Name)),
    ];
    for (const name of toDelete) {
      const item = names.getItemOrNullObject(name);
      item.load('name');
      await context.sync();
      if (!item.isNullObject) {
        item.delete();
      }
    }

    if (journalAccountLabels.length > 0) {
      names.add(
        NAMED_JOURNAL_ACCOUNTS,
        `='${LISTS_SHEET}'!$A$1:$A$${journalAccountLabels.length}`
      );
    }
    if (bankAccountLabels.length > 0) {
      names.add(
        NAMED_BANK_ACCOUNTS,
        `='${LISTS_SHEET}'!$${BANK_LIST_COL}$1:$${BANK_LIST_COL}$${bankAccountLabels.length}`
      );
    }
    if (contactLabels.length > 0) {
      names.add(
        NAMED_CONTACTS,
        `='${LISTS_SHEET}'!$${CONTACT_LIST_COL}$1:$${CONTACT_LIST_COL}$${contactLabels.length}`
      );
    }
    if (taxLabels.length > 0) {
      names.add(NAMED_TAX, `='${LISTS_SHEET}'!$B$1:$B$${taxLabels.length}`);
    }
    if (categoryNames.length > 0) {
      names.add(
        NAMED_TRACKING,
        `='${LISTS_SHEET}'!$C$1:$C$${categoryNames.length}`
      );
    }

    colIndex = 4;
    for (const cat of options.trackingCategories) {
      if (cat.Options.length === 0) continue;
      const col = colLetter(colIndex);
      const rangeName = trackingRangeName(cat.Name);
      names.add(
        rangeName,
        `='${LISTS_SHEET}'!$${col}$2:$${col}$${cat.Options.length + 1}`
      );
      colIndex += 1;
    }

    const lookupCol = colLetter(colIndex);
    const lookupCol2 = colLetter(colIndex + 1);
    if (categoryNames.length > 0) {
      const lookupRows = options.trackingCategories
        .filter((c) => c.Options.length > 0)
        .map((c) => [c.Name, trackingRangeName(c.Name)]);
      if (lookupRows.length > 0) {
        listsSheet.getRange(`${lookupCol}1`).values = [['Category']];
        listsSheet.getRange(`${lookupCol2}1`).values = [['RangeName']];
        listsSheet.getRange(
          `${lookupCol}2:${lookupCol2}${lookupRows.length + 1}`
        ).values = lookupRows;
        names.add(
          NAMED_CATEGORY_LOOKUP,
          `='${LISTS_SHEET}'!$${lookupCol}$2:$${lookupCol2}$${lookupRows.length + 1}`
        );
        colIndex += 2;
      }
    }

    colIndex = await setupAccountTaxDropdowns(
      context,
      listsSheet,
      names,
      options,
      defaultCurrency,
      colIndex
    );

    await context.sync();

    const payoutBankRow =
      FIRST_DATA_ROW +
      ACCOUNT_MAPPING_STRIPE_OBJECTS.indexOf('stripe_payout_bank');
    const contactRow =
      FIRST_DATA_ROW +
      ACCOUNT_MAPPING_STRIPE_OBJECTS.indexOf('stripe_payout_contact');

    mappingsSheet
      .getRange(`B${FIRST_DATA_ROW}:B${LAST_DATA_ROW}`)
      .dataValidation.clear();
    mappingsSheet
      .getRange(`C${FIRST_DATA_ROW}:C${LAST_DATA_ROW}`)
      .dataValidation.clear();
    await context.sync();

    for (let i = 0; i < ACCOUNT_MAPPING_STRIPE_OBJECTS.length; i++) {
      const row = FIRST_DATA_ROW + i;
      const stripeObject = ACCOUNT_MAPPING_STRIPE_OBJECTS[i];
      if (stripeObject === 'stripe_payout_contact') {
        if (contactLabels.length > 0) {
          mappingsSheet.getRange(`F${row}`).dataValidation.rule =
            listValidation(`=${NAMED_CONTACTS}`);
        }
        continue;
      }
      const accountSource =
        stripeObject === 'stripe_payout_bank'
          ? bankAccountLabels.length > 0
            ? `=${NAMED_BANK_ACCOUNTS}`
            : null
          : journalAccountLabels.length > 0
            ? `=${NAMED_JOURNAL_ACCOUNTS}`
            : null;
      if (accountSource) {
        mappingsSheet.getRange(`B${row}`).dataValidation.rule =
          listValidation(accountSource);
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'accountMappingsExcel.ts:validationApplied',message:'B column validation for payout bank row',data:{payoutBankRow,bankAccountLabelsCount:bankAccountLabels.length,bankValidationApplied:bankAccountLabels.length>0,accountSource:bankAccountLabels.length>0?`=XeroBankAccounts`:null},timestamp:Date.now(),hypothesisId:'H3-H4',runId:'post-fix'})}).catch(()=>{});
    // #endregion

    await applyAccountMappingsTaxValidation(
      mappingsSheet,
      FIRST_DATA_ROW,
      LAST_DATA_ROW,
      [contactRow, payoutBankRow]
    );
    if (categoryNames.length > 0) {
      mappingsSheet
        .getRange(`D${FIRST_DATA_ROW}:D${LAST_DATA_ROW}`)
        .dataValidation.rule = listValidation(`=${NAMED_TRACKING}`);
    }

    const hasLookup = categoryNames.some((n) =>
      options.trackingCategories.find(
        (c) => c.Name === n && c.Options.length > 0
      )
    );
    if (hasLookup) {
      for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
        const formula = `=IF(D${row}="","",INDIRECT(VLOOKUP(D${row},${NAMED_CATEGORY_LOOKUP},2,FALSE)))`;
        mappingsSheet.getRange(`E${row}`).dataValidation.rule =
          listValidation(formula);
      }
    }

    mappingsSheet.getRange(`A1:${colLetter(ACCOUNT_MAPPING_HEADERS.length)}1`).format.autofitColumns();

    await applyXeroJournalsTaxDropdowns(context);

    const accountRange = mappingsSheet.getRange(
      `B${FIRST_DATA_ROW}:B${LAST_DATA_ROW}`
    );
    accountRange.load('values');
    await context.sync();
    const existing = (accountRange.values as unknown[][]) ?? [];
    const accountColValues = existing.map((row, i) => {
      const stripeObject = ACCOUNT_MAPPING_STRIPE_OBJECTS[i];
      return [
        normalizeAccountMappingCell(
          row[0],
          stripeObject,
          journalAccounts,
          bankAccounts
        ),
      ];
    });
    accountRange.values = accountColValues;

    await context.sync();

    // #region agent log
    const payoutIdx = ACCOUNT_MAPPING_STRIPE_OBJECTS.indexOf('stripe_payout_bank');
    const payoutRaw = existing[payoutIdx]?.[0];
    const payoutNorm = accountColValues[payoutIdx]?.[0];
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'accountMappingsExcel.ts:cellNormalize',message:'stripe_payout_bank B cell',data:{payoutRaw:String(payoutRaw??''),payoutNorm:String(payoutNorm??''),wasInternalTax:isInternalTaxRangeName(String(payoutRaw??'')),internalCode:isInternalTaxRangeName(String(payoutRaw??''))?accountCodeFromInternalTaxRangeName(String(payoutRaw??'')):null},timestamp:Date.now(),hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  });
}

export function accountMappingsSheetExists(): Promise<boolean> {
  return Excel.run(async (context) => {
    const sheet =
      context.workbook.worksheets.getItemOrNullObject(ACCOUNT_MAPPINGS_SHEET);
    sheet.load('name');
    await context.sync();
    return !sheet.isNullObject;
  });
}
