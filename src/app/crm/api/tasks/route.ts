import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId') || '';
    const status = searchParams.get('status') || '';
    const assignedTo = searchParams.get('assignedTo') || '';

    const db = getDb();

    let query = `
      SELECT t.*,
        tr.reference as trip_reference,
        c.name as customer_name,
        tr.destination,
        u.name as assigned_to_name
      FROM tasks t
      JOIN trips tr ON t.trip_id = tr.id
      LEFT JOIN customers c ON tr.customer_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (tripId) {
      query += ` AND t.trip_id = ?`;
      params.push(tripId);
    }

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (assignedTo === 'me') {
      query += ` AND t.assigned_to = ?`;
      params.push(session.id);
    }

    query += ' ORDER BY t.due_date ASC, t.created_at DESC';

    const tasks = await db.prepare(query).all(...params);

    return NextResponse.json({
      ok: true,
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const db = getDb();

    const { trip_id, title, description, assigned_to, priority, due_date } = body;

    if (!trip_id || !title) {
      return NextResponse.json({ error: 'Trip ID and title are required' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(trip_id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const assignedId = assigned_to || session.id;

    const result = await db.prepare(`
      INSERT INTO tasks (trip_id, title, description, assigned_to, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(trip_id, title, description || null, assignedId, priority || 'medium', due_date || null);

    await logActivity({
      trip_id: Number(trip_id),
      customer_id: (trip as { customer_id: number }).customer_id,
      user: session,
      activity_type: 'task_created',
      description: `Task created: ${title}`,
      metadata: { task_title: title, priority, due_date, assigned_to: assignedId },
    });

    const task = await db.prepare(`
      SELECT t.*,
        tr.reference as trip_reference,
        c.name as customer_name,
        tr.destination,
        u.name as assigned_to_name
      FROM tasks t
      JOIN trips tr ON t.trip_id = tr.id
      LEFT JOIN customers c ON tr.customer_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
