import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_FOLLOWUP_TYPES } from '@/config/crm';
import Link from 'next/link';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string; tripId?: string; page?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;
  const db = getDb();

  const dateFilter = params.date || '';
  const statusFilter = params.status || '';
  const tripIdFilter = params.tripId || '';
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = `
    SELECT f.*,
      t.reference as trip_reference, t.destination,
      c.name as customer_name,
      u.name as assigned_to_name
    FROM followups f
    JOIN trips t ON f.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON f.assigned_to = u.id
    WHERE t.archived = 0
  `;

  const filterParams: (string | number)[] = [];

  if (tripIdFilter) {
    query += ` AND f.trip_id = ?`;
    filterParams.push(tripIdFilter);
  }

  if (statusFilter) {
    query += ` AND f.status = ?`;
    filterParams.push(statusFilter);
  }

  if (dateFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    query += ` AND f.scheduled_date = ?`;
    filterParams.push(today);
  } else if (dateFilter === 'overdue') {
    const today = new Date().toISOString().split('T')[0];
    query += ` AND f.scheduled_date < ? AND f.status = 'pending'`;
    filterParams.push(today);
  } else if (dateFilter) {
    query += ` AND f.scheduled_date = ?`;
    filterParams.push(dateFilter);
  }

  query += ' ORDER BY f.scheduled_date ASC LIMIT ? OFFSET ?';
  filterParams.push(limit, offset);

  const followups = db.prepare(query).all(...filterParams);

  const today = new Date().toISOString().split('T')[0];
  const overdueCount = db.prepare(`
    SELECT COUNT(*) as count FROM followups
    WHERE scheduled_date < ? AND status = 'pending'
    AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
  `).get(today) as { count: number };

  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM followups
    WHERE scheduled_date = ? AND status = 'pending'
    AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
  `).get(today) as { count: number };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500">{followups.length} follow-ups</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-red-700">{overdueCount.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-xl font-bold text-amber-700">{todayCount.count}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-xl font-bold text-green-700">{followups.filter(f => f.status === 'pending' && f.scheduled_date > today).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <select
            defaultValue={statusFilter}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No follow-ups found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                followups.map(f => {
                  const isOverdue = f.status === 'pending' && new Date(f.scheduled_date).getTime() < new Date().getTime();
                  const isToday = f.scheduled_date === today;

                  return (
                    <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : isToday ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">
                          {new Date(f.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{f.scheduled_time || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          f.followup_type === 'call' ? 'bg-blue-100 text-blue-700' :
                          f.followup_type === 'whatsapp' ? 'bg-green-100 text-green-700' :
                          f.followup_type === 'email' ? 'bg-gray-100 text-gray-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {f.followup_type === 'call' ? 'Call' : f.followup_type === 'whatsapp' ? 'WhatsApp' : f.followup_type === 'email' ? 'Email' : f.followup_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/crm/leads/${f.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                          {f.trip_reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{f.customer_name || 'No customer'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{f.destination || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{f.assigned_to_name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          f.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          f.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
