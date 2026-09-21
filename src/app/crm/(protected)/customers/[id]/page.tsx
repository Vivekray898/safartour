import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { notFound } from 'next/navigation';
import { getActivitiesForCustomer } from '@/lib/crm/activity';
import { formatCurrency } from '@/config/crm';
import Link from 'next/link';
import { Calendar, Users, Phone, Mail, MapPin, Clock, Repeat, DollarSign, CreditCard, FileText, Pencil } from 'lucide-react';
import { CRMStatusBadge, CRMLeadSourceBadge } from '@/components/crm/common/CRMStatusBadge';

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id: idParam } = await params;
  // Non-numeric segments must never reach Postgres as an integer id.
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = getDb();

  const customer = await db.prepare(`
    SELECT c.*,
      u.name as assigned_employee_name,
      (SELECT COUNT(*) FROM trips WHERE customer_id = c.id AND archived = 0) as active_trips,
      (SELECT COUNT(*) FROM trips WHERE customer_id = c.id AND status = 'completed') as completed_trips,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q
        JOIN trips t ON q.trip_id = t.id
        WHERE t.customer_id = c.id) as total_quoted,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
        JOIN trips t ON p.trip_id = t.id
        WHERE t.customer_id = c.id) as total_paid
    FROM customers c
    LEFT JOIN users u ON c.assigned_employee_id = u.id
    WHERE c.id = ?
  `).get(id) as {
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
    assigned_employee_name: string | null;
    first_trip_at: string | null;
    last_trip_at: string | null;
    trip_count: number;
    is_repeat_customer: number;
    created_at: string;
    updated_at: string;
    active_trips: number;
    completed_trips: number;
    total_quoted: number;
    total_paid: number;
  } | undefined;

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
      </div>
    );
  }

  const trips = await db.prepare(`
    SELECT t.id, t.reference, t.status, t.priority, t.lead_source,
      t.destination, t.start_date, t.end_date, t.total_pax,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount,
      t.updated_at
    FROM trips t
    WHERE t.customer_id = ?
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all(id);

  const activities = await getActivitiesForCustomer(Number(id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-xl font-bold text-green-700">{customer.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              {customer.is_repeat_customer && (
                <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full mt-1">
                  <Repeat className="w-3 h-3" />
                  Repeat Customer
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/crm/leads/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil className="w-4 h-4" />
            New Trip
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                  {customer.phone}
                </a>
                {customer.preferred_contact === 'whatsapp' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Preferred</span>
                )}
              </div>
              {customer.alt_phone && (
                <div className="text-sm text-gray-500">Alt: {customer.alt_phone}</div>
              )}
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </a>
              )}
              {customer.city && (
                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {customer.city}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-500 text-sm mb-3">Customer Stats</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                  <Users className="w-3 h-3" />
                  Total Trips
                </div>
                <div className="text-lg font-bold text-gray-900">{customer.trip_count}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                  <Clock className="w-3 h-3" />
                  Active
                </div>
                <div className="text-lg font-bold text-amber-600">{customer.active_trips}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                  <Calendar className="w-3 h-3" />
                  Completed
                </div>
                <div className="text-lg font-bold text-green-600">{customer.completed_trips}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                  <Repeat className="w-3 h-3" />
                  Repeat
                </div>
                <div className="text-lg font-bold text-green-600">
                  {customer.is_repeat_customer ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-500 text-sm mb-3">Financial Summary</div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-gray-600">Total Quoted</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(customer.total_quoted)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-sm font-semibold text-green-700">{formatCurrency(customer.total_paid)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Pending</span>
                <span className="text-sm font-bold text-red-600">
                  {formatCurrency(Math.max(0, customer.total_quoted - customer.total_paid))}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-500 text-sm mb-3">Company Info</div>
            <div className="space-y-2 text-sm">
              {customer.company ? (
                <div>
                  <span className="text-gray-500">Company</span>
                  <p className="font-medium text-gray-900">{customer.company}</p>
                </div>
              ) : (
                <div className="text-gray-400">No company</div>
              )}
              {customer.company_contact_person && (
                <div>
                  <span className="text-gray-500">Contact Person</span>
                  <p className="font-medium text-gray-900">{customer.company_contact_person}</p>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500">Assigned To</span>
                <p className="font-medium text-gray-900">{customer.assigned_employee_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Trips / Enquiries</h2>
            <Link
              href="/crm/leads?customerId"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quoted</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No trips yet</p>
                    </td>
                  </tr>
                ) : (
                  trips.map((trip: { id: number; reference: string; destination: string | null; start_date: string | null; status: string; quoted_amount: number | null; paid_amount: number | null; updated_at: string }) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/crm/leads/${trip.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                          {trip.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{trip.destination || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <CRMStatusBadge status={trip.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {trip.quoted_amount ? formatCurrency(trip.quoted_amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={trip.paid_amount !== null && trip.quoted_amount ? (trip.paid_amount >= trip.quoted_amount ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'}>
                          {trip.paid_amount ? formatCurrency(trip.paid_amount) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(trip.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
          </div>
          <div className="p-4 max-h-96 overflow-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No activities yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      {activities.indexOf(activity) < activities.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {activity.user_name && (
                        <p className="text-xs text-gray-500 mt-0.5">by {activity.user_name}</p>
                      )}
                      {activity.trip_reference && (
                        <Link
                          href={`/crm/leads/${activity.trip_id}`}
                          className="text-xs text-green-600 hover:underline mt-0.5 inline-block"
                        >
                          {activity.trip_reference}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
