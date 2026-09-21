import { requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatReference } from '@/lib/crm/format';
import CRMFilterBar from '@/components/crm/common/CRMFilterBar';
import CRMEmptyState from '@/components/crm/common/CRMEmptyState';
import CRMPagination from '@/components/crm/common/CRMPagination';
import { HotelActionsProvider, AddHotelButton, HotelRowActions, type HotelRow } from '@/components/crm/entities/HotelActions';
import { Building2 } from 'lucide-react';

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; destination?: string; show?: string; page?: string }>;
}) {
  const session = await requireRole(['admin']);
  const params = await searchParams;
  const db = getDb();

  const search = params.search || '';
  const destination = params.destination || '';
  const includeArchived = params.show === 'archived';
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE h.archived = ?';
  const filterParams: (string | number)[] = [includeArchived ? 1 : 0];

  if (search) {
    where += ` AND (h.name ILIKE ? OR h.destination ILIKE ? OR h.address ILIKE ?)`;
    const s = `%${search}%`;
    filterParams.push(s, s, s);
  }
  if (destination) {
    where += ` AND h.destination ILIKE ?`;
    filterParams.push(`%${destination}%`);
  }

  const hotels = await db.prepare(`
    SELECT h.*, s.name as supplier_name
    FROM hotels h
    LEFT JOIN suppliers s ON h.supplier_id = s.id
    ${where}
    ORDER BY h.name ASC
    LIMIT ? OFFSET ?
  `).all(...filterParams, limit, offset);

  const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM hotels h ${where}`).get(...filterParams) as { count: number };
  const suppliers = await db.prepare('SELECT id, name FROM suppliers WHERE archived = 0 AND status = \'active\' ORDER BY name ASC').all() as Array<{ id: number; name: string }>;

  const rows = hotels as unknown as HotelRow[];

  return (
    <HotelActionsProvider suppliers={suppliers} canEdit={session.role === 'admin'}>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
            <p className="text-sm text-gray-500">{totalResult.count} {includeArchived ? 'archived' : 'active'} hotels</p>
          </div>
          <AddHotelButton />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          <CRMFilterBar
            basePath="/crm/hotels"
            searchValue={search}
            searchPlaceholder="Search hotel, destination, address..."
            selects={[
              includeArchived
                ? { name: 'show', value: 'archived', label: 'Showing', options: [{ value: 'archived', label: 'Archived' }, { value: '', label: 'Active' }] }
                : undefined,
            ].filter(Boolean) as { name: string; value: string; label: string; options: Array<{ value: string; label: string }> }[]}
          />

          {totalResult.count === 0 ? (
            includeArchived
              ? (
                <CRMEmptyState
                  icon={Building2}
                  title="No archived hotels"
                  description="Hotels you archive will appear here and can be restored anytime."
                />
              ) : search || destination ? (
                <CRMEmptyState icon={Building2} title="No hotels match your filters" description="Try a different search or clear the filters." />
              ) : (
                <CRMEmptyState
                  icon={Building2}
                  title="No hotels yet"
                  description="Hotels you add here can be linked to suppliers and used in quotations and itineraries."
                  ctaLabel="Add Hotel"
                  ctaHref="/crm/hotels"
                />
              )
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(hotel => (
                      <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{formatReference('HTL', hotel.id)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{hotel.name}</div>
                          <div className="text-xs text-gray-500 md:hidden">{hotel.destination}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{hotel.destination}</td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{hotel.category || 'Not set'}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-900">
                          {hotel.contact_phone && (
                            <a href={`tel:${hotel.contact_phone.replace(/\D/g, '')}`} className="hover:underline">{hotel.contact_phone}</a>
                          )}
                          {hotel.contact_email && (
                            <a href={`mailto:${hotel.contact_email}`} className="text-blue-600 hover:underline ml-2">{hotel.contact_email}</a>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">{hotel.supplier_name || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${hotel.archived ? 'bg-gray-100 text-gray-500' : hotel.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {hotel.archived ? 'Archived' : hotel.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <HotelRowActions hotel={hotel} canEdit={session.role === 'admin'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CRMPagination basePath="/crm/hotels" page={page} totalCount={totalResult.count} limit={limit} params={{ search, destination, ...(includeArchived ? { show: 'archived' } : {}) }} />
            </>
          )}
        </div>
      </div>
    </HotelActionsProvider>
  );
}
