import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatCRMDate } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMPagination from '@/components/crm/common/CRMPagination';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { QuotationActionsProvider, QuotationRowActions, type QuotationListRow } from '@/components/crm/entities/QuotationActions';
import Link from 'next/link';
import { FileText } from 'lucide-react';

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
  const page = Math.max(1, parseInt(params.page || '1'));
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
  const countWhere = tripId && statusFilter
    ? 'WHERE q.trip_id = ? AND q.status = ?'
    : tripId ? 'WHERE q.trip_id = ?' : statusFilter ? 'WHERE q.status = ?' : '';
  const countParams = tripId && statusFilter ? [tripId, statusFilter] : tripId ? [tripId] : statusFilter ? [statusFilter] : [];
  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM quotations q ${countWhere}`).get(...countParams) as { count: number };

  const rows = quotations as unknown as QuotationListRow[];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' },
    { value: 'viewed', label: 'Viewed' }, { value: 'revised', label: 'Revised' },
    { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <QuotationActionsProvider canEdit={session.role === 'admin' || session.role === 'employee'}>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <p className="text-sm text-gray-500">{totalResult.count} total quotations</p>
          </div>
          <Link
            href="/crm/leads/new"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            New Quotation
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          <CRMFilterBar
            basePath="/crm/quotations"
            searchValue=""
            searchPlaceholder="Search quotations..."
            selects={[{ name: 'status', value: statusFilter, label: 'Status', options: statusOptions }]}
          />

          {rows.length === 0 ? (
            <CRMEmptyState
              icon={FileText}
              title={statusFilter || tripId ? 'No quotations match your filters' : 'No quotations yet'}
              description={statusFilter || tripId
                ? 'Try a different status filter or clear it.'
                : 'Quotations are created from a lead or trip. Start by creating a lead with the trip requirement.'}
              ctaLabel={statusFilter || tripId ? undefined : 'Create a Lead'}
              ctaHref={statusFilter || tripId ? undefined : '/crm/leads/new'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(quotation => (
                      <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/crm/quotations/${quotation.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                            {quotation.reference}
                          </Link>
                          <span className="text-xs text-gray-500 ml-1">{(quotation as { version?: string }).version}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{(quotation as { customer_name?: string | null }).customer_name || 'No customer'}</td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <Link href={`/crm/leads/${quotation.trip_id}`} className="text-sm text-green-700 hover:underline">
                            {(quotation as { trip_reference?: string }).trip_reference}
                          </Link>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">{(quotation as { destination?: string | null }).destination || '—'}</td>
                        <td className="px-4 py-3">
                          <CRMStatusBadge status={quotation.status} type="quotation" size="sm" />
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {(quotation.final_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-500">
                          {formatCRMDate((quotation as { quotation_date?: string }).quotation_date)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <QuotationRowActions quotation={quotation} canEdit={session.role === 'admin' || session.role === 'employee'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CRMPagination basePath="/crm/quotations" page={page} totalCount={totalResult.count} limit={limit} params={{ ...(tripId ? { tripId } : {}), ...(statusFilter ? { status: statusFilter } : {}) }} />
            </>
          )}
        </div>
      </div>
    </QuotationActionsProvider>
  );
}
