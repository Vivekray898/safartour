import { getSession, requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_HOTEL_CATEGORIES } from '@/config/crm';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireRole(['admin']);
  const params = await searchParams;
  const db = getDb();

  const search = params.search || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT h.*,
      s.name as supplier_name
    FROM hotels h
    LEFT JOIN suppliers s ON h.supplier_id = s.id
    WHERE h.is_active = 1
  `;

  const filterParams: (string | number)[] = [];

  if (search) {
    query += ` AND (h.name LIKE ? OR h.destination LIKE ? OR h.contact_phone LIKE ?)`;
    filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY h.name ASC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const hotels = await db.prepare(query).all(...filterParams);
  const totalResult = await db.prepare('SELECT COUNT(*) as count FROM hotels WHERE is_active = 1').get() as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-sm text-gray-500">{totalResult.count} hotels in database</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Hotel
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotels..."
              defaultValue={search}
              onChange={(e) => {
                window.location.href = `/crm/hotels${search ? `?search=${search}` : ''}`;
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No hotels found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                hotels.map(hotel => (
                  <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{hotel.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{hotel.destination}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {hotel.category || 'Not set'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {hotel.contact_phone && (
                        <a href={`tel:${hotel.contact_phone.replace(/\D/g, '')}`} className="hover:underline">
                          {hotel.contact_phone}
                        </a>
                      )}
                      {hotel.contact_email && (
                        <a href={`mailto:${hotel.contact_email}`} className="text-blue-600 hover:underline ml-2">
                          {hotel.contact_email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{hotel.address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{hotel.supplier_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-green-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
