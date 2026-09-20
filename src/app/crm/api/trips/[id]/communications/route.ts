import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';
import { CRM_COMMUNICATION_TYPES } from '@/config/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const communications = await db.prepare(`
      SELECT cm.*,
        u.name as recorded_by_name
      FROM communications cm
      LEFT JOIN users u ON cm.recorded_by = u.id
      WHERE cm.trip_id = ?
      ORDER BY cm.occurred_at DESC
    `).all(id);

    return NextResponse.json({ ok: true, communications });
  } catch (error) {
    console.error('Get trip communications error:', error);
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

    const { communication_type, occurred_at, subject, outcome, summary } = body;

    if (!communication_type || !occurred_at) {
      return NextResponse.json({ error: 'Type and date are required' }, { status: 400 });
    }

    const typeValid = CRM_COMMUNICATION_TYPES.some(t => t.value === communication_type);
    if (!typeValid) {
      return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO communications (trip_id, communication_type, occurred_at, subject, outcome, summary, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, communication_type, occurred_at, subject || null, outcome || null, summary || null, session.id);

    await logActivity({
      trip_id: Number(id),
      user: session,
      activity_type: 'communication_logged',
      description: `Communication logged: ${communication_type}`,
      metadata: { type: communication_type, subject, occurred_at },
    });

    const communication = await db.prepare(`
      SELECT cm.*,
        u.name as recorded_by_name
      FROM communications cm
      LEFT JOIN users u ON cm.recorded_by = u.id
      WHERE cm.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, communication });
  } catch (error) {
    console.error('Create trip communication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
