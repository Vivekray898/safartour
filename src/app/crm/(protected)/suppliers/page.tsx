import { requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatReference } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import CRMPagination from '@/components/crm/common/CRMPagination';
import { SupplierActionsProvider, AddSupplierButton, SupplierRowActions, type SupplierRow } from '@/components/crm/entities/SupplierActions';
import { Truck } from 'lucide-react';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; show?: string; page?: string }>;
}) {
  const session = await requireRole(['admin']);
  const params = await searchParams;
  const db = getDb();

  const search = params.search || '';
  const type = params.type || '';
  const includeArchived = params.show === 'archived';
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE s.archived = ?';
  const filterParams: (string | number)[] = [includeArchived ? 1 : 0];

  if (search) {
    where += ` AND (s.name ILIKE ? OR s.phone ILIKE ? OR s.email ILIKE ? OR s.location ILIKE ?)`;
    const s = `%${search}%`;
    filterParams.push(s, s, s, s);
  }
  if (type) { where += ` AND s.type = ?`; filterParams.push(type); }

  const suppliers = await db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM hotels h WHERE h.supplier_id = s.id AND h.archived = 0) as hotel_count
    FROM suppliers s
    ${where}
    ORDER BY s.name ASC
    LIMIT ? OFFSET ?
  `).all(...filterParams, limit, offset);

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM suppliers s ${where}`).get(...filterParams) as { count: number };

  const rows = suppliers as unknown as SupplierRow[];

  const typeLabels: Record<string, string> = {
    hotel: 'Hotel', driver: 'Driver', vehicle_owner: 'Vehicle Owner',
    transport_company: 'Transport Company', local_agent: 'Local Agent',
    activity_provider: 'Activity Provider', other: 'Other',
  };

  return (
    <SupplierActionsProvider canEdit={session.role === 'admin'}>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-sm text-gray-500">{totalResult.count} {includeArchived ? 'archived' : 'active'} suppliers</p>
          </div>
          <AddSupplierButton />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          <CRMFilterBar
            basePath="/crm/suppliers"
            searchValue={search}
            searchPlaceholder="Search supplier, contact, location..."
            selects={[
              { name: 'type', value: type, label: 'Type', options: [
                { value: '', label: 'All types' },
                ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
              ] },
              includeArchived
                ? { name: 'show', value: 'archived', label: 'Showing', options: [{ value: 'archived', label: 'Archived' }, { value: '', label: 'Active' }] }
                : undefined,
            ].filter(Boolean) as { name: string; value: string; label: string; options: Array<{ value: string; label: string }> }[]}
          />

          {totalResult.count === 0 ? (
            search || type ? (
              <CRMEmptyState icon={Truck} title="No suppliers match your filters" description="Try a different search or clear the filters." />
            ) : (
              <CRMEmptyState
                icon={Truck}
                title="No suppliers yet"
                description="Hotels, transport partners, local agents and activity providers you work with."
                ctaLabel="Add Supplier"
                ctaHref="/crm/suppliers"
              />
            )
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="hidden lg:table-cell text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hotels</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{formatReference('SUP', supplier.id)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{typeLabels[supplier.type ?? ''] ?? supplier.type ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {typeLabels[supplier.type ?? ''] ?? supplier.type ?? '—'}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900">
                          <div className="flex flex-wrap items-center gap-2">
                            {supplier.phone && <a href={`tel:${supplier.phone.replace(/\D/g, '')}`} className="hover:underline">{supplier.phone}</a>}
                            {supplier.whatsapp && <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} className="text-green-600 hover:underline">WhatsApp</a>}
                            {supplier.email && <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">{supplier.email}</a>}
                            {!supplier.phone && !supplier.whatsapp && !supplier.email && <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">{supplier.location || '—'}</td>
                        <td className="hidden lg:table-cell px-4 py-3 text-center text-sm text-gray-600">{supplier.hotel_count}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            supplier.archived ? 'bg-gray-100 text-gray-500' : supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {supplier.archived ? 'Archived' : supplier.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <SupplierRowActions supplier={supplier} canEdit={session.role === 'admin'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CRMPagination basePath="/crm/suppliers" page={page} totalCount={totalResult.count} limit={limit} params={{ search, type, ...(includeArchived ? { show: 'archived' } : {}) }} />
            </>
          )}
        </div>
      </div>
    </SupplierActionsProvider>
  );
}
