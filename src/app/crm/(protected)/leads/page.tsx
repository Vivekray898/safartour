import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRMLeadSourceBadge, CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import Link from 'next/link';
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';

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
    WHERE t.archived = 0
  `;

  const filterParams: (string | number)[] = [];

  if (searchFilter) {
    query += ` AND (t.reference LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR t.destination LIKE ?)`;
    const s = `%${searchFilter}%`;
    filterParams.push(s, s, s, s);
  }

  if (statusFilter) {
    if (statusFilter === 'active') {
      query += ` AND t.status IN ('new', 'contacted', 'requirement_collected', 'quotation_preparing', 'quotation_sent', 'negotiation', 'booking_pending')`;
    } else if (statusFilter === 'booked') {
      query += ` AND t.status IN ('booked', 'trip_ongoing', 'completed')`;
    } else {
      query += ` AND t.status = ?`;
      filterParams.push(statusFilter);
    }
  }

  if (priorityFilter) {
    query += ` AND t.priority = ?`;
    filterParams.push(priorityFilter);
  }

  if (sourceFilter) {
    query += ` AND t.lead_source = ?`;
    filterParams.push(sourceFilter);
  }

  query += ' ORDER BY t.updated_at DESC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const leads = await db.prepare(query).all(...filterParams) as LeadRow[];

  const countQuery = `
    SELECT COUNT(*) as count FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.archived = 0
  `;

  const totalResult = await db.prepare(countQuery).get() as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              defaultValue={searchFilter}
              name="search"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            defaultValue={statusFilter}
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) form.submit();
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quotation_sent">Quotation Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="lost">Lost</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            defaultValue={priorityFilter}
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) form.submit();
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            defaultValue={sourceFilter}
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) form.submit();
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">Call</option>
            <option value="walk_in">Walk-in</option>
            <option value="referral">Referral</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="existing_customer">Existing Customer</option>
          </select>

          {(statusFilter || priorityFilter || sourceFilter || searchFilter) && (
            <Link
              href="/crm/leads"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear filters
            </Link>
          )}
        </div>

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
                      {lead.start_date ? new Date(lead.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
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
                      {new Date(lead.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {leads.length > 0 && totalResult.count > limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalResult.count)} of {totalResult.count} leads
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = `/crm/leads?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}${sourceFilter ? `&source=${sourceFilter}` : ''}`}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => window.location.href = `/crm/leads?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}${sourceFilter ? `&source=${sourceFilter}` : ''}`}
                disabled={page * limit >= totalResult.count}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
