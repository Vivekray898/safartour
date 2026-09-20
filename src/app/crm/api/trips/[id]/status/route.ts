import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logStatusChange } from '@/lib/crm/activity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(id) as {
      id: number;
      customer_id: number;
      status: string;
    } | undefined;

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const { status, note, lost_reason } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (status === 'lost' && !lost_reason) {
      return NextResponse.json({ error: 'Lost reason is required' }, { status: 400 });
    }

    await db.prepare(`
      UPDATE trips SET status = ?, updated_at = datetime('now'),
        lost_reason = CASE WHEN ? = 'lost' THEN ? ELSE lost_reason END,
        lost_note = CASE WHEN ? = 'lost' THEN ? ELSE lost_note END
      WHERE id = ?
    `).run(status, status, lost_reason || null, status, note || null, id);

    await logStatusChange(Number(id), trip.customer_id, session, trip.status, status, note);

    return NextResponse.json({
      ok: true,
      message: 'Status updated',
    });
  } catch (error) {
    console.error('Status change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
