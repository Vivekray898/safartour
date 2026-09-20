import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const search = params.search || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT c.id, c.name, c.phone, c.email, c.city, c.preferred_contact,
      c.company, c.company_contact_person, c.is_repeat_customer,
      c.assigned_employee_id, u.name as assigned_employee_name,
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
    WHERE c.archived = 0
  `;

  const countQuery = `SELECT COUNT(*) as count FROM customers WHERE archived = 0`;
  const filterParams: (string | number)[] = [];

  if (search) {
    query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`;
    const s = `%${search}%`;
    filterParams.push(s, s, s);
  }

  query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const customers = await db.prepare(query).all(...filterParams);
  const totalResult = await db.prepare(countQuery).get() as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{totalResult.count} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/leads/quick"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick Lead
          </Link>
          <Link
            href="/crm/leads/new"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              defaultValue={search}
              onChange={(e) => {
                window.location.href = `/crm/customers${search ? `?search=${search}` : ''}`;
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quoted</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No customers found</p>
                      <p className="text-xs mt-1">Create your first lead to add a customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/customers/${customer.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                        {customer.name}
                      </Link>
                      {customer.is_repeat_customer && (
                        <span className="inline-block ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Repeat</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <span>{customer.phone || '-'}</span>
                        {customer.email && (
                          <>
                            <span className="text-gray-300">|</span>
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline text-xs">{customer.email}</a>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.city || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium text-gray-900">{customer.active_trips}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{customer.completed_trips}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      ₹{(customer.total_quoted || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      ₹{(customer.total_paid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {customer.assigned_employee_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(customer.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {customers.length > 0 && totalResult.count > limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalResult.count)} of {totalResult.count} customers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = `/crm/customers?page=${page - 1}${search ? `&search=${search}` : ''}`}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => window.location.href = `/crm/customers?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
