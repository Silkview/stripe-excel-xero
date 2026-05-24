import { useEffect, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { BANK_TXN_SHEET_ALIASES } from '../config/xeroBankTransactionBuilder';
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
import { useNotifications } from '../context/NotificationContext';

interface BuildPanelProps {
  currencyReady: boolean;
  defaultCurrency?: string;
  xeroFeaturesEnabled?: boolean;
  onBuilt?: () => void;
}

export default function BuildPanel({
  currencyReady,
  defaultCurrency,
  xeroFeaturesEnabled = true,
  onBuilt,
}: BuildPanelProps) {
  const { publish, clear } = useNotifications();
  const [building, setBuilding] = useState(false);
  const [buildingBank, setBuildingBank] = useState(false);

  const busy = building || buildingBank;

  useEffect(() => {
    let prereq: string | null = null;
    if (!xeroFeaturesEnabled) {
      prereq = 'Upgrade to Pro or Firm to build Xero journals and bank transactions.';
    } else if (!currencyReady) {
      prereq =
        'Connect Xero first to set your organisation currency. Build is disabled until then.';
    }
    if (prereq) {
      publish({ kind: 'warn', message: prereq, source: 'build-prereq' });
    } else {
      clear('build-prereq');
    }
  }, [xeroFeaturesEnabled, currencyReady, publish, clear]);

  useEffect(() => {
    if (currencyReady && defaultCurrency) {
      publish({
        kind: 'success',
        message: `Only balance transactions in ${defaultCurrency} are included.`,
        source: 'build-info',
      });
    } else {
      clear('build-info');
    }
  }, [currencyReady, defaultCurrency, publish, clear]);

  useEffect(() => {
    publish({
      kind: 'success',
      message:
        'Manual journals summarise balance transactions on Xero_Journals. Bank transactions create one RECEIVE line per payout on Xero_Bank_Transaction.',
      source: 'build-help',
    });
    return () => {
      clear('build');
      clear('build-prereq');
      clear('build-info');
      clear('build-help');
    };
  }, [publish, clear]);

  const notifyBuild = (message: string, isError: boolean) => {
    publish({
      kind: isError ? 'error' : 'success',
      message,
      source: 'build',
    });
  };

  const handleBuildJournals = async () => {
    if (!xeroFeaturesEnabled) {
      notifyBuild('Upgrade to Pro or Firm to build Xero journals.', true);
      return;
    }
    if (!currencyReady || !defaultCurrency) {
      notifyBuild(
        'Connect Xero to set your organisation currency before building.',
        true
      );
      return;
    }
    setBuilding(true);
    clear('build');
    try {
      const result = await buildXeroJournalsFromBalanceTransactions(defaultCurrency);
      const optRes = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
      if (optRes.success && optRes.data) {
        await applyAccountMappingsDropdowns(optRes.data, defaultCurrency);
      }
      await activateWorksheet(JOURNAL_SHEET, 'A2');
      const dateCount =
        result.chargeDates + result.refundDates + result.feeDates;
      notifyBuild(
        `${result.lineCount} journal line${result.lineCount === 1 ? '' : 's'} → Xero_Journals (${dateCount} date${dateCount === 1 ? '' : 's'}).`,
        false
      );
      onBuilt?.();
    } catch (err) {
      notifyBuild(
        err instanceof Error ? err.message : 'Failed to build journals.',
        true
      );
    } finally {
      setBuilding(false);
    }
  };

  const handleBuildBankTransactions = async () => {
    if (!xeroFeaturesEnabled) {
      notifyBuild('Upgrade to Pro or Firm to build bank transactions.', true);
      return;
    }
    if (!currencyReady || !defaultCurrency) {
      notifyBuild(
        'Connect Xero to set your organisation currency before building.',
        true
      );
      return;
    }
    setBuildingBank(true);
    clear('build');
    try {
      const result =
        await buildXeroBankTransactionsFromBalanceTransactions(defaultCurrency);
      await activateFirstAvailableWorksheet(BANK_TXN_SHEET_ALIASES, 'A2');
      notifyBuild(
        `${result.rowCount} bank transaction row${result.rowCount === 1 ? '' : 's'} → Xero_Bank_Transaction.`,
        false
      );
      onBuilt?.();
    } catch (err) {
      notifyBuild(
        err instanceof Error
          ? err.message
          : 'Failed to build bank transactions.',
        true
      );
    } finally {
      setBuildingBank(false);
    }
  };

  const buildDisabled = busy || !xeroFeaturesEnabled || !currencyReady;

  return (
    <div className="p-3.5 flex flex-col gap-0">
      <Card
        title="Manual journals"
        icon="📒"
        iconClass="bg-stripe-light text-stripe"
      >
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
    </div>
  );
}
