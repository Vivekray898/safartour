"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface QuotationListRow {
  id: number;
  reference: string;
  status: string;
  final_amount: number;
  trip_id: number;
}

interface QuotationActionsContextValue {
  confirmDuplicate: (quotation: QuotationListRow) => void;
  confirmDelete: (quotation: QuotationListRow) => void;
}

const QuotationActionsContext = createContext<QuotationActionsContextValue | null>(null);

function useQuotationActions(): QuotationActionsContextValue {
  const ctx = useContext(QuotationActionsContext);
  if (!ctx) throw new Error('useQuotationActions must be used within QuotationActionsProvider');
  return ctx;
}

export function QuotationActionsProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState<QuotationListRow | null>(null);
  const [deleting, setDeleting] = useState<QuotationListRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const doDuplicate = async (quotation: QuotationListRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/crm/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateOf: quotation.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not duplicate the quotation');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (quotation: QuotationListRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/crm/api/quotations/${quotation.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not delete the quotation');
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const ctx: QuotationActionsContextValue = {
    confirmDuplicate: quotation => setDuplicating(quotation),
    confirmDelete: quotation => setDeleting(quotation),
  };

  return (
    <QuotationActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMConfirm
            open={duplicating !== null}
            title={`Duplicate ${duplicating?.reference ?? 'quotation'}?`}
            message="A new draft quotation will be created with the same trip, items and amounts. The original stays untouched."
            confirmLabel="Duplicate"
            busyLabel="Duplicating..."
            destructive={false}
            onConfirm={() => doDuplicate(duplicating!)}
            onClose={() => setDuplicating(null)}
          />
          <CRMConfirm
            open={deleting !== null}
            title={`Delete ${deleting?.reference ?? 'quotation'}?`}
            message="Only empty draft quotations can be permanently deleted. Sent or priced quotations are kept for history — mark them cancelled instead."
            confirmLabel="Delete Draft"
            busyLabel="Deleting..."
            onConfirm={() => doDelete(deleting!)}
            onClose={() => setDeleting(null)}
          />
        </>
      )}
    </QuotationActionsContext.Provider>
  );
}

export function QuotationRowActions({ quotation, canEdit }: { quotation: QuotationListRow; canEdit: boolean }) {
  const { confirmDuplicate, confirmDelete } = useQuotationActions();
  if (!canEdit) return null;
  const actions: CRMRowAction[] = [{ label: 'Duplicate', onSelect: () => confirmDuplicate(quotation) }];
  if (quotation.status === 'draft') {
    actions.push({ label: 'Delete Draft', danger: true, onSelect: () => confirmDelete(quotation) });
  }
  return <CRMRowActions actions={actions} label={`Actions for ${quotation.reference}`} />;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'revised', label: 'Revised' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

/**
 * Detail-page action bar: status changer, duplicate, delete, print.
 * Complements the server-rendered Preview/Download/Share links.
 */
export function QuotationDetailActions({
  quotation,
  canEdit,
}: {
  quotation: QuotationListRow;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { confirmDuplicate, confirmDelete } = useQuotationActions();
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const changeStatus = async (status: string) => {
    if (statusBusy) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const res = await fetch(`/crm/api/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not update the status');
      router.refresh();
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : 'Could not update the status');
    } finally {
      setStatusBusy(false);
    }
  };

  if (!canEdit) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor="quotation-status" className="text-xs text-gray-500 uppercase tracking-wider font-medium">Status</label>
        <select
          id="quotation-status"
          value={quotation.status}
          disabled={statusBusy}
          onChange={e => changeStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {statusBusy && <span className="text-xs text-gray-400">Updating...</span>}
      </div>
      {statusError && <p className="text-xs text-red-600" role="alert">{statusError}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => confirmDuplicate(quotation)}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-700 transition-colors"
        >
          Duplicate
        </button>
        <a
          href={`/crm/api/quotations/${quotation.id}/pdf?inline=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-700 transition-colors"
        >
          Print / Open PDF
        </a>
        {quotation.status === 'draft' && (
          <button
            type="button"
            onClick={() => confirmDelete(quotation)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Draft
          </button>
        )}
      </div>
    </div>
  );
}
