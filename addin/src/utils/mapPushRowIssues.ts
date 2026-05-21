import type { PushRowIssue, XeroBankTransactionInput } from '@stripesync/shared';
import type { JournalRowContext } from './readXeroJournals';

const MAX_STATUS_LEN = 255;

function truncateMessage(msg: string): string {
  return msg.length > MAX_STATUS_LEN ? `${msg.slice(0, MAX_STATUS_LEN - 1)}…` : msg;
}

export interface RowFeedback {
  excelRow: number;
  status: 'ok' | 'error';
  message?: string;
}

function descriptionsMatch(a: string, b: string): boolean {
  const ta = a.trim();
  const tb = b.trim();
  if (!ta || !tb) return false;
  return ta === tb;
}

export function mapJournalIssuesToRows(
  rowContext: JournalRowContext[],
  issues: PushRowIssue[]
): Map<number, string> {
  const errors = new Map<number, string>();

  for (const issue of issues) {
    const msg = truncateMessage(issue.message);
    const date = issue.date;
    if (!date) continue;

    for (const row of rowContext) {
      if (row.date !== date) continue;

      if (issue.description) {
        if (!descriptionsMatch(row.description, issue.description)) continue;
        if (
          issue.accountCode &&
          row.accountCode &&
          issue.accountCode !== row.accountCode
        ) {
          continue;
        }
      } else if (issue.accountCode && row.accountCode !== issue.accountCode) {
        continue;
      }

      if (!errors.has(row.excelRow)) {
        errors.set(row.excelRow, msg);
      }
    }
  }

  return errors;
}

export function buildJournalRowFeedback(
  rowContext: JournalRowContext[],
  issues: PushRowIssue[] | undefined,
  journalIdsByDate: Record<string, string> | undefined
): RowFeedback[] {
  const errorMap = issues?.length
    ? mapJournalIssuesToRows(rowContext, issues)
    : new Map<number, string>();

  const results: RowFeedback[] = [];

  for (const row of rowContext) {
    const err = errorMap.get(row.excelRow);
    if (err) {
      results.push({ excelRow: row.excelRow, status: 'error', message: err });
      continue;
    }

    const id = journalIdsByDate?.[row.date];
    if (id) {
      const statusMsg = id.length > 12 ? '✓ pushed' : id;
      results.push({
        excelRow: row.excelRow,
        status: 'ok',
        message: statusMsg,
      });
    }
  }

  return results;
}

function bankIssueMatchesTxn(
  issue: PushRowIssue,
  txn: XeroBankTransactionInput
): boolean {
  if (issue.reference && issue.reference !== txn.reference) return false;
  if (issue.date && issue.date !== txn.date) return false;
  return true;
}

export function mapBankIssuesToRows(
  includedRowNumbers: number[],
  transactions: XeroBankTransactionInput[],
  issues: PushRowIssue[]
): Map<number, string> {
  const errors = new Map<number, string>();

  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    const excelRow = includedRowNumbers[i];
    for (const issue of issues) {
      if (!bankIssueMatchesTxn(issue, txn)) continue;
      errors.set(excelRow, truncateMessage(issue.message));
      break;
    }
  }

  return errors;
}

export function buildBankRowFeedback(
  includedRowNumbers: number[],
  transactions: XeroBankTransactionInput[],
  issues: PushRowIssue[] | undefined,
  bankTransactionIds: string[]
): RowFeedback[] {
  const errorMap = issues?.length
    ? mapBankIssuesToRows(includedRowNumbers, transactions, issues)
    : new Map<number, string>();

  const results: RowFeedback[] = [];
  let idIdx = 0;

  for (let i = 0; i < transactions.length; i++) {
    const excelRow = includedRowNumbers[i];
    const err = errorMap.get(excelRow);
    if (err) {
      results.push({ excelRow, status: 'error', message: err });
      continue;
    }

    const id = bankTransactionIds[idIdx++];
    if (id) {
      results.push({
        excelRow,
        status: 'ok',
        message: id.length > 12 ? '✓ pushed' : id,
      });
    }
  }

  return results;
}
