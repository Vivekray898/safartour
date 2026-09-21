"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMEntityForm, { type CRMField } from '@/components/crm/common/CRMEntityForm';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface PaymentListRow {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
  note: string | null;
  trip_id: number;
  trip_reference?: string | null;
  customer_name?: string | null;
  recorded_by_name?: string | null;
}

interface PaymentActionsContextValue {
  openCreate: () => void;
  confirmDelete: (payment: PaymentListRow) => void;
}

const PaymentActionsContext = createContext<PaymentActionsContextValue | null>(null);

function usePaymentActions(): PaymentActionsContextValue {
  const ctx = useContext(PaymentActionsContext);
  if (!ctx) throw new Error('usePaymentActions must be used within PaymentActionsProvider');
  return ctx;
}

export function PaymentActionsProvider({
  canEdit,
  trips,
  children,
}: {
  canEdit: boolean;
  /** Active trips for the selector: { id, label } where label = "REF — Customer". */
  trips: Array<{ id: number; label: string }>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<PaymentListRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const submit = async (values: Record<string, string>) => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/crm/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: Number(values.trip_id),
          amount: Math.round(Number(values.amount)),
          payment_date: values.payment_date,
          payment_method: values.payment_method,
          transaction_id: values.transaction_id || null,
          note: values.note || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.warning || data.error || 'Could not record the payment');
      setCreateOpen(false);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (payment: PaymentListRow) => {
    const res = await fetch(`/crm/api/payments/${payment.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not delete the payment');
    refresh();
  };

  const fields = (): CRMField[] => [
    {
      name: 'trip_id', label: 'Trip', required: true, type: 'select',
      options: [{ value: '', label: 'Select trip' }, ...trips.map(t => ({ value: String(t.id), label: t.label }))],
    },
    { name: 'amount', label: 'Amount (₹)', required: true, type: 'number', min: 1, half: true, placeholder: 'e.g. 15000' },
    { name: 'payment_date', label: 'Payment Date', required: true, type: 'date', half: true },
    { name: 'payment_method', label: 'Payment Method', required: true, type: 'select', half: true, options: [
      { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' },
      { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'card', label: 'Card' },
      { value: 'other', label: 'Other' },
    ] },
    { name: 'transaction_id', label: 'Transaction ID', half: true },
    { name: 'note', label: 'Note', type: 'textarea' },
  ];

  const ctx: PaymentActionsContextValue = {
    openCreate: () => { setFormError(null); setCreateOpen(true); },
    confirmDelete: payment => setDeleting(payment),
  };

  return (
    <PaymentActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMEntityForm
            open={createOpen}
            title="Record Payment"
            description="Payments are linked to a trip. The trip's accepted quotation amount is used for pending calculations."
            fields={fields()}
            submitLabel="Record Payment"
            savingLabel="Recording..."
            saving={saving}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={submit}
          />
          <CRMConfirm
            open={deleting !== null}
            title="Delete payment?"
            message={`Payment of ₹${deleting?.amount?.toLocaleString('en-IN') ?? ''} (${deleting?.payment_date ?? ''}) will be permanently removed from ${deleting?.trip_reference ?? 'the trip'}. This cannot be undone.`}
            confirmLabel="Delete Payment"
            busyLabel="Deleting..."
            onConfirm={() => doDelete(deleting!)}
            onClose={() => setDeleting(null)}
          />
        </>
      )}
    </PaymentActionsContext.Provider>
  );
}

export function AddPaymentButton({ className }: { className?: string }) {
  const { openCreate } = usePaymentActions();
  return (
    <button
      type="button"
      onClick={openCreate}
      className={className ?? 'inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Record Payment
    </button>
  );
}

export function PaymentRowActions({ payment, canEdit }: { payment: PaymentListRow; canEdit: boolean }) {
  const { confirmDelete } = usePaymentActions();
  if (!canEdit) return null;
  const actions: CRMRowAction[] = [
    { label: 'Delete', danger: true, onSelect: () => confirmDelete(payment) },
  ];
  return <CRMRowActions actions={actions} label="Payment actions" />;
}
