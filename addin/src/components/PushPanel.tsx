import { useState, useEffect } from 'react';
import type {
  BankTransactionPushResult,
  ManualJournalPostMode,
  ManualJournalPushResult,
  XeroManualJournalStatus,
} from '@stripesync/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
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
  JOURNAL_PUSH_XERO_ID_COL,
  JOURNAL_PUSH_STATUS_COL,
  BANK_PUSH_DATA_COLS,
  BANK_PUSH_XERO_ID_COL,
  BANK_PUSH_STATUS_COL,
} from '../utils/pushRowFeedback';
import { useNotifications } from '../context/NotificationContext';

const LS_JOURNAL_RANGE = 'stripesync_journal_push_range';
const LS_BANK_RANGE = 'stripesync_bank_push_range';

type PushType = 'journals' | 'bank';

interface PushPanelProps {
  xeroConnected: boolean;
  currencyReady: boolean;
  xeroFeaturesEnabled?: boolean;
  defaultCurrency?: string;
  manualJournalPostMode?: ManualJournalPostMode;
}

export default function PushPanel({
  xeroConnected,
  currencyReady,
  xeroFeaturesEnabled = true,
  defaultCurrency,
  manualJournalPostMode = 'draft_and_post',
}: PushPanelProps) {
  const { publish, clear } = useNotifications();
  const draftOnly = manualJournalPostMode === 'draft_only';
  const [pushType, setPushType] = useState<PushType>('journals');
  const [journalRange, setJournalRange] = useState(DEFAULT_JOURNAL_PUSH_RANGE);
  const [bankRange, setBankRange] = useState(DEFAULT_BANK_PUSH_RANGE);
  const [pushStatus, setPushStatus] = useState<XeroManualJournalStatus>('DRAFT');
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    const savedJournal = localStorage.getItem(LS_JOURNAL_RANGE);
    const savedBank = localStorage.getItem(LS_BANK_RANGE);
    if (savedJournal) setJournalRange(savedJournal);
    if (savedBank) setBankRange(savedBank);
  }, []);

  useEffect(() => {
    if (draftOnly) {
      setPushStatus('DRAFT');
    }
  }, [draftOnly]);

  const pushEnabled = xeroFeaturesEnabled && xeroConnected && currencyReady;

  useEffect(() => {
    let prereq: string | null = null;
    if (!xeroFeaturesEnabled) {
      prereq = 'Upgrade to Pro or Firm to push journals and bank transactions to Xero.';
    } else if (!currencyReady) {
      prereq =
        'Connect Xero first to set your organisation currency. Push is disabled until then.';
    } else if (!xeroConnected) {
      prereq = 'Connect Xero and set organisation currency to enable push.';
    }
    if (prereq) {
      publish({ kind: 'warn', message: prereq, source: 'push-prereq' });
    } else {
      clear('push-prereq');
    }
  }, [xeroFeaturesEnabled, currencyReady, xeroConnected, publish, clear]);

  useEffect(() => {
    if (currencyReady && defaultCurrency) {
      publish({
        kind: 'success',
        message: `Journals and bank transactions post in ${defaultCurrency} only.`,
        source: 'push-info',
      });
    } else {
      clear('push-info');
    }
  }, [currencyReady, defaultCurrency, publish, clear]);

  useEffect(() => {
    if (pushType === 'journals') {
      publish({
        kind: 'success',
        message: `Rows with Xero ID already set are skipped. Xero IDs written to column ${JOURNAL_PUSH_XERO_ID_COL}; errors in column ${JOURNAL_PUSH_STATUS_COL} (Status).`,
        source: 'push-help',
      });
    } else {
      publish({
        kind: 'success',
        message: `Receive Money · AUTHORISED · skips pushed rows · Xero IDs in column ${BANK_PUSH_XERO_ID_COL}; errors in column ${BANK_PUSH_STATUS_COL} (Status).`,
        source: 'push-help',
      });
    }
  }, [pushType, publish]);

  useEffect(() => {
    return () => {
      clear('push');
      clear('push-prereq');
      clear('push-info');
      clear('push-help');
    };
  }, [clear]);

  const notifyPush = (message: string, isError: boolean) => {
    publish({
      kind: isError ? 'error' : 'success',
      message,
      source: 'push',
    });
  };

  const handlePushJournals = async () => {
    if (!pushEnabled) {
      notifyPush(
        !xeroConnected
          ? 'Connect Xero before pushing journals.'
          : 'Connect Xero to set your organisation currency before pushing.',
        true
      );
      return;
    }

    setPushing(true);
    clear('push');
    localStorage.setItem(LS_JOURNAL_RANGE, journalRange);

    try {
      const { lines, skippedCount, rowContext } =
        await readXeroJournalsForPush(journalRange);
      await resetPushFeedback(
        journalRange,
        JOURNAL_PUSH_XERO_ID_COL,
        JOURNAL_PUSH_STATUS_COL,
        JOURNAL_PUSH_DATA_COLS
      );

      const res = await apiPost<ManualJournalPushResult>(
        '/api/xero/manual-journals',
        { status: pushStatus, lines }
      );

      const rowIssues = res.error?.rowIssues;

      if (!res.success || !res.data || res.data.created === 0) {
        if (rowIssues?.length) {
          const feedback = buildJournalRowFeedback(
            rowContext,
            rowIssues,
            undefined,
            pushStatus
          );
          await applyPushRowFeedback(
            journalRange,
            JOURNAL_PUSH_XERO_ID_COL,
            JOURNAL_PUSH_STATUS_COL,
            JOURNAL_PUSH_DATA_COLS,
            feedback
          );
          notifyPush(
            `${feedback.length} row${feedback.length === 1 ? '' : 's'} failed validation. See highlighted rows in column ${JOURNAL_PUSH_STATUS_COL} (Status).`,
            true
          );
        } else {
          notifyPush(
            formatErrorWithDetails(res) || 'Failed to push journals to Xero.',
            true
          );
        }
        return;
      }

      const { created, journalIdsByDate } = res.data;
      const feedback = buildJournalRowFeedback(
        rowContext,
        undefined,
        journalIdsByDate,
        pushStatus
      );
      await applyPushRowFeedback(
        journalRange,
        JOURNAL_PUSH_XERO_ID_COL,
        JOURNAL_PUSH_STATUS_COL,
        JOURNAL_PUSH_DATA_COLS,
        feedback
      );

      const okRows = feedback.filter((f) => f.status === 'ok').length;
      let msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed successfully as ${pushStatus} (${created} journal${created === 1 ? '' : 's'} in Xero). Xero IDs in column ${JOURNAL_PUSH_XERO_ID_COL}, status in column ${JOURNAL_PUSH_STATUS_COL}.`;
      if (skippedCount > 0) {
        msg += ` ${skippedCount} row${skippedCount === 1 ? '' : 's'} skipped (already pushed).`;
      }
      notifyPush(msg, false);
    } catch (err) {
      notifyPush(
        err instanceof Error ? err.message : 'Failed to push journals to Xero.',
        true
      );
    } finally {
      setPushing(false);
    }
  };

  const handlePushBank = async () => {
    if (!pushEnabled) {
      notifyPush(
        !xeroConnected
          ? 'Connect Xero before pushing bank transactions.'
          : 'Connect Xero to set your organisation currency before pushing.',
        true
      );
      return;
    }

    setPushing(true);
    clear('push');
    localStorage.setItem(LS_BANK_RANGE, bankRange);

    try {
      const { transactions, skippedCount, includedRowNumbers } =
        await readXeroBankTransactionsForPush(bankRange);
      await resetPushFeedback(
        bankRange,
        BANK_PUSH_XERO_ID_COL,
        BANK_PUSH_STATUS_COL,
        BANK_PUSH_DATA_COLS
      );

      const res = await apiPost<BankTransactionPushResult>(
        '/api/xero/bank-transactions',
        { transactions }
      );

      const rowIssues = res.error?.rowIssues;

      if (!res.success || !res.data || res.data.created === 0) {
        if (rowIssues?.length) {
          const feedback = buildBankRowFeedback(
            includedRowNumbers,
            transactions,
            rowIssues,
            []
          );
          await applyPushRowFeedback(
            bankRange,
            BANK_PUSH_XERO_ID_COL,
            BANK_PUSH_STATUS_COL,
            BANK_PUSH_DATA_COLS,
            feedback
          );
          notifyPush(
            `${feedback.length} row${feedback.length === 1 ? '' : 's'} failed. See highlighted rows in column ${BANK_PUSH_STATUS_COL} (Status).`,
            true
          );
        } else {
          notifyPush(
            formatErrorWithDetails(res) ||
              'Failed to push bank transactions to Xero.',
            true
          );
        }
        return;
      }

      const { created, bankTransactionIds } = res.data;
      const feedback = buildBankRowFeedback(
        includedRowNumbers,
        transactions,
        undefined,
        bankTransactionIds
      );
      await applyPushRowFeedback(
        bankRange,
        BANK_PUSH_XERO_ID_COL,
        BANK_PUSH_STATUS_COL,
        BANK_PUSH_DATA_COLS,
        feedback
      );

      const okRows = feedback.filter((f) => f.status === 'ok').length;
      let msg = `${okRows} row${okRows === 1 ? '' : 's'} pushed successfully as AUTHORISED (${created} transaction${created === 1 ? '' : 's'} in Xero). Xero IDs in column ${BANK_PUSH_XERO_ID_COL}, status in column ${BANK_PUSH_STATUS_COL}.`;
      if (skippedCount > 0) {
        msg += ` ${skippedCount} row${skippedCount === 1 ? '' : 's'} skipped (already pushed).`;
      }
      notifyPush(msg, false);
    } catch (err) {
      notifyPush(
        err instanceof Error
          ? err.message
          : 'Failed to push bank transactions to Xero.',
        true
      );
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="p-3.5 flex flex-col gap-0">
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <button
          type="button"
          onClick={() => setPushType('journals')}
          className={`py-2 px-2 text-[11.5px] font-medium rounded-lg border cursor-pointer transition-colors ${
            pushType === 'journals'
              ? 'border-xero bg-xero-light text-xero-dark'
              : 'border-border bg-white text-ink-2'
          }`}
        >
          <div className="text-base mb-0.5">📒</div>
          Manual journals
        </button>
        <button
          type="button"
          onClick={() => setPushType('bank')}
          className={`py-2 px-2 text-[11.5px] font-medium rounded-lg border cursor-pointer transition-colors ${
            pushType === 'bank'
              ? 'border-xero bg-xero-light text-xero-dark'
              : 'border-border bg-white text-ink-2'
          }`}
        >
          <div className="text-base mb-0.5">🏦</div>
          Bank transactions
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
          <Field label="Status" className="mt-2">
            {draftOnly ? (
              <div className="w-full rounded-sm border border-border bg-bg px-2 py-1.5 text-sm text-ink-2">
                Draft (required for this workspace)
              </div>
            ) : (
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
            )}
          </Field>
          <Button
            variant="push"
            onClick={handlePushJournals}
            disabled={pushing || !pushEnabled}
            className="mt-2"
          >
            {pushing ? 'Pushing…' : '↑ Push journals to Xero'}
          </Button>
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
          <Button
            variant="push"
            onClick={handlePushBank}
            disabled={pushing || !pushEnabled}
            className="mt-2"
          >
            {pushing ? 'Pushing…' : '↑ Push bank transactions to Xero'}
          </Button>
        </Card>
      )}
    </div>
  );
}
