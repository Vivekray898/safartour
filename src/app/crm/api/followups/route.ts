import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logFollowUp } from '@/lib/crm/activity';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();

    let query = `
      SELECT f.*,
        t.reference as trip_reference,
        c.name as customer_name,
        t.destination,
        u.name as assigned_to_name,
        u2.name as completed_by_name
      FROM followups f
      JOIN trips t ON f.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON f.assigned_to = u.id
      LEFT JOIN users u2 ON f.completed_by = u2.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (tripId) {
      query += ` AND f.trip_id = ?`;
      params.push(tripId);
    }

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND f.scheduled_date = ?`;
      params.push(date);
    }

    query += ' ORDER BY f.scheduled_date ASC, f.scheduled_time ASC';

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const followups = await db.prepare(query).all(...params);

    return NextResponse.json({
      ok: true,
      followups,
      pagination: {
        page,
        limit,
        total: followups.length,
      },
    });
  } catch (error) {
    console.error('Get followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const db = getDb();

    const { trip_id, scheduled_date, scheduled_time, followup_type, assigned_to, note } = body;

    if (!trip_id || !scheduled_date || !followup_type) {
      return NextResponse.json({ error: 'Trip ID, scheduled date, and followup type are required' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(trip_id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const assignedId = assigned_to || session.id;

    const result = await db.prepare(`
      INSERT INTO followups (trip_id, scheduled_date, scheduled_time, followup_type, assigned_to, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(trip_id, scheduled_date, scheduled_time || null, followup_type, assignedId, note || null);

    await logFollowUp(
      Number(trip_id),
      (trip as { customer_id: number }).customer_id,
      session,
      'scheduled',
      followup_type,
      note
    );

    await logActivity({
      trip_id: Number(trip_id),
      customer_id: (trip as { customer_id: number }).customer_id,
      user: session,
      activity_type: 'followup_scheduled',
      description: `Follow-up scheduled: ${followup_type} on ${scheduled_date}`,
      metadata: { followup_type, scheduled_date, scheduled_time, assigned_to: assignedId, note },
    });

    const followup = await db.prepare(`
      SELECT f.*,
        t.reference as trip_reference,
        c.name as customer_name,
        t.destination,
        u.name as assigned_to_name
      FROM followups f
      JOIN trips t ON f.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON f.assigned_to = u.id
      WHERE f.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, followup });
  } catch (error) {
    console.error('Create followup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
