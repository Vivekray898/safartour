import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_ACTIVE_STATUSES } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const db = getDb();

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const stats = {
      newLeads: db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status = 'new' AND archived = 0`).get() as { count: number },
      activeLeads: db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status IN (${CRM_ACTIVE_STATUSES.map(() => '?').join(',')}) AND status != 'booked' AND status != 'completed' AND status != 'trip_ongoing' AND archived = 0`).get(...CRM_ACTIVE_STATUSES) as { count: number },
      followupsToday: db.prepare(`SELECT COUNT(*) as count FROM followups WHERE scheduled_date = ? AND status = 'pending' AND trip_id IN (SELECT id FROM trips WHERE archived = 0)`).get(today) as { count: number },
      quotationsSent: db.prepare(`SELECT COUNT(*) as count FROM quotations WHERE status IN ('sent', 'viewed', 'revised')`).get() as { count: number },
      bookings: db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status IN ('booked', 'trip_ongoing') AND archived = 0`).get() as { count: number },
      upcomingTrips: db.prepare(`
        SELECT COUNT(*) as count FROM trips
        WHERE status IN ('booked', 'trip_ongoing') AND archived = 0
        AND start_date >= ?
      `).get(today) as { count: number },
      pendingPayments: db.prepare(`
        SELECT COALESCE(SUM(q.final_amount - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)), 0) as amount
        FROM quotations q
        WHERE q.status = 'accepted'
        AND q.final_amount > (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)
      `).get() as { amount: number },
      lostLeads: db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status = 'lost' AND archived = 0`).get() as { count: number },
    };

    const pipeline = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM trips
      WHERE archived = 0
      GROUP BY status
      ORDER BY CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'requirement_collected' THEN 3
        WHEN 'quotation_preparing' THEN 4
        WHEN 'quotation_sent' THEN 5
        WHEN 'negotiation' THEN 6
        WHEN 'booking_pending' THEN 7
        WHEN 'booked' THEN 8
        WHEN 'trip_ongoing' THEN 9
        WHEN 'completed' THEN 10
        ELSE 11
      END
    `).all() as Array<{ status: string; count: number }>;

    const followups = {
      overdue: db.prepare(`
        SELECT COUNT(*) as count FROM followups
        WHERE status = 'pending'
        AND scheduled_date < ?
        AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
      `).get(today) as { count: number },
      today: db.prepare(`
        SELECT COUNT(*) as count FROM followups
        WHERE scheduled_date = ?
        AND status = 'pending'
        AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
      `).get(today) as { count: number },
      upcoming: db.prepare(`
        SELECT COUNT(*) as count FROM followups
        WHERE scheduled_date > ?
        AND scheduled_date <= ?
        AND status = 'pending'
        AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
      `).get(today, tomorrow) as { count: number },
    };

    const todayFollowups = db.prepare(`
      SELECT f.*, t.reference as trip_reference, c.name as customer_name, t.destination
      FROM followups f
      JOIN trips t ON f.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE f.scheduled_date = ?
      AND f.status = 'pending'
      AND t.archived = 0
      ORDER BY f.scheduled_time ASC
    `).all(today) as Array<{
      id: number;
      trip_id: number;
      scheduled_date: string;
      scheduled_time: string | null;
      followup_type: string;
      assigned_to: number | null;
      note: string | null;
      status: string;
      trip_reference: string;
      customer_name: string | null;
      destination: string | null;
    }>;

    const overdueFollowups = db.prepare(`
      SELECT f.*, t.reference as trip_reference, c.name as customer_name, t.destination
      FROM followups f
      JOIN trips t ON f.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE f.scheduled_date < ?
      AND f.status = 'pending'
      AND t.archived = 0
      ORDER BY f.scheduled_date ASC, f.scheduled_time ASC
      LIMIT 10
    `).all(today) as Array<{
      id: number;
      trip_id: number;
      scheduled_date: string;
      scheduled_time: string | null;
      followup_type: string;
      assigned_to: number | null;
      note: string | null;
      status: string;
      trip_reference: string;
      customer_name: string | null;
      destination: string | null;
    }>;

    const upcomingTrips = db.prepare(`
      SELECT t.id, t.reference, t.start_date, t.end_date,
        c.name as customer_name, c.phone as customer_phone,
        t.destination, t.total_pax,
        t.vehicle_type, t.status,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
      FROM trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.status IN ('booked', 'trip_ongoing') AND t.archived = 0
      AND t.start_date >= ?
      ORDER BY t.start_date ASC
      LIMIT 10
    `).all(today) as Array<{
      id: number;
      reference: string;
      start_date: string | null;
      end_date: string | null;
      customer_name: string | null;
      customer_phone: string | null;
      destination: string | null;
      total_pax: number | null;
      vehicle_type: string | null;
      status: string;
      quoted_amount: number | null;
      paid_amount: number | null;
    }>;

    const revenue = {
      quoted: db.prepare(`
        SELECT COALESCE(SUM(final_amount), 0) as total
        FROM quotations q
        WHERE q.status = 'accepted'
      `).get() as { total: number },
      booked: db.prepare(`
        SELECT COALESCE(SUM(final_amount), 0) as total
        FROM quotations q
        WHERE q.status = 'accepted'
        AND q.trip_id IN (SELECT id FROM trips WHERE status IN ('booked', 'trip_ongoing') AND archived = 0)
      `).get() as { total: number },
      collected: db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN trips t ON p.trip_id = t.id
        WHERE t.status IN ('booked', 'trip_ongoing', 'completed') AND t.archived = 0
      `).get() as { total: number },
      pending: stats.pendingPayments.amount,
    };

    return NextResponse.json({
      ok: true,
      stats,
      pipeline,
      followups: {
        ...followups,
        today: todayFollowups,
        overdue: overdueFollowups,
      },
      upcomingTrips,
      revenue,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
