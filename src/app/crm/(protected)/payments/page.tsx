import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatCRMDate, formatReference } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMPagination from '@/components/crm/common/CRMPagination';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import { CRMPaymentMethodBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import { PaymentActionsProvider, AddPaymentButton, PaymentRowActions, type PaymentListRow } from '@/components/crm/entities/PaymentActions';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const tripId = params.tripId || '';
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*,
      t.reference as trip_reference, t.destination,
      c.name as customer_name, c.phone as customer_phone,
      u.name as recorded_by_name
    FROM payments p
    JOIN trips t ON p.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON p.recorded_by = u.id
    WHERE 1=1
  `;

  const filterParams: (string | number)[] = [];

  if (tripId) {
    query += ` AND p.trip_id = ?`;
    filterParams.push(tripId);
  }

  query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const payments = await db.prepare(query).all(...filterParams);

  const totalAllPayments = await db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN trips t ON p.trip_id = t.id
    WHERE t.archived = 0
  `).get() as { total: number };

  const totalCount = await db.prepare(
    tripId ? 'SELECT COUNT(*) as count FROM payments WHERE trip_id = ?' : 'SELECT COUNT(*) as count FROM payments'
  ).get(...(tripId ? [tripId] : [])) as { count: number };

  // Trips for the record-payment selector (human-readable labels).
  const trips = await db.prepare(`
    SELECT t.id, t.reference, t.destination, c.name as customer_name
    FROM trips t LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.archived = 0
    ORDER BY t.created_at DESC LIMIT 100
  `).all() as Array<{ id: number; reference: string; destination: string | null; customer_name: string | null }>;

  const canEdit = session.role === 'admin' || session.role === 'employee';
  const rows = payments as unknown as PaymentListRow[];

  return (
    <PaymentActionsProvider
      canEdit={canEdit}
      trips={trips.map(t => ({ id: t.id, label: `${t.reference} — ${t.customer_name || t.destination || 'Trip'}` }))}
    >
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-sm text-gray-500">Total collected: {formatCurrency(totalAllPayments.total)}</p>
          </div>
          <AddPaymentButton />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          <CRMFilterBar
            basePath="/crm/payments"
            searchValue=""
            searchPlaceholder="Search payments..."
          />

          {rows.length === 0 ? (
            <CRMEmptyState
              icon={CreditCard}
              title={tripId ? 'No payments for this trip' : 'No payments recorded'}
              description={tripId
                ? 'Record a payment against this trip to track collections.'
                : 'Payments are recorded against trips. Record the first payment to start tracking collections.'}
              ctaLabel={tripId ? undefined : 'Record Payment'}
              ctaHref={tripId ? undefined : '/crm/payments'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{formatReference('PAY', payment.id)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatCRMDate(payment.payment_date)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/crm/leads/${payment.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                            {payment.trip_reference}
                          </Link>
                          <div className="text-xs text-gray-500">{payment.customer_name || ''}</div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900">{payment.customer_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3"><CRMPaymentMethodBadge method={payment.payment_method} /></td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">{payment.recorded_by_name || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <PaymentRowActions payment={payment} canEdit={session.role === 'admin'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CRMPagination basePath="/crm/payments" page={page} totalCount={totalCount.count} limit={limit} params={tripId ? { tripId } : {}} />
            </>
          )}
        </div>
      </div>
    </PaymentActionsProvider>
  );
}
