"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

interface NewLeadFormProps {
  destinations: readonly string[];
  sources: ReadonlyArray<{ value: string; label: string }>;
  employees: Array<{ id: number; name: string }>;
  currentUserId: number;
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TRIP_TYPES = [
  { value: 'package', label: 'Package Tour' },
  { value: 'custom_trip', label: 'Custom Trip' },
  { value: 'hotel_transport', label: 'Hotel + Transport' },
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'airport_transfer', label: 'Airport Transfer' },
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'family_holiday', label: 'Family Holiday' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
];

const GROUP_TYPES = [
  { value: 'family', label: 'Family' },
  { value: 'couple', label: 'Couple' },
  { value: 'friends', label: 'Friends' },
  { value: 'solo', label: 'Solo' },
  { value: 'group', label: 'Group' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'senior_citizens', label: 'Senior Citizens' },
  { value: 'other', label: 'Other' },
];

export default function NewLeadForm({
  destinations,
  sources,
  employees,
  currentUserId,
}: NewLeadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    destination: '',
    trip_type: 'package',
    group_type: 'family',
    adults: 2,
    children_5_12: 0,
    start_date: '',
    end_date: '',
    lead_source: 'website',
    priority: 'medium',
    assigned_employee_id: currentUserId,
    notes: '',
  });

  const set = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }

    setLoading(true);
    try {
      const custRes = await fetch('/crm/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          city: form.city.trim() || null,
        }),
      });
      const custData = await custRes.json();

      let customerId: number | undefined;
      if (custData.ok && custData.customer) {
        customerId = custData.customer.id;
      } else if (custData.duplicate) {
        customerId = custData.duplicate_phone || custData.duplicate_email;
      } else {
        setError(custData.message || custData.error || 'Failed to create customer');
        return;
      }

      if (!customerId) {
        setError('Could not resolve the customer for this lead.');
        return;
      }

      const tripRes = await fetch('/crm/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          destination: form.destination || null,
          trip_type: form.trip_type,
          group_type: form.group_type,
          adults: Number(form.adults) || 0,
          children_5_12: Number(form.children_5_12) || 0,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          lead_source: form.lead_source,
          priority: form.priority,
          assigned_employee_id: form.assigned_employee_id || currentUserId,
          customer_facing_notes: form.notes.trim() || null,
        }),
      });
      const tripData = await tripRes.json();

      if (tripData.ok && tripData.trip) {
        router.push(`/crm/leads/${tripData.trip.id}`);
      } else {
        setError(tripData.error || 'Customer saved but the trip could not be created.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900 mb-2">Customer</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nl-name" className={labelCls}>Name *</label>
            <input id="nl-name" type="text" required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Customer name" />
          </div>
          <div>
            <label htmlFor="nl-phone" className={labelCls}>Phone *</label>
            <input id="nl-phone" type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="10-digit mobile number" />
          </div>
          <div>
            <label htmlFor="nl-email" className={labelCls}>Email</label>
            <input id="nl-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
          <div>
            <label htmlFor="nl-city" className={labelCls}>City</label>
            <input id="nl-city" type="text" value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900 mb-2">Trip</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nl-destination" className={labelCls}>Destination</label>
            <select id="nl-destination" value={form.destination} onChange={e => set('destination', e.target.value)} className={inputCls}>
              <option value="">Not decided yet</option>
              {destinations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-triptype" className={labelCls}>Trip type</label>
            <select id="nl-triptype" value={form.trip_type} onChange={e => set('trip_type', e.target.value)} className={inputCls}>
              {TRIP_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-grouptype" className={labelCls}>Group type</label>
            <select id="nl-grouptype" value={form.group_type} onChange={e => set('group_type', e.target.value)} className={inputCls}>
              {GROUP_TYPES.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-source" className={labelCls}>Lead source</label>
            <select id="nl-source" value={form.lead_source} onChange={e => set('lead_source', e.target.value)} className={inputCls}>
              {sources.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-start" className={labelCls}>Start date</label>
            <input id="nl-start" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="nl-end" className={labelCls}>End date</label>
            <input id="nl-end" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className={inputCls} min={form.start_date || undefined} />
          </div>
          <div>
            <label htmlFor="nl-adults" className={labelCls}>Adults</label>
            <input id="nl-adults" type="number" min={0} max={50} value={form.adults} onChange={e => set('adults', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="nl-children" className={labelCls}>Children (5–12)</label>
            <input id="nl-children" type="number" min={0} max={20} value={form.children_5_12} onChange={e => set('children_5_12', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900 mb-2">Assignment</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nl-assignee" className={labelCls}>Assigned employee</label>
            <select id="nl-assignee" value={form.assigned_employee_id} onChange={e => set('assigned_employee_id', Number(e.target.value))} className={inputCls}>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nl-priority" className={labelCls}>Priority</label>
            <select id="nl-priority" value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="nl-notes" className={labelCls}>Notes</label>
          <textarea id="nl-notes" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} placeholder="Requirements, preferences, questions..." />
        </div>
      </fieldset>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Creating lead…' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
}
