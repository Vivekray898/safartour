import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logFollowUp } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const followups = await db.prepare(`
      SELECT f.*,
        u.name as assigned_to_name,
        u2.name as completed_by_name
      FROM followups f
      LEFT JOIN users u ON f.assigned_to = u.id
      LEFT JOIN users u2 ON f.completed_by = u2.id
      WHERE f.trip_id = ?
      ORDER BY f.scheduled_date DESC, f.scheduled_time ASC
    `).all(id);

    return NextResponse.json({ ok: true, followups });
  } catch (error) {
    console.error('Get trip followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const { scheduled_date, scheduled_time, followup_type, assigned_to, note } = body;

    if (!scheduled_date || !followup_type) {
      return NextResponse.json({ error: 'Date and type are required' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO followups (trip_id, scheduled_date, scheduled_time, followup_type, assigned_to, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, scheduled_date, scheduled_time || null, followup_type, assigned_to || session.id, note || null);

    await logFollowUp(Number(id), null, session, 'scheduled', followup_type, note);

    const followup = await db.prepare(`
      SELECT f.*,
        u.name as assigned_to_name
      FROM followups f
      LEFT JOIN users u ON f.assigned_to = u.id
      WHERE f.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, followup });
  } catch (error) {
    console.error('Create trip followup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
