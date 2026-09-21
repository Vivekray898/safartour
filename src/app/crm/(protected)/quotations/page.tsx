import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_QUOTATION_STATUSES } from '@/config/crm';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string; status?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const tripId = params.tripId || '';
  const statusFilter = params.status || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT q.*,
      t.reference as trip_reference, t.destination,
      c.name as customer_name, c.phone as customer_phone,
      u.name as prepared_by_name
    FROM quotations q
    JOIN trips t ON q.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON q.prepared_by = u.id
    WHERE 1=1
  `;

  const filterParams: (string | number)[] = [];

  if (tripId) {
    query += ` AND q.trip_id = ?`;
    filterParams.push(tripId);
  }

  if (statusFilter) {
    query += ` AND q.status = ?`;
    filterParams.push(statusFilter);
  }

  query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const quotations = await db.prepare(query).all(...filterParams);
  const totalResult = await db.prepare('SELECT COUNT(*) as count FROM quotations').get() as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500">{totalResult.count} total quotations</p>
        </div>
        <Link
          href="/crm/leads/new"
          className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            defaultValue={statusFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="revised">Revised</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Prepared By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No quotations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/quotations/${q.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                        {q.reference}
                      </Link>
                      <span className="text-xs text-gray-500 ml-1">{q.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${q.trip_id}`} className="text-sm text-green-700 hover:underline">
                        {q.trip_reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{q.customer_name || 'No customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{q.destination || '-'}</td>
                    <td className="px-4 py-3">
                      <CRMStatusBadge status={q.status} type="quotation" size="sm" />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(q.final_amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{q.prepared_by_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(q.quotation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
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
