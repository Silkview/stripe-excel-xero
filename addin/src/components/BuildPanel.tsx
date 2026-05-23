import { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import ResultBar from './ui/ResultBar';
import InfoRow from './ui/InfoRow';
import {
  BANK_TXN_SHEET_ALIASES,
} from '../config/xeroBankTransactionBuilder';
import { JOURNAL_SHEET } from '../config/xeroJournalBuilder';
import { buildXeroBankTransactionsFromBalanceTransactions } from '../utils/xeroBankTransactionsExcel';
import { applyAccountMappingsDropdowns } from '../utils/accountMappingsExcel';
import { buildXeroJournalsFromBalanceTransactions } from '../utils/xeroJournalsExcel';
import { apiGet } from '../utils/api';
import type { XeroMappingOptions } from '@stripesync/shared';
import {
  activateFirstAvailableWorksheet,
  activateWorksheet,
} from '../utils/officeHelpers';

interface BuildPanelProps {
  currencyReady: boolean;
  defaultCurrency?: string;
  onBuilt?: () => void;
}

export default function BuildPanel({
  currencyReady,
  defaultCurrency,
  onBuilt,
}: BuildPanelProps) {
  const [building, setBuilding] = useState(false);
  const [buildingBank, setBuildingBank] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const busy = building || buildingBank;

  const handleBuildJournals = async () => {
    if (!currencyReady || !defaultCurrency) {
      setStatusMessage('Connect Xero to set your organisation currency before building.');
      setStatusError(true);
      return;
    }
    setBuilding(true);
    setStatusMessage(null);
    setStatusError(false);
    try {
      const result = await buildXeroJournalsFromBalanceTransactions(defaultCurrency);
      const optRes = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
      if (optRes.success && optRes.data) {
        await applyAccountMappingsDropdowns(optRes.data, defaultCurrency);
      }
      await activateWorksheet(JOURNAL_SHEET, 'A2');
      const dateCount =
        result.chargeDates + result.refundDates + result.feeDates;
      setStatusMessage(
        `${result.lineCount} journal line${result.lineCount === 1 ? '' : 's'} → Xero_Journals (${dateCount} date${dateCount === 1 ? '' : 's'}).`
      );
      onBuilt?.();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to build journals.'
      );
      setStatusError(true);
    } finally {
      setBuilding(false);
    }
  };

  const handleBuildBankTransactions = async () => {
    if (!currencyReady || !defaultCurrency) {
      setStatusMessage('Connect Xero to set your organisation currency before building.');
      setStatusError(true);
      return;
    }
    setBuildingBank(true);
    setStatusMessage(null);
    setStatusError(false);
    try {
      const result =
        await buildXeroBankTransactionsFromBalanceTransactions(defaultCurrency);
      await activateFirstAvailableWorksheet(BANK_TXN_SHEET_ALIASES, 'A2');
      setStatusMessage(
        `${result.rowCount} bank transaction row${result.rowCount === 1 ? '' : 's'} → Xero_Bank_Transaction.`
      );
      onBuilt?.();
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Failed to build bank transactions.'
      );
      setStatusError(true);
    } finally {
      setBuildingBank(false);
    }
  };

  const buildDisabled = busy || !currencyReady;

  return (
    <div className="p-3.5 flex flex-col gap-0">
      {!currencyReady && (
        <InfoRow className="mb-2 text-warn">
          Connect Xero first to set your organisation currency. Build is disabled until then.
        </InfoRow>
      )}
      {currencyReady && defaultCurrency && (
        <InfoRow className="mb-2">
          Only balance transactions in {defaultCurrency} are included.
        </InfoRow>
      )}
      <Card
        title="Manual journals"
        icon="📒"
        iconClass="bg-stripe-light text-stripe"
      >
        <InfoRow>
          Summarise balance transactions into formula-driven lines on Xero_Journals
          (charges, refunds, fees + clearing). Uses Account_Mappings.
        </InfoRow>
        <Button
          variant="build"
          onClick={handleBuildJournals}
          disabled={buildDisabled}
          className="mt-2"
        >
          {building ? 'Building…' : 'Build journals from balance transactions'}
        </Button>
      </Card>

      <Card
        title="Bank transactions"
        icon="🏦"
        iconClass="bg-xero-light text-xero-dark"
      >
        <InfoRow>
          One RECEIVE line per payout on Xero_Bank_Transaction. Bank, clearing, and
          contact from Account_Mappings.
        </InfoRow>
        <Button
          variant="build"
          onClick={handleBuildBankTransactions}
          disabled={buildDisabled}
          className="mt-2"
        >
          {buildingBank
            ? 'Building…'
            : 'Build bank transactions from balance transactions'}
        </Button>
      </Card>

      {statusMessage && (
        <ResultBar variant={statusError ? 'warn' : 'success'}>
          {statusMessage}
        </ResultBar>
      )}
    </div>
  );
}
