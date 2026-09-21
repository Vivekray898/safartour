"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import CRMEntityForm, { type CRMField } from '@/components/crm/common/CRMEntityForm';
import CRMConfirm from '@/components/crm/common/CRMConfirm';
import CRMRowActions, { type CRMRowAction } from '@/components/crm/common/CRMRowActions';

export interface HotelRow {
  id: number;
  name: string;
  destination: string;
  category: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  room_types: string | null;
  meal_plans: string | null;
  notes: string | null;
  supplier_id: number | null;
  is_active: number;
  archived: number;
  /** Joined display field from the suppliers table. */
  supplier_name?: string | null;
}

interface HotelActionsContextValue {
  openCreate: () => void;
  openEdit: (hotel: HotelRow) => void;
  confirmArchive: (hotel: HotelRow) => void;
  confirmRestore: (hotel: HotelRow) => void;
}

const HotelActionsContext = createContext<HotelActionsContextValue | null>(null);

function useHotelActions(): HotelActionsContextValue {
  const ctx = useContext(HotelActionsContext);
  if (!ctx) throw new Error('useHotelActions must be used within HotelActionsProvider');
  return ctx;
}

function hotelFields(suppliers: Array<{ id: number; name: string }>, hotel?: HotelRow): CRMField[] {
  return [
    { name: 'name', label: 'Hotel Name', required: true, half: true, defaultValue: hotel?.name, placeholder: 'e.g. Hotel Sonar Bangla' },
    { name: 'destination', label: 'Destination', required: true, half: true, defaultValue: hotel?.destination, placeholder: 'e.g. Darjeeling' },
    { name: 'category', label: 'Category', half: true, type: 'select', defaultValue: hotel?.category ?? '', options: [
      { value: '', label: 'Select category' },
      { value: 'Budget', label: 'Budget' }, { value: 'Standard', label: 'Standard' },
      { value: 'Deluxe', label: 'Deluxe' }, { value: 'Premium', label: 'Premium' }, { value: 'Luxury', label: 'Luxury' },
    ] },
    {
      name: 'supplier_id', label: 'Supplier', half: true, type: 'select',
      defaultValue: hotel?.supplier_id ? String(hotel.supplier_id) : '',
      options: [{ value: '', label: 'No supplier' }, ...suppliers.map(s => ({ value: String(s.id), label: s.name }))],
    },
    { name: 'contact_phone', label: 'Contact Phone', half: true, type: 'tel', defaultValue: hotel?.contact_phone, placeholder: '+91 ...' },
    { name: 'contact_email', label: 'Contact Email', half: true, type: 'email', defaultValue: hotel?.contact_email },
    { name: 'address', label: 'Address', defaultValue: hotel?.address },
    { name: 'room_types', label: 'Room Types', half: true, defaultValue: hotel?.room_types, placeholder: 'Deluxe, Super Deluxe, Suite' },
    { name: 'meal_plans', label: 'Meal Plans', half: true, defaultValue: hotel?.meal_plans, placeholder: 'EP, CP, MAP, AP' },
    { name: 'is_active', label: 'Active', type: 'checkbox', defaultValue: hotel ? hotel.is_active : 1, helpText: 'Available for bookings' },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: hotel?.notes },
  ];
}

export function HotelActionsProvider({
  suppliers,
  canEdit,
  children,
}: {
  suppliers: Array<{ id: number; name: string }>;
  canEdit: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<HotelRow | null>(null);
  const [archiving, setArchiving] = useState<HotelRow | null>(null);
  const [restoring, setRestoring] = useState<HotelRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const submit = async (values: Record<string, string>, target: HotelRow | null) => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: values.name,
        destination: values.destination,
        category: values.category || null,
        address: values.address || null,
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
        room_types: values.room_types || null,
        meal_plans: values.meal_plans || null,
        notes: values.notes || null,
        supplier_id: values.supplier_id ? Number(values.supplier_id) : null,
        is_active: values.is_active === 'on' || values.is_active === '1' ? true : false,
      };
      const res = await fetch(target ? `/crm/api/hotels/${target.id}` : '/crm/api/hotels', {
        method: target ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not save the hotel');
      }
      setCreateOpen(false);
      setEditing(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const doArchive = async (hotel: HotelRow) => {
    const res = await fetch(`/crm/api/hotels/${hotel.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not archive the hotel');
    refresh();
  };

  const doRestore = async (hotel: HotelRow) => {
    const res = await fetch(`/crm/api/hotels/${hotel.id}?restore=1`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not restore the hotel');
    refresh();
  };

  const ctx: HotelActionsContextValue = {
    openCreate: () => { setFormError(null); setCreateOpen(true); },
    openEdit: hotel => { setFormError(null); setEditing(hotel); },
    confirmArchive: hotel => setArchiving(hotel),
    confirmRestore: hotel => setRestoring(hotel),
  };

  return (
    <HotelActionsContext.Provider value={ctx}>
      {children}

      {canEdit && (
        <>
          <CRMEntityForm
            open={createOpen}
            title="Add Hotel"
            description="Hotels added here can be selected in quotations and itineraries."
            fields={hotelFields(suppliers)}
            submitLabel="Create Hotel"
            savingLabel="Creating..."
            saving={saving}
            error={formError}
            onClose={() => setCreateOpen(false)}
            onSubmit={values => submit(values, null)}
          />

          <CRMEntityForm
            open={editing !== null}
            title={`Edit — ${editing?.name ?? ''}`}
            fields={hotelFields(suppliers, editing ?? undefined)}
            submitLabel="Save Changes"
            savingLabel="Saving..."
            saving={saving}
            error={formError}
            onClose={() => setEditing(null)}
            onSubmit={values => submit(values, editing)}
          />

          <CRMConfirm
            open={archiving !== null}
            title={`Archive ${archiving?.name ?? 'hotel'}?`}
            message="The hotel will no longer appear in active hotel lists. Historical quotations and itineraries that reference it remain unchanged."
            confirmLabel="Archive Hotel"
            busyLabel="Archiving..."
            onConfirm={() => doArchive(archiving!)}
            onClose={() => setArchiving(null)}
          />

          <CRMConfirm
            open={restoring !== null}
            title={`Restore ${restoring?.name ?? 'hotel'}?`}
            message="The hotel will reappear in active hotel lists."
            confirmLabel="Restore Hotel"
            busyLabel="Restoring..."
            destructive={false}
            onConfirm={() => doRestore(restoring!)}
            onClose={() => setRestoring(null)}
          />
        </>
      )}
    </HotelActionsContext.Provider>
  );
}

export function AddHotelButton({ className }: { className?: string }) {
  const { openCreate } = useHotelActions();
  return (
    <button
      type="button"
      onClick={openCreate}
      className={className ?? 'inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Add Hotel
    </button>
  );
}

export function HotelRowActions({ hotel, canEdit }: { hotel: HotelRow; canEdit: boolean }) {
  const { openEdit, confirmArchive, confirmRestore } = useHotelActions();
  const actions: CRMRowAction[] = [
    { label: 'Edit', onSelect: () => openEdit(hotel) },
    hotel.archived
      ? { label: 'Restore', onSelect: () => confirmRestore(hotel) }
      : { label: 'Archive', danger: true, onSelect: () => confirmArchive(hotel) },
  ];
  if (!canEdit) return null;
  return <CRMRowActions actions={actions} label={`Actions for ${hotel.name}`} />;
}
