import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_PAYMENT_METHODS, CRMPaymentMethodBadge } from '@/config/crm';
import { formatCurrency } from '@/config/crm';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const tripId = params.tripId || '';
  const page = parseInt(params.page || '1');
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
    params.push(tripId);
  }

  query += ' ORDER BY p.payment_date DESC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const payments = db.prepare(query).all(...filterParams);

  const totalAllPayments = db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN trips t ON p.trip_id = t.id
    WHERE t.archived = 0
  `).get() as { total: number };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Total collected: {formatCurrency(totalAllPayments.total)}</p>
        </div>
        <Link
          href="/crm/leads?status=booked"
          className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Ref</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No payments recorded</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${payment.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                        {payment.trip_reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{payment.customer_name || 'No customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.destination || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <CRMPaymentMethodBadge method={payment.payment_method} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.transaction_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.recorded_by_name || 'Unknown'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
