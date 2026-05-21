import { useState, useEffect } from 'react';
import type {
  BankTransactionPushResult,
  ManualJournalPushResult,
  XeroManualJournalStatus,
} from '@stripesync/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import InfoRow from './ui/InfoRow';
import { apiPost } from '../utils/api';
import { formatErrorWithDetails } from '../utils/errorMessages';
import {
  buildBankRowFeedback,
  buildJournalRowFeedback,
} from '../utils/mapPushRowIssues';
import {
  readXeroBankTransactionsForPush,
  DEFAULT_BANK_PUSH_RANGE,
} from '../utils/readXeroBankTransactions';
import {
  readXeroJournalsForPush,
  DEFAULT_JOURNAL_PUSH_RANGE,
} from '../utils/readXeroJournals';
import {
  applyPushRowFeedback,
  resetPushFeedback,
  JOURNAL_PUSH_DATA_COLS,
  JOURNAL_PUSH_STATUS_COL,
  BANK_PUSH_DATA_COLS,
  BANK_PUSH_STATUS_COL,
} from '../utils/pushRowFeedback';

const LS_JOURNAL_RANGE = 'stripesync_journal_push_range';
const LS_BANK_RANGE = 'stripesync_bank_push_range';

type PushType = 'journals' | 'bank';

interface PushPanelProps {
  xeroConnected: boolean;
  currencyReady: boolean;
  defaultCurrency?: string;
}

