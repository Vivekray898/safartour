import { getSession, requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_SUPPLIER_TYPES } from '@/config/crm';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default async function SuppliersPage() {
  const session = await requireRole(['admin']);
  const db = getDb();

  const suppliers = db.prepare(`
    SELECT * FROM suppliers WHERE status = 'active' ORDER BY name ASC
  `).all();

  const typeLabels: Record<string, string> = {
    hotel: 'Hotel',
    driver: 'Driver',
    vehicle_owner: 'Vehicle Owner',
    transport_company: 'Transport Company',
    local_agent: 'Local Agent',
    activity_provider: 'Activity Provider',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        </div>
        <button className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No suppliers found</p>
                  </td>
                </tr>
              ) : (
                suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{supplier.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {typeLabels[supplier.type] || supplier.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {supplier.phone && (
                          <a href={`tel:${supplier.phone.replace(/\D/g, '')}`} className="hover:underline">{supplier.phone}</a>
                        )}
                        {supplier.whatsapp && (
                          <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} className="text-green-600 hover:underline">
                            WhatsApp
                          </a>
                        )}
                        {supplier.email && (
                          <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline ml-2">
                            {supplier.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{supplier.location || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {supplier.internal_rating ? (
                        <span className="text-amber-500">{'★'.repeat(supplier.internal_rating)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{supplier.notes || '-'}</td>
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
