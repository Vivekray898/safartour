import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRMLeadSourceBadge, CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMPagination from '@/components/crm/common/CRMPagination';
import { formatCurrency } from '@/config/crm';
import { formatCRMDate } from '@/lib/crm/format';
import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';

interface LeadRow {
  id: number;
  reference: string;
  status: string;
  priority: string;
  lead_source: string;
  destination: string | null;
  start_date: string | null;
  total_pax: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  assigned_employee_name: string | null;
  quoted_amount: number | null;
  paid_amount: number | null;
  updated_at: string;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; source?: string; search?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const statusFilter = params.status || '';
  const priorityFilter = params.priority || '';
  const sourceFilter = params.source || '';
  const searchFilter = params.search || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Shared WHERE conditions so the list query and the count query stay in
  // sync (pagination totals must respect the active filters).
  const conditions: string[] = ['t.archived = 0'];
  const filterParams: (string | number)[] = [];

  if (searchFilter) {
    conditions.push(`(t.reference LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR t.destination LIKE ?)`);
    const s = `%${searchFilter}%`;
    filterParams.push(s, s, s, s);
  }

  if (statusFilter) {
    if (statusFilter === 'active') {
      conditions.push(`t.status IN ('new', 'contacted', 'requirement_collected', 'quotation_preparing', 'quotation_sent', 'negotiation', 'booking_pending')`);
    } else if (statusFilter === 'booked') {
      conditions.push(`t.status IN ('booked', 'trip_ongoing', 'completed')`);
    } else {
      conditions.push(`t.status = ?`);
      filterParams.push(statusFilter);
    }
  }

  if (priorityFilter) {
    conditions.push(`t.priority = ?`);
    filterParams.push(priorityFilter);
  }

  if (sourceFilter) {
    conditions.push(`t.lead_source = ?`);
    filterParams.push(sourceFilter);
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  let query = `
    SELECT t.id, t.reference, t.status, t.priority, t.lead_source,
      t.destination, t.start_date, t.total_pax,
      c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
      u.name as assigned_employee_name,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount,
      t.updated_at
    FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.assigned_employee_id = u.id
    ${whereSql}
  `;

  const listParams = [...filterParams, limit, offset];
  query += ' ORDER BY t.updated_at DESC LIMIT ? OFFSET ?';

  const leads = await db.prepare(query).all(...listParams) as LeadRow[];

  const totalResult = await db.prepare(`
    SELECT COUNT(*) as count FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    ${whereSql}
  `).get(...filterParams) as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{totalResult.count} total leads</p>
        </div>
        <Link
          href="/crm/leads/new"
          className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <CRMFilterBar
          basePath="/crm/leads"
          searchValue={searchFilter}
          searchPlaceholder="Search leads..."
          selects={[
            {
              name: 'status',
              value: statusFilter,
              label: 'Filter by status',
              options: [
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'quotation_sent', label: 'Quotation Sent' },
                { value: 'negotiation', label: 'Negotiation' },
                { value: 'booked', label: 'Booked' },
                { value: 'completed', label: 'Completed' },
                { value: 'lost', label: 'Lost' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
            },
            {
              name: 'priority',
              value: priorityFilter,
              label: 'Filter by priority',
              options: [
                { value: '', label: 'All Priority' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
            {
              name: 'source',
              value: sourceFilter,
              label: 'Filter by source',
              options: [
                { value: '', label: 'All Sources' },
                { value: 'website', label: 'Website' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'call', label: 'Call' },
                { value: 'walk_in', label: 'Walk-in' },
                { value: 'referral', label: 'Referral' },
                { value: 'google', label: 'Google' },
                { value: 'facebook', label: 'Facebook' },
                { value: 'instagram', label: 'Instagram' },
                { value: 'existing_customer', label: 'Existing Customer' },
              ],
            },
          ]}
          clearHref="/crm/leads"
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pax</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quoted</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Filter className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No leads found</p>
                      <p className="text-xs mt-1">Try adjusting your filters or create a new lead.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${lead.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                        {lead.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.customer_name || 'No customer'}</div>
                        <div className="text-xs text-gray-500">{lead.customer_phone || lead.customer_email || 'No contact'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[150px] truncate">
                      {lead.destination || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCRMDate(lead.start_date, '—')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.total_pax || 0}
                    </td>
                    <td className="px-4 py-3">
                      <CRMStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        lead.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        lead.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.assigned_employee_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {lead.quoted_amount ? formatCurrency(lead.quoted_amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={lead.paid_amount && lead.quoted_amount ? (lead.paid_amount >= lead.quoted_amount ? 'text-green-600' : 'text-amber-600') : 'text-gray-400'}>
                        {lead.paid_amount ? formatCurrency(lead.paid_amount) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CRMLeadSourceBadge source={lead.lead_source} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCRMDate(lead.updated_at, '—')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {leads.length > 0 && (
          <CRMPagination
            basePath="/crm/leads"
            page={page}
            totalCount={totalResult.count}
            limit={limit}
            params={Object.fromEntries(
              Object.entries({ status: statusFilter, priority: priorityFilter, source: sourceFilter, search: searchFilter }).filter(([, v]) => v)
            )}
            label="leads"
          />
        )}
      </div>
    </div>
  );
}
