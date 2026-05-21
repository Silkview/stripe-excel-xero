import { useState } from 'react';
import type {
  ManualJournalPushResult,
  XeroManualJournalStatus,
} from '@stripesync/shared';
import { apiPost } from '../utils/api';
import { formatErrorWithDetails } from '../utils/errorMessages';
import { buildXeroJournalsFromBalanceTransactions } from '../utils/xeroJournalsExcel';
import { readXeroJournalsForPush } from '../utils/readXeroJournals';

interface XeroPanelProps {
  xeroConnected: boolean;
}

export default function XeroPanel({ xeroConnected }: XeroPanelProps) {
  const [building, setBuilding] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<XeroManualJournalStatus>('DRAFT');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const handleBuildJournals = async () => {
    setBuilding(true);
    setStatusMessage(null);
    setStatusError(false);

    try {
      const result = await buildXeroJournalsFromBalanceTransactions();
      const dateCount =
        result.chargeDates + result.refundDates + result.feeDates;
      setStatusMessage(
        `${result.lineCount} journal line${result.lineCount === 1 ? '' : 's'} written to Xero_Journals ` +
          `(${dateCount} date${dateCount === 1 ? '' : 's'}: ` +
          `${result.chargeDates} charge, ${result.refundDates} refund, ${result.feeDates} fee).`
      );
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to build journals.'
      );
      setStatusError(true);
    } finally {
      setBuilding(false);
    }
  };

  const handlePushJournals = async () => {
    if (!xeroConnected) {
      setStatusMessage('Connect Xero before pushing journals.');
      setStatusError(true);
      return;
    }

    setPushing(true);
    setStatusMessage(null);
    setStatusError(false);

    try {
      const lines = await readXeroJournalsForPush();
      const res = await apiPost<ManualJournalPushResult>(
        '/api/xero/manual-journals',
        { status: pushStatus, lines }
      );

      if (!res.success || !res.data) {
        setStatusMessage(
          formatErrorWithDetails(res) ||
            'Failed to push journals to Xero.'
        );
        setStatusError(true);
        return;
      }

      const { created, manualJournalIds, errors } = res.data;
      let msg = `Pushed ${created} manual journal${created === 1 ? '' : 's'} to Xero as ${pushStatus}.`;
      if (manualJournalIds.length > 0 && manualJournalIds.length <= 3) {
        msg += ` IDs: ${manualJournalIds.join(', ')}.`;
      }
      if (errors && errors.length > 0) {
        msg += ` ${errors.length} batch error(s).`;
      }
      setStatusMessage(msg);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to push journals to Xero.'
      );
      setStatusError(true);
    } finally {
      setPushing(false);
    }
  };

  const busy = building || pushing;

  return (
    <section className="mb-4 border-t border-gray-200 pt-3">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">Xero journals</h2>

      <p className="text-xs text-gray-600 mb-2">
        Summarise balance transactions into formula-driven lines on{' '}
        <span className="font-mono">Xero_Journals</span> (per day: charges,
        refunds, fees + clearing pairs). Uses{' '}
        <span className="font-mono">Account_Mappings</span> for account codes and
        tax.
      </p>

      <button
        type="button"
        onClick={handleBuildJournals}
        disabled={busy}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-2 px-3 rounded mb-2"
      >
        {building ? 'Building journals…' : 'Build journals from balance transactions'}
      </button>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700 mb-1">Push to Xero</h3>
        <label className="block text-xs text-gray-600 mb-1">Journal status</label>
        <select
          value={pushStatus}
          onChange={(e) =>
            setPushStatus(e.target.value as XeroManualJournalStatus)
          }
          disabled={busy}
          className="w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
        </select>

        <button
          type="button"
          onClick={handlePushJournals}
          disabled={busy || !xeroConnected}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium py-2 px-3 rounded mb-2"
        >
          {pushing ? 'Pushing to Xero…' : 'Push journals to Xero'}
        </button>

        {!xeroConnected && (
          <p className="text-xs text-amber-700 mb-2">Connect Xero to enable push.</p>
        )}

        <p className="text-xs text-gray-500">
          One manual journal per date; narration{' '}
          <span className="font-mono">Stripe posting - [date]</span>. Line
          descriptions come from column D.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`text-xs p-2 rounded mt-2 whitespace-pre-wrap ${
            statusError
              ? 'text-red-700 bg-red-50'
              : 'text-green-700 bg-green-50'
          }`}
        >
          {statusMessage}
        </div>
      )}
    </section>
  );
}
