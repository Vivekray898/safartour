import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { requireRole } from '@/lib/crm/auth';
import { formatCRMDate } from '@/lib/crm/format';
import { CRMStatusBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import MetricCard from '@/components/crm/dashboard/MetricCard';
import PipelineChart from '@/components/crm/dashboard/PipelineChart';
import FollowUpWidget from '@/components/crm/dashboard/FollowUpWidget';
import UpcomingTripsList from '@/components/crm/dashboard/UpcomingTripsList';
import RevenueSummary from '@/components/crm/dashboard/RevenueSummary';
import { Plus, Calendar, Phone, Send } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await requireAuth();
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const stats = {
    newLeads: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status = 'new' AND archived = 0`).get() as { count: number },
    activeLeads: await db.prepare(`
      SELECT COUNT(*) as count FROM trips
      WHERE status IN ('contacted', 'requirement_collected', 'quotation_preparing', 'quotation_sent', 'negotiation', 'booking_pending') AND archived = 0
    `).get() as { count: number },
    followupsToday: await db.prepare(`
      SELECT COUNT(*) as count FROM followups
      WHERE scheduled_date = ? AND status = 'pending'
      AND trip_id IN (SELECT id FROM trips WHERE archived = 0)
    `).get(today) as { count: number },
    quotationsSent: await db.prepare(`
      SELECT COUNT(*) as count FROM quotations
      WHERE status IN ('sent', 'viewed', 'revised')
    `).get() as { count: number },
    bookings: await db.prepare(`
      SELECT COUNT(*) as count FROM trips
      WHERE status IN ('booked', 'trip_ongoing') AND archived = 0
    `).get() as { count: number },
    upcomingTrips: await db.prepare(`
      SELECT COUNT(*) as count FROM trips
      WHERE status IN ('booked', 'trip_ongoing') AND archived = 0 AND start_date >= ?
    `).get(today) as { count: number },
    pendingPayments: await db.prepare(`
      SELECT COALESCE(SUM(q.final_amount - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)), 0) as amount
      FROM quotations q
      WHERE q.status = 'accepted'
      AND q.final_amount > (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = q.trip_id)
    `).get() as { amount: number },
    lostLeads: await db.prepare(`SELECT COUNT(*) as count FROM trips WHERE status = 'lost' AND archived = 0`).get() as { count: number },
  };

  const pipeline = await db.prepare(`
    SELECT t.status, COUNT(*) as count,
      MAX(c.name) as customer_name, MAX(t.reference) as reference,
      MAX(t.destination) as destination, MAX(t.start_date) as start_date
    FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.archived = 0
    GROUP BY t.status
    ORDER BY CASE t.status
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
  `).all() as Array<{ status: string; count: number; customer_name: string | null; reference: string; destination: string | null; start_date: string | null }>;

  const overdueFollowups = await db.prepare(`
    SELECT f.id, f.scheduled_date, f.scheduled_time, f.followup_type, f.note,
      t.reference as trip_reference, c.name as customer_name, t.destination
    FROM followups f
    JOIN trips t ON f.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE f.scheduled_date < ?
    AND f.status = 'pending'
    AND t.archived = 0
    ORDER BY f.scheduled_date ASC
    LIMIT 5
  `).all(today) as Array<{
    id: number;
    scheduled_date: string;
    scheduled_time: string | null;
    followup_type: string;
    note: string | null;
    trip_reference: string;
    customer_name: string | null;
    destination: string | null;
  }>;

  const todayFollowups = await db.prepare(`
    SELECT f.id, f.scheduled_time, f.followup_type, f.note,
      t.reference as trip_reference, c.name as customer_name, t.destination, t.status
    FROM followups f
    JOIN trips t ON f.trip_id = t.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE f.scheduled_date = ?
    AND f.status = 'pending'
    AND t.archived = 0
    ORDER BY f.scheduled_time ASC
  `).all(today) as Array<{
    id: number;
    scheduled_time: string | null;
    followup_type: string;
    note: string | null;
    trip_reference: string;
    customer_name: string | null;
    destination: string | null;
    status: string;
  }>;

  const upcomingTrips = await db.prepare(`
    SELECT t.id, t.reference, t.start_date, t.end_date, t.total_pax,
      c.name as customer_name, c.phone as customer_phone, t.destination,
      t.vehicle_type, t.status,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
    FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.status IN ('booked', 'trip_ongoing') AND t.archived = 0
    AND t.start_date >= ?
    ORDER BY t.start_date ASC
    LIMIT 5
  `).all(today) as Array<{
    id: number;
    reference: string;
    start_date: string | null;
    end_date: string | null;
    total_pax: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    destination: string | null;
    vehicle_type: string | null;
    status: string;
    quoted_amount: number | null;
    paid_amount: number | null;
  }>;

  const revenue = {
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
    pending: stats.pendingPayments.amount,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{formatCRMDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/leads/new"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="New Leads"
          value={stats.newLeads.count}
          icon={Phone}
          color="blue"
          href="/crm/leads?status=new"
        />
        <MetricCard
          title="Active Leads"
          value={stats.activeLeads.count}
          icon={Calendar}
          color="purple"
          href="/crm/leads?status=active"
        />
        <MetricCard
          title="Follow-ups Today"
          value={stats.followupsToday.count}
          icon={Calendar}
          color="amber"
          href="/crm/followups?date=today"
        />
        <MetricCard
          title="Quotations Sent"
          value={stats.quotationsSent.count}
          icon={Send}
          color="green"
          href="/crm/quotations?status=sent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Bookings"
          value={stats.bookings.count}
          icon={Calendar}
          color="green"
          href="/crm/leads?status=booked"
        />
        <MetricCard
          title="Upcoming Trips"
          value={stats.upcomingTrips.count}
          icon={Calendar}
          color="green"
          href="/crm/leads?status=booked"
        />
        <MetricCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments.amount)}
          icon={Calendar}
          color="red"
          href="/crm/payments?status=pending"
        />
        <MetricCard
          title="Lost Leads"
          value={stats.lostLeads.count}
          icon={Phone}
          color="gray"
          href="/crm/leads?status=lost"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineChart pipeline={pipeline} />
        </div>
        <div>
          <FollowUpWidget
            overdue={overdueFollowups}
            today={todayFollowups}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingTripsList trips={upcomingTrips} />
        <RevenueSummary revenue={revenue} />
      </div>
    </div>
  );
}
