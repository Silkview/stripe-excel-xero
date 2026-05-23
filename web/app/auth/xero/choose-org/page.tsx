'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ChooseOrgForm() {
  const searchParams = useSearchParams();
  const pick = searchParams.get('pick') ?? '';
  const [tenants, setTenants] = useState<
    { tenantId: string; tenantName: string }[] | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pick) {
      setTenants([]);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(
          `/api/xero/tenant-pick-preview?pick=${encodeURIComponent(pick)}`
        );
        const json = await res.json();
        if (json.success && json.data?.tenants) {
          setTenants(json.data.tenants);
        } else {
          setTenants([]);
        }
      } catch {
        setTenants([]);
      }
    })();
  }, [pick]);

  const handleSelect = async (tenantId: string, tenantName: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/xero/complete-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pick, tenantId }),
      });
      const html = await res.text();
      document.open();
      document.write(html);
      document.close();
    } catch {
      setError(`Failed to connect ${tenantName}. Try again.`);
      setSubmitting(false);
    }
  };

  if (!pick) {
    return (
      <p className="text-sm text-red-600">
        Missing session. Close this tab and connect Xero again from Excel or the
        dashboard.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-gray-900 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-2">Choose Xero organisation</h1>
      <p className="text-sm text-gray-600 mb-6">
        Your Xero login has access to multiple organisations. Select which one
        to link to this workspace.
      </p>
      {error && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}
      {tenants === null && (
        <p className="text-sm text-gray-500">Loading organisations…</p>
      )}
      {tenants !== null && tenants.length === 0 && (
        <p className="text-sm text-gray-500">
          Session expired or invalid. Close this tab and connect Xero again.
        </p>
      )}
      {tenants && tenants.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tenants.map((t) => (
            <li key={t.tenantId}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSelect(t.tenantId, t.tenantName)}
                className="w-full text-left px-4 py-3 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                {t.tenantName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ChooseXeroOrgPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <ChooseOrgForm />
    </Suspense>
  );
}
