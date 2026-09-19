import { getSession, requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_VEHICLES } from '@/config/crm';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default async function DriversPage() {
  const session = await requireRole(['admin']);
  const db = getDb();

  const drivers = db.prepare(`
    SELECT * FROM drivers ORDER BY name ASC
  `).all();

  const vehicleLabels: Record<string, string> = {
    hatchback: 'Hatchback',
    sedan: 'Sedan',
    suv: 'SUV',
    innova: 'Innova',
    innova_crysta: 'Innova Crysta',
    luxury_suv: 'Luxury SUV',
    tempo_traveller: 'Tempo Traveller',
    bus: 'Bus',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        </div>
        <button className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No drivers found</p>
                  </td>
                </tr>
              ) : (
                drivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{driver.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {driver.phone && (
                        <a href={`tel:${driver.phone.replace(/\D/g, '')}`} className="hover:underline">{driver.phone}</a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {vehicleLabels[driver.vehicle_type] || driver.vehicle_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{driver.vehicle_number || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{driver.destination_route || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        driver.availability === 'available' ? 'bg-green-100 text-green-700' :
                        driver.availability === 'booked' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {driver.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{driver.notes || '-'}</td>
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
