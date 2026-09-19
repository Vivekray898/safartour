import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_ACTIVE_STATUSES } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'leads';

    const db = getDb();

    if (reportType === 'leads') {
      const total = db.prepare(`SELECT COUNT(*) as count FROM trips WHERE archived = 0`).get() as { count: number };

      const byStatus = db.prepare(`
        SELECT status, COUNT(*) as count FROM trips WHERE archived = 0 GROUP BY status
      `).all() as Array<{ status: string; count: number }>;

      const bySource = db.prepare(`
        SELECT lead_source, COUNT(*) as count FROM trips WHERE archived = 0 GROUP BY lead_source
      `).all() as Array<{ lead_source: string; count: number }>;

      const byEmployee = db.prepare(`
        SELECT u.name, COUNT(*) as count FROM trips t
        LEFT JOIN users u ON t.assigned_employee_id = u.id
        WHERE t.archived = 0 GROUP BY t.assigned_employee_id
      `).all() as Array<{ name: string | null; count: number }>;

      return NextResponse.json({
        ok: true,
        report: {
          type: 'leads',
          total: total.count,
          byStatus,
          bySource,
          byEmployee,
        },
      });
    }

    if (reportType === 'bookings') {
      const byMonth = db.prepare(`
        SELECT strftime('%Y-%m', start_date) as month, COUNT(*) as count
        FROM trips
        WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0
        AND start_date IS NOT NULL
        GROUP BY month
        ORDER BY month DESC LIMIT 12
      `).all() as Array<{ month: string; count: number }>;

      const byDestination = db.prepare(`
        SELECT destination, COUNT(*) as count FROM trips
        WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0
        AND destination IS NOT NULL
        GROUP BY destination
        ORDER BY count DESC
      `).all() as Array<{ destination: string; count: number }>;

      const byTripType = db.prepare(`
        SELECT trip_type, COUNT(*) as count FROM trips
        WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0
        GROUP BY trip_type
      `).all() as Array<{ trip_type: string; count: number }>;

      const totalBookings = db.prepare(`
        SELECT COUNT(*) as count FROM trips
        WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0
      `).get() as { count: number };

      return NextResponse.json({
        ok: true,
        report: {
          type: 'bookings',
          total: totalBookings.count,
          byMonth,
          byDestination,
          byTripType,
        },
      });
    }

    if (reportType === 'revenue') {
      const quoted = db.prepare(`
        SELECT COALESCE(SUM(final_amount), 0) as total FROM quotations WHERE status = 'accepted'
      `).get() as { total: number };

      const booked = db.prepare(`
        SELECT COALESCE(SUM(final_amount), 0) as total FROM quotations
        WHERE status = 'accepted' AND trip_id IN (
          SELECT id FROM trips WHERE status IN ('booked', 'trip_ongoing') AND archived = 0
        )
      `).get() as { total: number };

      const collected = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
        JOIN trips t ON p.trip_id = t.id
        WHERE t.status IN ('booked', 'trip_ongoing', 'completed') AND t.archived = 0
      `).get() as { total: number };

      const pending = db.prepare(`
        SELECT COALESCE(SUM(q.final_amount - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)), 0) as total
        FROM quotations q WHERE q.status = 'accepted'
        AND q.final_amount > (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)
      `).get() as { total: number };

      return NextResponse.json({
        ok: true,
        report: {
          type: 'revenue',
          quoted: quoted.total,
          booked: booked.total,
          collected: collected.total,
          pending: pending.total,
        },
      });
    }

    if (reportType === 'conversion') {
      const enquiries = db.prepare(`SELECT COUNT(*) as count FROM trips WHERE archived = 0`).get() as { count: number };

      const quotations = db.prepare(`
        SELECT COUNT(DISTINCT trip_id) as count FROM quotations WHERE status != 'draft'
      `).get() as { count: number };

      const bookings = db.prepare(`
        SELECT COUNT(*) as count FROM trips
        WHERE status IN ('booked', 'trip_ongoing', 'completed') AND archived = 0
      `).get() as { count: number };

      return NextResponse.json({
        ok: true,
        report: {
          type: 'conversion',
          enquiries: enquiries.count,
          quotations: quotations.count,
          bookings: bookings.count,
          quotationRate: enquiries.count > 0 ? Math.round((quotations.count / enquiries.count) * 100) : 0,
          bookingRate: enquiries.count > 0 ? Math.round((bookings.count / enquiries.count) * 100) : 0,
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
