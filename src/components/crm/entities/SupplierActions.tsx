"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMEntityForm, { type CRMField } from '@/components/crm/common/CRMEntityForm';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface SupplierRow {
  id: number;
  name: string;
  type: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  archived: number;
  /** Joined display field: linked active hotels. */
  hotel_count?: number;
}

interface SupplierActionsContextValue {
  openCreate: () => void;
  openEdit: (supplier: SupplierRow) => void;
  confirmArchive: (supplier: SupplierRow) => void;
  confirmRestore: (supplier: SupplierRow) => void;
}

const SupplierActionsContext = createContext<SupplierActionsContextValue | null>(null);

function useSupplierActions(): SupplierActionsContextValue {
  const ctx = useContext(SupplierActionsContext);
  if (!ctx) throw new Error('useSupplierActions must be used within SupplierActionsProvider');
  return ctx;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Select type' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'driver', label: 'Driver' },
  { value: 'vehicle_owner', label: 'Vehicle Owner' },
  { value: 'transport_company', label: 'Transport Company' },
  { value: 'local_agent', label: 'Local Agent' },
  { value: 'activity_provider', label: 'Activity Provider' },
  { value: 'other', label: 'Other' },
];

function supplierFields(supplier?: SupplierRow): CRMField[] {
  return [
    { name: 'name', label: 'Supplier Name', required: true, half: true, defaultValue: supplier?.name, placeholder: 'e.g. ABC Travels' },
    { name: 'type', label: 'Type', half: true, type: 'select', defaultValue: supplier?.type ?? '', options: TYPE_OPTIONS },
    { name: 'phone', label: 'Phone', half: true, type: 'tel', defaultValue: supplier?.phone, placeholder: '+91 ...' },
    { name: 'whatsapp', label: 'WhatsApp', half: true, type: 'tel', defaultValue: supplier?.whatsapp },
    { name: 'email', label: 'Email', half: true, type: 'email', defaultValue: supplier?.email },
    { name: 'location', label: 'Location', half: true, defaultValue: supplier?.location, placeholder: 'e.g. Darjeeling' },
    { name: 'status', label: 'Status', half: true, type: 'select', defaultValue: supplier?.status ?? 'active', options: [
      { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
    ] },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: supplier?.notes },
  ];
}

export function SupplierActionsProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [archiving, setArchiving] = useState<SupplierRow | null>(null);
  const [restoring, setRestoring] = useState<SupplierRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const submit = async (values: Record<string, string>, target: SupplierRow | null) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name,
        type: values.type || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        email: values.email || null,
        location: values.location || null,
        notes: values.notes || null,
        status: values.status || 'active',
      };
      const res = await fetch(target ? `/crm/api/suppliers/${target.id}` : '/crm/api/suppliers', {
        method: target ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not save the supplier');
      setCreateOpen(false);
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const doArchive = async (supplier: SupplierRow) => {
    const res = await fetch(`/crm/api/suppliers/${supplier.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not archive the supplier');
    refresh();
  };

  const doRestore = async (supplier: SupplierRow) => {
    const res = await fetch(`/crm/api/suppliers/${supplier.id}?restore=1`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not restore the supplier');
    refresh();
  };

  const ctx: SupplierActionsContextValue = {
    openCreate: () => { setFormError(null); setCreateOpen(true); },
    openEdit: supplier => { setFormError(null); setEditing(supplier); },
    confirmArchive: supplier => setArchiving(supplier),
    confirmRestore: supplier => setRestoring(supplier),
  };

  return (
    <SupplierActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMEntityForm
            open={createOpen}
            title="Add Supplier"
            description="Hotels, transport partners, agents and activity providers you work with."
            fields={supplierFields()}
            submitLabel="Create Supplier"
            savingLabel="Creating..."
            saving={saving}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={values => submit(values, null)}
          />
          <CRMEntityForm
            open={editing !== null}
            title={`Edit — ${editing?.name ?? ''}`}
            fields={supplierFields(editing ?? undefined)}
            submitLabel="Save Changes"
            savingLabel="Saving..."
            saving={saving}
            error={formError}
            onClose={() => setEditing(null)}
            onSubmit={values => submit(values, editing)}
          />
          <CRMConfirm
            open={archiving !== null}
            title={`Archive ${archiving?.name ?? 'supplier'}?`}
            message="The supplier will no longer appear in active supplier lists. Linked hotels keep their records."
            confirmLabel="Archive Supplier"
            busyLabel="Archiving..."
            onConfirm={() => doArchive(archiving!)}
            onClose={() => setArchiving(null)}
          />
          <CRMConfirm
            open={restoring !== null}
            title={`Restore ${restoring?.name ?? 'supplier'}?`}
            message="The supplier will reappear in active supplier lists."
            confirmLabel="Restore Supplier"
            busyLabel="Restoring..."
            destructive={false}
            onConfirm={() => doRestore(restoring!)}
            onClose={() => setRestoring(null)}
          />
        </>
      )}
    </SupplierActionsContext.Provider>
  );
}

export function AddSupplierButton({ className }: { className?: string }) {
  const { openCreate } = useSupplierActions();
  return (
    <button
      type="button"
      onClick={openCreate}
      className={className ?? 'inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Add Supplier
    </button>
  );
}

export function SupplierRowActions({ supplier, canEdit }: { supplier: SupplierRow; canEdit: boolean }) {
  const { openEdit, confirmArchive, confirmRestore } = useSupplierActions();
  if (!canEdit) return null;
  const actions: CRMRowAction[] = [
    { label: 'Edit', onSelect: () => openEdit(supplier) },
    supplier.archived
      ? { label: 'Restore', onSelect: () => confirmRestore(supplier) }
      : { label: 'Archive', danger: true, onSelect: () => confirmArchive(supplier) },
  ];
  return <CRMRowActions actions={actions} label={`Actions for ${supplier.name}`} />;
}