export default function PushPanel({
  xeroConnected,
  currencyReady,
  defaultCurrency,
}: PushPanelProps) {
  const [pushType, setPushType] = useState<PushType>('journals');
  const [journalRange, setJournalRange] = useState(DEFAULT_JOURNAL_PUSH_RANGE);
  const [bankRange, setBankRange] = useState(DEFAULT_BANK_PUSH_RANGE);
  const [pushStatus, setPushStatus] = useState<XeroManualJournalStatus>('DRAFT');
  const [pushing, setPushing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    const savedJournal = localStorage.getItem(LS_JOURNAL_RANGE);
    const savedBank = localStorage.getItem(LS_BANK_RANGE);
    if (savedJournal) setJournalRange(savedJournal);
    if (savedBank) setBankRange(savedBank);
  }, []);

  const pushEnabled = xeroConnected && currencyReady;

  const handlePushJournals = async () => {
    if (!pushEnabled) {
      setStatusMessage(
        !xeroConnected
          ? 'Connect Xero before pushing journals.'
          : 'Connect Xero to set your organisation currency before pushing.'
      );
      setStatusError(true);
      return;
    }

    setPushing(true);
    setStatusMessage(null);
    setStatusError(false);
    localStorage.setItem(LS_JOURNAL_RANGE, journalRange);

    try {
      const { lines, skippedCount, rowContext } =
        await readXeroJournalsForPush(journalRange);
      await resetPushFeedback(
        journalRange,
        JOURNAL_PUSH_STATUS_COL,
        JOURNAL_PUSH_DATA_COLS
      );

      const res = await apiPost<ManualJournalPushResult>(
        '/api/xero/manual-journals',
        { status: pushStatus, lines }
      );

      const rowIssues =
        res.error?.rowIssues ?? res.data?.rowIssues;

      if (!res.success || !res.data) {
        if (rowIssues?.length) {
          const feedback = buildJournalRowFeedback(rowContext, rowIssues, undefined);
          await applyPushRowFeedback(
            journalRange,
            JOURNAL_PUSH_STATUS_COL,
            JOURNAL_PUSH_DATA_COLS,
            feedback
          );
          setStatusMessage(
            `${feedback.length} row${feedback.length === 1 ? '' : 's'} failed validation. See highlighted rows in column ${JOURNAL_PUSH_STATUS_COL}.`
          );
        } else {
          setStatusMessage(
            formatErrorWithDetails(res) || 'Failed to push journals to Xero.'
          );
        }
        setStatusError(true);
        return;
      }

      const { created, journalIdsByDate } = res.data;
      const feedback = buildJournalRowFeedback(
        rowContext,
        rowIssues,
        journalIdsByDate
      );
      await applyPushRowFeedback(
        journalRange,
        JOURNAL_PUSH_STATUS_COL,
        JOURNAL_PUSH_DATA_COLS,
        feedback
      );

      const errorRows = feedback.filter((f) => f.status === 'error').length;
      const okRows = feedback.filter((f) => f.status === 'ok').length;

      let msg = `${created} journal${created === 1 ? '' : 's'} pushed as ${pushStatus}.`;
      if (okRows > 0 && errorRows === 0) {
        msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed successfully (highlighted green).`;
      } else if (errorRows > 0) {
        msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed; ${errorRows} row${errorRows === 1 ? '' : 's'} failed (highlighted red).`;
      }
      if (skippedCount > 0) {
        msg += ` ${skippedCount} row${skippedCount === 1 ? '' : 's'} skipped (already pushed).`;
      }
      setStatusMessage(msg);
      setStatusError(errorRows > 0);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to push journals to Xero.'
      );
      setStatusError(true);
    } finally {
      setPushing(false);
    }
  };

  const handlePushBank = async () => {
    if (!pushEnabled) {
      setStatusMessage(
        !xeroConnected
          ? 'Connect Xero before pushing bank transactions.'
          : 'Connect Xero to set your organisation currency before pushing.'
      );
      setStatusError(true);
      return;
    }

    setPushing(true);
    setStatusMessage(null);
    setStatusError(false);
    localStorage.setItem(LS_BANK_RANGE, bankRange);

    try {
      const { transactions, skippedCount, includedRowNumbers } =
        await readXeroBankTransactionsForPush(bankRange);
      await resetPushFeedback(
        bankRange,
        BANK_PUSH_STATUS_COL,
        BANK_PUSH_DATA_COLS
      );

      const res = await apiPost<BankTransactionPushResult>(
        '/api/xero/bank-transactions',
        { transactions }
      );

      const rowIssues =
        res.error?.rowIssues ?? res.data?.rowIssues;

      if (!res.success || !res.data) {
        if (rowIssues?.length) {
          const feedback = buildBankRowFeedback(
            includedRowNumbers,
            transactions,
            rowIssues,
            []
          );
          await applyPushRowFeedback(
            bankRange,
            BANK_PUSH_STATUS_COL,
            BANK_PUSH_DATA_COLS,
            feedback
          );
          setStatusMessage(
            `${feedback.length} row${feedback.length === 1 ? '' : 's'} failed. See highlighted rows in column ${BANK_PUSH_STATUS_COL}.`
          );
        } else {
          setStatusMessage(
            formatErrorWithDetails(res) ||
              'Failed to push bank transactions to Xero.'
          );
        }
        setStatusError(true);
        return;
      }

      const { created, bankTransactionIds } = res.data;
      const feedback = buildBankRowFeedback(
        includedRowNumbers,
        transactions,
        rowIssues,
        bankTransactionIds
      );
      await applyPushRowFeedback(
        bankRange,
        BANK_PUSH_STATUS_COL,
        BANK_PUSH_DATA_COLS,
        feedback
      );

      const errorRows = feedback.filter((f) => f.status === 'error').length;
      const okRows = feedback.filter((f) => f.status === 'ok').length;

      let msg = `${created} bank transaction${created === 1 ? '' : 's'} pushed as AUTHORISED.`;
      if (okRows > 0 && errorRows === 0) {
        msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed successfully (highlighted green).`;
      } else if (errorRows > 0) {
        msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed; ${errorRows} row${errorRows === 1 ? '' : 's'} failed (highlighted red).`;
      }
      if (skippedCount > 0) {
        msg += ` ${skippedCount} row${skippedCount === 1 ? '' : 's'} skipped (already pushed).`;
      }
      setStatusMessage(msg);
      setStatusError(errorRows > 0);
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Failed to push bank transactions to Xero.'
      );
      setStatusError(true);
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-0">
      {!currencyReady && (
        <InfoRow className="mb-2 text-warn">
          Connect Xero first to set your organisation currency. Push is disabled until then.
        </InfoRow>
      )}
      {currencyReady && defaultCurrency && (
        <InfoRow className="mb-2">
          Journals and bank transactions post in {defaultCurrency} only.
        </InfoRow>
      )}
      <div className="flex gap-1 mb-2.5 p-0.5 bg-bg rounded-sm border border-border">
        <button
          type="button"
          onClick={() => setPushType('journals')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-[3px] border-none cursor-pointer transition-colors ${
            pushType === 'journals'
              ? 'bg-surface text-text shadow-sm'
              : 'bg-transparent text-text-3'
          }`}
        >
          Manual Journals
        </button>
        <button
          type="button"
          onClick={() => setPushType('bank')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-[3px] border-none cursor-pointer transition-colors ${
            pushType === 'bank'
              ? 'bg-surface text-text shadow-sm'
              : 'bg-transparent text-text-3'
          }`}
        >
          Bank Transactions
        </button>
      </div>

      {pushType === 'journals' && (
        <Card title="Push journals" icon="↑" iconClass="bg-xero-light text-xero-dark">
          <Field label="Read range">
            <input
              type="text"
              value={journalRange}
              onChange={(e) => setJournalRange(e.target.value)}
              className="w-full border border-border rounded-sm px-2 py-1.5 text-xs font-mono bg-surface text-text"
              spellCheck={false}
            />
          </Field>
          <InfoRow>Rows with Xero ID already set are skipped. Errors show in column {JOURNAL_PUSH_STATUS_COL}.</InfoRow>
          <Field label="Status" className="mt-2">
            <select
              value={pushStatus}
              onChange={(e) =>
                setPushStatus(e.target.value as XeroManualJournalStatus)
              }
              disabled={pushing}
              className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-surface"
            >
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
            </select>
          </Field>
          <Button
            variant="xero"
            onClick={handlePushJournals}
            disabled={pushing || !pushEnabled}
            className="mt-2"
          >
            {pushing ? 'Pushing…' : '↑ Push journals to Xero'}
          </Button>
          {!pushEnabled && (
            <InfoRow className="text-warn mt-1">
              Connect Xero and set organisation currency to enable push.
            </InfoRow>
          )}
        </Card>
      )}

      {pushType === 'bank' && (
        <Card
          title="Push bank transactions"
          icon="↑"
          iconClass="bg-xero-light text-xero-dark"
        >
          <Field label="Read range">
            <input
              type="text"
              value={bankRange}
              onChange={(e) => setBankRange(e.target.value)}
              className="w-full border border-border rounded-sm px-2 py-1.5 text-xs font-mono bg-surface text-text"
              spellCheck={false}
            />
          </Field>
          <InfoRow>Receive Money · AUTHORISED · skips pushed rows · errors in column {BANK_PUSH_STATUS_COL}.</InfoRow>
          <Button
            variant="xero"
            onClick={handlePushBank}
            disabled={pushing || !pushEnabled}
            className="mt-2"
          >
            {pushing ? 'Pushing…' : '↑ Push bank transactions to Xero'}
          </Button>
          {!pushEnabled && (
            <InfoRow className="text-warn mt-1">
              Connect Xero and set organisation currency to enable push.
            </InfoRow>
          )}
        </Card>
      )}

      {statusMessage && (
        <ResultBar variant={statusError ? 'warn' : 'success'}>
          {statusMessage}
        </ResultBar>
      )}
    </div>
  );
}
