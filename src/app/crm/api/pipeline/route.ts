import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_STATUSES } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';

    const db = getDb();

    let query = `
      SELECT t.id, t.reference, t.status, t.priority,
        c.name as customer_name, c.phone as customer_phone,
        t.destination, t.start_date, t.total_pax,
        u.name as assigned_employee_name,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
      FROM trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_employee_id = u.id
      WHERE t.archived = 0
    `;

    const params: string[] = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (session.role === 'employee') {
      query += ` AND (t.assigned_employee_id = ? OR t.assigned_employee_id IS NULL)`;
      params.push(session.id);
    }

    query += ' ORDER BY t.updated_at DESC LIMIT 100';

    const trips = await db.prepare(query).all(...params);

    const pipelineData = CRM_STATUSES.map(s => {
      const count = trips.filter((t: { status: string }) => t.status === s.value).length;
      return {
        ...s,
        count,
        value: s.value,
      };
    });

    return NextResponse.json({
      ok: true,
      pipeline: pipelineData,
      trips: trips.length > 0 ? trips : [],
    });
  } catch (error) {
    console.error('Pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
