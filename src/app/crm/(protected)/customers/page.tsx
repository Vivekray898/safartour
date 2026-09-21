import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatReference, formatCRMDate } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMPagination from '@/components/crm/common/CRMPagination';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import { CustomerActionsProvider, AddCustomerButton, CustomerRowActions, type CustomerRow } from '@/components/crm/entities/CustomerActions';
import Link from 'next/link';
import { Users } from 'lucide-react';

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
  const employees = await db.prepare('SELECT id, name FROM users WHERE is_active = 1 ORDER BY name ASC').all() as Array<{ id: number; name: string }>;

  const rows = customers as unknown as CustomerRow[];

  return (
    <CustomerActionsProvider employees={employees} canEdit={session.role === 'admin'}>
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{totalResult.count} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/leads/quick"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Quick Lead
          </Link>
          <AddCustomerButton />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <CRMFilterBar
          basePath="/crm/customers"
          searchValue={search}
          searchPlaceholder="Search customers..."
        />

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
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-0 py-0">
                    <CRMEmptyState
                      icon={Users}
                      title={search ? 'No customers match your search' : 'No customers yet'}
                      description={search ? 'Try a different name, phone or email.' : 'Customers created from enquiries or manually added will appear here.'}
                      ctaLabel={search ? undefined : 'Add Customer'}
                      ctaHref={search ? undefined : '/crm/customers'}
                    />
                  </td>
                </tr>
              ) : (
                rows.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/customers/${customer.id}`} className="font-medium text-green-700 hover:text-green-800 text-sm">
                        {customer.name}
                      </Link>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">{formatReference('CUS', customer.id)}</div>
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
                      {(customer.total_quoted || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                      {(customer.total_paid || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {customer.assigned_employee_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCRMDate(customer.updated_at, '—')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CustomerRowActions customer={customer} canEdit={session.role === 'admin'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {customers.length > 0 && (
          <CRMPagination
            basePath="/crm/customers"
            page={page}
            totalCount={totalResult.count}
            limit={limit}
            params={search ? { search } : {}}
            label="customers"
          />
        )}
      </div>
    </div>
    </CustomerActionsProvider>
  );
}
