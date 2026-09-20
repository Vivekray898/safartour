import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRMStatusBadge, CRMPriorityBadge, CRMLeadSourceBadge, CRMPaymentMethodBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import { getActivitiesForTrip } from '@/lib/crm/activity';
import Link from 'next/link';
import { MessageSquare, Mail } from 'lucide-react';

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;
  const db = getDb();

  const trip = await db.prepare(`
    SELECT t.*,
      c.name as customer_name, c.phone as customer_phone,
      c.email as customer_email, c.city as customer_city,
      u.name as assigned_employee_name,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
    FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.assigned_employee_id = u.id
    WHERE t.id = ?
  `).get(id);

  if (!trip) {
    return <div className="text-center py-12 text-gray-500">Trip not found</div>;
  }

  const quotations = await db.prepare(`
    SELECT q.reference, q.version, q.status, q.final_amount
    FROM quotations q WHERE q.trip_id = ? ORDER BY q.created_at DESC
  `).all(id);

  const payments = await db.prepare(`
    SELECT amount, payment_date, payment_method, transaction_id
    FROM payments WHERE trip_id = ? ORDER BY payment_date DESC
  `).all(id);

  const followups = await db.prepare(`
    SELECT scheduled_date, scheduled_time, followup_type, note, status
    FROM followups WHERE trip_id = ? ORDER BY scheduled_date DESC
  `).all(id);

  const pendingAmount = (trip?.quoted_amount || 0) - (trip?.paid_amount || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{trip?.reference}</span>
            <CRMStatusBadge status={trip?.status || 'new'} />
            <CRMPriorityBadge priority={trip?.priority || 'medium'} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{trip?.customer_name}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
          <p className="text-gray-600">Destination: {trip?.destination || 'Not set'}</p>
          <p className="text-gray-600 mt-1">Start: {trip?.start_date ? new Date(trip.start_date).toLocaleDateString() : 'Not set'}</p>
          <p className="text-gray-600 mt-1">Pax: {trip?.total_pax || 0}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-600">Quoted</span><span className="font-medium">{formatCurrency(trip?.quoted_amount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Paid</span><span className="font-medium text-green-700">{formatCurrency(trip?.paid_amount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Pending</span><span className={`font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, pendingAmount))}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
