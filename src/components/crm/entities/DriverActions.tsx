"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMEntityForm, { type CRMField } from '@/components/crm/common/CRMEntityForm';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface DriverRow {
  id: number;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  destination_route: string | null;
  availability: string | null;
  notes: string | null;
  archived: number;
  /** Joined display fields from trips/customers. */
  assigned_trip_reference?: string | null;
  assigned_customer_name?: string | null;
}

interface DriverActionsContextValue {
  openCreate: () => void;
  openEdit: (driver: DriverRow) => void;
  confirmArchive: (driver: DriverRow) => void;
  confirmRestore: (driver: DriverRow) => void;
}

const DriverActionsContext = createContext<DriverActionsContextValue | null>(null);

function useDriverActions(): DriverActionsContextValue {
  const ctx = useContext(DriverActionsContext);
  if (!ctx) throw new Error('useDriverActions must be used within DriverActionsProvider');
  return ctx;
}

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'available', label: 'Available' },
  { value: 'on_trip', label: 'On trip' },
  { value: 'off_duty', label: 'Off duty' },
];

function driverFields(driver?: DriverRow): CRMField[] {
  return [
    { name: 'name', label: 'Driver Name', required: true, half: true, defaultValue: driver?.name, placeholder: 'Full name' },
    { name: 'phone', label: 'Phone', half: true, type: 'tel', defaultValue: driver?.phone, placeholder: '+91 ...' },
    { name: 'vehicle_type', label: 'Vehicle Type', half: true, defaultValue: driver?.vehicle_type, placeholder: 'e.g. Sumo, Innova' },
    { name: 'vehicle_number', label: 'Vehicle Number', half: true, defaultValue: driver?.vehicle_number, placeholder: 'WB-XX-XXXX' },
    { name: 'destination_route', label: 'Routes / Destination', half: true, defaultValue: driver?.destination_route, placeholder: 'e.g. Darjeeling, Sikkim' },
    { name: 'availability', label: 'Availability', half: true, type: 'select', defaultValue: driver?.availability ?? '', options: AVAILABILITY_OPTIONS },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: driver?.notes },
  ];
}

export function DriverActionsProvider({ canEdit, children }: { canEdit: boolean; children: ReactNode }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DriverRow | null>(null);
  const [archiving, setArchiving] = useState<DriverRow | null>(null);
  const [restoring, setRestoring] = useState<DriverRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const submit = async (values: Record<string, string>, target: DriverRow | null) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name,
        phone: values.phone || null,
        vehicle_type: values.vehicle_type || null,
        vehicle_number: values.vehicle_number || null,
        destination_route: values.destination_route || null,
        availability: values.availability || null,
        notes: values.notes || null,
      };
      const res = await fetch(target ? `/crm/api/drivers/${target.id}` : '/crm/api/drivers', {
        method: target ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Could not save the driver');
      setCreateOpen(false);
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const doArchive = async (driver: DriverRow) => {
    const res = await fetch(`/crm/api/drivers/${driver.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not archive the driver');
    refresh();
  };

  const doRestore = async (driver: DriverRow) => {
    const res = await fetch(`/crm/api/drivers/${driver.id}?restore=1`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not restore the driver');
    refresh();
  };

  const ctx: DriverActionsContextValue = {
    openCreate: () => { setFormError(null); setCreateOpen(true); },
    openEdit: driver => { setFormError(null); setEditing(driver); },
    confirmArchive: driver => setArchiving(driver),
    confirmRestore: driver => setRestoring(driver),
  };

  return (
    <DriverActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMEntityForm
            open={createOpen}
            title="Add Driver"
            description="Drivers and their vehicles available for trips."
            fields={driverFields()}
            submitLabel="Create Driver"
            savingLabel="Creating..."
            saving={saving}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={values => submit(values, null)}
          />
          <CRMEntityForm
            open={editing !== null}
            title={`Edit — ${editing?.name ?? ''}`}
            fields={driverFields(editing ?? undefined)}
            submitLabel="Save Changes"
            savingLabel="Saving..."
            saving={saving}
            error={formError}
            onClose={() => setEditing(null)}
            onSubmit={values => submit(values, editing)}
          />
          <CRMConfirm
            open={archiving !== null}
            title={`Archive ${archiving?.name ?? 'driver'}?`}
            message="The driver will no longer appear in active driver lists. Trip history stays intact."
            confirmLabel="Archive Driver"
            busyLabel="Archiving..."
            onConfirm={() => doArchive(archiving!)}
            onClose={() => setArchiving(null)}
          />
          <CRMConfirm
            open={restoring !== null}
            title={`Restore ${restoring?.name ?? 'driver'}?`}
            message="The driver will reappear in active driver lists."
            confirmLabel="Restore Driver"
            busyLabel="Restoring..."
            destructive={false}
            onConfirm={() => doRestore(restoring!)}
            onClose={() => setRestoring(null)}
          />
        </>
      )}
    </DriverActionsContext.Provider>
  );
}

export function AddDriverButton({ className }: { className?: string }) {
  const { openCreate } = useDriverActions();
  return (
    <button
      type="button"
      onClick={openCreate}
      className={className ?? 'inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Add Driver
    </button>
  );
}

export function DriverRowActions({ driver, canEdit }: { driver: DriverRow; canEdit: boolean }) {
  const { openEdit, confirmArchive, confirmRestore } = useDriverActions();
  if (!canEdit) return null;
  const actions: CRMRowAction[] = [
    { label: 'Edit', onSelect: () => openEdit(driver) },
    driver.archived
      ? { label: 'Restore', onSelect: () => confirmRestore(driver) }
      : { label: 'Archive', danger: true, onSelect: () => confirmArchive(driver) },
  ];
  return <CRMRowActions actions={actions} label={`Actions for ${driver.name}`} />;
}
