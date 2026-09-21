"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMEntityForm, { type CRMField } from '@/components/crm/common/CRMEntityForm';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  alt_phone: string | null;
  preferred_contact: string | null;
  company: string | null;
  company_contact_person: string | null;
  assigned_employee_id: number | null;
  archived: number;
  /** Joined/computed display fields from the list query. */
  is_repeat_customer?: number;
  active_trips?: number;
  completed_trips?: number;
  total_quoted?: number;
  total_paid?: number;
  assigned_employee_name?: string | null;
  updated_at?: string;
}

interface CustomerActionsContextValue {
  openCreate: () => void;
  openEdit: (customer: CustomerRow) => void;
  confirmArchive: (customer: CustomerRow) => void;
  confirmRestore: (customer: CustomerRow) => void;
}

const CustomerActionsContext = createContext<CustomerActionsContextValue | null>(null);

function useCustomerActions(): CustomerActionsContextValue {
  const ctx = useContext(CustomerActionsContext);
  if (!ctx) throw new Error('useCustomerActions must be used within CustomerActionsProvider');
  return ctx;
}

function customerFields(
  employees: Array<{ id: number; name: string }>,
  customer?: CustomerRow,
): CRMField[] {
  return [
    { name: 'name', label: 'Full Name', required: true, half: true, defaultValue: customer?.name, placeholder: 'e.g. Rajesh Sharma' },
    { name: 'phone', label: 'Phone', required: true, half: true, type: 'tel', defaultValue: customer?.phone, placeholder: '+91 ...' },
    { name: 'whatsapp', label: 'WhatsApp', half: true, type: 'tel', defaultValue: customer?.whatsapp, helpText: undefined },
    { name: 'alt_phone', label: 'Alternate Phone', half: true, type: 'tel', defaultValue: customer?.alt_phone },
    { name: 'email', label: 'Email', half: true, type: 'email', defaultValue: customer?.email },
    { name: 'city', label: 'City / Location', half: true, defaultValue: customer?.city, placeholder: 'e.g. Kolkata' },
    { name: 'preferred_contact', label: 'Preferred Contact', half: true, type: 'select', defaultValue: customer?.preferred_contact ?? '', options: [
      { value: '', label: 'Not set' },
      { value: 'call', label: 'Call' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'email', label: 'Email' },
    ] },
    {
      name: 'assigned_employee_id', label: 'Assigned Employee', half: true, type: 'select',
      defaultValue: customer?.assigned_employee_id ? String(customer.assigned_employee_id) : '',
      options: [{ value: '', label: 'Unassigned' }, ...employees.map(e => ({ value: String(e.id), label: e.name }))],
    },
    { name: 'company', label: 'Company', half: true, defaultValue: customer?.company },
    { name: 'company_contact_person', label: 'Company Contact Person', half: true, defaultValue: customer?.company_contact_person },
  ];
}

export function CustomerActionsProvider({
  employees,
  canEdit,
  children,
}: {
  employees: Array<{ id: number; name: string }>;
  canEdit: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [archiving, setArchiving] = useState<CustomerRow | null>(null);
  const [restoring, setRestoring] = useState<CustomerRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const submit = async (values: Record<string, string>, target: CustomerRow | null) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        alt_phone: values.alt_phone || null,
        email: values.email || null,
        city: values.city || null,
        preferred_contact: values.preferred_contact || null,
        assigned_employee_id: values.assigned_employee_id ? Number(values.assigned_employee_id) : null,
        company: values.company || null,
        company_contact_person: values.company_contact_person || null,
      };
      const res = await fetch(target ? `/crm/api/customers/${target.id}` : '/crm/api/customers', {
        method: target ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not save the customer');
      setCreateOpen(false);
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const doArchive = async (customer: CustomerRow) => {
    const res = await fetch(`/crm/api/customers/${customer.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not archive the customer');
    refresh();
  };

  const doRestore = async (customer: CustomerRow) => {
    const res = await fetch(`/crm/api/customers/${customer.id}?restore=1`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not restore the customer');
    refresh();
  };

  const ctx: CustomerActionsContextValue = {
    openCreate: () => { setFormError(null); setCreateOpen(true); },
    openEdit: customer => { setFormError(null); setEditing(customer); },
    confirmArchive: customer => setArchiving(customer),
    confirmRestore: customer => setRestoring(customer),
  };

  return (
    <CustomerActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMEntityForm
            open={createOpen}
            title="Add Customer"
            description="Customers are created from enquiries or added manually here."
            fields={customerFields(employees)}
            submitLabel="Create Customer"
            savingLabel="Creating..."
            saving={saving}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={values => submit(values, null)}
          />
          <CRMEntityForm
            open={editing !== null}
            title={`Edit — ${editing?.name ?? ''}`}
            fields={customerFields(employees, editing ?? undefined)}
            submitLabel="Save Changes"
            savingLabel="Saving..."
            saving={saving}
            error={formError}
            onClose={() => setEditing(null)}
            onSubmit={values => submit(values, editing)}
          />
          <CRMConfirm
            open={archiving !== null}
            title={`Archive ${archiving?.name ?? 'customer'}?`}
            message="This customer will no longer appear in active customer lists.\nHistorical trips, quotations and payments will remain available."
            confirmLabel="Archive Customer"
            busyLabel="Archiving..."
            onConfirm={() => doArchive(archiving!)}
            onClose={() => setArchiving(null)}
          />
          <CRMConfirm
            open={restoring !== null}
            title={`Restore ${restoring?.name ?? 'customer'}?`}
            message="The customer will reappear in active customer lists."
            confirmLabel="Restore Customer"
            busyLabel="Restoring..."
            destructive={false}
            onConfirm={() => doRestore(restoring!)}
            onClose={() => setRestoring(null)}
          />
        </>
      )}
    </CustomerActionsContext.Provider>
  );
}

export function AddCustomerButton({ className }: { className?: string }) {
  const { openCreate } = useCustomerActions();
  return (
    <button
      type="button"
      onClick={openCreate}
      className={className ?? 'inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Add Customer
    </button>
  );
}

export function CustomerRowActions({ customer, canEdit }: { customer: CustomerRow; canEdit: boolean }) {
  const { openEdit, confirmArchive, confirmRestore } = useCustomerActions();
  if (!canEdit) return null;
  const actions: CRMRowAction[] = [
    { label: 'Edit', onSelect: () => openEdit(customer) },
    customer.archived
      ? { label: 'Restore', onSelect: () => confirmRestore(customer) }
      : { label: 'Archive', danger: true, onSelect: () => confirmArchive(customer) },
  ];
  return <CRMRowActions actions={actions} label={`Actions for ${customer.name}`} />;
}

/** Detail-page header actions: Edit + Archive/Restore with confirms. */
export function CustomerDetailActions({ customer, canEdit }: { customer: CustomerRow; canEdit: boolean }) {
  const { openEdit, confirmArchive, confirmRestore } = useCustomerActions();
  if (!canEdit) return null;
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => openEdit(customer)}
        className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Edit
      </button>
      {customer.archived ? (
        <button
          type="button"
          onClick={() => confirmRestore(customer)}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Restore
        </button>
      ) : (
        <button
          type="button"
          onClick={() => confirmArchive(customer)}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Archive
        </button>
      )}
    </div>
  );
}
