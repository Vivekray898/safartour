import { requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatReference } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import CRMPagination from '@/components/crm/common/CRMPagination';
import { DriverActionsProvider, AddDriverButton, DriverRowActions, type DriverRow } from '@/components/crm/entities/DriverActions';
import { Users } from 'lucide-react';

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; availability?: string; show?: string; page?: string }>;
}) {
  const session = await requireRole(['admin']);
  const params = await searchParams;
  const db = getDb();

  const search = params.search || '';
  const availability = params.availability || '';
  const includeArchived = params.show === 'archived';
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE d.archived = ?';
  const filterParams: (string | number)[] = [includeArchived ? 1 : 0];

  if (search) {
    where += ` AND (d.name ILIKE ? OR d.phone ILIKE ? OR d.vehicle_number ILIKE ? OR d.destination_route ILIKE ?)`;
    const s = `%${search}%`;
    filterParams.push(s, s, s, s);
  }
  if (availability) { where += ` AND d.availability = ?`; filterParams.push(availability); }

  const drivers = await db.prepare(`
    SELECT d.*,
      t.reference as assigned_trip_reference,
      c.name as assigned_customer_name
    FROM drivers d
    LEFT JOIN trips t ON d.assigned_trip_id = t.id AND t.archived = 0
    LEFT JOIN customers c ON t.customer_id = c.id
    ${where}
    ORDER BY d.name ASC
    LIMIT ? OFFSET ?
  `).all(...filterParams, limit, offset);

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM drivers d ${where}`).get(...filterParams) as { count: number };

  const rows = drivers as unknown as DriverRow[];

  return (
    <DriverActionsProvider canEdit={session.role === 'admin'}>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
            <p className="text-sm text-gray-500">{totalResult.count} {includeArchived ? 'archived' : 'active'} drivers</p>
          </div>
          <AddDriverButton />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          <CRMFilterBar
            basePath="/crm/drivers"
            searchValue={search}
            searchPlaceholder="Search driver, phone, vehicle, route..."
            selects={[
              { name: 'availability', value: availability, label: 'Availability', options: [
                { value: '', label: 'All' },
                { value: 'available', label: 'Available' },
                { value: 'on_trip', label: 'On trip' },
                { value: 'off_duty', label: 'Off duty' },
              ] },
              includeArchived
                ? { name: 'show', value: 'archived', label: 'Showing', options: [{ value: 'archived', label: 'Archived' }, { value: '', label: 'Active' }] }
                : undefined,
            ].filter(Boolean) as { name: string; value: string; label: string; options: Array<{ value: string; label: string }> }[]}
          />

          {totalResult.count === 0 ? (
            search || availability ? (
              <CRMEmptyState icon={Users} title="No drivers match your filters" description="Try a different search or clear the filters." />
            ) : (
              <CRMEmptyState
                icon={Users}
                title="No drivers yet"
                description="Drivers, their vehicles and the routes they cover for your trips."
                ctaLabel="Add Driver"
                ctaHref="/crm/drivers"
              />
            )
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Trip</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(driver => (
                      <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{formatReference('DRV', driver.id)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{driver.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{driver.phone || ''}</div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm">
                          {driver.phone ? <a href={`tel:${driver.phone.replace(/\D/g, '')}`} className="hover:underline">{driver.phone}</a> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-gray-900">{driver.vehicle_type || '—'}</div>
                          <div className="text-xs text-gray-500">{driver.vehicle_number || ''}</div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">{driver.destination_route || '—'}</td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                          {driver.assigned_trip_reference ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            driver.archived ? 'bg-gray-100 text-gray-500' :
                            driver.availability === 'available' ? 'bg-green-100 text-green-700' :
                            driver.availability === 'on_trip' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {driver.archived ? 'Archived' : driver.availability === 'available' ? 'Available' : driver.availability === 'on_trip' ? 'On trip' : driver.availability === 'off_duty' ? 'Off duty' : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DriverRowActions driver={driver} canEdit={session.role === 'admin'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CRMPagination basePath="/crm/drivers" page={page} totalCount={totalResult.count} limit={limit} params={{ search, availability, ...(includeArchived ? { show: 'archived' } : {}) }} />
            </>
          )}
        </div>
      </div>
    </DriverActionsProvider>
  );
}
