import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export default async function ItinerariesPage() {
  const session = await requireAuth();
  const db = getDb();

  const itineraries = await db.prepare(`
    SELECT i.*,
      t.reference as trip_reference,
      c.name as customer_name,
      t.destination,
      t.start_date, t.end_date
    FROM itinerary_days i
    JOIN trips t ON i.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    GROUP BY i.trip_id
    ORDER BY t.start_date ASC
  `).all();

  const itineraryCounts = await db.prepare(`
    SELECT trip_id, COUNT(*) as days FROM itinerary_days GROUP BY trip_id
  `).all() as Array<{ trip_id: number; days: number }>;

  const countsMap = new Map(itineraryCounts.map(c => [c.trip_id, c.days]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Itineraries</h1>
          <p className="text-sm text-gray-500">{itineraries.length} itineraries</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Ref</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {itineraries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Briefcase className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No itineraries created</p>
                    </div>
                  </td>
                </tr>
              ) : (
                itineraries.map(itr => (
                  <tr key={itr.trip_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${itr.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                        {itr.trip_reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{itr.customer_name || 'No customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{itr.destination || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {itr.start_date ? new Date(itr.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                      {itr.end_date ? ' - ' + new Date(itr.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        {countsMap.get(itr.trip_id) || 0} days
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(itr.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
