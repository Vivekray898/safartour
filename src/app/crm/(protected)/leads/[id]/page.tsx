import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { formatCRMDate, formatCRMDateRange, formatReference } from '@/lib/crm/format';
import { notFound } from 'next/navigation';
import { CRMStatusBadge, CRMPriorityBadge, CRMLeadSourceBadge } from '@/components/crm/common/CRMStatusBadge';
import { formatCurrency } from '@/config/crm';
import { getActivitiesForTrip } from '@/lib/crm/activity';
import Link from 'next/link';
import { MessageSquare, Mail } from 'lucide-react';

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id: idParam } = await params;
  // `/crm/leads/new` and any other non-numeric segment must never reach Postgres.
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const db = getDb();

  const trip = await db.prepare(`
    SELECT t.*,
      c.name as customer_name, c.phone as customer_phone,
      c.email as customer_email, c.city as customer_city,
      u.name as assigned_employee_name,
      (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
    FROM trips t
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN users u ON t.assigned_employee_id = u.id
    WHERE t.id = ?
  `).get(id);

  if (!trip) {
    return <div className="text-center py-12 text-gray-500">Trip not found</div>;
  }

  const quotations = await db.prepare(`
    SELECT q.id, q.reference, q.version, q.status, q.final_amount
    FROM quotations q WHERE q.trip_id = ? ORDER BY q.created_at DESC
  `).all(id);

  const payments = await db.prepare(`
    SELECT id, amount, payment_date, payment_method, transaction_id,
      (SELECT name FROM users WHERE id = payments.recorded_by) as recorded_by_name
    FROM payments WHERE trip_id = ? ORDER BY payment_date DESC
  `).all(id);

  const followups = await db.prepare(`
    SELECT id, scheduled_date, scheduled_time, followup_type, note, status
    FROM followups WHERE trip_id = ? ORDER BY scheduled_date DESC
  `).all(id);

  const tasks = await db.prepare(`
    SELECT id, title, priority, status, due_date,
      (SELECT name FROM users WHERE id = tasks.assigned_to) as assigned_name
    FROM tasks WHERE trip_id = ? ORDER BY created_at DESC
  `).all(id);

  const activities = await getActivitiesForTrip(id);
  const t = trip as Record<string, unknown> & {
    reference: string; status: string; priority: string; lead_source: string | null;
    destination: string | null; start_date: string | null; end_date: string | null;
    total_pax: number | null; adults: number | null; trip_type: string | null;
    group_type: string | null; budget: number | null; archived: number;
    customer_id: number; customer_name: string | null; customer_phone: string | null;
    customer_email: string | null; customer_city: string | null;
    assigned_employee_name: string | null; quoted_amount: number; paid_amount: number;
  };

  const pendingAmount = (t.quoted_amount || 0) - (t.paid_amount || 0);

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">{t.reference}</span>
            <span className="text-xs font-mono text-gray-400">{formatReference('TRP', Number(t.id))}</span>
            <CRMStatusBadge status={t.status} />
            <CRMPriorityBadge priority={t.priority} />
            {t.lead_source && <CRMLeadSourceBadge source={t.lead_source} />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{t.customer_name || 'No customer'}</h1>
          <p className="text-gray-500 mt-1">
            {t.destination || 'Destination not set'} · {formatCRMDateRange(t.start_date, t.end_date)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={`https://wa.me/${(t.customer_phone || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`mailto:${t.customer_email || ''}`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-green-500 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Trip details */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Destination</span><span className="text-gray-900">{t.destination || 'Not set'}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Travel Dates</span><span className="text-gray-900">{formatCRMDateRange(t.start_date, t.end_date)}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Travellers</span><span className="text-gray-900">{t.total_pax ?? t.adults ?? 0}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Trip Type</span><span className="text-gray-900 capitalize">{t.trip_type || 'Not set'}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Group Type</span><span className="text-gray-900 capitalize">{t.group_type || 'Not set'}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Budget</span><span className="text-gray-900">{t.budget ? formatCurrency(t.budget) : 'Not set'}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Assigned Employee</span><span className="text-gray-900">{t.assigned_employee_name || 'Unassigned'}</span></div>
              <div><span className="text-xs text-gray-500 uppercase tracking-wider block">Lead Source</span><span className="text-gray-900">{t.lead_source || 'Not set'}</span></div>
            </div>
          </div>

          {/* Quotations */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quotations</h2>
              <Link href={`/crm/quotations?tripId=${t.id}`} className="text-sm text-green-700 hover:underline">View all</Link>
            </div>
            {quotations.length === 0 ? (
              <p className="text-sm text-gray-500">No quotations yet. Create one from this trip to start pricing.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="py-2 pr-4">Reference</th><th className="py-2 pr-4">Version</th>
                      <th className="py-2 pr-4">Status</th><th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotations.map(q => (
                      <tr key={q.id}>
                        <td className="py-2 pr-4"><Link href={`/crm/quotations/${q.id}`} className="text-green-700 hover:underline">{q.reference}</Link></td>
                        <td className="py-2 pr-4 text-gray-500">{q.version}</td>
                        <td className="py-2 pr-4"><CRMStatusBadge status={q.status} type="quotation" size="sm" /></td>
                        <td className="py-2 text-right font-medium">{formatCurrency(q.final_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
              <Link href={`/crm/payments?tripId=${t.id}`} className="text-sm text-green-700 hover:underline">View all</Link>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="py-2 pr-4">Reference</th><th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Method</th><th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-500">{formatReference('PAY', p.id)}</td>
                        <td className="py-2 pr-4">{formatCRMDate(p.payment_date)}</td>
                        <td className="py-2 pr-4 capitalize">{p.payment_method.replace(/_/g, ' ')}</td>
                        <td className="py-2 text-right font-medium text-green-700">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Follow-ups + Tasks */}
          <div className="grid gap-6 md:grid-cols-2 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Follow-ups</h2>
              {followups.length === 0 ? (
                <p className="text-sm text-gray-500">No follow-ups scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {followups.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-gray-50">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 capitalize">{f.followup_type}</div>
                        <div className="text-xs text-gray-500 truncate">{f.note || ''}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gray-700">{formatCRMDate(f.scheduled_date)}</div>
                        <div className={`text-xs ${f.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>{f.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks created.</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-gray-50">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{task.title}</div>
                        <div className="text-xs text-gray-500">{task.assigned_name || 'Unassigned'}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gray-700">{formatCRMDate(task.due_date, '—')}</div>
                        <div className={`text-xs ${task.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>{task.status.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 15).map(activity => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-green-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-gray-900">{activity.description}</div>
                      <div className="text-xs text-gray-500">{formatCRMDate(activity.created_at)}{activity.user_name ? ` · ${activity.user_name}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <Link href={`/crm/customers/${t.customer_id}`} className="block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
                  {(t.customer_name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-green-700 truncate">{t.customer_name || 'No customer'}</p>
                  <p className="text-xs font-mono text-gray-400">{formatReference('CUS', t.customer_id)}</p>
                </div>
              </div>
            </Link>
            <div className="mt-4 space-y-1.5 text-sm">
              {t.customer_phone && <div className="text-gray-600">{t.customer_phone}</div>}
              {t.customer_email && <div className="text-gray-600 break-all">{t.customer_email}</div>}
              {t.customer_city && <div className="text-gray-500">{t.customer_city}</div>}
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Quoted</span><span className="font-medium">{formatCurrency(t.quoted_amount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Paid</span><span className="font-medium text-green-700">{formatCurrency(t.paid_amount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pending</span><span className={`font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, pendingAmount))}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
