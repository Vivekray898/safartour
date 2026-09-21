import { getSession, requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatCurrency } from '@/config/crm';
import { BarChart3 } from 'lucide-react';

export default async function ReportsPage() {
  const session = await requireRole(['admin']);
  const db = getDb();

  const leadsReport = {
    total: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE archived = 0`).get() as { count: number },
    byStatus: await db.prepare(`SELECT status, COUNT(*) as count FROM trips WHERE archived = 0 GROUP BY status`).all() as Array<{ status: string; count: number }>,
    bySource: await db.prepare(`SELECT lead_source, COUNT(*) as count FROM trips WHERE archived = 0 GROUP BY lead_source ORDER BY count DESC`).all() as Array<{ lead_source: string; count: number }>,
    byEmployee: await db.prepare(`SELECT u.name, COUNT(*) as count FROM trips t LEFT JOIN users u ON t.assigned_employee_id = u.id WHERE t.archived = 0 GROUP BY t.assigned_employee_id, u.name`).all() as Array<{ name: string | null; count: number }>,
  };

  const bookingsReport = {
    total: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0`).get() as { count: number },
    byMonth: await db.prepare(`
      SELECT substring(start_date from 1 for 7) as month, COUNT(*) as count
      FROM trips WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0 AND start_date IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12
    `).all() as Array<{ month: string; count: number }>,
    byDestination: await db.prepare(`
      SELECT destination, COUNT(*) as count FROM trips
      WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0 AND destination IS NOT NULL
      GROUP BY destination ORDER BY count DESC
    `).all() as Array<{ destination: string; count: number }>,
  };

  const revenueReport = {
    quoted: await db.prepare(`SELECT COALESCE(SUM(final_amount), 0) as total FROM quotations WHERE status = 'accepted'`).get() as { total: number },
    booked: await db.prepare(`
      SELECT COALESCE(SUM(final_amount), 0) as total FROM quotations
      WHERE status = 'accepted' AND trip_id IN (
        SELECT id FROM trips WHERE status IN ('booked', 'trip_ongoing') AND archived = 0
      )
    `).get() as { total: number },
    collected: await db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
      JOIN trips t ON p.trip_id = t.id
      WHERE t.status IN ('booked', 'trip_ongoing', 'completed') AND t.archived = 0
    `).get() as { total: number },
    pending: await db.prepare(`
      SELECT COALESCE(SUM(q.final_amount - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)), 0) as total
      FROM quotations q WHERE q.status = 'accepted'
      AND q.final_amount > (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)
    `).get() as { total: number },
  };

  const conversionReport = {
    enquiries: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE archived = 0`).get() as { count: number },
    quotations: await db.prepare(`SELECT COUNT(DISTINCT trip_id) as count FROM quotations WHERE status != 'draft'`).get() as { count: number },
    bookings: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0`).get() as { count: number },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">CRM analytics and insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Leads Report
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Leads</span>
                <span className="font-bold text-gray-900">{leadsReport.total.count}</span>
              </div>
              <div className="h-20 flex items-end gap-1">
                {leadsReport.byStatus.slice(0, 5).map(s => (
                  <div
                    key={s.status}
                    className="flex-1 bg-green-200 rounded-t hover:opacity-80"
                    style={{ height: `${(s.count / leadsReport.total.count || 1) * 100}%` }}
                    title={`${s.status}: ${s.count}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">By Source</h3>
              <div className="space-y-1">
                {leadsReport.bySource.slice(0, 5).map(s => (
                  <div key={s.lead_source} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{s.lead_source.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">By Employee</h3>
              <div className="space-y-1">
                {leadsReport.byEmployee.map(e => (
                  <div key={e.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{e.name || 'Unassigned'}</span>
                    <span className="font-medium text-gray-900">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Revenue Report
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Quoted Value</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(revenueReport.quoted.total)}</p>
                <p className="text-xs text-green-600 mt-1">Accepted quotations</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Booked Value</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(revenueReport.booked.total)}</p>
                <p className="text-xs text-blue-600 mt-1">Confirmed trips</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">Collected</p>
                <p className="text-xl font-bold text-emerald-800">{formatCurrency(revenueReport.collected.total)}</p>
                <p className="text-xs text-emerald-600 mt-1">Payments received</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700 font-medium">Pending</p>
                <p className="text-xl font-bold text-amber-800">{formatCurrency(revenueReport.pending.total)}</p>
                <p className="text-xs text-amber-600 mt-1">Still to collect</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Conversion Funnel
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-gray-600">Enquiries</span>
                <span className="font-bold text-gray-900">{conversionReport.enquiries.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-gray-600">Quotations Sent</span>
                <span className="font-bold text-gray-900">{conversionReport.quotations.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${conversionReport.enquiries.count > 0 ? (conversionReport.quotations.count / conversionReport.enquiries.count) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-500">{conversionReport.enquiries.count > 0 ? Math.round((conversionReport.quotations.count / conversionReport.enquiries.count) * 100) : 0}% conversion rate</p>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-gray-600">Bookings</span>
                <span className="font-bold text-gray-900">{conversionReport.bookings.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${conversionReport.enquiries.count > 0 ? (conversionReport.bookings.count / conversionReport.enquiries.count) * 100 : 0}%` }}></div>
              </div>
              <p className="text-xs text-gray-500">{conversionReport.enquiries.count > 0 ? Math.round((conversionReport.bookings.count / conversionReport.enquiries.count) * 100) : 0}% conversion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Bookings by Month
          </h2>

          <div className="space-y-2">
            {bookingsReport.byMonth.slice(0, 6).map(m => (
              <div key={m.month} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{m.month}</span>
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-green-200 rounded flex-1 max-w-[100px]" style={{ width: `${Math.min(m.count * 3, 100)}%` }}></div>
                  <span className="font-medium text-gray-900 min-w-[30px]">{m.count}</span>
                </div>
              </div>
            ))}
            {bookingsReport.byMonth.length === 0 && (
              <p className="text-sm text-gray-500">No bookings data available</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Top Destinations</h3>
            <div className="space-y-1">
              {bookingsReport.byDestination.slice(0, 5).map(d => (
                <div key={d.destination} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{d.destination}</span>
                  <span className="font-medium text-gray-900">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
